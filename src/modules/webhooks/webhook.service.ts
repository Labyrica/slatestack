import crypto from 'crypto';
import { and, asc, desc, eq, inArray, isNull, lte, or, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '../../shared/database/index.js';
import { webhook, webhookDelivery } from '../../shared/database/schema.js';
import { BadRequestError } from '../../shared/errors/index.js';

export type WebhookEvent =
  | 'entry.created'
  | 'entry.updated'
  | 'entry.deleted'
  | 'entry.published'
  | 'entry.unpublished';

export const WEBHOOK_EVENTS: WebhookEvent[] = [
  'entry.created',
  'entry.updated',
  'entry.deleted',
  'entry.published',
  'entry.unpublished',
];

const DELIVERY_TIMEOUT_MS = 10_000;
const MAX_ATTEMPTS = 4; // initial + 3 retries
const BACKOFF_STEPS_MS = [60_000, 5 * 60_000, 15 * 60_000];

/**
 * Reject webhook URLs that target internal infrastructure. Catches loopback,
 * link-local (incl. cloud metadata 169.254.169.254), RFC1918 ranges, and
 * IPv6 unspecified/loopback/ULA. Hostnames that resolve to those ranges at
 * delivery time are not blocked here — this is admin-only input, so the
 * goal is to stop accidents, not a determined attacker.
 */
export function assertSafeWebhookUrl(rawUrl: string): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new BadRequestError('Invalid webhook URL');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new BadRequestError(`Webhook URL must use http(s), got ${url.protocol}`);
  }

  const host = url.hostname.toLowerCase();

  // Strip IPv6 brackets and zone ids.
  const ipHost = host.startsWith('[') && host.endsWith(']') ? host.slice(1, -1) : host;
  const ipCore = ipHost.split('%')[0];

  // Block obvious hostnames.
  if (host === 'localhost' || host === '0.0.0.0' || host === '::' || host === '::1') {
    throw new BadRequestError('Webhook URL points to a local/loopback address');
  }

  // IPv4 numeric.
  if (/^\d+\.\d+\.\d+\.\d+$/.test(ipCore)) {
    const parts = ipCore.split('.').map((p) => parseInt(p, 10));
    if (parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) {
      throw new BadRequestError('Invalid IPv4 in webhook URL');
    }
    const [a, b] = parts;
    const isLoopback = a === 127;
    const isPrivate10 = a === 10;
    const isPrivate172 = a === 172 && b >= 16 && b <= 31;
    const isPrivate192 = a === 192 && b === 168;
    const isLinkLocal = a === 169 && b === 254;
    const isCgnat = a === 100 && b >= 64 && b <= 127;
    if (isLoopback || isPrivate10 || isPrivate172 || isPrivate192 || isLinkLocal || isCgnat) {
      throw new BadRequestError('Webhook URL points to a private/loopback/link-local address');
    }
  }

  // IPv6 numeric (very lightweight check).
  if (ipCore.includes(':')) {
    const lower = ipCore.toLowerCase();
    if (
      lower === '::1' ||
      lower.startsWith('fe80:') || // link-local
      lower.startsWith('fc') ||    // ULA fc00::/7
      lower.startsWith('fd')
    ) {
      throw new BadRequestError('Webhook URL points to a private/loopback IPv6 address');
    }
  }

  return url;
}

export async function createWebhook(input: {
  name: string;
  url: string;
  events: WebhookEvent[];
  collectionSlug?: string | null;
  createdBy: string;
}) {
  assertSafeWebhookUrl(input.url);
  const secret = crypto.randomBytes(24).toString('hex');
  const [row] = await db
    .insert(webhook)
    .values({
      id: nanoid(),
      name: input.name,
      url: input.url,
      secret,
      events: input.events,
      collectionSlug: input.collectionSlug ?? null,
      createdBy: input.createdBy,
    })
    .returning();
  return toWebhookResponse(row, /* includeSecret */ true);
}

export async function listWebhooks() {
  const rows = await db.select().from(webhook).orderBy(desc(webhook.createdAt));
  return rows.map((r) => toWebhookResponse(r, false));
}

export async function updateWebhook(id: string, patch: {
  name?: string;
  url?: string;
  events?: WebhookEvent[];
  collectionSlug?: string | null;
  enabled?: boolean;
}) {
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.name !== undefined) updateData.name = patch.name;
  if (patch.url !== undefined) {
    assertSafeWebhookUrl(patch.url);
    updateData.url = patch.url;
  }
  if (patch.events !== undefined) updateData.events = patch.events;
  if (patch.collectionSlug !== undefined) updateData.collectionSlug = patch.collectionSlug;
  if (patch.enabled !== undefined) updateData.enabled = patch.enabled;

  const [row] = await db.update(webhook).set(updateData).where(eq(webhook.id, id)).returning();
  if (!row) return null;
  return toWebhookResponse(row, false);
}

export async function deleteWebhook(id: string) {
  const result = await db.delete(webhook).where(eq(webhook.id, id)).returning({ id: webhook.id });
  return result.length > 0;
}

