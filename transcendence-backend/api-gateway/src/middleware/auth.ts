import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { JwtUtils, JwtPayload } from '@transcendence/shared';

declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}

export interface AuthMiddlewareOptions {
  optional?: boolean;
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
  options: AuthMiddlewareOptions = {}
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader) {
      if (options.optional) {
        return;
      }
      return reply.status(401).send({
        success: false,
        error: 'Authorization header is required'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      if (options.optional) {
        return;
      }
      return reply.status(401).send({
        success: false,
        error: 'Token is required'
      });
    }

    try {
      const decoded = JwtUtils.verifyToken(token);
      request.user = decoded;
    } catch (error) {
      if (options.optional) {
        return;
      }
      return reply.status(401).send({
        success: false,
        error: 'Invalid or expired token'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return reply.status(500).send({
      success: false,
      error: 'Internal server error'
    });
  }
}

// Prehandler function for required authentication
export const requireAuth = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  await authMiddleware(request, reply, { optional: false });
};

// Prehandler function for optional authentication
export const optionalAuth = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  await authMiddleware(request, reply, { optional: true });
};

// Plugin for registering auth middleware
export default async function authPlugin(fastify: FastifyInstance) {
  fastify.decorateRequest('user', null);
  
  fastify.addHook('preHandler', async (request, reply) => {
    // Skip auth for health check and public routes
    const publicRoutes = ['/health', '/api/auth/login', '/api/auth/register'];
    
    if (publicRoutes.some(route => request.url.startsWith(route))) {
      return;
    }

    // Apply optional auth to all routes by default
    await optionalAuth(request, reply);
  });
} 