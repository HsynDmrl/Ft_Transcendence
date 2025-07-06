// Base Model
export interface BaseModel {
  id: number;
  createdAt: Date;
  updatedAt: Date;
}

// User Types
export interface User extends BaseModel {
  firstName: string;
  lastName: string;
  email: string;
  displayName?: string;
  passwordHash: string;
  avatarUrl?: string;
  isActive: boolean;
  isOnline: boolean;
  lastSeen?: Date;
  wins: number;
  losses: number;
}

export interface CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  displayName?: string;
}

export interface UpdateUserDto {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  isActive?: boolean;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  displayName: string;
}

// Friendship Types
export interface Friendship extends BaseModel {
  requesterId: number;
  addresseeId: number;
  status: FriendshipStatus;
}

export enum FriendshipStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  BLOCKED = 'blocked'
}

// Game Types
export interface Game extends BaseModel {
  player1Id: number;
  player2Id: number;
  winner?: number;
  player1Score: number;
  player2Score: number;
  status: GameStatus;
  startedAt?: Date;
  endedAt?: Date;
  tournamentId?: number;
}

export enum GameStatus {
  WAITING = 'waiting',
  IN_PROGRESS = 'in_progress',
  FINISHED = 'finished',
  CANCELLED = 'cancelled'
}

// Tournament Types
export interface Tournament extends BaseModel {
  name: string;
  description?: string;
  maxPlayers: number;
  currentPlayers: number;
  status: TournamentStatus;
  startDate: Date;
  endDate?: Date;
  winnerId?: number;
}

export enum TournamentStatus {
  REGISTRATION = 'registration',
  IN_PROGRESS = 'in_progress',
  FINISHED = 'finished',
  CANCELLED = 'cancelled'
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationRequest {
  page: number;
  size: number;
  sort?: string;
}

export interface PaginationResponse<T> {
  data: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

// JWT Types
export interface JwtPayload {
  userId: number;
  email: string;
  displayName: string;
  iat?: number;
  exp?: number;
} 