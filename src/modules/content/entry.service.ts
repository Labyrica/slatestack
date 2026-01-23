import { nanoid } from 'nanoid';
import { db } from '../../shared/database/index.js';
import { entry } from '../../shared/database/schema.js';
import { eq, and, desc, asc } from 'drizzle-orm';
import { validateEntryData } from './content.validation.js';
import { getCollection } from './collection.service.js';
import { generateSlug, ensureUniqueSlug } from './slug.utils.js';
import { CreateEntryInput, UpdateEntryInput, EntryResponse } from './entry.schemas.js';

/**
 * Create a new entry in a collection
 */
export async function createEntry(
  collectionId: string,
  input: CreateEntryInput
): Promise<EntryResponse> {
  // Fetch collection
  const coll = await getCollection(collectionId);
  if (!coll) {
    throw new Error('Collection not found');
  }

  // Validate entry data against collection schema
  const validation = validateEntryData(coll.fields, input.data);
  if (!validation.valid) {
    const error = new Error('Validation failed') as Error & {
      details: Array<{ field: string; message: string }>;
    };
    error.details = validation.errors.map((err) => {
      const [field, ...messageParts] = err.split(': ');
      return { field, message: messageParts.join(': ') };
    });
    throw error;
  }

  // Generate slug from configured field or fallback to 'title'
  const slugField = coll.fields.find((f) => f.type === 'slug');
  let slug: string;

  if (slugField && slugField.generateFrom) {
    const sourceValue = input.data[slugField.generateFrom];
    if (sourceValue) {
      const baseSlug = generateSlug(String(sourceValue));
      slug = await ensureUniqueSlug(collectionId, baseSlug);
    } else {
      throw new Error(`Slug source field '${slugField.generateFrom}' is required`);
    }
  } else {
    // Fallback: use 'title' field or generate from id
    const titleValue = input.data.title;
    const baseSlug = titleValue ? generateSlug(String(titleValue)) : nanoid(8);
    slug = await ensureUniqueSlug(collectionId, baseSlug);
  }

  // Insert entry
  const newEntry = await db
    .insert(entry)
    .values({
      id: nanoid(),
      collectionId,
      slug,
      data: input.data,
      status: input.status ?? 'draft',
      position: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return {
    id: newEntry[0].id,
    collectionId: newEntry[0].collectionId,
    slug: newEntry[0].slug,
    data: newEntry[0].data as Record<string, unknown>,
    status: newEntry[0].status as 'draft' | 'published',
    position: newEntry[0].position,
    createdAt: newEntry[0].createdAt.toISOString(),
    updatedAt: newEntry[0].updatedAt.toISOString(),
  };
}

/**
 * Get a single entry by ID
 */
export async function getEntry(
  collectionId: string,
  entryId: string
): Promise<EntryResponse | null> {
  const result = await db
    .select()
    .from(entry)
    .where(and(eq(entry.id, entryId), eq(entry.collectionId, collectionId)))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const e = result[0];
  return {
    id: e.id,
    collectionId: e.collectionId,
    slug: e.slug,
    data: e.data as Record<string, unknown>,
    status: e.status as 'draft' | 'published',
    position: e.position,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

/**
 * List entries in a collection
 */
export async function listEntries(
  collectionId: string,
  options?: { status?: 'draft' | 'published' }
): Promise<EntryResponse[]> {
  const conditions = options?.status
    ? and(eq(entry.collectionId, collectionId), eq(entry.status, options.status))
    : eq(entry.collectionId, collectionId);

  const results = await db
    .select()
    .from(entry)
    .where(conditions)
    .orderBy(asc(entry.position), desc(entry.createdAt));

  return results.map((e) => ({
    id: e.id,
    collectionId: e.collectionId,
    slug: e.slug,
    data: e.data as Record<string, unknown>,
    status: e.status as 'draft' | 'published',
    position: e.position,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  }));
}

/**
 * Update an existing entry
 */
export async function updateEntry(
  collectionId: string,
  entryId: string,
  input: UpdateEntryInput
): Promise<EntryResponse> {
  // Fetch existing entry
  const existingEntry = await getEntry(collectionId, entryId);
  if (!existingEntry) {
    throw new Error('Entry not found');
  }

  // If data is being updated, validate it
  if (input.data) {
    const coll = await getCollection(collectionId);
    if (!coll) {
      throw new Error('Collection not found');
    }

    // Merge existing data with updates for validation
    const mergedData = { ...existingEntry.data, ...input.data };
    const validation = validateEntryData(coll.fields, mergedData);
    if (!validation.valid) {
      const error = new Error('Validation failed') as Error & {
        details: Array<{ field: string; message: string }>;
      };
      error.details = validation.errors.map((err) => {
        const [field, ...messageParts] = err.split(': ');
        return { field, message: messageParts.join(': ') };
      });
      throw error;
    }

    // Check if slug needs regeneration
    const slugField = coll.fields.find((f) => f.type === 'slug');
    if (slugField && slugField.generateFrom) {
      const sourceFieldName = slugField.generateFrom;
      const oldSourceValue = existingEntry.data[sourceFieldName];
      const newSourceValue = input.data[sourceFieldName];

      // If the source field changed, regenerate slug
      if (newSourceValue !== undefined && newSourceValue !== oldSourceValue) {
        const newBaseSlug = generateSlug(String(newSourceValue));
        const newSlug = await ensureUniqueSlug(collectionId, newBaseSlug, entryId);

        // Update entry with new slug and data
        const updated = await db
          .update(entry)
          .set({
            slug: newSlug,
            data: mergedData,
            status: input.status ?? existingEntry.status,
            position: input.position ?? existingEntry.position,
            updatedAt: new Date(),
          })
          .where(and(eq(entry.id, entryId), eq(entry.collectionId, collectionId)))
          .returning();

        const e = updated[0];
        return {
          id: e.id,
          collectionId: e.collectionId,
          slug: e.slug,
          data: e.data as Record<string, unknown>,
          status: e.status as 'draft' | 'published',
          position: e.position,
          createdAt: e.createdAt.toISOString(),
          updatedAt: e.updatedAt.toISOString(),
        };
      }
    }
  }

  // Update entry without slug change
  const updateData: any = {
    updatedAt: new Date(),
  };
  if (input.data) {
    updateData.data = { ...existingEntry.data, ...input.data };
  }
  if (input.status !== undefined) {
    updateData.status = input.status;
  }
  if (input.position !== undefined) {
    updateData.position = input.position;
  }

  const updated = await db
    .update(entry)
    .set(updateData)
    .where(and(eq(entry.id, entryId), eq(entry.collectionId, collectionId)))
    .returning();

  const e = updated[0];
  return {
    id: e.id,
    collectionId: e.collectionId,
    slug: e.slug,
    data: e.data as Record<string, unknown>,
    status: e.status as 'draft' | 'published',
    position: e.position,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

/**
 * Delete an entry
 */
export async function deleteEntry(
  collectionId: string,
  entryId: string
): Promise<void> {
  const result = await db
    .delete(entry)
    .where(and(eq(entry.id, entryId), eq(entry.collectionId, collectionId)))
    .returning({ id: entry.id });

  if (result.length === 0) {
    throw new Error('Entry not found');
  }
}

/**
 * Reorder entries for drag-and-drop
 */
export async function reorderEntries(
  collectionId: string,
  orderedIds: string[]
): Promise<void> {
  // Update position for each entry based on array index
  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(entry)
      .set({ position: i, updatedAt: new Date() })
      .where(and(eq(entry.id, orderedIds[i]), eq(entry.collectionId, collectionId)));
  }
}
