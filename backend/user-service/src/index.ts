import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import path from 'path';
import { config } from './config/index';
import userRoutes from './routes/users';
import { database } from '@transcendence/shared';

// Initialize Fastify instance
const fastify = Fastify({
  logger: {
    level: config.isDevelopment ? 'info' : 'warn',
    transport: config.isDevelopment ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    } : undefined
  }
});

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);
  
  // Handle validation errors
  if (error.validation) {
    return reply.status(400).send({
      success: false,
      error: 'Validation Error',
      message: 'Request validation failed',
      details: error.validation
    });
  }

  // Handle multipart errors
  if (error.code === 'FST_FILES_LIMIT' || error.code === 'FST_FILE_TOO_LARGE') {
    return reply.status(400).send({
      success: false,
      error: 'Upload Error',
      message: error.message
    });
  }

  // Default error response
  const statusCode = error.statusCode || 500;
  const response = {
    success: false,
    error: statusCode >= 500 ? 'Internal Server Error' : error.message || 'Bad Request',
    message: statusCode >= 500 ? 'An unexpected error occurred' : error.message
  };

  if (config.isDevelopment && statusCode >= 500) {
    response.stack = error.stack;
  }

  return reply.status(statusCode).send(response);
});

// Register plugins
async function registerPlugins() {
  // Security
  await fastify.register(helmet, {
    contentSecurityPolicy: false
  });

  // CORS
  await fastify.register(cors, {
    origin: config.cors.origin,
    credentials: config.cors.credentials,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  });

  // Rate limiting
  await fastify.register(rateLimit, {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.timeWindow,
    errorResponseBuilder: (request, context) => {
      return {
        success: false,
        error: 'Too Many Requests',
        message: `Rate limit exceeded, retry in ${Math.round(context.ttl / 1000)} seconds`,
        retryAfter: Math.round(context.ttl / 1000)
      };
    }
  });

  // File upload (multipart/form-data)
  await fastify.register(multipart, {
    limits: {
      fileSize: config.upload.maxFileSize,
      files: 1 // Allow only one file per request
    }
  });

  // Static file serving for uploaded files
  await fastify.register(import('@fastify/static'), {
    root: path.resolve(config.upload.uploadPath),
    prefix: '/static/uploads/',
    decorateReply: false
  });
}

// Register routes
async function registerRoutes() {
  // API routes
  await fastify.register(userRoutes, { prefix: '/api/users' });
  
  // Root health check
  fastify.get('/', async (request, reply) => {
    return reply.status(200).send({
      success: true,
      message: 'User Service API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      service: 'user-service'
    });
  });

  // Detailed health check
  fastify.get('/health', async (request, reply) => {
    try {
      // Test database connection
      await database.get('SELECT 1');
      
      return reply.status(200).send({
        success: true,
        message: 'User Service is healthy',
        timestamp: new Date().toISOString(),
        service: 'user-service',
        version: '1.0.0',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        database: 'connected'
      });
    } catch (error) {
      fastify.log.error('Health check failed:', error);
      return reply.status(503).send({
        success: false,
        message: 'User Service is unhealthy',
        timestamp: new Date().toISOString(),
        service: 'user-service',
        error: 'Database connection failed'
      });
    }
  });

  // Ready check (Kubernetes readiness probe)
  fastify.get('/ready', async (request, reply) => {
    try {
      await database.get('SELECT 1');
      return reply.status(200).send({ status: 'ready' });
    } catch (error) {
      return reply.status(503).send({ status: 'not ready' });
    }
  });

  // Live check (Kubernetes liveness probe)
  fastify.get('/live', async (request, reply) => {
    return reply.status(200).send({ status: 'alive' });
  });
}

// Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
  fastify.log.info(`Received ${signal}, shutting down gracefully...`);
  
  fastify.close(() => {
    fastify.log.info('User Service shut down successfully');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    fastify.log.error('Force shutting down User Service');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  fastify.log.fatal('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  fastify.log.fatal('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Initialize and start server
async function start() {
  try {
    // Initialize database
    fastify.log.info('Initializing database...');
    await database.initialize();
    fastify.log.info('Database initialized successfully');

    // Register plugins and routes
    fastify.log.info('Registering plugins...');
    await registerPlugins();
    
    fastify.log.info('Registering routes...');
    await registerRoutes();

    // Start server
    const address = await fastify.listen({
      host: config.server.host,
      port: config.server.port
    });

    fastify.log.info(`🚀 User Service started successfully!`);
    fastify.log.info(`📍 Server listening on: ${address}`);
    fastify.log.info(`🔧 Environment: ${config.env}`);
    fastify.log.info(`📊 Rate limit: ${config.rateLimit.max} requests per ${config.rateLimit.timeWindow}`);
    fastify.log.info(`📁 Upload path: ${config.upload.uploadPath}`);
    fastify.log.info(`📦 Max file size: ${config.upload.maxFileSize / 1024 / 1024}MB`);

  } catch (error) {
    fastify.log.fatal('Failed to start User Service:', error);
    process.exit(1);
  }
}

// Auto-start if this file is run directly
if (process.argv[1]?.includes('index.ts') || process.argv[1]?.includes('index.js')) {
  start();
}

export { fastify };
export default start; 