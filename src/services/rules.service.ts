import pool from '../config/database';
import {
  Rule,
  CreateRuleDto,
  UpdateRuleDto,
  PaginationParams,
  RuleStatus,
  SaveRuleDto,
  UpdateCompleteRuleDto,
  CompleteRuleResponse,
  RuleFunctionStep,
} from '../types';

export class RulesService {
  async findAll(params: PaginationParams & { status?: RuleStatus; search?: string; for_approval_request?: boolean } = {}): Promise<{ rules: Rule[]; total: number }> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const offset = (page - 1) * limit;

    // Special handling for approval request
    if (params.for_approval_request) {
      let whereClause = 'WHERE r.deleted_at IS NULL';
      const queryParams: (string | number)[] = [];
      
      // Add search condition if provided
      if (params.search) {
        const searchTerm = `%${params.search}%`;
        queryParams.push(searchTerm);
        // Search by id (exact match if numeric) or name (case-insensitive partial match)
        const idCondition = /^\d+$/.test(params.search) ? `r.id = ${parseInt(params.search, 10)} OR ` : '';
        whereClause += ` AND (${idCondition}r.name ILIKE $${queryParams.length})`;
      }
      
      const countResult = await pool.query(
        `SELECT COUNT(DISTINCT r.id) 
         FROM rules r
         INNER JOIN rule_versions rv ON r.id = rv.rule_id 
           AND r.version_major = rv.major_version 
           AND r.version_minor = rv.minor_version
         ${whereClause}`,
        queryParams
      );
      const total = parseInt(countResult.rows[0].count, 10);

      queryParams.push(limit, offset);
      const result = await pool.query(
        `SELECT r.id, r.name, rv.id as rule_version_id, r.version_major, r.version_minor
         FROM rules r
         INNER JOIN rule_versions rv ON r.id = rv.rule_id 
           AND r.version_major = rv.major_version 
           AND r.version_minor = rv.minor_version
         ${whereClause}
         ORDER BY r.created_at DESC
         LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`,
        queryParams
      );

      return { rules: result.rows, total };
    }

    // Normal findAll logic
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

  /**
   * Save complete rule JSON - creates/updates rule_functions and rule_function_steps
   * Creates rule_versions entry on first save
   */
  async saveCompleteRule(ruleId: number, data: SaveRuleDto): Promise<CompleteRuleResponse> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check if rule exists
      const ruleResult = await client.query(
        'SELECT * FROM rules WHERE id = $1 AND deleted_at IS NULL',
        [ruleId]
      );

      if (ruleResult.rows.length === 0) {
        throw new Error('Rule not found');
      }

      const rule: Rule = ruleResult.rows[0];

      // Check if rule_function exists for this rule
      const existingRuleFunctionResult = await client.query(
        'SELECT * FROM rule_functions WHERE rule_id = $1 AND deleted_at IS NULL',
        [ruleId]
      );

      let ruleFunctionId: number;
      let isFirstSave = false;

