export const config = {
  // Server configuration
  server: {
    host: process.env.HOST || '0.0.0.0',
    port: parseInt(process.env.PORT || '3004'),
  },

  // CORS configuration
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },

  // Rate limiting
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    timeWindow: process.env.RATE_LIMIT_WINDOW || '15 minutes',
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'transcendence-super-secret-key-change-in-production',
  },

  // Game configuration
  game: {
    maxPlayers: 2,
    matchmakingTimeout: 30000, // 30 seconds
    gameTimeout: 600000, // 10 minutes
  },

  // Environment
  env: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
}; 