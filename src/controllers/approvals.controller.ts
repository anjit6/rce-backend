import { Request, Response, NextFunction } from 'express';
import { approvalsService } from '../services/approvals.service';
import { CreateApprovalDto, ApproveRejectDto, ApprovalStatus, RuleStatus } from '../types';
import { getCreateRequestPermission, PERMISSIONS } from '../constants/permissions';

const validStatuses: RuleStatus[] = ['WIP', 'TEST', 'PENDING', 'PROD'];
const validApprovalStatuses: (ApprovalStatus | 'ALL')[] = ['PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN', 'ALL'];

export class ApprovalsController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as ApprovalStatus | 'ALL' | undefined;
      const rule_id = req.query.rule_id ? parseInt(req.query.rule_id as string) : undefined;
      const requested_by = req.query.requested_by as string | undefined;
      const search = req.query.search as string | undefined;

      // Get user context from authenticated request
      const userId = req.user?.userId;
      const userPermissions = req.user?.permissions || [];

      if (status && !validApprovalStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          error: `Invalid status. Must be one of: ${validApprovalStatuses.join(', ')}`,
        });
        return;
      }

      const { approvals, total } = await approvalsService.findAll({
        page,
        limit,
        status,
        rule_id,
        requested_by,
        search,
        userId,
        userPermissions,
      });

      res.json({
        success: true,
        data: approvals,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id;

      const approval = await approvalsService.findById(id);

      if (!approval) {
        res.status(404).json({
          success: false,
          error: 'Approval not found',
        });
        return;
      }

      res.json({
        success: true,
        data: approval,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: CreateApprovalDto = req.body;

      const errors: string[] = [];
      if (!data.rule_version_id || typeof data.rule_version_id !== 'number') {
        errors.push('rule_version_id is required and must be a number');
      }
      if (!data.rule_id || typeof data.rule_id !== 'number') {
        errors.push('rule_id is required and must be a number');
      }
      if (!data.from_stage || !validStatuses.includes(data.from_stage)) {
        errors.push(`from_stage is required and must be one of: ${validStatuses.join(', ')}`);
      }
      if (!data.to_stage || !validStatuses.includes(data.to_stage)) {
        errors.push(`to_stage is required and must be one of: ${validStatuses.join(', ')}`);
      }
      if (!data.requested_by || typeof data.requested_by !== 'string') {
        errors.push('requested_by is required');
      }

      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          error: errors.join(', '),
        });
        return;
      }

      // Check if user has the specific stage transition permission or generic permission
      const stageSpecificPermission = getCreateRequestPermission(data.from_stage, data.to_stage);
      const userPermissions = req.user?.permissions || [];
      
      const hasStagePermission = stageSpecificPermission ? userPermissions.includes(stageSpecificPermission) : false;
      const hasGenericPermission = userPermissions.includes(PERMISSIONS.CREATE_APPROVAL_REQUEST);

      if (!hasStagePermission && !hasGenericPermission) {
        res.status(403).json({
          success: false,
          error: `You don't have permission to create ${data.from_stage} to ${data.to_stage} approval requests`,
        });
        return;
      }

      const approval = await approvalsService.create(data);

      res.status(201).json({
        success: true,
        data: approval,
        message: 'Approval request created successfully',
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('pending approval already exists')) {
        res.status(409).json({
          success: false,
          error: error.message,
        });
        return;
      }
      next(error);
    }
  }

  async approveOrReject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id;
      const data: ApproveRejectDto = req.body;

      const errors: string[] = [];
      if (!data.action || !['APPROVED', 'REJECTED'].includes(data.action)) {
        errors.push('action is required and must be APPROVED or REJECTED');
      }
      if (!data.action_by || typeof data.action_by !== 'string') {
        errors.push('action_by is required');
      }

      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          error: errors.join(', '),
        });
        return;
      }

      const approval = await approvalsService.approveOrReject(id, data);

      if (!approval) {
        res.status(404).json({
          success: false,
          error: 'Approval not found',
        });
        return;
      }

      res.json({
        success: true,
        data: approval,
        message: `Approval request ${data.action.toLowerCase()} successfully`,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('no longer pending')) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }
      next(error);
    }
  }

  async withdraw(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id;
      const { withdrawn_by } = req.body;

      if (!withdrawn_by || typeof withdrawn_by !== 'string') {
        res.status(400).json({
          success: false,
          error: 'withdrawn_by is required',
        });
        return;
      }

      const approval = await approvalsService.withdraw(id, withdrawn_by);

      if (!approval) {
        res.status(404).json({
          success: false,
          error: 'Approval not found',
        });
        return;
      }

      res.json({
        success: true,
        data: approval,
        message: 'Approval request withdrawn successfully',
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('no longer pending')) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }
      next(error);
    }
  }
}

export const approvalsController = new ApprovalsController();
