import { Router } from 'express';
import { categoriesController } from '../controllers/categories.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { PERMISSIONS } from '../constants/permissions';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/categories - Get all categories with pagination (anyone who can view rules can view categories)
router.get('/', authorize(PERMISSIONS.VIEW_RULE, PERMISSIONS.VIEW_OWN_RULES, PERMISSIONS.VIEW_ALL_RULES), categoriesController.getAll.bind(categoriesController));

// GET /api/categories/:id - Get category by ID
router.get('/:id', authorize(PERMISSIONS.VIEW_RULE, PERMISSIONS.VIEW_OWN_RULES, PERMISSIONS.VIEW_ALL_RULES), categoriesController.getById.bind(categoriesController));

// POST /api/categories - Create a new category (requires edit rule permission)
router.post('/', authorize(PERMISSIONS.CREATE_RULE), categoriesController.create.bind(categoriesController));

// PUT /api/categories/:id - Update a category
router.put('/:id', authorize(PERMISSIONS.EDIT_RULE), categoriesController.update.bind(categoriesController));

// DELETE /api/categories/:id - Soft delete a category
router.delete('/:id', authorize(PERMISSIONS.EDIT_RULE), categoriesController.delete.bind(categoriesController));

export default router;
