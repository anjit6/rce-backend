import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { CreateUserDto, LoginDto } from '../types';

export class AuthController {
  // POST /api/auth/register - Create new user
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: CreateUserDto = req.body;

      // Validation
      const errors: string[] = [];
      if (!data.first_name || typeof data.first_name !== 'string' || data.first_name.trim() === '') {
        errors.push('First name is required');
      }
      if (!data.last_name || typeof data.last_name !== 'string' || data.last_name.trim() === '') {
        errors.push('Last name is required');
      }
      if (!data.email || typeof data.email !== 'string') {
        errors.push('Email is required');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push('Invalid email format');
      }
      if (!data.password || typeof data.password !== 'string') {
        errors.push('Password is required');
      } else if (data.password.length < 6) {
        errors.push('Password must be at least 6 characters');
      }
      if (!data.role_id || typeof data.role_id !== 'number') {
        errors.push('Role ID is required');
      }

      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          error: errors.join(', '),
        });
        return;
      }

      // Check if email already exists
      const existingUser = await authService.findByEmail(data.email);
      if (existingUser) {
        res.status(409).json({
          success: false,
          error: 'Email already registered',
        });
        return;
      }

      // Verify role exists
      const role = await authService.getRoleById(data.role_id);
      if (!role) {
        res.status(400).json({
          success: false,
          error: 'Invalid role ID',
        });
        return;
      }

      // Create user
      const user = await authService.createUser({
        ...data,
        first_name: data.first_name.trim(),
        last_name: data.last_name.trim(),
        email: data.email.toLowerCase().trim(),
      });

      res.status(201).json({
        success: true,
        data: user,
        message: 'User created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/login - User login
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: LoginDto = req.body;

      // Validation
      if (!data.email || !data.password) {
        res.status(400).json({
          success: false,
          error: 'Email and password are required',
        });
        return;
      }

      // Attempt login
      const result = await authService.login({
        email: data.email.toLowerCase().trim(),
        password: data.password,
      });

      if (!result) {
        res.status(401).json({
          success: false,
          error: 'Invalid email or password',
        });
        return;
      }

      res.json({
        success: true,
        data: result,
        message: 'Login successful',
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/logout - User logout
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.token;

      if (!token) {
        res.status(400).json({
          success: false,
          error: 'No active session',
        });
        return;
      }

      await authService.deleteSession(token);

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/auth/me - Get current user info
  async getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated',
        });
        return;
      }

      const user = await authService.findById(req.user.userId);
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      let role = null;
      if (user.role_id) {
        role = await authService.getRoleById(user.role_id);
      }

      const permissions = await authService.getUserPermissions(user.id);

      res.json({
        success: true,
        data: authService.toPublicUser(user, role, permissions),
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/auth/users - Get all users (admin only)
  async getAllUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await authService.findAll();

      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/auth/roles - Get all roles
  async getAllRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roles = await authService.getAllRoles();

      res.json({
        success: true,
        data: roles,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
