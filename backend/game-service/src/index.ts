import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
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
await fastify.register(websocket);

// Health check route
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', service: 'game-service' };
});

// Basic game routes placeholder
fastify.get('/api/games', async (request, reply) => {
  return { message: 'Game service is running', games: [] };
});

// WebSocket route for real-time game communication
fastify.register(async function (fastify) {
  fastify.get('/ws', { websocket: true }, (connection, req) => {
    connection.socket.on('message', message => {
      // Handle game messages
      console.log('Game message received:', message.toString());
    });
  });
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
    
    console.log(`🚀 Game Service running on http://${config.server.host}:${config.server.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start(); 