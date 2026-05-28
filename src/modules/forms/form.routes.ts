import { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import {
  requireCollectionAccess,
  resolveCollectionAccess,
  CollectionPermissions,
} from '../auth/auth.service.js';
import { getCollectionAccessInfo } from '../content/collection.service.js';
import {
  submitForm,
  listSubmissions,
  deleteSubmission,
  getSubmissionCollectionId,
} from './form.service.js';
import { NotFoundError } from '../../shared/errors/index.js';

export const formRoutes: FastifyPluginAsync = async (fastify) => {
  // Public submission endpoint — no auth required, tight rate limit to throttle spam.
  fastify.post('/api/forms/:slug', {
    schema: {
      params: Type.Object({ slug: Type.String() }),
      body: Type.Record(Type.String(), Type.Unknown()),
    },
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      },
    },
    handler: async (request, reply) => {
      const { slug } = request.params as { slug: string };
      const result = await submitForm(slug, request.body as Record<string, unknown>, {
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] ?? null,
      });
      return reply.code(201).send(result);
    },
  });

  // Admin: list submissions for a form collection.
  fastify.get('/api/admin/collections/:collectionId/submissions', {
    preHandler: [requireCollectionAccess('read')],
    schema: { params: Type.Object({ collectionId: Type.String() }) },
    handler: async (request) => {
      const { collectionId } = request.params as { collectionId: string };
      return listSubmissions(collectionId);
    },
  });

  // Admin: delete a single submission. Authorised against the *owning*
  // collection's write permissions, not a blanket editor role — so editors
  // restricted from a collection can't delete its submissions.
  fastify.delete('/api/admin/submissions/:id', {
    schema: { params: Type.Object({ id: Type.String() }) },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };

      const collectionId = await getSubmissionCollectionId(id);
      if (!collectionId) {
        throw new NotFoundError('Submission', id);
      }

      const coll = await getCollectionAccessInfo(collectionId);
      if (!coll) throw new NotFoundError('Collection', collectionId);

      if (!request.user && !request.apiKey) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const access = resolveCollectionAccess(
        request.user ? { role: request.user.role } : null,
        request.apiKey,
        coll.slug,
        (coll.permissions as CollectionPermissions | null) ?? null
      );
      if (access !== 'write') {
        return reply.code(403).send({ error: 'Forbidden' });
      }

      const ok = await deleteSubmission(id);
      if (!ok) throw new NotFoundError('Submission', id);
      return reply.code(204).send();
    },
  });
};
