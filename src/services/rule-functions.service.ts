import pool from '../config/database';
import {
  RuleFunction,
  CreateRuleFunctionDto,
  UpdateRuleFunctionDto,
  PaginationParams,
} from '../types';

export class RuleFunctionsService {
  async findAll(params: PaginationParams = {}): Promise<{ ruleFunctions: RuleFunction[]; total: number }> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const offset = (page - 1) * limit;

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM rule_functions WHERE deleted_at IS NULL'
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await pool.query(
      `SELECT * FROM rule_functions
       WHERE deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return { ruleFunctions: result.rows, total };
  }

  async findById(id: number): Promise<RuleFunction | null> {
    const result = await pool.query(
      'SELECT * FROM rule_functions WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    return result.rows[0] || null;
  }

  async findByRuleId(ruleId: number): Promise<RuleFunction | null> {
    const result = await pool.query(
      'SELECT * FROM rule_functions WHERE rule_id = $1 AND deleted_at IS NULL',
      [ruleId]
    );
    return result.rows[0] || null;
  }

  async create(data: CreateRuleFunctionDto): Promise<RuleFunction> {
    const result = await pool.query(
      `INSERT INTO rule_functions (rule_id, code, return_type, input_params)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        data.rule_id,
        data.code,
        data.return_type || null,
        JSON.stringify(data.input_params || []),
      ]
    );
    return result.rows[0];
  }

  async update(id: number, data: UpdateRuleFunctionDto): Promise<RuleFunction | null> {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];
    let paramIndex = 1;

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
      `UPDATE rule_functions
       SET ${fields.join(', ')}
       WHERE id = $${paramIndex} AND deleted_at IS NULL
       RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  async delete(id: number): Promise<boolean> {
    const result = await pool.query(
      `UPDATE rule_functions
       SET deleted_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id`,
      [id]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  async hardDelete(id: number): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM rule_functions WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }
}

export const ruleFunctionsService = new RuleFunctionsService();
