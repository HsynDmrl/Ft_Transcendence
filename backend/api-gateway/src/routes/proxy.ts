import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { 
  authService, 
  userService, 
  friendshipService, 
  gameService 
} from '../services/serviceProxy.js';
import { requireAuth } from '../middleware/auth.js';

export default async function proxyRoutes(fastify: FastifyInstance) {
  
  // Auth Service Routes (Public)
  fastify.register(async function(fastify) {
    fastify.addHook('preHandler', async (request, reply) => {
      // Skip auth for auth routes
      console.log(`🔄 API Gateway: Processing ${request.method} ${request.url}`);
    });

    // Authentication routes
    fastify.post('/api/auth/register', async (request: FastifyRequest, reply: FastifyReply) => {
      console.log('📝 API Gateway: Registration request received');
      console.log('📝 Request body:', JSON.stringify(request.body, null, 2));
      
      try {
        const response = await authService.forwardRequest(request, '/register', {
          method: 'POST',
          body: request.body,
        });
        
        console.log('✅ API Gateway: Auth service response:', {
          status: response.status,
          data: response.data
        });
        
        return reply.status(response.status).send(response.data);
      } catch (error: any) {
        console.error('❌ API Gateway: Error forwarding to auth service:', {
          message: error.message,
          statusCode: error.statusCode,
          stack: error.stack
        });
        
        // Use the statusCode from the error (which preserves the original from auth service)
        const statusCode = error.statusCode || 500;
        
        return reply.status(statusCode).send({
          success: false,
          error: error.message || 'Internal server error'
        });
      }
    });

    fastify.post('/api/auth/login', async (request: FastifyRequest, reply: FastifyReply) => {
      const response = await authService.forwardRequest(request, '/login', {
        method: 'POST',
        body: request.body,
      });
      return reply.status(response.status).send(response.data);
    });

    fastify.post('/api/auth/logout', async (request: FastifyRequest, reply: FastifyReply) => {
      const response = await authService.forwardRequest(request, '/logout', {
        method: 'POST',
        body: request.body,
      });
      return reply.status(response.status).send(response.data);
    });

    fastify.post('/api/auth/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
      const response = await authService.forwardRequest(request, '/refresh', {
        method: 'POST',
        body: request.body,
      });
      return reply.status(response.status).send(response.data);
    });

    fastify.get('/api/auth/me', async (request: FastifyRequest, reply: FastifyReply) => {
      const response = await authService.forwardRequest(request, '/me', {
        method: 'GET',
      });
      return reply.status(response.status).send(response.data);
    });
  });

  // User Service Routes (Protected)
  fastify.register(async function(fastify) {
    fastify.addHook('preHandler', requireAuth);

    // User management
    fastify.get('/api/users/getAll', async (request: FastifyRequest, reply: FastifyReply) => {
      const response = await userService.forwardRequest(request, '/getAll', {
        method: 'GET',
        params: request.query as Record<string, any>,
      });
      return reply.status(response.status).send(response.data);
    });

    fastify.get('/api/users/getAllPaginated', async (request: FastifyRequest, reply: FastifyReply) => {
      const response = await userService.forwardRequest(request, '/getAllPaginated', {
        method: 'GET',
        params: request.query as Record<string, any>,
      });
      return reply.status(response.status).send(response.data);
    });

    fastify.get('/api/users/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const response = await userService.forwardRequest(request, `/${request.params.id}`, {
        method: 'GET',
      });
      return reply.status(response.status).send(response.data);
    });

    fastify.post('/api/users/add', async (request: FastifyRequest, reply: FastifyReply) => {
      const response = await userService.forwardRequest(request, '/add', {
        method: 'POST',
        body: request.body,
      });
      return reply.status(response.status).send(response.data);
    });

    fastify.put('/api/users/update', async (request: FastifyRequest, reply: FastifyReply) => {
      const response = await userService.forwardRequest(request, '/update', {
        method: 'PUT',
        body: request.body,
      });
      return reply.status(response.status).send(response.data);
    });

    fastify.delete('/api/users/soft-delete/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const response = await userService.forwardRequest(request, `/soft-delete/${request.params.id}`, {
        method: 'DELETE',
      });
      return reply.status(response.status).send(response.data);
    });

    fastify.post('/api/users/restore/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const response = await userService.forwardRequest(request, `/restore/${request.params.id}`, {
        method: 'POST',
      });
      return reply.status(response.status).send(response.data);
    });

    // Profile management
    fastify.get('/api/users/profile', async (request: FastifyRequest, reply: FastifyReply) => {
      const response = await userService.forwardRequest(request, '/profile', {
        method: 'GET',
      });
      return reply.status(response.status).send(response.data);
    });

    fastify.put('/api/users/profile', async (request: FastifyRequest, reply: FastifyReply) => {
      const response = await userService.forwardRequest(request, '/profile', {
        method: 'PUT',
        body: request.body,
      });
      return reply.status(response.status).send(response.data);
    });

    fastify.post('/api/users/upload-avatar', async (request: FastifyRequest, reply: FastifyReply) => {
      const response = await userService.forwardRequest(request, '/upload-avatar', {
        method: 'POST',
        body: request.body,
      });
      return reply.status(response.status).send(response.data);
    });

    // Online status
    fastify.post('/api/users/online', async (request: FastifyRequest, reply: FastifyReply) => {
      const response = await userService.forwardRequest(request, '/online', {
        method: 'POST',
      });
      return reply.status(response.status).send(response.data);
    });

    fastify.post('/api/users/offline', async (request: FastifyRequest, reply: FastifyReply) => {
      const response = await userService.forwardRequest(request, '/offline', {
        method: 'POST',
      });
      return reply.status(response.status).send(response.data);
    });
  });

  // Friendship Service Routes (Protected)
  fastify.register(async function(fastify) {
    fastify.addHook('preHandler', requireAuth);

    fastify.get('/api/friendships', async (request: FastifyRequest, reply: FastifyReply) => {
      const response = await friendshipService.forwardRequest(request, '/', {
        method: 'GET',
        params: request.query as Record<string, any>,
      });
      return reply.status(response.status).send(response.data);
    });

    fastify.post('/api/friendships/request', async (request: FastifyRequest, reply: FastifyReply) => {
      const response = await friendshipService.forwardRequest(request, '/request', {
        method: 'POST',
        body: request.body,
      });
      return reply.status(response.status).send(response.data);
    });

    fastify.post('/api/friendships/accept', async (request: FastifyRequest, reply: FastifyReply) => {
      const response = await friendshipService.forwardRequest(request, '/accept', {
        method: 'POST',
        body: request.body,
      });
      return reply.status(response.status).send(response.data);
    });

    fastify.post('/api/friendships/decline', async (request: FastifyRequest, reply: FastifyReply) => {
      const response = await friendshipService.forwardRequest(request, '/decline', {
        method: 'POST',
        body: request.body,
      });
      return reply.status(response.status).send(response.data);
    });

    fastify.delete('/api/friendships/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const response = await friendshipService.forwardRequest(request, `/${request.params.id}`, {
        method: 'DELETE',
      });
      return reply.status(response.status).send(response.data);
    });

    fastify.get('/api/friendships/online-friends', async (request: FastifyRequest, reply: FastifyReply) => {
      const response = await friendshipService.forwardRequest(request, '/online-friends', {
        method: 'GET',
      });
      return reply.status(response.status).send(response.data);
    });
  });

  // Game Service Routes (Protected)
  fastify.register(async function(fastify) {
    fastify.addHook('preHandler', requireAuth);

    // Game management
    fastify.get('/api/games', async (request: FastifyRequest, reply: FastifyReply) => {
      const response = await gameService.forwardRequest(request, '/', {
        method: 'GET',
        params: request.query as Record<string, any>,
      });
      return reply.status(response.status).send(response.data);
    });

    fastify.post('/api/games/create', async (request: FastifyRequest, reply: FastifyReply) => {
      const response = await gameService.forwardRequest(request, '/create', {
        method: 'POST',
        body: request.body,
      });
      return reply.status(response.status).send(response.data);
    });

    fastify.post('/api/games/join/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const response = await gameService.forwardRequest(request, `/join/${request.params.id}`, {
        method: 'POST',
      });
      return reply.status(response.status).send(response.data);
    });

    fastify.post('/api/games/start/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const response = await gameService.forwardRequest(request, `/start/${request.params.id}`, {
        method: 'POST',
      });
      return reply.status(response.status).send(response.data);
    });

    fastify.post('/api/games/finish/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const response = await gameService.forwardRequest(request, `/finish/${request.params.id}`, {
        method: 'POST',
        body: request.body,
      });
      return reply.status(response.status).send(response.data);
    });

    // Match history
    fastify.get('/api/games/history/:userId', async (request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) => {
      const response = await gameService.forwardRequest(request, `/history/${request.params.userId}`, {
        method: 'GET',
        params: request.query as Record<string, any>,
      });
      return reply.status(response.status).send(response.data);
    });

    // Tournaments
    fastify.get('/api/tournaments', async (request: FastifyRequest, reply: FastifyReply) => {
      const response = await gameService.forwardRequest(request, '/tournaments', {
        method: 'GET',
        params: request.query as Record<string, any>,
      });
      return reply.status(response.status).send(response.data);
    });

    fastify.post('/api/tournaments/create', async (request: FastifyRequest, reply: FastifyReply) => {
      const response = await gameService.forwardRequest(request, '/tournaments/create', {
        method: 'POST',
        body: request.body,
      });
      return reply.status(response.status).send(response.data);
    });

    fastify.post('/api/tournaments/join/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const response = await gameService.forwardRequest(request, `/tournaments/join/${request.params.id}`, {
        method: 'POST',
      });
      return reply.status(response.status).send(response.data);
    });

    // Leaderboard
    fastify.get('/api/leaderboard', async (request: FastifyRequest, reply: FastifyReply) => {
      const response = await gameService.forwardRequest(request, '/leaderboard', {
        method: 'GET',
        params: request.query as Record<string, any>,
      });
      return reply.status(response.status).send(response.data);
    });
  });
} 