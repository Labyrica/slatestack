import { describe, expect, it, vi } from 'vitest';

vi.mock('../../shared/database/index.js', () => ({ db: {} }));
vi.mock('../../shared/database/schema.js', () => ({
  entry: { __table: 'entry' },
  collection: { __table: 'collection' },
}));
vi.mock('../webhooks/webhook.service.js', () => ({ enqueueEvent: vi.fn() }));

import { clampPagination } from './entry.service.js';

describe('clampPagination', () => {
  it('defaults to page 1, limit 20', () => {
    expect(clampPagination()).toEqual({ page: 1, limit: 20, offset: 0 });
    expect(clampPagination({})).toEqual({ page: 1, limit: 20, offset: 0 });
  });

  it('computes offset from page and limit', () => {
    expect(clampPagination({ page: 3, limit: 50 })).toEqual({ page: 3, limit: 50, offset: 100 });
  });

  it('caps limit at 100', () => {
    expect(clampPagination({ limit: 999999 }).limit).toBe(100);
  });

  it('floors fractional values and clamps below 1', () => {
    expect(clampPagination({ page: 2.9, limit: 10.5 })).toEqual({ page: 2, limit: 10, offset: 10 });
    expect(clampPagination({ page: 0, limit: 0 })).toEqual({ page: 1, limit: 1, offset: 0 });
    expect(clampPagination({ page: -5, limit: -5 })).toEqual({ page: 1, limit: 1, offset: 0 });
  });

  it('falls back to defaults on NaN/Infinity', () => {
    expect(clampPagination({ page: NaN, limit: NaN })).toEqual({ page: 1, limit: 20, offset: 0 });
    expect(clampPagination({ page: Infinity, limit: Infinity })).toEqual({ page: 1, limit: 20, offset: 0 });
  });
});
