console.log('🔧 Starting API Gateway...');

import Fastify from 'fastify';
console.log('✅ Fastify imported');

import { config } from './config/index.js';
console.log('✅ Config imported');

console.log('🚀 API Gateway starting with configuration:');
console.log('🔧 Server:', config.server);
console.log('🔧 Services:', config.services);
console.log('🔧 CORS:', config.cors);

// Plugins
import cors from '@fastify/cors';
console.log('✅ CORS imported');
import helmet from '@fastify/helmet';
console.log('✅ Helmet imported');
import rateLimit from '@fastify/rate-limit';
console.log('✅ Rate limit imported');
import multipart from '@fastify/multipart';
console.log('✅ Multipart imported');
import staticFiles from '@fastify/static';
console.log('✅ Static files imported');

// Custom plugins
import errorHandlerPlugin from './middleware/errorHandler.js';
console.log('✅ Error handler imported');
import authPlugin from './middleware/auth.js';
console.log('✅ Auth plugin imported');

// Routes
import healthRoutes from './routes/health.js';
console.log('✅ Health routes imported');
import proxyRoutes from './routes/proxy.js';
console.log('✅ Proxy routes imported');

// Create Fastify instance
console.log('🏗️ Creating Fastify instance...');

const fastify = Fastify({
  logger: true, // Simple logger
  trustProxy: true,
});
console.log('✅ Fastify instance created successfully');

// Declare the application
declare const fastify: Fastify.FastifyInstance;

async function buildApp() {
  try {
    console.log('🏗️ Building app...');
    // Security plugins
    console.log('📋 Registering helmet...');
    await fastify.register(helmet, {
      contentSecurityPolicy: false, // Disable CSP for API
    });
    console.log('✅ Helmet registered');

    console.log('📋 Registering CORS...');
    await fastify.register(cors, config.cors);
    console.log('✅ CORS registered');

    console.log('📋 Registering rate limit...');
    await fastify.register(rateLimit, {
      max: config.rateLimit.max,
      timeWindow: config.rateLimit.timeWindow,
      errorResponseBuilder: (request, context) => ({
        success: false,
        error: 'Rate limit exceeded',
        message: `Too many requests, please try again later`,
        retryAfter: Math.round(context.ttl / 1000),
      }),
    });
    console.log('✅ Rate limit registered');

    // File upload support
    console.log('📋 Registering multipart...');
    await fastify.register(multipart, {
      limits: {
        fileSize: config.upload.maxFileSize,
      },
    });
    console.log('✅ Multipart registered');

    // Static files (for avatars, etc.)
    console.log('📋 Registering static files...');
    await fastify.register(staticFiles, {
      root: config.static.root,
      prefix: config.static.prefix,
    });
    console.log('✅ Static files registered');

    // Custom middleware
    console.log('📋 Registering error handler...');
    await fastify.register(errorHandlerPlugin);
    console.log('✅ Error handler registered');
    
    console.log('📋 Registering auth plugin...');
    await fastify.register(authPlugin);
    console.log('✅ Auth plugin registered');

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

    // Register routes
    await fastify.register(healthRoutes);
    await fastify.register(proxyRoutes);

    // Root route
    fastify.get('/', async (request, reply) => {
      return {
        success: true,
        message: 'Transcendence API Gateway',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        documentation: '/health',
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
    console.log('🚀 Starting API Gateway server...');
    const app = await buildApp();
    console.log('✅ App built successfully');
    
    await app.listen({
      host: config.server.host,
      port: config.server.port,
    });

    console.log(`
🚀 API Gateway started successfully!
📍 Server running at: http://${config.server.host}:${config.server.port}
🌍 Environment: ${config.env}
📊 Health check: http://${config.server.host}:${config.server.port}/health
📚 API Documentation: http://${config.server.host}:${config.server.port}/health/detailed
`);

    // Graceful shutdown
    const signals = ['SIGINT', 'SIGTERM'];
    signals.forEach((signal) => {
      process.on(signal, async () => {
        console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
        
        try {
          await app.close();
          console.log('✅ API Gateway shut down gracefully');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during shutdown:', error);
          process.exit(1);
        }
      });
    });

  } catch (error) {
    console.error('❌ Failed to start API Gateway:', error);
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
console.log('🔄 Checking if should start server...');
console.log('📋 import.meta.url:', import.meta.url);
console.log('📋 process.argv[1]:', process.argv[1]);

// Fix path comparison for Windows
const currentModulePath = import.meta.url;
const mainModulePath = `file:///${process.argv[1].replace(/\\/g, '/')}`;
console.log('📋 Normalized paths:', { currentModulePath, mainModulePath });

if (currentModulePath === mainModulePath) {
  console.log('✅ Starting server...');
  start();
} else {
  console.log('⏸️ Not starting server (module imported)');
}

export { buildApp, start };
export default fastify; 