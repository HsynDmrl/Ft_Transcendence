console.log('🔐 Starting Auth Service...');

import Fastify from 'fastify';
console.log('✅ Fastify imported');

import { config } from './config/index.js';
console.log('✅ Config imported');

console.log('🚀 Auth Service starting with configuration:');
console.log('🔧 Server:', config.server);
console.log('🔧 JWT:', { secret: config.jwt.secret.length + ' chars', expiresIn: config.jwt.expiresIn });

import { database, runMigrations } from '@transcendence/shared';
console.log('✅ Shared package imported');

// Plugins
import cors from '@fastify/cors';
console.log('✅ CORS imported');
import helmet from '@fastify/helmet';
console.log('✅ Helmet imported');
import rateLimit from '@fastify/rate-limit';
console.log('✅ Rate limit imported');

// Routes
import authRoutes from './routes/auth.js';
console.log('✅ Auth routes imported');

// Create Fastify instance
console.log('🏗️ Creating Auth Service Fastify instance...');

const fastify = Fastify({
  logger: true, // Simple logger
  trustProxy: true,
});
console.log('✅ Auth Service Fastify instance created successfully');

async function buildApp() {
  try {
    // Security plugins
    await fastify.register(helmet, {
      contentSecurityPolicy: false,
    });

    await fastify.register(cors, config.cors);

    await fastify.register(rateLimit, {
      max: config.rateLimit.max,
      timeWindow: config.rateLimit.timeWindow,
      errorResponseBuilder: (request, context) => ({
        success: false,
        error: 'Rate limit exceeded',
        message: 'Too many authentication requests, please try again later',
        retryAfter: Math.round(context.ttl / 1000),
      }),
    });

    // Request logging
    fastify.addHook('onRequest', async (request, reply) => {
      request.log.info({
        method: request.method,
        url: request.url,
        userAgent: request.headers['user-agent'],
        ip: request.ip,
      }, 'Incoming request');
    });

    fastify.addHook('onResponse', async (request, reply) => {
      request.log.info({
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        responseTime: reply.getResponseTime(),
      }, 'Request completed');
    });

    // Error handler
    fastify.setErrorHandler(async (error, request, reply) => {
      request.log.error(error);
      
      return reply.status(500).send({
        success: false,
        error: 'Internal Server Error',
        message: config.isDevelopment ? error.message : 'Something went wrong'
      });
    });

    // Register routes
    await fastify.register(authRoutes);

    // Root route
    fastify.get('/', async (request, reply) => {
      return {
        success: true,
        message: 'Transcendence Authentication Service',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: [
          'POST /register - User registration',
          'POST /login - User login',
          'POST /logout - User logout (protected)',
          'POST /refresh - Refresh access token',
          'GET /me - Get current user (protected)',
          'POST /validate - Validate token (internal)',
          'GET /health - Health check'
        ]
      };
    });

    return fastify;
  } catch (error) {
    fastify.log.error(error);
    throw error;
  }
}

async function start() {
  try {
    // Initialize database connection and run migrations
    await database.connect();
    await runMigrations();

    const app = await buildApp();
    
    await app.listen({
      host: config.server.host,
      port: config.server.port,
    });

    console.log(`
🔐 Auth Service started successfully!
📍 Server running at: http://${config.server.host}:${config.server.port}
🌍 Environment: ${config.env}
📊 Health check: http://${config.server.host}:${config.server.port}/health
🔑 Available endpoints:
   - POST /register - User registration
   - POST /login - User login
   - POST /logout - User logout (protected)
   - POST /refresh - Refresh access token
   - GET /me - Get current user (protected)
   - POST /validate - Validate token (internal)
`);

    // Graceful shutdown
    const signals = ['SIGINT', 'SIGTERM'];
    signals.forEach((signal) => {
      process.on(signal, async () => {
        console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
        
        try {
          await app.close();
          await database.close();
          console.log('✅ Auth Service shut down gracefully');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during shutdown:', error);
          process.exit(1);
        }
      });
    });

  } catch (error) {
    console.error('❌ Failed to start Auth Service:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
console.log('🔄 Checking if should start Auth Service...');
console.log('📋 import.meta.url:', import.meta.url);
console.log('📋 process.argv[1]:', process.argv[1]);

// Fix path comparison for Windows
const currentModulePath = import.meta.url;
const mainModulePath = `file:///${process.argv[1].replace(/\\/g, '/')}`;
console.log('📋 Normalized paths:', { currentModulePath, mainModulePath });

if (currentModulePath === mainModulePath) {
  console.log('✅ Starting Auth Service...');
  start();
} else {
  console.log('⏸️ Not starting Auth Service (module imported)');
}

export { buildApp, start };
export default fastify; 