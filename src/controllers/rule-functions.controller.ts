import { Request, Response, NextFunction } from 'express';
import { ruleFunctionsService } from '../services/rule-functions.service';
import { rulesService } from '../services/rules.service';
import { CreateRuleFunctionDto, UpdateRuleFunctionDto } from '../types';

export class RuleFunctionsController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const { ruleFunctions, total } = await ruleFunctionsService.findAll({ page, limit });

      res.json({
        success: true,
        data: ruleFunctions,
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
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid ID format',
        });
        return;
      }

      const ruleFunction = await ruleFunctionsService.findById(id);

      if (!ruleFunction) {
        res.status(404).json({
          success: false,
          error: 'Rule function not found',
        });
        return;
      }

      res.json({
        success: true,
        data: ruleFunction,
      });
    } catch (error) {
      next(error);
    }
  }

  async getByRuleId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ruleId = parseInt(req.params.ruleId, 10);
      if (isNaN(ruleId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid rule ID format',
        });
        return;
      }

      const ruleFunction = await ruleFunctionsService.findByRuleId(ruleId);

      if (!ruleFunction) {
        res.status(404).json({
          success: false,
          error: 'Rule function not found for this rule',
        });
        return;
      }

      res.json({
        success: true,
        data: ruleFunction,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: CreateRuleFunctionDto = req.body;

      const errors: string[] = [];
      if (!data.rule_id || typeof data.rule_id !== 'number') {
        errors.push('Rule ID is required and must be a number');
      }
      if (!data.code || typeof data.code !== 'string' || data.code.trim() === '') {
        errors.push('Code is required');
      }

      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          error: errors.join(', '),
        });
        return;
      }

      // Check if rule exists
      const rule = await rulesService.findById(data.rule_id);
      if (!rule) {
        res.status(404).json({
          success: false,
          error: 'Rule not found',
        });
        return;
      }

      // Check if rule function already exists for this rule
      const existingRuleFunction = await ruleFunctionsService.findByRuleId(data.rule_id);
      if (existingRuleFunction) {
        res.status(409).json({
          success: false,
          error: 'Rule function already exists for this rule',
        });
        return;
      }

      const ruleFunction = await ruleFunctionsService.create({
        ...data,
        code: data.code.trim(),
      });

      res.status(201).json({
        success: true,
        data: ruleFunction,
        message: 'Rule function created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid ID format',
        });
        return;
      }

      const data: UpdateRuleFunctionDto = req.body;

      const existing = await ruleFunctionsService.findById(id);
      if (!existing) {
        res.status(404).json({
          success: false,
          error: 'Rule function not found',
        });
        return;
      }

      const ruleFunction = await ruleFunctionsService.update(id, data);

      res.json({
        success: true,
        data: ruleFunction,
        message: 'Rule function updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid ID format',
        });
        return;
      }

      const existing = await ruleFunctionsService.findById(id);
      if (!existing) {
        res.status(404).json({
          success: false,
          error: 'Rule function not found',
        });
        return;
      }

      await ruleFunctionsService.delete(id);

      res.json({
        success: true,
        message: 'Rule function deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const ruleFunctionsController = new RuleFunctionsController();
