// @ts-ignore - bcryptjs types
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../config/database';
import {
  User,
  UserPublic,
  CreateUserDto,
  LoginDto,
  LoginResponse,
  JwtPayload,
  Role,
} from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'rce-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const SALT_ROUNDS = 10;

export class AuthService {
  // Find user by email
  async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    return result.rows[0] || null;
  }

  // Find user by ID
  async findById(id: string): Promise<User | null> {
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  // Get role by ID
  async getRoleById(roleId: number): Promise<Role | null> {
    const result = await pool.query(
      'SELECT * FROM roles WHERE id = $1',
      [roleId]
    );
    return result.rows[0] || null;
  }

  // Get permissions by IDs
  async getPermissionsByIds(permissionIds: number[]): Promise<string[]> {
    if (!permissionIds || permissionIds.length === 0) {
      return [];
    }
    const result = await pool.query(
      'SELECT name FROM permissions WHERE id = ANY($1)',
      [permissionIds]
    );
    return result.rows.map(row => row.name);
  }

  // Get user's permissions
  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await this.findById(userId);
    if (!user || !user.role_id) {
      return [];
    }
    const role = await this.getRoleById(user.role_id);
    if (!role) {
      return [];
    }
    return this.getPermissionsByIds(role.permission_ids);
  }

  // Create new user
  async createUser(data: CreateUserDto): Promise<UserPublic> {
    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    const result = await pool.query(
      `INSERT INTO users (first_name, last_name, email, password, role_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        data.first_name,
        data.last_name,
        data.email.toLowerCase(),
        hashedPassword,
        data.role_id,
      ]
    );

    const user = result.rows[0];
    return this.toPublicUser(user);
  }

  // Verify password
  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  // Generate JWT token
  generateToken(payload: JwtPayload): string {
    const options: jwt.SignOptions = { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] };
    return jwt.sign(payload as object, JWT_SECRET, options);
  }

  // Verify JWT token
  verifyToken(token: string): JwtPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch {
      return null;
    }
  }

  // Hash token for storage
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // Create session
  async createSession(userId: string, token: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await pool.query(
      `INSERT INTO user_sessions (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, tokenHash, expiresAt]
    );

    // Update last_login_at
    await pool.query(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
      [userId]
    );
  }

  // Validate session
  async validateSession(token: string): Promise<boolean> {
    const tokenHash = this.hashToken(token);
    const result = await pool.query(
      `SELECT * FROM user_sessions
       WHERE token_hash = $1 AND expires_at > CURRENT_TIMESTAMP`,
      [tokenHash]
    );
    return result.rows.length > 0;
  }

  // Delete session (logout)
  async deleteSession(token: string): Promise<boolean> {
    const tokenHash = this.hashToken(token);
    const result = await pool.query(
      'DELETE FROM user_sessions WHERE token_hash = $1 RETURNING id',
      [tokenHash]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Delete all user sessions
  async deleteAllUserSessions(userId: string): Promise<void> {
    await pool.query(
      'DELETE FROM user_sessions WHERE user_id = $1',
      [userId]
    );
  }

  // Clean expired sessions
  async cleanExpiredSessions(): Promise<void> {
    await pool.query(
      'DELETE FROM user_sessions WHERE expires_at <= CURRENT_TIMESTAMP'
    );
  }

  // Login
  async login(data: LoginDto): Promise<LoginResponse | null> {
    const user = await this.findByEmail(data.email);

    if (!user || !user.is_active) {
      return null;
    }

    const isValidPassword = await this.verifyPassword(data.password, user.password);
    if (!isValidPassword) {
      return null;
    }

    // Get user permissions
    const permissions = await this.getUserPermissions(user.id);

    // Generate token
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      roleId: user.role_id,
      permissions,
    };
    const token = this.generateToken(payload);

    // Create session
    await this.createSession(user.id, token);

    // Get role info
    let role: Role | null = null;
    if (user.role_id) {
      role = await this.getRoleById(user.role_id);
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    return {
      user: this.toPublicUser(user, role, permissions),
      token,
      expiresAt,
    };
  }

  // Convert User to UserPublic (remove password)
  toPublicUser(user: User, role?: Role | null, permissions?: string[]): UserPublic {
    return {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role_id: user.role_id,
      role: role || undefined,
      permissions: permissions || undefined,
      is_active: user.is_active,
      last_login_at: user.last_login_at,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  // Get all users (for admin)
  async findAll(): Promise<UserPublic[]> {
    const result = await pool.query(
      `SELECT u.*, r.name as role_name, r.description as role_description, r.permission_ids, r.created_at as role_created_at, r.updated_at as role_updated_at
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       ORDER BY u.created_at DESC`
    );

    return result.rows.map(row => ({
      id: row.id,
      first_name: row.first_name,
      last_name: row.last_name,
      email: row.email,
      role_id: row.role_id,
      role: row.role_id ? {
        id: row.role_id,
        name: row.role_name,
        description: row.role_description,
        permission_ids: row.permission_ids,
        created_at: row.role_created_at,
        updated_at: row.role_updated_at
      } : undefined,
      is_active: row.is_active,
      last_login_at: row.last_login_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  }

  // Get all roles
  async getAllRoles(): Promise<Role[]> {
    const result = await pool.query('SELECT * FROM roles ORDER BY id');
    return result.rows;
  }
}

export const authService = new AuthService();
