import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import type { FastifyPluginAsync } from 'fastify';

export interface CorsPluginOptions {
  allowedOrigins?: string[];
}

const corsPlugin: FastifyPluginAsync<CorsPluginOptions> = async (
  fastify,
  options
) => {
  const allowedOrigins = options.allowedOrigins || ['http://localhost:5173'];

  await fastify.register(cors, {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
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
