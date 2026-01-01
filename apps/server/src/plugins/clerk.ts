import fp from 'fastify-plugin';
import { verifyToken } from '@clerk/backend';
import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { OrgRole } from '../types/auth';

export interface ClerkPluginOptions {
  secretKey: string;
}

const clerkPlugin: FastifyPluginAsync<ClerkPluginOptions> = async (
  fastify,
  options
) => {
  // Add preHandler hook to verify JWT
  fastify.addHook('preHandler', async (request: FastifyRequest) => {
    // Initialize auth object with null values
    request.auth = {
      userId: null,
      orgId: null,
      orgRole: null,
    };

    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return;
    }

    const token = authHeader.substring(7);

    try {
      const payload = await verifyToken(token, {
        secretKey: options.secretKey,
      });

      // Extract org info based on JWT version (discriminated union)
      let orgId: string | null = null;
      let orgRole: string | null = null;

      if (payload.v === 2) {
        // v2 format: org data under 'o' object
        orgId = payload.o?.id ?? null;
        orgRole = payload.o?.rol ?? null;
      } else {
        // v1 format: org data at top level
        orgId = payload.org_id ?? null;
        orgRole = payload.org_role ?? null;
      }

      request.auth = {
        userId: payload.sub,
        orgId,
        orgRole: OrgRole.safeParse(orgRole).data ?? null,
      };

      fastify.log.debug({ userId: payload.sub, orgId }, 'JWT verified');
    } catch (error) {
      fastify.log.warn({ err: error }, 'JWT verification failed');
      // Auth stays null - will be handled by protected procedures
    }
  });
};

export default fp(clerkPlugin, {
  name: 'clerk',
  fastify: '5.x',
});