function toWebhookResponse(row: typeof webhook.$inferSelect, includeSecret: boolean) {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    events: row.events as WebhookEvent[],
    collectionSlug: row.collectionSlug,
    enabled: row.enabled,
    ...(includeSecret ? { secret: row.secret } : {}),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * Enqueue a webhook event. Finds matching webhook subscriptions and creates
 * a pending delivery per match; the ticker handles actual HTTP calls.
 */
export async function enqueueEvent(
  event: WebhookEvent,
  collectionSlug: string,
  payload: Record<string, unknown>
) {
  const matching = await db
    .select()
    .from(webhook)
    .where(and(eq(webhook.enabled, true)));

  const inserts = matching
    .filter((w) => (w.events as string[]).includes(event))
    .filter((w) => !w.collectionSlug || w.collectionSlug === collectionSlug)
    .map((w) => ({
      id: nanoid(),
      webhookId: w.id,
      event,
      payload,
      status: 'pending',
      attempts: 0,
      nextAttemptAt: new Date(),
    }));

  if (inserts.length === 0) return;
  await db.insert(webhookDelivery).values(inserts);
}

function sign(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

async function deliverOne(delivery: typeof webhookDelivery.$inferSelect, hook: typeof webhook.$inferSelect) {
  const payloadJson = JSON.stringify(delivery.payload);
  const signature = sign(payloadJson, hook.secret);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS);
  try {
    const res = await fetch(hook.url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-slatestack-event': delivery.event,
        'x-slatestack-signature': `sha256=${signature}`,
      },
      body: payloadJson,
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    await db
      .update(webhookDelivery)
      .set({
        status: 'success',
        attempts: delivery.attempts + 1,
        deliveredAt: new Date(),
        lastError: null,
        nextAttemptAt: null,
      })
      .where(eq(webhookDelivery.id, delivery.id));
  } catch (err: any) {
    const nextAttempt = delivery.attempts + 1;
    if (nextAttempt >= MAX_ATTEMPTS) {
      await db
        .update(webhookDelivery)
        .set({
          status: 'failed',
          attempts: nextAttempt,
          lastError: err?.message ?? String(err),
          nextAttemptAt: null,
        })
        .where(eq(webhookDelivery.id, delivery.id));
    } else {
      const delayMs = BACKOFF_STEPS_MS[Math.min(nextAttempt - 1, BACKOFF_STEPS_MS.length - 1)];
      await db
        .update(webhookDelivery)
        .set({
          status: 'pending',
          attempts: nextAttempt,
          lastError: err?.message ?? String(err),
          nextAttemptAt: new Date(Date.now() + delayMs),
        })
        .where(eq(webhookDelivery.id, delivery.id));
    }
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Drain pending webhook deliveries whose nextAttemptAt is in the past.
 * Safe to call concurrently with itself; each delivery is claimed by
 * checking-and-setting nextAttemptAt to NULL before fire.
 */
export async function processPendingDeliveries(limit = 20) {
  // RETURNING goes through db.execute, which yields raw column names —
  // alias the snake_case columns back to the camelCase keys of $inferSelect.
  const claimed = await db.execute(sql`
    UPDATE webhook_delivery
    SET next_attempt_at = NULL
    WHERE id IN (
      SELECT id FROM webhook_delivery
      WHERE status = 'pending'
        AND next_attempt_at IS NOT NULL
        AND next_attempt_at <= NOW()
      ORDER BY next_attempt_at ASC
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    )
    RETURNING
      id,
      webhook_id AS "webhookId",
      event,
      payload,
      status,
      attempts,
      last_error AS "lastError",
      next_attempt_at AS "nextAttemptAt",
      delivered_at AS "deliveredAt",
      "createdAt"
  `);

  const rows = ((claimed as any).rows ?? claimed) as typeof webhookDelivery.$inferSelect[];
  if (rows.length === 0) return;

  const hookIds = Array.from(new Set(rows.map((r) => r.webhookId)));
  const hooks = await db.select().from(webhook).where(inArray(webhook.id, hookIds));
  const hooksById = new Map(hooks.map((h) => [h.id, h]));

  await Promise.all(
    rows.map((r) => {
      const h = hooksById.get(r.webhookId);
      if (!h) {
        return db
          .update(webhookDelivery)
          .set({ status: 'failed', lastError: 'webhook deleted', nextAttemptAt: null })
          .where(eq(webhookDelivery.id, r.id));
      }
      return deliverOne(r, h);
    })
  );
}

export async function listDeliveries(webhookId?: string, status?: string) {
  const conditions = [];
  if (webhookId) conditions.push(eq(webhookDelivery.webhookId, webhookId));
  if (status) conditions.push(eq(webhookDelivery.status, status));
  const rows = await db
    .select()
    .from(webhookDelivery)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(webhookDelivery.createdAt))
    .limit(200);
  return rows.map((r) => ({
    id: r.id,
    webhookId: r.webhookId,
    event: r.event,
    status: r.status,
    attempts: r.attempts,
    lastError: r.lastError,
    nextAttemptAt: r.nextAttemptAt ? r.nextAttemptAt.toISOString() : null,
    deliveredAt: r.deliveredAt ? r.deliveredAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function retryDelivery(id: string) {
  const [row] = await db
    .update(webhookDelivery)
    .set({ status: 'pending', nextAttemptAt: new Date() })
    .where(eq(webhookDelivery.id, id))
    .returning();
  return !!row;
}
