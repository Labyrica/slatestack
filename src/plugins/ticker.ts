import fp from 'fastify-plugin';
import { inArray, sql } from 'drizzle-orm';
import { db } from '../shared/database/index.js';
import { collection, entry } from '../shared/database/schema.js';
import { processPendingDeliveries, enqueueEvent } from '../modules/webhooks/webhook.service.js';

const SCHEDULED_PUBLISH_INTERVAL_MS = 60_000;
const WEBHOOK_DELIVERY_INTERVAL_MS = 30_000;

/**
 * Promote any draft entries whose publishAt has passed. Multi-instance-safe:
 * the atomic UPDATE ... RETURNING serves as the claim — only the instance
 * whose UPDATE actually changed the row will emit the webhook event, because
 * the row's status is verified inside the same statement.
 */
async function promoteScheduledEntries(log: { error: Function; info: Function }) {
  try {
    const result = await db.execute(sql`
      UPDATE ${entry}
      SET status = 'published',
          publish_at = NULL,
          "updatedAt" = NOW()
      WHERE id IN (
        SELECT e.id FROM ${entry} e
        WHERE e.status = 'draft'
          AND e.publish_at IS NOT NULL
          AND e.publish_at <= NOW()
        ORDER BY e.publish_at ASC
        LIMIT 100
        FOR UPDATE SKIP LOCKED
      )
      RETURNING id, slug, data, "collectionId" AS collection_id
    `);

    const rows = ((result as any).rows ?? result) as Array<{
      id: string;
      slug: string;
      data: Record<string, unknown>;
      collection_id: string;
    }>;
    if (rows.length === 0) return;

    // Resolve collection slugs for the rows we actually published.
    const collIds = Array.from(new Set(rows.map((r) => r.collection_id)));
    const slugRows = await db
      .select({ id: collection.id, slug: collection.slug })
      .from(collection)
      .where(inArray(collection.id, collIds));
    const slugById = new Map(slugRows.map((r) => [r.id, r.slug]));

    for (const row of rows) {
      const collectionSlug = slugById.get(row.collection_id);
      if (!collectionSlug) continue;
      await enqueueEvent('entry.published', collectionSlug, {
        id: row.id,
        collection: collectionSlug,
        slug: row.slug,
        status: 'published',
        data: row.data,
      });
    }
  } catch (err) {
    log.error({ err }, 'scheduled publish tick failed');
  }
}

export default fp(async (fastify) => {
  let publishTimer: NodeJS.Timeout | null = null;
  let deliveryTimer: NodeJS.Timeout | null = null;

  const tickPublish = async () => {
    try {
      await promoteScheduledEntries(fastify.log);
    } catch (err) {
      fastify.log.error({ err }, 'scheduled publish tick failed');
    }
    publishTimer = setTimeout(tickPublish, SCHEDULED_PUBLISH_INTERVAL_MS);
  };

  const tickDelivery = async () => {
    try {
      await processPendingDeliveries();
    } catch (err) {
      fastify.log.error({ err }, 'webhook delivery tick failed');
    }
    deliveryTimer = setTimeout(tickDelivery, WEBHOOK_DELIVERY_INTERVAL_MS);
  };

  fastify.addHook('onReady', async () => {
    publishTimer = setTimeout(tickPublish, SCHEDULED_PUBLISH_INTERVAL_MS);
    deliveryTimer = setTimeout(tickDelivery, WEBHOOK_DELIVERY_INTERVAL_MS);
  });

  fastify.addHook('onClose', async () => {
    if (publishTimer) clearTimeout(publishTimer);
    if (deliveryTimer) clearTimeout(deliveryTimer);
  });
});
