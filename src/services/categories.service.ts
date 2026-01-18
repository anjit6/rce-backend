import pool from '../config/database';
import {
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
  PaginationParams,
} from '../types';

export class CategoriesService {
  async findAll(params: PaginationParams = {}): Promise<{ categories: Category[]; total: number }> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const offset = (page - 1) * limit;

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM categories WHERE deleted_at IS NULL'
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await pool.query(
      `SELECT * FROM categories
       WHERE deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return { categories: result.rows, total };
  }

  async findById(id: string): Promise<Category | null> {
    const result = await pool.query(
      'SELECT * FROM categories WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    return result.rows[0] || null;
  }

  async findByName(name: string): Promise<Category | null> {
    const result = await pool.query(
      'SELECT * FROM categories WHERE name = $1 AND deleted_at IS NULL',
      [name]
    );
    return result.rows[0] || null;
  }

  async create(data: CreateCategoryDto): Promise<Category> {
    const result = await pool.query(
      `INSERT INTO categories (name)
       VALUES ($1)
       RETURNING *`,
      [data.name]
    );
    return result.rows[0];
  }

  async update(id: string, data: UpdateCategoryDto): Promise<Category | null> {
    const fields: string[] = [];
    const values: (string | undefined)[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE categories
       SET ${fields.join(', ')}
       WHERE id = $${paramIndex} AND deleted_at IS NULL
       RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await pool.query(
      `UPDATE categories
       SET deleted_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id`,
      [id]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  async hardDelete(id: string): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM categories WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }
}

export const categoriesService = new CategoriesService();
