import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authService } from '../services/authService.js';
import { authMiddleware } from '../middleware/auth.js';
import { RegisterDto, LoginDto } from '@transcendence/shared';

interface RegisterRequest extends FastifyRequest {
  body: RegisterDto;
}

interface LoginRequest extends FastifyRequest {
  body: LoginDto;
}

interface RefreshRequest extends FastifyRequest {
  body: {
    refreshToken: string;
  };
}

export default async function authRoutes(fastify: FastifyInstance) {
  
  // User Registration
  fastify.post('/register', async (request: RegisterRequest, reply: FastifyReply) => {
    console.log('👤 Auth Service: Registration request received');
    console.log('👤 Request body:', JSON.stringify(request.body, null, 2));
    
    try {
      const result = await authService.register(request.body);
      
      console.log('👤 Auth Service: Registration result:', {
        success: result.success,
        hasData: !!result.data,
        error: result.error
      });
      
      const statusCode = result.success ? 201 : 400;
      return reply.status(statusCode).send(result);
    } catch (error: any) {
      console.error('❌ Auth Service: Registration error:', {
        message: error.message,
        stack: error.stack
      });
      
      return reply.status(500).send({
        success: false,
        error: 'Internal server error during registration'
      });
    }
  });

  // User Login
  fastify.post('/login', async (request: LoginRequest, reply: FastifyReply) => {
    const result = await authService.login(request.body);
    
    const statusCode = result.success ? 200 : 401;
    return reply.status(statusCode).send(result);
  });

  // User Logout (Protected)
  fastify.post('/logout', {
    preHandler: authMiddleware
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: 'User not authenticated'
      });
    }

    const result = await authService.logout(request.user.userId);
    
    const statusCode = result.success ? 200 : 400;
    return reply.status(statusCode).send(result);
  });

  // Refresh Token
  fastify.post('/refresh', async (request: RefreshRequest, reply: FastifyReply) => {
    if (!request.body.refreshToken) {
      return reply.status(400).send({
        success: false,
        error: 'Refresh token is required'
      });
    }

    const result = await authService.refreshToken(request.body.refreshToken);
    
    const statusCode = result.success ? 200 : 401;
    return reply.status(statusCode).send(result);
  });

  // Get Current User (Protected)
  fastify.get('/me', {
    preHandler: authMiddleware
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: 'User not authenticated'
      });
    }

    const result = await authService.getMe(request.user.userId);
    
    const statusCode = result.success ? 200 : 404;
    return reply.status(statusCode).send(result);
  });

  // Validate Token (Internal endpoint for other services)
  fastify.post('/validate', {
    preHandler: authMiddleware
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: 'Invalid token'
      });
    }

    // Check if user still exists and is active
    const isValid = await authService.validateUser(request.user.userId);
    
    if (!isValid) {
      return reply.status(401).send({
        success: false,
        error: 'User no longer exists or is inactive'
      });
    }

    return reply.status(200).send({
      success: true,
      data: {
        userId: request.user.userId,
        email: request.user.email,
        displayName: request.user.displayName
      }
    });
  });

  // Health check for this service
  fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.status(200).send({
      success: true,
      message: 'Auth Service is healthy',
      timestamp: new Date().toISOString(),
      service: 'auth-service',
      version: '1.0.0'
    });
  });
} 