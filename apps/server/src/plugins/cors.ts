import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import type { FastifyPluginAsync } from 'fastify';

function isAllowedOrigin(origin: string): boolean {
  // Allow localhost for development
  if (origin === 'http://localhost:5173' || origin === 'http://localhost:4173') {
    return true;
  }

  // Allow Railway origins matching agent-kit*.up.railway.app
  try {
    const url = new URL(origin);
    if (
      url.hostname.endsWith('.up.railway.app') &&
      url.hostname.startsWith('agent-kit')
    ) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

const corsPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(cors, {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        callback(null, true);
        return;
      }

      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });
};

export default fp(corsPlugin, {
  name: 'cors',
  fastify: '5.x',
});
