import pool from '../config/database';
import {
  Rule,
  CreateRuleDto,
  UpdateRuleDto,
  PaginationParams,
  RuleStatus,
} from '../types';

export class RulesService {
  async findAll(params: PaginationParams & { status?: RuleStatus; search?: string } = {}): Promise<{ rules: Rule[]; total: number }> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE deleted_at IS NULL';
    const queryParams: (string | number)[] = [];

    if (params.status) {
      queryParams.push(params.status);
      whereClause += ` AND status = $${queryParams.length}`;
    }

    if (params.search) {
      const searchTerm = `%${params.search}%`;
      queryParams.push(searchTerm);
      const searchParamIndex = queryParams.length;
      // Search by id (exact match if numeric) or name/description (case-insensitive partial match)
      const idCondition = /^\d+$/.test(params.search) ? `id = ${parseInt(params.search, 10)} OR ` : '';
      whereClause += ` AND (${idCondition}name ILIKE $${searchParamIndex} OR description ILIKE $${searchParamIndex})`;
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM rules ${whereClause}`,
      queryParams
    );
    const total = parseInt(countResult.rows[0].count, 10);

    queryParams.push(limit, offset);
    const result = await pool.query(
      `SELECT * FROM rules
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`,
      queryParams
    );

    return { rules: result.rows, total };
  }

  async findById(id: number): Promise<Rule | null> {
    const result = await pool.query(
      'SELECT * FROM rules WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    return result.rows[0] || null;
  }

  async findBySlug(slug: string): Promise<Rule | null> {
    const result = await pool.query(
      'SELECT * FROM rules WHERE slug = $1 AND deleted_at IS NULL',
      [slug]
    );
    return result.rows[0] || null;
  }

  async create(data: CreateRuleDto): Promise<Rule> {
    const result = await pool.query(
      `INSERT INTO rules (slug, name, description, status, version_major, version_minor, author)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.slug,
        data.name,
        data.description || null,
        data.status || 'WIP',
        data.version_major ?? 0,
        data.version_minor ?? 1,
        data.author || null,
      ]
    );
    return result.rows[0];
  }

  async update(id: number, data: UpdateRuleDto): Promise<Rule | null> {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];
    let paramIndex = 1;

    if (data.slug !== undefined) {
      fields.push(`slug = $${paramIndex++}`);
      values.push(data.slug);
    }
    if (data.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }
    if (data.version_major !== undefined) {
      fields.push(`version_major = $${paramIndex++}`);
      values.push(data.version_major);
    }
    if (data.version_minor !== undefined) {
      fields.push(`version_minor = $${paramIndex++}`);
      values.push(data.version_minor);
    }
    if (data.author !== undefined) {
      fields.push(`author = $${paramIndex++}`);
      values.push(data.author);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE rules
       SET ${fields.join(', ')}
       WHERE id = $${paramIndex} AND deleted_at IS NULL
       RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  async delete(id: number): Promise<boolean> {
    const result = await pool.query(
      `UPDATE rules
       SET deleted_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id`,
      [id]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  async hardDelete(id: number): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM rules WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }
}

export const rulesService = new RulesService();
