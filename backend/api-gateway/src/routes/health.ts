import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { checkServicesHealth } from '../services/serviceProxy.js';

interface HealthResponse {
  success: boolean;
  timestamp: string;
  uptime: number;
  version: string;
  services?: Record<string, boolean>;
  status: 'healthy' | 'degraded' | 'unhealthy';
}

export default async function healthRoutes(fastify: FastifyInstance) {
  // Simple health check
  fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    const response: HealthResponse = {
      success: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      status: 'healthy',
    };

    return reply.status(200).send(response);
  });

  // Detailed health check with services
  fastify.get('/health/detailed', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const servicesHealth = await checkServicesHealth();
      const healthyServices = Object.values(servicesHealth).filter(Boolean).length;
      const totalServices = Object.keys(servicesHealth).length;

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      if (healthyServices === 0) {
        status = 'unhealthy';
      } else if (healthyServices < totalServices) {
        status = 'degraded';
      }

      const response: HealthResponse = {
        success: true,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        services: servicesHealth,
        status,
      };

      const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 207 : 503;
      return reply.status(statusCode).send(response);
    } catch (error) {
      console.error('Health check error:', error);
      
      const response: HealthResponse = {
        success: false,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        status: 'unhealthy',
      };

      return reply.status(503).send(response);
    }
  });

  // Readiness probe
  fastify.get('/ready', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const servicesHealth = await checkServicesHealth();
      const allHealthy = Object.values(servicesHealth).every(Boolean);

      if (allHealthy) {
        return reply.status(200).send({
          success: true,
          message: 'All services are ready',
          services: servicesHealth,
        });
      } else {
        return reply.status(503).send({
          success: false,
          message: 'Some services are not ready',
          services: servicesHealth,
        });
      }
    } catch (error) {
      console.error('Readiness check error:', error);
      return reply.status(503).send({
        success: false,
        message: 'Readiness check failed',
      });
    }
  });

  // Liveness probe
  fastify.get('/live', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.status(200).send({
      success: true,
      message: 'API Gateway is alive',
      timestamp: new Date().toISOString(),
    });
  });
} 