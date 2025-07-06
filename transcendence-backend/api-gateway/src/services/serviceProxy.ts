import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { FastifyRequest } from 'fastify';
import { config } from '../config/index.js';
import { ServiceUnavailableError, AppError } from '../middleware/errorHandler.js';

export interface ServiceConfig {
  url: string;
  timeout: number;
}

export interface ProxyOptions {
  method?: string;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  body?: any;
  timeout?: number;
}

export class ServiceProxy {
  private client: AxiosInstance;
  private serviceName: string;

  constructor(serviceName: string, serviceConfig: ServiceConfig) {
    this.serviceName = serviceName;
    
    console.log(`🔧 Initializing ${serviceName} proxy with config:`, serviceConfig);
    
    this.client = axios.create({
      baseURL: serviceConfig.url,
      timeout: serviceConfig.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[${this.serviceName}] 🚀 Making request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
        console.log(`[${this.serviceName}] 🔧 Headers:`, config.headers);
        console.log(`[${this.serviceName}] 📦 Data:`, config.data);
        return config;
      },
      (error) => {
        console.error(`[${this.serviceName}] ❌ Request error:`, error.message);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log(`[${this.serviceName}] ✅ Success: ${response.status} ${response.config.url}`);
        console.log(`[${this.serviceName}] 📦 Response data:`, response.data);
        return response;
      },
      (error) => {
        console.error(`[${this.serviceName}] ❌ Response error:`, {
          message: error.message,
          code: error.code,
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          fullURL: `${error.config?.baseURL}${error.config?.url}`,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
        
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          console.error(`[${this.serviceName}] 🔌 Connection failed to: ${error.config?.baseURL}${error.config?.url}`);
          throw new ServiceUnavailableError(`${this.serviceName} service is unavailable`);
        }
        
        if (error.response) {
          // Forward the error response from the service with the original status code
          const originalError = new AppError(
            error.response.data?.error || error.response.data?.message || 'Service error',
            error.response.status
          );
          originalError.status = error.response.status; // Preserve the original status
          throw originalError;
        }
        
        throw error;
      }
    );
  }

  async request<T = any>(
    path: string,
    options: ProxyOptions = {}
  ): Promise<AxiosResponse<T>> {
    const requestConfig: AxiosRequestConfig = {
      method: (options.method || 'GET') as any,
      url: path,
      headers: options.headers,
      params: options.params,
      data: options.body,
      timeout: options.timeout,
    };

    return this.client.request<T>(requestConfig);
  }

  async get<T = any>(path: string, options: Omit<ProxyOptions, 'method' | 'body'> = {}): Promise<AxiosResponse<T>> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  async post<T = any>(path: string, body?: any, options: Omit<ProxyOptions, 'method' | 'body'> = {}): Promise<AxiosResponse<T>> {
    return this.request<T>(path, { ...options, method: 'POST', body });
  }

  async put<T = any>(path: string, body?: any, options: Omit<ProxyOptions, 'method' | 'body'> = {}): Promise<AxiosResponse<T>> {
    return this.request<T>(path, { ...options, method: 'PUT', body });
  }

  async patch<T = any>(path: string, body?: any, options: Omit<ProxyOptions, 'method' | 'body'> = {}): Promise<AxiosResponse<T>> {
    return this.request<T>(path, { ...options, method: 'PATCH', body });
  }

  async delete<T = any>(path: string, options: Omit<ProxyOptions, 'method' | 'body'> = {}): Promise<AxiosResponse<T>> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }

  // Helper method to forward request with authentication
  async forwardRequest<T = any>(
    request: FastifyRequest,
    path: string,
    options: Omit<ProxyOptions, 'headers'> = {}
  ): Promise<AxiosResponse<T>> {
    const headers: Record<string, string> = {};

    // Forward authorization header
    if (request.headers.authorization) {
      headers['Authorization'] = request.headers.authorization;
    }

    // Forward user agent
    if (request.headers['user-agent']) {
      headers['User-Agent'] = request.headers['user-agent'];
    }

    // Forward content type for non-GET requests
    if (request.headers['content-type'] && options.method !== 'GET') {
      headers['Content-Type'] = request.headers['content-type'];
    }

    return this.request<T>(path, {
      ...options,
      headers: { ...headers, ...options.headers },
    });
  }
}

// Service proxy instances
export const authService = new ServiceProxy('auth-service', config.services.auth);
export const userService = new ServiceProxy('user-service', config.services.user);
export const friendshipService = new ServiceProxy('friendship-service', config.services.friendship);
export const gameService = new ServiceProxy('game-service', config.services.game);

// Health check for all services
export async function checkServicesHealth(): Promise<Record<string, boolean>> {
  const services = {
    auth: authService,
    user: userService,
    friendship: friendshipService,
    game: gameService,
  };

  const results: Record<string, boolean> = {};

  await Promise.allSettled(
    Object.entries(services).map(async ([name, service]) => {
      try {
        await service.get('/health', { timeout: 5000 });
        results[name] = true;
      } catch (error) {
        console.error(`Health check failed for ${name}:`, error);
        results[name] = false;
      }
    })
  );

  return results;
} 