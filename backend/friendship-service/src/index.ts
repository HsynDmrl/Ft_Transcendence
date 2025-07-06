import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { database } from '@transcendence/shared';
import { config } from './config/index.js';

const fastify = Fastify({
  logger: {
    level: config.isDevelopment ? 'info' : 'warn',
    transport: config.isDevelopment ? {
      target: 'pino-pretty'
    } : undefined
  }
});

// Register plugins
await fastify.register(helmet);
await fastify.register(cors, config.cors);
await fastify.register(rateLimit, config.rateLimit);

// Health check route
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', service: 'friendship-service' };
});

// Basic friendship routes placeholder
fastify.get('/api/friendships', async (request, reply) => {
  return { message: 'Friendship service is running', friends: [] };
});

// Start server
async function start() {
  try {
    // Initialize database
    await database.initialize();
    
    // Start server
    await fastify.listen({ 
      host: config.server.host, 
      port: config.server.port 
    });
    
    console.log(`🚀 Friendship Service running on http://${config.server.host}:${config.server.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start(); 