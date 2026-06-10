import { describe, expect, it, vi } from 'vitest';

vi.mock('../../shared/database/index.js', () => ({ db: {} }));
vi.mock('../../shared/database/schema.js', () => ({
  webhook: { __table: 'webhook' },
  webhookDelivery: { __table: 'webhook_delivery' },
}));

import { assertSafeWebhookUrl } from './webhook.service.js';
import { BadRequestError } from '../../shared/errors/index.js';

describe('assertSafeWebhookUrl', () => {
  it('accepts public http(s) URLs', () => {
    expect(assertSafeWebhookUrl('https://hooks.example.com/x').hostname).toBe('hooks.example.com');
    expect(assertSafeWebhookUrl('http://203.0.113.10/hook').hostname).toBe('203.0.113.10');
  });

  it('rejects non-http protocols', () => {
    expect(() => assertSafeWebhookUrl('ftp://example.com')).toThrow(BadRequestError);
    expect(() => assertSafeWebhookUrl('file:///etc/passwd')).toThrow(BadRequestError);
  });

  it('rejects malformed URLs', () => {
    expect(() => assertSafeWebhookUrl('not a url')).toThrow(BadRequestError);
  });

  it('rejects loopback and unspecified hosts', () => {
    for (const url of [
      'http://localhost/x',
      'http://127.0.0.1/x',
      'http://127.8.9.1/x',
      'http://0.0.0.0/x',
      'http://[::1]/x',
    ]) {
      expect(() => assertSafeWebhookUrl(url), url).toThrow(BadRequestError);
    }
  });

  it('rejects private, link-local, and CGNAT IPv4 ranges', () => {
    for (const url of [
      'http://10.0.0.5/x',
      'http://172.16.0.1/x',
      'http://172.31.255.255/x',
      'http://192.168.1.1/x',
      'http://169.254.169.254/latest/meta-data', // cloud metadata
      'http://100.64.0.1/x',
    ]) {
      expect(() => assertSafeWebhookUrl(url), url).toThrow(BadRequestError);
    }
  });

  it('allows boundary-adjacent public IPv4 addresses', () => {
    for (const url of [
      'http://11.0.0.1/x',
      'http://172.15.0.1/x',
      'http://172.32.0.1/x',
      'http://192.167.1.1/x',
      'http://100.63.0.1/x',
      'http://100.128.0.1/x',
    ]) {
      expect(() => assertSafeWebhookUrl(url), url).not.toThrow();
    }
  });

  it('rejects private IPv6 ranges', () => {
    for (const url of [
      'http://[fe80::1]/x',
      'http://[fc00::1]/x',
      'http://[fd12:3456::1]/x',
    ]) {
      expect(() => assertSafeWebhookUrl(url), url).toThrow(BadRequestError);
    }
  });
});
