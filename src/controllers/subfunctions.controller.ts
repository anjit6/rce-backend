import { Request, Response, NextFunction } from 'express';
import { subfunctionsService } from '../services/subfunctions.service';
import { CreateSubfunctionDto, UpdateSubfunctionDto } from '../types';

export class SubfunctionsController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const category_id = req.query.category_id as string | undefined;
      const search = req.query.search as string | undefined;

      const { subfunctions, total } = await subfunctionsService.findAll({ page, limit, category_id, search });

      res.json({
        success: true,
        data: subfunctions,
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

      const subfunction = await subfunctionsService.findById(id);

      if (!subfunction) {
        res.status(404).json({
          success: false,
          error: 'Subfunction not found',
        });
        return;
      }

      res.json({
        success: true,
        data: subfunction,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: CreateSubfunctionDto = req.body;

      const errors: string[] = [];
      if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
        errors.push('Name is required');
      }
      if (!data.function_name || typeof data.function_name !== 'string' || data.function_name.trim() === '') {
        errors.push('Function name is required');
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

      const existingFn = await subfunctionsService.findByFunctionName(data.function_name.trim());
      if (existingFn) {
        res.status(409).json({
          success: false,
          error: 'Subfunction with this function_name already exists',
        });
        return;
      }

      const version = data.version || 'v1.0';
      const existingNameVersion = await subfunctionsService.findByNameAndVersion(data.name.trim(), version);
      if (existingNameVersion) {
        res.status(409).json({
          success: false,
          error: `Subfunction with name "${data.name}" and version "${version}" already exists`,
        });
        return;
      }

      const subfunction = await subfunctionsService.create({
        ...data,
        name: data.name.trim(),
        function_name: data.function_name.trim(),
        code: data.code.trim(),
      });

      res.status(201).json({
        success: true,
        data: subfunction,
        message: 'Subfunction created successfully',
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

      const data: UpdateSubfunctionDto = req.body;

      const existing = await subfunctionsService.findById(id);
      if (!existing) {
        res.status(404).json({
          success: false,
          error: 'Subfunction not found',
        });
        return;
      }

      if (data.function_name !== undefined) {
        const existingFn = await subfunctionsService.findByFunctionName(data.function_name.trim());
        if (existingFn && existingFn.id !== id) {
          res.status(409).json({
            success: false,
            error: 'Subfunction with this function_name already exists',
          });
          return;
        }
      }

      if (data.name !== undefined || data.version !== undefined) {
        const name = data.name?.trim() || existing.name;
        const version = data.version || existing.version;
        const existingNameVersion = await subfunctionsService.findByNameAndVersion(name, version);
        if (existingNameVersion && existingNameVersion.id !== id) {
          res.status(409).json({
            success: false,
            error: `Subfunction with name "${name}" and version "${version}" already exists`,
          });
          return;
        }
      }

      const subfunction = await subfunctionsService.update(id, data);

      res.json({
        success: true,
        data: subfunction,
        message: 'Subfunction updated successfully',
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

      const existing = await subfunctionsService.findById(id);
      if (!existing) {
        res.status(404).json({
          success: false,
          error: 'Subfunction not found',
        });
        return;
      }

      await subfunctionsService.delete(id);

      res.json({
        success: true,
        message: 'Subfunction deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const subfunctionsController = new SubfunctionsController();
