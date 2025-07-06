import Joi from 'joi';
import { 
  CreateUserDto, 
  UpdateUserDto, 
  LoginDto, 
  RegisterDto,
  PaginationRequest 
} from '../types/index.js';

// Common validation schemas
export const emailSchema = Joi.string()
  .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'org', 'edu', 'gov', 'mil', 'tr', 'io'] } })
  .required()
  .messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  });

export const passwordSchema = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
  .required()
  .messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.max': 'Password must be less than 128 characters long',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    'any.required': 'Password is required'
  });

export const displayNameSchema = Joi.string()
  .min(3)
  .max(20)
  .pattern(/^[a-zA-Z0-9_-]+$/)
  .messages({
    'string.min': 'Display name must be at least 3 characters long',
    'string.max': 'Display name must be less than 20 characters long',
    'string.pattern.base': 'Display name can only contain letters, numbers, underscores, and hyphens'
  });

export const nameSchema = Joi.string()
  .min(2)
  .max(50)
  .pattern(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/)
  .required()
  .messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name must be less than 50 characters long',
    'string.pattern.base': 'Name can only contain letters and spaces',
    'any.required': 'Name is required'
  });

// User validation schemas
export const createUserSchema = Joi.object<CreateUserDto>({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  displayName: displayNameSchema.optional()
});

export const updateUserSchema = Joi.object<UpdateUserDto>({
  id: Joi.number().integer().positive().required(),
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  email: emailSchema.optional(),
  displayName: displayNameSchema.optional(),
  avatarUrl: Joi.string().uri().max(500).optional(),
  isActive: Joi.boolean().optional()
});

export const loginSchema = Joi.object<LoginDto>({
  email: emailSchema,
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  })
});

export const registerSchema = Joi.object<RegisterDto>({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  displayName: displayNameSchema.required()
});

// Pagination validation
export const paginationSchema = Joi.object<PaginationRequest>({
  page: Joi.number().integer().min(1).default(1),
  size: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().max(50).optional()
});

// Common parameter validation
export const idSchema = Joi.number().integer().positive().required();

export const friendshipActionSchema = Joi.object({
  targetUserId: Joi.number().integer().positive().required()
});

export const gameScoreSchema = Joi.object({
  gameId: Joi.number().integer().positive().required(),
  player1Score: Joi.number().integer().min(0).required(),
  player2Score: Joi.number().integer().min(0).required()
});

export const tournamentSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(500).optional(),
  maxPlayers: Joi.number().integer().min(2).max(64).default(8),
  startDate: Joi.date().greater('now').required()
});

// Validation helper class
export class ValidationUtils {
  static validate<T>(schema: Joi.ObjectSchema<T>, data: any): { 
    value: T; 
    error?: Joi.ValidationError 
  } {
    const result = schema.validate(data, { 
      abortEarly: false,
      stripUnknown: true 
    });
    
    return {
      value: result.value,
      error: result.error
    };
  }

  static async validateAsync<T>(schema: Joi.ObjectSchema<T>, data: any): Promise<{ 
    value: T; 
    error?: Joi.ValidationError 
  }> {
    try {
      const value = await schema.validateAsync(data, { 
        abortEarly: false,
        stripUnknown: true 
      });
      
      return { value };
    } catch (error) {
      return { 
        value: data, 
        error: error as Joi.ValidationError 
      };
    }
  }

  static formatValidationErrors(error: Joi.ValidationError): string[] {
    return error.details.map(detail => detail.message);
  }

  static isValidEmail(email: string): boolean {
    const result = emailSchema.validate(email);
    return !result.error;
  }

  static isValidPassword(password: string): boolean {
    const result = passwordSchema.validate(password);
    return !result.error;
  }

  static isValidDisplayName(displayName: string): boolean {
    const result = displayNameSchema.validate(displayName);
    return !result.error;
  }
}

export default ValidationUtils; 