import { Request, Response, NextFunction } from 'express';
import { ruleFunctionStepsService } from '../services/rule-function-steps.service';
import { ruleFunctionsService } from '../services/rule-functions.service';
import { subfunctionsService } from '../services/subfunctions.service';
import { CreateRuleFunctionStepDto, UpdateRuleFunctionStepDto, StepType } from '../types';

const validStepTypes: StepType[] = ['subFunction', 'condition', 'output'];

export class RuleFunctionStepsController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const rule_function_id = req.query.rule_function_id
        ? parseInt(req.query.rule_function_id as string, 10)
        : undefined;

      const { steps, total } = await ruleFunctionStepsService.findAll({ page, limit, rule_function_id });

      res.json({
        success: true,
        data: steps,
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

  async getByRuleFunctionId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ruleFunctionId = parseInt(req.params.ruleFunctionId, 10);
      if (isNaN(ruleFunctionId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid rule function ID format',
        });
        return;
      }

      const steps = await ruleFunctionStepsService.findByRuleFunctionId(ruleFunctionId);

      res.json({
        success: true,
        data: steps,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const ruleFunctionId = parseInt(req.params.ruleFunctionId, 10);

      if (isNaN(ruleFunctionId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid rule function ID format',
        });
        return;
      }

      const step = await ruleFunctionStepsService.findById(id, ruleFunctionId);

      if (!step) {
        res.status(404).json({
          success: false,
          error: 'Rule function step not found',
        });
        return;
      }

      res.json({
        success: true,
        data: step,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: CreateRuleFunctionStepDto = req.body;

      const errors: string[] = [];
      if (!data.id || typeof data.id !== 'string' || data.id.trim() === '') {
        errors.push('ID is required');
      }
      if (!data.rule_function_id || typeof data.rule_function_id !== 'number') {
        errors.push('Rule function ID is required and must be a number');
      }
      if (!data.type || !validStepTypes.includes(data.type)) {
        errors.push(`Type is required and must be one of: ${validStepTypes.join(', ')}`);
      }
      if (data.sequence === undefined || typeof data.sequence !== 'number') {
        errors.push('Sequence is required and must be a number');
      }

      // Type-specific validation
      if (data.type === 'subFunction') {
        if (!data.subfunction_id) {
          errors.push('Subfunction ID is required for subFunction type steps');
        }
      }
      if (data.type === 'condition') {
        if (!data.conditions || !Array.isArray(data.conditions) || data.conditions.length === 0) {
          errors.push('Conditions are required for condition type steps');
        }
      }
      if (data.type === 'output') {
        if (!data.output_data) {
          errors.push('Output data is required for output type steps');
        }
      }

      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          error: errors.join(', '),
        });
        return;
      }

      // Check if rule function exists
      const ruleFunction = await ruleFunctionsService.findById(data.rule_function_id);
      if (!ruleFunction) {
        res.status(404).json({
          success: false,
          error: 'Rule function not found',
        });
        return;
      }

      // Check if subfunction exists for subFunction type
      if (data.type === 'subFunction' && data.subfunction_id) {
        const subfunction = await subfunctionsService.findById(data.subfunction_id);
        if (!subfunction) {
          res.status(404).json({
            success: false,
            error: 'Subfunction not found',
          });
          return;
        }
      }

      // Check if step with same ID already exists
      const existingStep = await ruleFunctionStepsService.findById(data.id, data.rule_function_id);
      if (existingStep) {
        res.status(409).json({
          success: false,
          error: 'Step with this ID already exists for this rule function',
        });
        return;
      }

      // Check if sequence is already taken
      const existingSequence = await ruleFunctionStepsService.findBySequence(data.rule_function_id, data.sequence);
      if (existingSequence) {
        res.status(409).json({
          success: false,
          error: 'Step with this sequence already exists for this rule function',
        });
        return;
      }

      const step = await ruleFunctionStepsService.create(data);

      res.status(201).json({
        success: true,
        data: step,
        message: 'Rule function step created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const ruleFunctionId = parseInt(req.params.ruleFunctionId, 10);

      if (isNaN(ruleFunctionId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid rule function ID format',
        });
        return;
      }

      const data: UpdateRuleFunctionStepDto = req.body;

      const existing = await ruleFunctionStepsService.findById(id, ruleFunctionId);
      if (!existing) {
        res.status(404).json({
          success: false,
          error: 'Rule function step not found',
        });
        return;
      }

      // Validate type if provided
      if (data.type && !validStepTypes.includes(data.type)) {
        res.status(400).json({
          success: false,
          error: `Invalid type. Must be one of: ${validStepTypes.join(', ')}`,
        });
        return;
      }

      // Check sequence uniqueness if updating
      if (data.sequence !== undefined && data.sequence !== existing.sequence) {
        const existingSequence = await ruleFunctionStepsService.findBySequence(ruleFunctionId, data.sequence);
        if (existingSequence && existingSequence.id !== id) {
          res.status(409).json({
            success: false,
            error: 'Step with this sequence already exists for this rule function',
          });
          return;
        }
      }

      // Check subfunction exists if updating
      if (data.subfunction_id !== undefined && data.subfunction_id !== null) {
        const subfunction = await subfunctionsService.findById(data.subfunction_id);
        if (!subfunction) {
          res.status(404).json({
            success: false,
            error: 'Subfunction not found',
          });
          return;
        }
      }

      const step = await ruleFunctionStepsService.update(id, ruleFunctionId, data);

      res.json({
        success: true,
        data: step,
        message: 'Rule function step updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const ruleFunctionId = parseInt(req.params.ruleFunctionId, 10);

      if (isNaN(ruleFunctionId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid rule function ID format',
        });
        return;
      }

      const existing = await ruleFunctionStepsService.findById(id, ruleFunctionId);
      if (!existing) {
        res.status(404).json({
          success: false,
          error: 'Rule function step not found',
        });
        return;
      }

      await ruleFunctionStepsService.delete(id, ruleFunctionId);

      res.json({
        success: true,
        message: 'Rule function step deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const ruleFunctionStepsController = new RuleFunctionStepsController();
