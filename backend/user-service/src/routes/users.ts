import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { userService } from '../services/userService';
import { fileService, UploadedFile } from '../services/fileService';
import { authMiddleware } from '../middleware/auth';
import { 
  CreateUserDto, 
  UpdateUserDto, 
  PaginationRequest,
  database
} from '@transcendence/shared';

interface GetAllUsersRequest extends FastifyRequest {
  query: {
    active?: string;
  };
}

interface GetPaginatedUsersRequest extends FastifyRequest {
  query: PaginationRequest;
}

interface GetUserByIdRequest extends FastifyRequest {
  params: {
    id: string;
  };
}

interface CreateUserRequest extends FastifyRequest {
  body: CreateUserDto;
}

interface UpdateUserRequest extends FastifyRequest {
  body: UpdateUserDto;
}

interface UpdateProfileRequest extends FastifyRequest {
  body: Partial<UpdateUserDto>;
}

interface SearchUsersRequest extends FastifyRequest {
  query: {
    q: string;
    limit?: string;
  };
}

export default async function userRoutes(fastify: FastifyInstance) {
  
  // Get all users
  fastify.get('/getAll', {
    preHandler: authMiddleware
  }, async (request: GetAllUsersRequest, reply: FastifyReply) => {
    const isActive = request.query.active !== undefined ? 
      request.query.active === 'true' : 
      undefined;
    
    const result = await userService.getAll(isActive);
    const statusCode = result.success ? 200 : 400;
    return reply.status(statusCode).send(result);
  });

  // Get paginated users
  fastify.get('/getAllPaginated', {
    preHandler: authMiddleware
  }, async (request: GetPaginatedUsersRequest, reply: FastifyReply) => {
    const result = await userService.getAllPaginated(request.query);
    const statusCode = result.success ? 200 : 400;
    return reply.status(statusCode).send(result);
  });

  // Get user by ID
  fastify.get('/:id', {
    preHandler: authMiddleware
  }, async (request: GetUserByIdRequest, reply: FastifyReply) => {
    const id = parseInt(request.params.id);
    
    if (isNaN(id)) {
      return reply.status(400).send({
        success: false,
        error: 'Invalid user ID',
        message: 'User ID must be a valid number'
      });
    }

    const result = await userService.getById(id);
    const statusCode = result.success ? 200 : 404;
    return reply.status(statusCode).send(result);
  });

  // Create new user (internal use)
  fastify.post('/add', {
    preHandler: authMiddleware
  }, async (request: CreateUserRequest, reply: FastifyReply) => {
    const result = await userService.add(request.body);
    const statusCode = result.success ? 201 : 400;
    return reply.status(statusCode).send(result);
  });

  // Update user
  fastify.put('/update', {
    preHandler: authMiddleware
  }, async (request: UpdateUserRequest, reply: FastifyReply) => {
    const result = await userService.update(request.body);
    const statusCode = result.success ? 200 : 400;
    return reply.status(statusCode).send(result);
  });

  // Soft delete user
  fastify.delete('/soft-delete/:id', {
    preHandler: authMiddleware
  }, async (request: GetUserByIdRequest, reply: FastifyReply) => {
    const id = parseInt(request.params.id);
    
    if (isNaN(id)) {
      return reply.status(400).send({
        success: false,
        error: 'Invalid user ID',
        message: 'User ID must be a valid number'
      });
    }

    const result = await userService.softDelete(id);
    const statusCode = result.success ? 200 : 400;
    return reply.status(statusCode).send(result);
  });

  // Restore user
  fastify.post('/restore/:id', {
    preHandler: authMiddleware
  }, async (request: GetUserByIdRequest, reply: FastifyReply) => {
    const id = parseInt(request.params.id);
    
    if (isNaN(id)) {
      return reply.status(400).send({
        success: false,
        error: 'Invalid user ID',
        message: 'User ID must be a valid number'
      });
    }

    const result = await userService.restore(id);
    const statusCode = result.success ? 200 : 400;
    return reply.status(statusCode).send(result);
  });

  // Get current user profile
  fastify.get('/profile', {
    preHandler: authMiddleware
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: 'User not authenticated'
      });
    }

    const result = await userService.getProfile(request.user.userId);
    const statusCode = result.success ? 200 : 404;
    return reply.status(statusCode).send(result);
  });

  // Update current user profile
  fastify.put('/profile', {
    preHandler: authMiddleware
  }, async (request: UpdateProfileRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: 'User not authenticated'
      });
    }

    const result = await userService.updateProfile(request.user.userId, request.body);
    const statusCode = result.success ? 200 : 400;
    return reply.status(statusCode).send(result);
  });

  // Upload avatar
  fastify.post('/upload-avatar', {
    preHandler: authMiddleware
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: 'User not authenticated'
      });
    }

    try {
      // Get uploaded file
      const data = await request.file();
      
      if (!data) {
        return reply.status(400).send({
          success: false,
          error: 'No file uploaded',
          message: 'Please select a file to upload'
        });
      }

      // Convert file to buffer
      const buffer = await data.toBuffer();
      
      const uploadedFile: UploadedFile = {
        filename: data.filename,
        originalName: data.filename,
        mimetype: data.mimetype,
        size: buffer.length,
        buffer
      };

      // Get current user to check existing avatar
      const currentUser = await userService.getById(request.user.userId);
      
      // Process avatar upload
      const uploadResult = await fileService.uploadAvatar(uploadedFile, request.user.userId);
      
      if (!uploadResult.success) {
        return reply.status(400).send(uploadResult);
      }

      // Update user's avatar URL in database
      const updateResult = await userService.updateProfile(request.user.userId, {
        avatarUrl: uploadResult.data!.medium // Use medium size as default
      });

      if (!updateResult.success) {
        // If database update fails, clean up uploaded files
        await fileService.deleteAvatar(uploadResult.data!.medium);
        return reply.status(500).send({
          success: false,
          error: 'Failed to update user avatar',
          message: 'Avatar upload succeeded but database update failed'
        });
      }

      // Delete old avatar if exists
      if (currentUser.success && currentUser.data?.avatarUrl) {
        await fileService.deleteAvatar(currentUser.data.avatarUrl);
      }

      return reply.status(200).send({
        success: true,
        data: {
          user: updateResult.data,
          avatarUrls: uploadResult.data
        }
      });

    } catch (error) {
      console.error('Avatar upload error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Upload failed',
        message: 'An error occurred while uploading the avatar'
      });
    }
  });

  // Set online status
  fastify.post('/online', {
    preHandler: authMiddleware
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: 'User not authenticated'
      });
    }

    const result = await userService.setOnlineStatus(request.user.userId, true);
    const statusCode = result.success ? 200 : 400;
    return reply.status(statusCode).send(result);
  });

  // Set offline status
  fastify.post('/offline', {
    preHandler: authMiddleware
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: 'User not authenticated'
      });
    }

    const result = await userService.setOnlineStatus(request.user.userId, false);
    const statusCode = result.success ? 200 : 400;
    return reply.status(statusCode).send(result);
  });

  // Search users
  fastify.get('/search', {
    preHandler: authMiddleware
  }, async (request: SearchUsersRequest, reply: FastifyReply) => {
    const { q, limit } = request.query;
    
    if (!q) {
      return reply.status(400).send({
        success: false,
        error: 'Search query required',
        message: 'Please provide a search query parameter "q"'
      });
    }

    const searchLimit = limit ? parseInt(limit) : 20;
    
    if (isNaN(searchLimit) || searchLimit < 1 || searchLimit > 100) {
      return reply.status(400).send({
        success: false,
        error: 'Invalid limit',
        message: 'Limit must be a number between 1 and 100'
      });
    }

    const result = await userService.searchUsers(q, searchLimit);
    const statusCode = result.success ? 200 : 400;
    return reply.status(statusCode).send(result);
  });

  // Get user statistics
  fastify.get('/stats/:id', {
    preHandler: authMiddleware
  }, async (request: GetUserByIdRequest, reply: FastifyReply) => {
    const id = parseInt(request.params.id);
    
    if (isNaN(id)) {
      return reply.status(400).send({
        success: false,
        error: 'Invalid user ID',
        message: 'User ID must be a valid number'
      });
    }

    try {
      // Get user basic info
      const userResult = await userService.getById(id);
      if (!userResult.success) {
        return reply.status(404).send(userResult);
      }

      // Get game statistics
      const gameStats = await database.get(`
        SELECT 
          COUNT(*) as totalGames,
          SUM(CASE WHEN winner = ? THEN 1 ELSE 0 END) as wins,
          SUM(CASE WHEN winner != ? AND winner IS NOT NULL THEN 1 ELSE 0 END) as losses,
          SUM(CASE WHEN status = 'finished' AND winner = ? THEN 1 ELSE 0 END) as finishedWins,
          AVG(CASE WHEN player1Id = ? THEN player1Score ELSE player2Score END) as avgScore
        FROM games 
        WHERE (player1Id = ? OR player2Id = ?) AND status = 'finished'
      `, [id, id, id, id, id, id]);

      // Get recent games
      const recentGames = await database.all(`
        SELECT 
          id, player1Id, player2Id, winner, player1Score, player2Score,
          status, startedAt, endedAt, createdAt
        FROM games 
        WHERE (player1Id = ? OR player2Id = ?) 
        ORDER BY createdAt DESC 
        LIMIT 10
      `, [id, id]);

      // Calculate win rate
      const totalGames = gameStats.totalGames || 0;
      const wins = gameStats.wins || 0;
      const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

      return reply.status(200).send({
        success: true,
        data: {
          user: userResult.data,
          stats: {
            totalGames,
            wins,
            losses: gameStats.losses || 0,
            winRate,
            averageScore: Math.round(gameStats.avgScore || 0)
          },
          recentGames: recentGames.map(game => ({
            ...game,
            startedAt: game.startedAt ? new Date(game.startedAt) : null,
            endedAt: game.endedAt ? new Date(game.endedAt) : null,
            createdAt: new Date(game.createdAt)
          }))
        }
      });

    } catch (error) {
      console.error('Get user stats error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to get user statistics',
        message: 'An error occurred while fetching user statistics'
      });
    }
  });

  // Health check for this service
  fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.status(200).send({
      success: true,
      message: 'User Service is healthy',
      timestamp: new Date().toISOString(),
      service: 'user-service',
      version: '1.0.0'
    });
  });
} 