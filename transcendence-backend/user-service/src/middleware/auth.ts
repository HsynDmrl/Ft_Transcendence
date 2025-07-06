import { FastifyRequest, FastifyReply } from 'fastify';
import { JwtUtils, JwtPayload } from '@transcendence/shared';

declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader) {
      return reply.status(401).send({
        success: false,
        error: 'Authorization header is required'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return reply.status(401).send({
        success: false,
        error: 'Token is required'
      });
    }

    try {
      const decoded = JwtUtils.verifyToken(token);
      request.user = decoded;
    } catch (error) {
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