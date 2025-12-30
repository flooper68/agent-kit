import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import type { PubSubMessage } from '../lib/redis/types';

interface TestMessage {
  greeting: string;
  timestamp: string;
}

const pubsubTestRoutes: FastifyPluginAsync = async (
  fastify: FastifyInstance
) => {
  const TEST_CHANNEL = 'test:pubsub';
  const receivedMessages: PubSubMessage<TestMessage>[] = [];

  await fastify.redis.pubsub.subscribe<TestMessage>(TEST_CHANNEL, (message) => {
    fastify.log.info({ message }, 'Received test message');
    receivedMessages.push(message);
    if (receivedMessages.length > 10) {
      receivedMessages.shift();
    }
  });

  fastify.post<{
    Body: { message?: string };
  }>(
    '/pubsub/publish',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              channel: { type: 'string' },
              subscriberCount: { type: 'number' },
            },
          },
        },
      },
    },
    async (request) => {
      const greeting = request.body.message || 'Hello from pub/sub!';

      const testMessage: TestMessage = {
        greeting,
        timestamp: new Date().toISOString(),
      };

      const subscriberCount = await fastify.redis.pubsub.publish(
        TEST_CHANNEL,
        testMessage
      );

      return {
        success: true,
        channel: TEST_CHANNEL,
        subscriberCount,
      };
    }
  );

  fastify.get(
    '/pubsub/messages',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              channel: { type: 'string' },
              messageCount: { type: 'number' },
              messages: { type: 'array' },
            },
          },
        },
      },
    },
    async () => {
      return {
        channel: TEST_CHANNEL,
        messageCount: receivedMessages.length,
        messages: receivedMessages,
      };
    }
  );

  fastify.get('/pubsub/health', async () => {
    try {
      const ping = await fastify.redis.publisher.ping();
      return {
        status: 'healthy',
        redis: {
          connected: true,
          ping,
        },
      };
    } catch (err) {
      return {
        status: 'unhealthy',
        redis: {
          connected: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        },
      };
    }
  });
};

export default pubsubTestRoutes;
