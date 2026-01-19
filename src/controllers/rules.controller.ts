import { Request, Response, NextFunction } from 'express';
import { rulesService } from '../services/rules.service';
import { CreateRuleDto, UpdateRuleDto, RuleStatus } from '../types';

const validStatuses: RuleStatus[] = ['WIP', 'ACTIVE', 'ARCHIVED'];

export class RulesController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as RuleStatus | undefined;
      const search = req.query.search as string | undefined;

      if (status && !validStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        });
        return;
      }

      const { rules, total } = await rulesService.findAll({ page, limit, status, search });

      res.json({
        success: true,
        data: rules,
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

      const rule = await rulesService.findById(id);

      if (!rule) {
        res.status(404).json({
          success: false,
          error: 'Rule not found',
        });
        return;
      }

      res.json({
        success: true,
        data: rule,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: CreateRuleDto = req.body;

      const errors: string[] = [];
      if (!data.slug || typeof data.slug !== 'string' || data.slug.trim() === '') {
        errors.push('Slug is required');
      }
      if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
        errors.push('Name is required');
      }
      if (data.status && !validStatuses.includes(data.status)) {
        errors.push(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          error: errors.join(', '),
        });
        return;
      }

      const existingSlug = await rulesService.findBySlug(data.slug.trim());
      if (existingSlug) {
        res.status(409).json({
          success: false,
          error: 'Rule with this slug already exists',
        });
        return;
      }

      const rule = await rulesService.create({
        ...data,
        slug: data.slug.trim(),
        name: data.name.trim(),
      });

      res.status(201).json({
        success: true,
        data: rule,
        message: 'Rule created successfully',
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

      const data: UpdateRuleDto = req.body;

      const existing = await rulesService.findById(id);
      if (!existing) {
        res.status(404).json({
          success: false,
          error: 'Rule not found',
        });
        return;
      }

      if (data.status && !validStatuses.includes(data.status)) {
        res.status(400).json({
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        });
        return;
      }

      if (data.slug !== undefined) {
        const existingSlug = await rulesService.findBySlug(data.slug.trim());
        if (existingSlug && existingSlug.id !== id) {
          res.status(409).json({
            success: false,
            error: 'Rule with this slug already exists',
          });
          return;
        }
      }

      const rule = await rulesService.update(id, data);

      res.json({
        success: true,
        data: rule,
        message: 'Rule updated successfully',
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

      const existing = await rulesService.findById(id);
      if (!existing) {
        res.status(404).json({
          success: false,
          error: 'Rule not found',
        });
        return;
      }

      await rulesService.delete(id);

      res.json({
        success: true,
        message: 'Rule deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const rulesController = new RulesController();
