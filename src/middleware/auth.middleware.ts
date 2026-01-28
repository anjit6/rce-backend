import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { JwtPayload } from '../types';
import { PermissionId } from '../constants/permissions';

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      token?: string;
    }
  }
}

// Authentication middleware - verifies JWT token
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'No token provided',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    const payload = authService.verifyToken(token);
    if (!payload) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
      return;
    }

    // Validate session exists in database
    const isValidSession = await authService.validateSession(token);
    if (!isValidSession) {
      res.status(401).json({
        success: false,
        error: 'Session expired or invalid',
      });
      return;
    }

    // Attach user info to request
    req.user = payload;
    req.token = token;

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Authentication failed',
    });
  }
};

// Optional authentication - doesn't require token but attaches user if present
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = authService.verifyToken(token);

      if (payload) {
        const isValidSession = await authService.validateSession(token);
        if (isValidSession) {
          req.user = payload;
          req.token = token;
        }
      }
    }

    next();
  } catch {
    // Silently continue without auth
    next();
  }
};

// Authorization middleware - checks if user has required permissions (by ID)
export const authorize = (...requiredPermissionIds: PermissionId[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const userPermissionIds = req.user.permissions || [];

    // Check if user has at least one of the required permissions
    const hasPermission = requiredPermissionIds.some(permissionId =>
      userPermissionIds.includes(permissionId)
    );

    if (!hasPermission) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        required: requiredPermissionIds,
        userPermissions: userPermissionIds,
      });
      return;
    }

    next();
  };
};

// Check if user has ALL specified permissions (by ID)
export const authorizeAll = (...requiredPermissionIds: PermissionId[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const userPermissionIds = req.user.permissions || [];

    // Check if user has ALL required permissions
    const hasAllPermissions = requiredPermissionIds.every(permissionId =>
      userPermissionIds.includes(permissionId)
    );

    if (!hasAllPermissions) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        required: requiredPermissionIds,
        userPermissions: userPermissionIds,
      });
      return;
    }

    next();
  };
};

// Role-based authorization
export const authorizeRole = (...allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user || !req.user.roleId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const role = await authService.getRoleById(req.user.roleId);
    if (!role || !allowedRoles.includes(role.name)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient role permissions',
        required: allowedRoles,
      });
      return;
    }

    next();
  };
};
