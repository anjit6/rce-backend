import pool from '../config/database';
import {
  RuleFunctionStep,
  CreateRuleFunctionStepDto,
  UpdateRuleFunctionStepDto,
  PaginationParams,
} from '../types';

export class RuleFunctionStepsService {
  async findAll(params: PaginationParams & { rule_function_id?: number } = {}): Promise<{ steps: RuleFunctionStep[]; total: number }> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE deleted_at IS NULL';
    const queryParams: (string | number)[] = [];

    if (params.rule_function_id) {
      queryParams.push(params.rule_function_id);
      whereClause += ` AND rule_function_id = $${queryParams.length}`;
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM rule_function_steps ${whereClause}`,
      queryParams
    );
    const total = parseInt(countResult.rows[0].count, 10);

    queryParams.push(limit, offset);
    const result = await pool.query(
      `SELECT * FROM rule_function_steps
       ${whereClause}
       ORDER BY sequence ASC
       LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`,
      queryParams
    );

    return { steps: result.rows, total };
  }

  async findByRuleFunctionId(ruleFunctionId: number): Promise<RuleFunctionStep[]> {
    const result = await pool.query(
      `SELECT * FROM rule_function_steps
       WHERE rule_function_id = $1 AND deleted_at IS NULL
       ORDER BY sequence ASC`,
      [ruleFunctionId]
    );
    return result.rows;
  }

  async findById(id: string, ruleFunctionId: number): Promise<RuleFunctionStep | null> {
    const result = await pool.query(
      'SELECT * FROM rule_function_steps WHERE id = $1 AND rule_function_id = $2 AND deleted_at IS NULL',
      [id, ruleFunctionId]
    );
    return result.rows[0] || null;
  }

  async findBySequence(ruleFunctionId: number, sequence: number): Promise<RuleFunctionStep | null> {
    const result = await pool.query(
      'SELECT * FROM rule_function_steps WHERE rule_function_id = $1 AND sequence = $2 AND deleted_at IS NULL',
      [ruleFunctionId, sequence]
    );
    return result.rows[0] || null;
  }

  async create(data: CreateRuleFunctionStepDto): Promise<RuleFunctionStep> {
    const result = await pool.query(
      `INSERT INTO rule_function_steps (id, rule_function_id, type, output_variable_name, return_type, next_step, sequence, subfunction_id, subfunction_params, conditions, output_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        data.id,
        data.rule_function_id,
        data.type,
        data.output_variable_name || null,
        data.return_type || null,
        data.next_step ? JSON.stringify(data.next_step) : null,
        data.sequence,
        data.subfunction_id || null,
        JSON.stringify(data.subfunction_params || []),
        JSON.stringify(data.conditions || []),
        data.output_data ? JSON.stringify(data.output_data) : null,
      ]
    );
    return result.rows[0];
  }

  async update(id: string, ruleFunctionId: number, data: UpdateRuleFunctionStepDto): Promise<RuleFunctionStep | null> {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];
    let paramIndex = 1;

    if (data.type !== undefined) {
      fields.push(`type = $${paramIndex++}`);
      values.push(data.type);
    }
    if (data.output_variable_name !== undefined) {
      fields.push(`output_variable_name = $${paramIndex++}`);
      values.push(data.output_variable_name);
    }
    if (data.return_type !== undefined) {
      fields.push(`return_type = $${paramIndex++}`);
      values.push(data.return_type);
    }
    if (data.next_step !== undefined) {
      fields.push(`next_step = $${paramIndex++}`);
      values.push(data.next_step ? JSON.stringify(data.next_step) : null);
    }
    if (data.sequence !== undefined) {
      fields.push(`sequence = $${paramIndex++}`);
      values.push(data.sequence);
    }
    if (data.subfunction_id !== undefined) {
      fields.push(`subfunction_id = $${paramIndex++}`);
      values.push(data.subfunction_id);
    }
    if (data.subfunction_params !== undefined) {
      fields.push(`subfunction_params = $${paramIndex++}`);
      values.push(JSON.stringify(data.subfunction_params));
    }
    if (data.conditions !== undefined) {
      fields.push(`conditions = $${paramIndex++}`);
      values.push(JSON.stringify(data.conditions));
    }
    if (data.output_data !== undefined) {
      fields.push(`output_data = $${paramIndex++}`);
      values.push(data.output_data ? JSON.stringify(data.output_data) : null);
    }

    if (fields.length === 0) {
      return this.findById(id, ruleFunctionId);
    }

    values.push(id, ruleFunctionId);
    const result = await pool.query(
      `UPDATE rule_function_steps
       SET ${fields.join(', ')}
       WHERE id = $${paramIndex} AND rule_function_id = $${paramIndex + 1} AND deleted_at IS NULL
       RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  async delete(id: string, ruleFunctionId: number): Promise<boolean> {
    const result = await pool.query(
      `UPDATE rule_function_steps
       SET deleted_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND rule_function_id = $2 AND deleted_at IS NULL
       RETURNING id`,
      [id, ruleFunctionId]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  async hardDelete(id: string, ruleFunctionId: number): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM rule_function_steps WHERE id = $1 AND rule_function_id = $2 RETURNING id',
      [id, ruleFunctionId]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }
}

export const ruleFunctionStepsService = new RuleFunctionStepsService();
