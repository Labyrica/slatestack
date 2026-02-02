import { FastifyPluginAsync } from 'fastify';
import { requireRole } from '../auth/auth.service.js';
import * as updateService from './update.service.js';
import { UpdateCheckResponse, ChangelogResponse, ConflictCheckResponse } from './update.schemas.js';

export const updateRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/admin/update/check - Check for available updates
  fastify.get(
    '/api/admin/update/check',
    {
      preHandler: [requireRole('admin')],
      schema: {
        response: { 200: UpdateCheckResponse }
      }
    },
    async (request, reply) => {
      const result = await updateService.checkForUpdates();
      return reply.send(result);
    }
  );

  // GET /api/admin/update/changelog - Get release notes
  fastify.get(
    '/api/admin/update/changelog',
    {
      preHandler: [requireRole('admin')],
      schema: {
        response: { 200: ChangelogResponse }
      }
    },
    async (request, reply) => {
      const result = await updateService.getChangelog();
      return reply.send(result);
    }
  );

  // GET /api/admin/update/conflicts - Check for merge conflicts (read-only)
  fastify.get(
    '/api/admin/update/conflicts',
    {
      preHandler: [requireRole('admin')],
      schema: {
        response: { 200: ConflictCheckResponse }
      }
    },
    async (request, reply) => {
      const result = await updateService.checkConflicts();
      return reply.send(result);
    }
  );
};
