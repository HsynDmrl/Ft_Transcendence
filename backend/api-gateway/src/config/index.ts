import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const config = {
  // Server configuration
  server: {
    host: process.env.HOST || '0.0.0.0',
    port: parseInt(process.env.PORT || '3000'),
  },

  // CORS configuration
  cors: {
    origin: process.env.FRONTEND_URLS?.split(',') || ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  },

  // Rate limiting
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    timeWindow: process.env.RATE_LIMIT_WINDOW || '15 minutes',
  },

  // Microservices URLs
  services: {
    auth: {
      url: process.env.AUTH_SERVICE_URL || 'http://127.0.0.1:3001',
      timeout: 10000,
    },
    user: {
      url: process.env.USER_SERVICE_URL || 'http://127.0.0.1:3002',
      timeout: 10000,
    },
    friendship: {
      url: process.env.FRIENDSHIP_SERVICE_URL || 'http://127.0.0.1:3003',
      timeout: 10000,
    },
    game: {
      url: process.env.GAME_SERVICE_URL || 'http://127.0.0.1:3004',
      timeout: 10000,
    },
  },

  // Static files
  static: {
    root: process.env.STATIC_FILES_PATH || path.resolve(__dirname, '../../public'),
    prefix: '/static/',
  },

  // Upload configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ],
    uploadPath: process.env.UPLOAD_PATH || path.resolve(__dirname, '../../uploads'),
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'transcendence-super-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  // Environment
  env: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
}; 