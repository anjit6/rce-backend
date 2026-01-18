import { Request, Response, NextFunction } from 'express';
import { categoriesService } from '../services/categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from '../types';

export class CategoriesController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const { categories, total } = await categoriesService.findAll({ page, limit });

      res.json({
        success: true,
        data: categories,
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
      const { id } = req.params;
      const category = await categoriesService.findById(id);

      if (!category) {
        res.status(404).json({
          success: false,
          error: 'Category not found',
        });
        return;
      }

      res.json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: CreateCategoryDto = req.body;

      if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
        res.status(400).json({
          success: false,
          error: 'Name is required and must be a non-empty string',
        });
        return;
      }

      const existing = await categoriesService.findByName(data.name.trim());
      if (existing) {
        res.status(409).json({
          success: false,
          error: 'Category with this name already exists',
        });
        return;
      }

      const category = await categoriesService.create({ name: data.name.trim() });

      res.status(201).json({
        success: true,
        data: category,
        message: 'Category created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdateCategoryDto = req.body;

      const existing = await categoriesService.findById(id);
      if (!existing) {
        res.status(404).json({
          success: false,
          error: 'Category not found',
        });
        return;
      }

      if (data.name !== undefined) {
        if (typeof data.name !== 'string' || data.name.trim() === '') {
          res.status(400).json({
            success: false,
            error: 'Name must be a non-empty string',
          });
          return;
        }

        const nameExists = await categoriesService.findByName(data.name.trim());
        if (nameExists && nameExists.id !== id) {
          res.status(409).json({
            success: false,
            error: 'Category with this name already exists',
          });
          return;
        }

        data.name = data.name.trim();
      }

      const category = await categoriesService.update(id, data);

      res.json({
        success: true,
        data: category,
        message: 'Category updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const existing = await categoriesService.findById(id);
      if (!existing) {
        res.status(404).json({
          success: false,
          error: 'Category not found',
        });
        return;
      }

      await categoriesService.delete(id);

      res.json({
        success: true,
        message: 'Category deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const categoriesController = new CategoriesController();
