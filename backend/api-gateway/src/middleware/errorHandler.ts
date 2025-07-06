import { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config/index.js';

export interface ApiError {
  success: false;
  error: string;
  message?: string;
  statusCode?: number;
  details?: any;
}

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Custom error classes
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service temporarily unavailable') {
    super(message, 503);
    this.name = 'ServiceUnavailableError';
  }
}

// Error handler function
export const errorHandler = (
  error: FastifyError | AppError,
  request: FastifyRequest,
  reply: FastifyReply
): void => {
  console.error('Error occurred:', {
    message: error.message,
    stack: config.isDevelopment ? error.stack : undefined,
    url: request.url,
    method: request.method,
    userAgent: request.headers['user-agent'],
    ip: request.ip,
    timestamp: new Date().toISOString(),
  });

  // Default error response
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details: any = undefined;

  // Handle different error types
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error.statusCode) {
    // Fastify error
    statusCode = error.statusCode;
    message = error.message;
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    details = error.message;
  } else if (error.code === 'ECONNREFUSED') {
    statusCode = 503;
    message = 'Service Unavailable';
  } else if (error.code === 'ENOTFOUND') {
    statusCode = 503;
    message = 'Service Not Found';
  }

  // Prepare error response
  const errorResponse: ApiError = {
    success: false,
    error: message,
  };

  // Add details in development mode
  if (config.isDevelopment) {
    errorResponse.message = error.message;
    errorResponse.details = details || error.stack;
  }

  // Send error response
  reply.status(statusCode).send(errorResponse);
};

// Plugin for registering error handler
export default async function errorHandlerPlugin(fastify: FastifyInstance) {
  fastify.setErrorHandler(errorHandler);

  // Handle 404 errors
  fastify.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      success: false,
      error: 'Route not found',
      message: `Route ${request.method} ${request.url} not found`,
    });
  });

  // Handle validation errors
  fastify.setSchemaErrorFormatter((errors, dataVar) => {
    const messages = errors.map(error => {
      const field = error.instancePath.replace('/', '') || error.params?.missingProperty || 'unknown';
      return `${field}: ${error.message}`;
    });
    
    return new ValidationError(`Validation failed: ${messages.join(', ')}`);
  });
} 