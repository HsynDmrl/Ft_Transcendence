import { 
  database, 
  JwtUtils, 
  PasswordUtils,
  User,
  RegisterDto,
  LoginDto,
  ValidationUtils,
  registerSchema,
  loginSchema,
  ApiResponse,
  TokenPair
} from '@transcendence/shared';

export interface AuthResponse {
  user: Omit<User, 'passwordHash'>;
  tokens: TokenPair;
}

export class AuthService {
  
  async register(data: RegisterDto): Promise<ApiResponse<AuthResponse>> {
    try {
      // Validate input
      const { value: validatedData, error } = ValidationUtils.validate(registerSchema, data);
      if (error) {
        return {
          success: false,
          error: 'Validation failed',
          message: ValidationUtils.formatValidationErrors(error).join(', ')
        };
      }

      // Check if email already exists
      const existingUser = await database.get(
        'SELECT id FROM users WHERE email = ?',
        [validatedData.email]
      );

      if (existingUser) {
        return {
          success: false,
          error: 'Email already registered',
          message: 'A user with this email already exists'
        };
      }

      // Check if display name already exists (if provided)
      if (validatedData.displayName) {
        const existingDisplayName = await database.get(
          'SELECT id FROM users WHERE displayName = ?',
          [validatedData.displayName]
        );

        if (existingDisplayName) {
          return {
            success: false,
            error: 'Display name already taken',
            message: 'This display name is already in use'
          };
        }
      }

      // Hash password
      const passwordHash = await PasswordUtils.hashPassword(validatedData.password);

      // Create user
      const result = await database.run(
        `INSERT INTO users (firstName, lastName, email, displayName, passwordHash, isActive, isOnline)
         VALUES (?, ?, ?, ?, ?, 1, 0)`,
        [
          validatedData.firstName,
          validatedData.lastName,
          validatedData.email,
          validatedData.displayName || null,
          passwordHash
        ]
      );

      // Get created user
      const user = await database.get(
        `SELECT id, firstName, lastName, email, displayName, avatarUrl, isActive, isOnline, 
         lastSeen, wins, losses, createdAt, updatedAt 
         FROM users WHERE id = ?`,
        [result.lastID]
      );

      if (!user) {
        return {
          success: false,
          error: 'Failed to create user',
          message: 'User registration failed'
        };
      }

      // Generate tokens
      const tokens = JwtUtils.generateTokens({
        userId: user.id,
        email: user.email,
        displayName: user.displayName || `${user.firstName} ${user.lastName}`
      });

      return {
        success: true,
        data: {
          user: {
            ...user,
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt),
            lastSeen: user.lastSeen ? new Date(user.lastSeen) : undefined
          },
          tokens
        }
      };

    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Registration failed',
        message: 'An error occurred during registration'
      };
    }
  }

  async login(data: LoginDto): Promise<ApiResponse<AuthResponse>> {
    try {
      // Validate input
      const { value: validatedData, error } = ValidationUtils.validate(loginSchema, data);
      if (error) {
        return {
          success: false,
          error: 'Validation failed',
          message: ValidationUtils.formatValidationErrors(error).join(', ')
        };
      }

      // Find user by email
      const user = await database.get(
        `SELECT id, firstName, lastName, email, displayName, passwordHash, avatarUrl, 
         isActive, isOnline, lastSeen, wins, losses, createdAt, updatedAt 
         FROM users WHERE email = ? AND isActive = 1`,
        [validatedData.email]
      );

      if (!user) {
        return {
          success: false,
          error: 'Invalid credentials',
          message: 'Email or password is incorrect'
        };
      }

      // Verify password
      const isValidPassword = await PasswordUtils.verifyPassword(
        validatedData.password,
        user.passwordHash
      );

      if (!isValidPassword) {
        return {
          success: false,
          error: 'Invalid credentials',
          message: 'Email or password is incorrect'
        };
      }

      // Update online status and last seen
      await database.run(
        'UPDATE users SET isOnline = 1, lastSeen = CURRENT_TIMESTAMP WHERE id = ?',
        [user.id]
      );

      // Generate tokens
      const tokens = JwtUtils.generateTokens({
        userId: user.id,
        email: user.email,
        displayName: user.displayName || `${user.firstName} ${user.lastName}`
      });

      return {
        success: true,
        data: {
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            isActive: user.isActive,
            isOnline: true, // Just set to online
            lastSeen: new Date(),
            wins: user.wins,
            losses: user.losses,
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt)
          },
          tokens
        }
      };

    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Login failed',
        message: 'An error occurred during login'
      };
    }
  }

  async logout(userId: number): Promise<ApiResponse<{ message: string }>> {
    try {
      // Update online status
      await database.run(
        'UPDATE users SET isOnline = 0, lastSeen = CURRENT_TIMESTAMP WHERE id = ?',
        [userId]
      );

      return {
        success: true,
        data: {
          message: 'Logged out successfully'
        }
      };

    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        error: 'Logout failed',
        message: 'An error occurred during logout'
      };
    }
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<TokenPair>> {
    try {
      // Verify refresh token
      const decoded = JwtUtils.verifyRefreshToken(refreshToken);
      
      // Get user data
      const user = await database.get(
        `SELECT id, email, displayName, firstName, lastName, isActive 
         FROM users WHERE id = ? AND isActive = 1`,
        [decoded.userId]
      );

      if (!user) {
        return {
          success: false,
          error: 'Invalid refresh token',
          message: 'User not found or inactive'
        };
      }

      // Generate new tokens
      const tokens = JwtUtils.generateTokens({
        userId: user.id,
        email: user.email,
        displayName: user.displayName || `${user.firstName} ${user.lastName}`
      });

      return {
        success: true,
        data: tokens
      };

    } catch (error) {
      console.error('Refresh token error:', error);
      return {
        success: false,
        error: 'Token refresh failed',
        message: 'Invalid or expired refresh token'
      };
    }
  }

  async getMe(userId: number): Promise<ApiResponse<Omit<User, 'passwordHash'>>> {
    try {
      const user = await database.get(
        `SELECT id, firstName, lastName, email, displayName, avatarUrl, isActive, 
         isOnline, lastSeen, wins, losses, createdAt, updatedAt 
         FROM users WHERE id = ? AND isActive = 1`,
        [userId]
      );

      if (!user) {
        return {
          success: false,
          error: 'User not found',
          message: 'User does not exist or is inactive'
        };
      }

      return {
        success: true,
        data: {
          ...user,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt),
          lastSeen: user.lastSeen ? new Date(user.lastSeen) : undefined
        }
      };

    } catch (error) {
      console.error('Get user error:', error);
      return {
        success: false,
        error: 'Failed to get user',
        message: 'An error occurred while fetching user data'
      };
    }
  }

  async validateUser(userId: number): Promise<boolean> {
    try {
      const user = await database.get(
        'SELECT id FROM users WHERE id = ? AND isActive = 1',
        [userId]
      );

      return !!user;
    } catch (error) {
      console.error('Validate user error:', error);
      return false;
    }
  }
}

export const authService = new AuthService(); 