import pool from '../config/database';
import {
  RuleApproval,
  CreateApprovalDto,
  ApproveRejectDto,
  ApprovalFilterParams,
  RuleStatus,
} from '../types';

export class ApprovalsService {
  async findAll(params: ApprovalFilterParams = {}): Promise<{ approvals: RuleApproval[]; total: number }> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const queryParams: (string | number)[] = [];

    // Filter by status (PENDING or ALL)
    if (params.status && params.status !== 'ALL') {
      queryParams.push(params.status);
      whereClause += ` AND ra.status = $${queryParams.length}`;
    }

    // Filter by rule_id
    if (params.rule_id) {
      queryParams.push(params.rule_id);
      whereClause += ` AND ra.rule_id = $${queryParams.length}`;
    }

    // Filter by requested_by
    if (params.requested_by) {
      queryParams.push(params.requested_by);
      whereClause += ` AND ra.requested_by = $${queryParams.length}`;
    }

    // Search by rule name or request comment
    if (params.search) {
      const searchTerm = `%${params.search}%`;
      queryParams.push(searchTerm);
      const searchParamIndex = queryParams.length;
      // Search by id (exact match if numeric) or other fields (case-insensitive partial match)
      const idCondition = /^\d+$/.test(params.search) ? `ra.id = ${parseInt(params.search, 10)} OR ` : '';
      whereClause += ` AND (${idCondition}r.name ILIKE $${searchParamIndex} OR r.slug ILIKE $${searchParamIndex} OR ra.request_comment ILIKE $${searchParamIndex} OR ra.requested_by ILIKE $${searchParamIndex})`;
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM rule_approvals ra
       JOIN rules r ON ra.rule_id = r.id
       ${whereClause}`,
      queryParams
    );
    const total = parseInt(countResult.rows[0].count, 10);

    queryParams.push(limit, offset);
    const result = await pool.query(
      `SELECT ra.*, r.name as rule_name, r.slug as rule_slug,
              rv.major_version, rv.minor_version
       FROM rule_approvals ra
       JOIN rules r ON ra.rule_id = r.id
       JOIN rule_versions rv ON ra.rule_version_id = rv.id
       ${whereClause}
       ORDER BY ra.created_at DESC
       LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`,
      queryParams
    );

    return { approvals: result.rows, total };
  }

  async findById(id: string): Promise<RuleApproval | null> {
    const result = await pool.query(
      `SELECT ra.*, r.name as rule_name, r.slug as rule_slug,
              rv.major_version, rv.minor_version, rv.rule_function_code,
              rv.rule_function_input_params, rv.rule_steps,
              rf.code as rule_code, rf.return_type as rule_return_type,
              rf.input_params as rule_input_params
       FROM rule_approvals ra
       JOIN rules r ON ra.rule_id = r.id
       JOIN rule_versions rv ON ra.rule_version_id = rv.id
       LEFT JOIN rule_functions rf ON r.id = rf.rule_id
       WHERE ra.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async findPendingByRuleVersionId(ruleVersionId: string): Promise<RuleApproval | null> {
    const result = await pool.query(
      `SELECT * FROM rule_approvals
       WHERE rule_version_id = $1 AND status = 'PENDING'`,
      [ruleVersionId]
    );
    return result.rows[0] || null;
  }

  async create(data: CreateApprovalDto): Promise<RuleApproval> {
    // Check if there's already a pending approval for this rule version
    const existingPending = await this.findPendingByRuleVersionId(data.rule_version_id);
    if (existingPending) {
      throw new Error('A pending approval already exists for this rule version');
    }

    const result = await pool.query(
      `INSERT INTO rule_approvals (
        rule_version_id, rule_id, from_stage, to_stage,
        requested_by, request_comment, status, action
      )
       VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', 'REQUESTED')
       RETURNING *`,
      [
        data.rule_version_id,
        data.rule_id,
        data.from_stage,
        data.to_stage,
        data.requested_by,
        data.request_comment || null,
      ]
    );
    return result.rows[0];
  }

  async approveOrReject(id: string, data: ApproveRejectDto): Promise<RuleApproval | null> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get the approval record
      const approvalResult = await client.query(
        'SELECT * FROM rule_approvals WHERE id = $1',
        [id]
      );
      const approval = approvalResult.rows[0];

      if (!approval) {
        await client.query('ROLLBACK');
        return null;
      }

      if (approval.status !== 'PENDING') {
        await client.query('ROLLBACK');
        throw new Error('This approval request is no longer pending');
      }

      // Determine the moved_to_stage based on action
      let movedToStage: RuleStatus;
      if (data.action === 'APPROVED') {
        movedToStage = approval.to_stage;
      } else {
        // On rejection, determine where to go back based on the transition
        // WIP → TEST rejection: goes back to WIP
        // TEST → PENDING rejection: goes back to TEST
        // PENDING → PROD rejection: goes back to TEST
        if (approval.from_stage === 'WIP' && approval.to_stage === 'TEST') {
          movedToStage = 'WIP';
        } else {
          movedToStage = 'TEST';
        }
      }

      // Update the approval record
      const updateResult = await client.query(
        `UPDATE rule_approvals
         SET status = $1, action = $2, action_by = $3, action_at = CURRENT_TIMESTAMP,
             action_comment = $4, moved_to_stage = $5
         WHERE id = $6
         RETURNING *`,
        [
          data.action,
          data.action,
          data.action_by,
          data.action_comment || null,
          movedToStage,
          id,
        ]
      );

      // Update the rule_versions stage and rule status based on action
      if (data.action === 'APPROVED') {
        await client.query(
          `UPDATE rule_versions SET stage = $1 WHERE id = $2`,
          [approval.to_stage, approval.rule_version_id]
        );

        // Update the rule status to match the approved stage
        await client.query(
          `UPDATE rules SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [approval.to_stage, approval.rule_id]
        );
      } else {
        // On rejection, update rule_versions stage to the rejection target
        await client.query(
          `UPDATE rule_versions SET stage = $1 WHERE id = $2`,
          [movedToStage, approval.rule_version_id]
        );

        // Update the rule status to the rejection target
        await client.query(
          `UPDATE rules SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [movedToStage, approval.rule_id]
        );
      }

      // Create history record
      await client.query(
        `INSERT INTO rule_stage_history (
          rule_version_id, from_stage, to_stage, changed_by, reason
        )
         VALUES ($1, $2, $3, $4, $5)`,
        [
          approval.rule_version_id,
          approval.from_stage,
          movedToStage,
          data.action_by,
          data.action === 'APPROVED'
            ? `Approved: ${data.action_comment || 'No comment'}`
            : `Rejected: ${data.action_comment || 'No comment'}`,
        ]
      );

      await client.query('COMMIT');
      return updateResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async withdraw(id: string, withdrawnBy: string): Promise<RuleApproval | null> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get the approval record
      const approvalResult = await client.query(
        'SELECT * FROM rule_approvals WHERE id = $1',
        [id]
      );
      const approval = approvalResult.rows[0];

      if (!approval) {
        await client.query('ROLLBACK');
        return null;
      }

      if (approval.status !== 'PENDING') {
        await client.query('ROLLBACK');
        throw new Error('This approval request is no longer pending');
      }

      // Update the approval record
      const updateResult = await client.query(
        `UPDATE rule_approvals
         SET status = 'WITHDRAWN', action = 'WITHDRAWN', action_by = $1,
             action_at = CURRENT_TIMESTAMP, moved_to_stage = $2
         WHERE id = $3
         RETURNING *`,
        [withdrawnBy, approval.from_stage, id]
      );

      // Create history record
      await client.query(
        `INSERT INTO rule_stage_history (
          rule_version_id, from_stage, to_stage, changed_by, reason
        )
         VALUES ($1, $2, $3, $4, $5)`,
        [
          approval.rule_version_id,
          approval.from_stage,
          approval.from_stage,
          withdrawnBy,
          'Approval request withdrawn',
        ]
      );

      await client.query('COMMIT');
      return updateResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export const approvalsService = new ApprovalsService();
