import { 
  database, 
  User,
  CreateUserDto,
  UpdateUserDto,
  ValidationUtils,
  createUserSchema,
  updateUserSchema,
  paginationSchema,
  ApiResponse,
  PaginationRequest,
  PaginationResponse,
  PasswordUtils
} from '@transcendence/shared';

export class UserService {
  
  // Get all users (with optional filtering)
  async getAll(isActive?: boolean): Promise<ApiResponse<User[]>> {
    try {
      let query = `
        SELECT id, firstName, lastName, email, displayName, avatarUrl, 
               isActive, isOnline, lastSeen, wins, losses, createdAt, updatedAt 
        FROM users
      `;
      const params: any[] = [];

      if (isActive !== undefined) {
        query += ' WHERE isActive = ?';
        params.push(isActive ? 1 : 0);
      }

      query += ' ORDER BY createdAt DESC';

      const users = await database.all(query, params);

      return {
        success: true,
        data: users.map(user => ({
          ...user,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt),
          lastSeen: user.lastSeen ? new Date(user.lastSeen) : undefined
        }))
      };

    } catch (error) {
      console.error('Get all users error:', error);
      return {
        success: false,
        error: 'Failed to fetch users',
        message: 'An error occurred while fetching users'
      };
    }
  }

  // Get users with pagination
  async getAllPaginated(request: PaginationRequest): Promise<ApiResponse<PaginationResponse<User>>> {
    try {
      // Validate pagination parameters
      const { value: validatedRequest, error } = ValidationUtils.validate(paginationSchema, request);
      if (error) {
        return {
          success: false,
          error: 'Invalid pagination parameters',
          message: ValidationUtils.formatValidationErrors(error).join(', ')
        };
      }

      const { page, size, sort } = validatedRequest;
      const offset = (page - 1) * size;

      // Build query with sorting
      let orderBy = 'ORDER BY createdAt DESC';
      if (sort) {
        const validSortFields = ['firstName', 'lastName', 'email', 'displayName', 'createdAt', 'wins', 'losses'];
        const [field, direction] = sort.split(':');
        if (validSortFields.includes(field)) {
          orderBy = `ORDER BY ${field} ${direction === 'desc' ? 'DESC' : 'ASC'}`;
        }
      }

      // Get total count
      const countResult = await database.get(
        'SELECT COUNT(*) as total FROM users WHERE isActive = 1'
      );
      const totalItems = countResult.total;

      // Get paginated data
      const users = await database.all(`
        SELECT id, firstName, lastName, email, displayName, avatarUrl, 
               isActive, isOnline, lastSeen, wins, losses, createdAt, updatedAt 
        FROM users 
        WHERE isActive = 1 
        ${orderBy}
        LIMIT ? OFFSET ?
      `, [size, offset]);

      const totalPages = Math.ceil(totalItems / size);

      return {
        success: true,
        data: {
          data: users.map(user => ({
            ...user,
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt),
            lastSeen: user.lastSeen ? new Date(user.lastSeen) : undefined
          })),
          totalItems,
          totalPages,
          currentPage: page
        }
      };

    } catch (error) {
      console.error('Get paginated users error:', error);
      return {
        success: false,
        error: 'Failed to fetch users',
        message: 'An error occurred while fetching users'
      };
    }
  }

  // Get user by ID
  async getById(id: number): Promise<ApiResponse<User>> {
    try {
      const user = await database.get(`
        SELECT id, firstName, lastName, email, displayName, avatarUrl, 
               isActive, isOnline, lastSeen, wins, losses, createdAt, updatedAt 
        FROM users 
        WHERE id = ? AND isActive = 1
      `, [id]);

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
      console.error('Get user by ID error:', error);
      return {
        success: false,
        error: 'Failed to fetch user',
        message: 'An error occurred while fetching user'
      };
    }
  }

  // Create new user (internal use, typically from auth service)
  async add(data: CreateUserDto): Promise<ApiResponse<User>> {
    try {
      // Validate input
      const { value: validatedData, error } = ValidationUtils.validate(createUserSchema, data);
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
          error: 'Email already exists',
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
      const result = await database.run(`
        INSERT INTO users (firstName, lastName, email, displayName, passwordHash, isActive, isOnline)
        VALUES (?, ?, ?, ?, ?, 1, 0)
      `, [
        validatedData.firstName,
        validatedData.lastName,
        validatedData.email,
        validatedData.displayName || null,
        passwordHash
      ]);

      // Get created user
      const user = await database.get(`
        SELECT id, firstName, lastName, email, displayName, avatarUrl, 
               isActive, isOnline, lastSeen, wins, losses, createdAt, updatedAt 
        FROM users WHERE id = ?
      `, [result.lastID]);

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
      console.error('Create user error:', error);
      return {
        success: false,
        error: 'Failed to create user',
        message: 'An error occurred while creating user'
      };
    }
  }

  // Update user
  async update(data: UpdateUserDto): Promise<ApiResponse<User>> {
    try {
      // Validate input
      const { value: validatedData, error } = ValidationUtils.validate(updateUserSchema, data);
      if (error) {
        return {
          success: false,
          error: 'Validation failed',
          message: ValidationUtils.formatValidationErrors(error).join(', ')
        };
      }

      // Check if user exists
      const existingUser = await database.get(
        'SELECT id FROM users WHERE id = ? AND isActive = 1',
        [validatedData.id]
      );

      if (!existingUser) {
        return {
          success: false,
          error: 'User not found',
          message: 'User does not exist or is inactive'
        };
      }

      // Check email uniqueness if email is being updated
      if (validatedData.email) {
        const emailExists = await database.get(
          'SELECT id FROM users WHERE email = ? AND id != ?',
          [validatedData.email, validatedData.id]
        );

        if (emailExists) {
          return {
            success: false,
            error: 'Email already exists',
            message: 'A user with this email already exists'
          };
        }
      }

      // Check display name uniqueness if display name is being updated
      if (validatedData.displayName) {
        const displayNameExists = await database.get(
          'SELECT id FROM users WHERE displayName = ? AND id != ?',
          [validatedData.displayName, validatedData.id]
        );

        if (displayNameExists) {
          return {
            success: false,
            error: 'Display name already taken',
            message: 'This display name is already in use'
          };
        }
      }

      // Build update query dynamically
      const updateFields = [];
      const updateValues = [];

      if (validatedData.firstName) {
        updateFields.push('firstName = ?');
        updateValues.push(validatedData.firstName);
      }
      if (validatedData.lastName) {
        updateFields.push('lastName = ?');
        updateValues.push(validatedData.lastName);
      }
      if (validatedData.email) {
        updateFields.push('email = ?');
        updateValues.push(validatedData.email);
      }
      if (validatedData.displayName) {
        updateFields.push('displayName = ?');
        updateValues.push(validatedData.displayName);
      }
      if (validatedData.avatarUrl) {
        updateFields.push('avatarUrl = ?');
        updateValues.push(validatedData.avatarUrl);
      }
      if (validatedData.isActive !== undefined) {
        updateFields.push('isActive = ?');
        updateValues.push(validatedData.isActive ? 1 : 0);
      }

      if (updateFields.length === 0) {
        return {
          success: false,
          error: 'No fields to update',
          message: 'At least one field must be provided for update'
        };
      }

      updateValues.push(validatedData.id);

      // Update user
      await database.run(`
        UPDATE users 
        SET ${updateFields.join(', ')}, updatedAt = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, updateValues);

      // Get updated user
      const updatedUser = await database.get(`
        SELECT id, firstName, lastName, email, displayName, avatarUrl, 
               isActive, isOnline, lastSeen, wins, losses, createdAt, updatedAt 
        FROM users WHERE id = ?
      `, [validatedData.id]);

      return {
        success: true,
        data: {
          ...updatedUser,
          createdAt: new Date(updatedUser.createdAt),
          updatedAt: new Date(updatedUser.updatedAt),
          lastSeen: updatedUser.lastSeen ? new Date(updatedUser.lastSeen) : undefined
        }
      };

    } catch (error) {
      console.error('Update user error:', error);
      return {
        success: false,
        error: 'Failed to update user',
        message: 'An error occurred while updating user'
      };
    }
  }

  // Soft delete user
  async softDelete(id: number): Promise<ApiResponse<{ message: string }>> {
    try {
      const user = await database.get(
        'SELECT id FROM users WHERE id = ? AND isActive = 1',
        [id]
      );

      if (!user) {
        return {
          success: false,
          error: 'User not found',
          message: 'User does not exist or is already inactive'
        };
      }

      await database.run(
        'UPDATE users SET isActive = 0, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );

      return {
        success: true,
        data: {
          message: 'User deactivated successfully'
        }
      };

    } catch (error) {
      console.error('Soft delete user error:', error);
      return {
        success: false,
        error: 'Failed to deactivate user',
        message: 'An error occurred while deactivating user'
      };
    }
  }

  // Restore user
  async restore(id: number): Promise<ApiResponse<{ message: string }>> {
    try {
      const user = await database.get(
        'SELECT id FROM users WHERE id = ? AND isActive = 0',
        [id]
      );

      if (!user) {
        return {
          success: false,
          error: 'User not found',
          message: 'User does not exist or is already active'
        };
      }

      await database.run(
        'UPDATE users SET isActive = 1, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );

      return {
        success: true,
        data: {
          message: 'User restored successfully'
        }
      };

    } catch (error) {
      console.error('Restore user error:', error);
      return {
        success: false,
        error: 'Failed to restore user',
        message: 'An error occurred while restoring user'
      };
    }
  }

  // Get user profile (for authenticated user)
  async getProfile(userId: number): Promise<ApiResponse<User>> {
    return this.getById(userId);
  }

  // Update user profile (for authenticated user)
  async updateProfile(userId: number, data: Partial<UpdateUserDto>): Promise<ApiResponse<User>> {
    return this.update({ ...data, id: userId });
  }

  // Update online status
  async setOnlineStatus(userId: number, isOnline: boolean): Promise<ApiResponse<{ message: string }>> {
    try {
      await database.run(`
        UPDATE users 
        SET isOnline = ?, lastSeen = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP 
        WHERE id = ? AND isActive = 1
      `, [isOnline ? 1 : 0, userId]);

      return {
        success: true,
        data: {
          message: `User status updated to ${isOnline ? 'online' : 'offline'}`
        }
      };

    } catch (error) {
      console.error('Set online status error:', error);
      return {
        success: false,
        error: 'Failed to update status',
        message: 'An error occurred while updating user status'
      };
    }
  }

  // Search users
  async searchUsers(query: string, limit: number = 20): Promise<ApiResponse<User[]>> {
    try {
      if (!query.trim()) {
        return {
          success: false,
          error: 'Search query is required',
          message: 'Please provide a search query'
        };
      }

      const searchQuery = `%${query.trim()}%`;
      const users = await database.all(`
        SELECT id, firstName, lastName, email, displayName, avatarUrl, 
               isActive, isOnline, lastSeen, wins, losses, createdAt, updatedAt 
        FROM users 
        WHERE isActive = 1 
        AND (
          firstName LIKE ? OR 
          lastName LIKE ? OR 
          displayName LIKE ? OR 
          email LIKE ?
        )
        ORDER BY 
          CASE 
            WHEN firstName LIKE ? THEN 1
            WHEN lastName LIKE ? THEN 2
            WHEN displayName LIKE ? THEN 3
            ELSE 4
          END,
          firstName ASC
        LIMIT ?
      `, [
        searchQuery, searchQuery, searchQuery, searchQuery,
        searchQuery, searchQuery, searchQuery,
        limit
      ]);

      return {
        success: true,
        data: users.map(user => ({
          ...user,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt),
          lastSeen: user.lastSeen ? new Date(user.lastSeen) : undefined
        }))
      };

    } catch (error) {
      console.error('Search users error:', error);
      return {
        success: false,
        error: 'Search failed',
        message: 'An error occurred while searching users'
      };
    }
  }
}

export const userService = new UserService(); 