      if (existingRuleFunctionResult.rows.length === 0) {
        // First save - insert new rule_function
        isFirstSave = true;
        const insertResult = await client.query(
          `INSERT INTO rule_functions (rule_id, code, return_type, input_params)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [
            ruleId,
            data.code,
            data.return_type || null,
            JSON.stringify(data.input_params || [])
          ]
        );
        ruleFunctionId = insertResult.rows[0].id;
      } else {
        // Update existing rule_function
        ruleFunctionId = existingRuleFunctionResult.rows[0].id;
        await client.query(
          `UPDATE rule_functions 
           SET code = $1, return_type = $2, input_params = $3, updated_at = CURRENT_TIMESTAMP
           WHERE id = $4`,
          [
            data.code,
            data.return_type || null,
            JSON.stringify(data.input_params || []),
            ruleFunctionId
          ]
        );
      }

      // Delete existing steps for this rule_function
      await client.query(
        'DELETE FROM rule_function_steps WHERE rule_function_id = $1',
        [ruleFunctionId]
      );

      // Insert new steps
      const steps: RuleFunctionStep[] = [];
      for (const step of data.steps) {
        const stepResult = await client.query(
          `INSERT INTO rule_function_steps (
            id, rule_function_id, type, output_variable_name, return_type,
            next_step, sequence, subfunction_id, subfunction_params, conditions, output_data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING *`,
          [
            step.id,
            ruleFunctionId,
            step.type,
            step.output_variable_name || null,
            step.return_type || null,
            step.next_step ? JSON.stringify(step.next_step) : null,
            step.sequence,
            step.subfunction_id || null,
            JSON.stringify(step.subfunction_params || []),
            JSON.stringify(step.conditions || []),
            step.output_data ? JSON.stringify(step.output_data) : null
          ]
        );
        steps.push(stepResult.rows[0]);
      }

      // If this is the first save, create a rule_versions entry
      if (isFirstSave) {
        await client.query(
          `INSERT INTO rule_versions (
            rule_id, major_version, minor_version, stage,
            rule_function_code, rule_function_input_params, rule_steps,
            created_by, comment
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            ruleId,
            rule.version_major,
            rule.version_minor,
            rule.status,
            data.code,
            JSON.stringify(data.input_params || []),
            JSON.stringify(data.steps),
            data.created_by || null,
            data.comment || null
          ]
        );
      }

      await client.query('COMMIT');

      // Fetch the complete rule function
      const ruleFunctionResult = await client.query(
        'SELECT * FROM rule_functions WHERE id = $1',
        [ruleFunctionId]
      );

      return {
        rule,
        rule_function: ruleFunctionResult.rows[0],
        steps
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update complete rule JSON - updates rule_functions and rule_function_steps
   */
  async updateCompleteRule(ruleId: number, data: UpdateCompleteRuleDto): Promise<CompleteRuleResponse> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check if rule exists
      const ruleResult = await client.query(
        'SELECT * FROM rules WHERE id = $1 AND deleted_at IS NULL',
        [ruleId]
      );

      if (ruleResult.rows.length === 0) {
        throw new Error('Rule not found');
      }

      const rule: Rule = ruleResult.rows[0];

      // Check if rule_function exists
      const ruleFunctionResult = await client.query(
        'SELECT * FROM rule_functions WHERE rule_id = $1 AND deleted_at IS NULL',
        [ruleId]
      );

      if (ruleFunctionResult.rows.length === 0) {
        throw new Error('Rule function not found. Use save API first.');
      }

      const ruleFunctionId = ruleFunctionResult.rows[0].id;

      // Update rule_function
      await client.query(
        `UPDATE rule_functions 
         SET code = $1, return_type = $2, input_params = $3, updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [
          data.code,
          data.return_type || null,
          JSON.stringify(data.input_params || []),
          ruleFunctionId
        ]
      );

      // Delete existing steps
      await client.query(
        'DELETE FROM rule_function_steps WHERE rule_function_id = $1',
        [ruleFunctionId]
      );

      // Insert new steps
      const steps: RuleFunctionStep[] = [];
      for (const step of data.steps) {
        const stepResult = await client.query(
          `INSERT INTO rule_function_steps (
            id, rule_function_id, type, output_variable_name, return_type,
            next_step, sequence, subfunction_id, subfunction_params, conditions, output_data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING *`,
          [
            step.id,
            ruleFunctionId,
            step.type,
            step.output_variable_name || null,
            step.return_type || null,
            step.next_step ? JSON.stringify(step.next_step) : null,
            step.sequence,
            step.subfunction_id || null,
            JSON.stringify(step.subfunction_params || []),
            JSON.stringify(step.conditions || []),
            step.output_data ? JSON.stringify(step.output_data) : null
          ]
        );
        steps.push(stepResult.rows[0]);
      }

      await client.query('COMMIT');

      // Fetch the updated rule function
      const updatedRuleFunctionResult = await client.query(
        'SELECT * FROM rule_functions WHERE id = $1',
        [ruleFunctionId]
      );

      return {
        rule,
        rule_function: updatedRuleFunctionResult.rows[0],
        steps
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get complete rule JSON - fetches rule with all details, input_params, code and steps
   */
  async getCompleteRule(ruleId: number): Promise<CompleteRuleResponse | null> {
    const client = await pool.connect();
    
    try {
      // Fetch rule
      const ruleResult = await client.query(
        'SELECT * FROM rules WHERE id = $1 AND deleted_at IS NULL',
        [ruleId]
      );

      if (ruleResult.rows.length === 0) {
        return null;
      }

      const rule: Rule = ruleResult.rows[0];

      // Fetch rule_function
      const ruleFunctionResult = await client.query(
        'SELECT * FROM rule_functions WHERE rule_id = $1 AND deleted_at IS NULL',
        [ruleId]
      );

      if (ruleFunctionResult.rows.length === 0) {
        // Rule exists but no function yet
        return {
          rule,
          rule_function: {
            id: 0,
            code: '',
            return_type: null,
            input_params: []
          },
          steps: []
        };
      }

      const ruleFunction = ruleFunctionResult.rows[0];

      // Fetch all steps for this rule_function
      const stepsResult = await client.query(
        `SELECT * FROM rule_function_steps 
         WHERE rule_function_id = $1 AND deleted_at IS NULL
         ORDER BY sequence ASC`,
        [ruleFunction.id]
      );

      return {
        rule,
        rule_function: ruleFunction,
        steps: stepsResult.rows
      };
    } finally {
      client.release();
    }
  }
}

export const rulesService = new RulesService();
