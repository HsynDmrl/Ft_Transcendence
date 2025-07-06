import jwt, { SignOptions } from 'jsonwebtoken';
import { JwtPayload } from '../types/index';

const JWT_SECRET = process.env.JWT_SECRET || 'transcendence-super-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class JwtUtils {
  static generateTokens(payload: Omit<JwtPayload, 'iat' | 'exp'>): TokenPair {
    const accessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: '24h',
    });

    const refreshToken = jwt.sign({ userId: payload.userId }, JWT_SECRET, {
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  static generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: '24h',
    });
  }

  static generateRefreshToken(userId: number): string {
    return jwt.sign({ userId }, JWT_SECRET, {
      expiresIn: '7d',
    });
  }

  static verifyToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      return decoded;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  static verifyRefreshToken(token: string): { userId: number } {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
      return decoded;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  static decodeToken(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch (error) {
      return null;
    }
  }

  static isTokenExpired(token: string): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  }

  static getTokenExpirationTime(token: string): Date | null {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) {
      return null;
    }
    
    return new Date(decoded.exp * 1000);
  }
}

export default JwtUtils; 