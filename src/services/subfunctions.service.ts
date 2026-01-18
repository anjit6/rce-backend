import pool from '../config/database';
import {
  Subfunction,
  CreateSubfunctionDto,
  UpdateSubfunctionDto,
  PaginationParams,
} from '../types';

export class SubfunctionsService {
  async findAll(params: PaginationParams & { category_id?: string } = {}): Promise<{ subfunctions: Subfunction[]; total: number }> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE deleted_at IS NULL';
    const queryParams: (string | number)[] = [];

    if (params.category_id) {
      queryParams.push(params.category_id);
      whereClause += ` AND category_id = $${queryParams.length}`;
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM subfunctions ${whereClause}`,
      queryParams
    );
    const total = parseInt(countResult.rows[0].count, 10);

    queryParams.push(limit, offset);
    const result = await pool.query(
      `SELECT * FROM subfunctions
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`,
      queryParams
    );

    return { subfunctions: result.rows, total };
  }

  async findById(id: number): Promise<Subfunction | null> {
    const result = await pool.query(
      'SELECT * FROM subfunctions WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    return result.rows[0] || null;
  }

  async findByFunctionName(functionName: string): Promise<Subfunction | null> {
    const result = await pool.query(
      'SELECT * FROM subfunctions WHERE function_name = $1 AND deleted_at IS NULL',
      [functionName]
    );
    return result.rows[0] || null;
  }

  async findByNameAndVersion(name: string, version: string): Promise<Subfunction | null> {
    const result = await pool.query(
      'SELECT * FROM subfunctions WHERE name = $1 AND version = $2 AND deleted_at IS NULL',
      [name, version]
    );
    return result.rows[0] || null;
  }

  async create(data: CreateSubfunctionDto): Promise<Subfunction> {
    const result = await pool.query(
      `INSERT INTO subfunctions (name, description, version, function_name, category_id, code, return_type, input_params)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.name,
        data.description || null,
        data.version || 'v1.0',
        data.function_name,
        data.category_id || null,
        data.code,
        data.return_type || null,
        JSON.stringify(data.input_params || []),
      ]
    );
    return result.rows[0];
  }

  async update(id: number, data: UpdateSubfunctionDto): Promise<Subfunction | null> {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.version !== undefined) {
      fields.push(`version = $${paramIndex++}`);
      values.push(data.version);
    }
    if (data.function_name !== undefined) {
      fields.push(`function_name = $${paramIndex++}`);
      values.push(data.function_name);
    }
    if (data.category_id !== undefined) {
      fields.push(`category_id = $${paramIndex++}`);
      values.push(data.category_id);
    }
    if (data.code !== undefined) {
      fields.push(`code = $${paramIndex++}`);
      values.push(data.code);
    }
    if (data.return_type !== undefined) {
      fields.push(`return_type = $${paramIndex++}`);
      values.push(data.return_type);
    }
    if (data.input_params !== undefined) {
      fields.push(`input_params = $${paramIndex++}`);
      values.push(JSON.stringify(data.input_params));
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE subfunctions
       SET ${fields.join(', ')}
       WHERE id = $${paramIndex} AND deleted_at IS NULL
       RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  async delete(id: number): Promise<boolean> {
    const result = await pool.query(
      `UPDATE subfunctions
       SET deleted_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id`,
      [id]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  async hardDelete(id: number): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM subfunctions WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }
}

export const subfunctionsService = new SubfunctionsService();
