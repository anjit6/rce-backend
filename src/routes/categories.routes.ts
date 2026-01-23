import { Router } from 'express';
import { categoriesController } from '../controllers/categories.controller';

const router = Router();

// GET /api/categories - Get all categories with pagination
router.get('/', categoriesController.getAll.bind(categoriesController));

// GET /api/categories/:id - Get category by ID
router.get('/:id', categoriesController.getById.bind(categoriesController));

// POST /api/categories - Create a new category
router.post('/', categoriesController.create.bind(categoriesController));

// PUT /api/categories/:id - Update a category
router.put('/:id', categoriesController.update.bind(categoriesController));

// DELETE /api/categories/:id - Soft delete a category
router.delete('/:id', categoriesController.delete.bind(categoriesController));

export default router;
