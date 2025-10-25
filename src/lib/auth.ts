import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'USER' | 'ADMIN' | 'SUPERUSER';
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// Verify JWT token
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

// Extract user from request
export function getUserFromRequest(request: NextRequest): TokenPayload | null {
  try {
    // Try to get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      return verifyToken(token);
    }

    // Try to get token from cookies
    const token = request.cookies.get('auth-token')?.value;
    if (token) {
      return verifyToken(token);
    }

    return null;
  } catch (error) {
    return null;
  }
}

// Middleware to require authentication
export function requireAuth(request: NextRequest): TokenPayload {
  const user = getUserFromRequest(request);
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

// Middleware to require specific role
export function requireRole(request: NextRequest, requiredRole: 'USER' | 'ADMIN' | 'SUPERUSER'): TokenPayload {
  const user = requireAuth(request);
  
  const roleHierarchy = {
    USER: 1,
    ADMIN: 2,
    SUPERUSER: 3,
  };
  
  const userLevel = roleHierarchy[user.role];
  const requiredLevel = roleHierarchy[requiredRole];
  
  if (userLevel < requiredLevel) {
    throw new Error(`Access denied. Required role: ${requiredRole} or higher`);
  }
  
  return user;
}

// Middleware to require specific permission
export function requirePermission(request: NextRequest, resource: string, action: string): TokenPayload {
  const user = requireAuth(request);
  
  // Import RBAC functions (avoiding circular dependency)
  const { hasPermission } = require('./rbac');
  
  if (!hasPermission(user.role, resource, action)) {
    throw new Error(`Access denied. Required permission: ${resource}:${action}`);
  }
  
  return user;
}
