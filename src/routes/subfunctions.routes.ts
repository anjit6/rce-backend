import { Router } from 'express';
import { subfunctionsController } from '../controllers/subfunctions.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { PERMISSIONS } from '../constants/permissions';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET routes - anyone who can view rules can view subfunctions
router.get('/', authorize(PERMISSIONS.VIEW_RULE, PERMISSIONS.VIEW_OWN_RULES, PERMISSIONS.VIEW_ALL_RULES), subfunctionsController.getAll.bind(subfunctionsController));
router.get('/:id', authorize(PERMISSIONS.VIEW_RULE, PERMISSIONS.VIEW_OWN_RULES, PERMISSIONS.VIEW_ALL_RULES), subfunctionsController.getById.bind(subfunctionsController));

// Write routes - require create/edit rule permissions
router.post('/', authorize(PERMISSIONS.CREATE_RULE), subfunctionsController.create.bind(subfunctionsController));
router.put('/:id', authorize(PERMISSIONS.EDIT_RULE), subfunctionsController.update.bind(subfunctionsController));
router.delete('/:id', authorize(PERMISSIONS.EDIT_RULE), subfunctionsController.delete.bind(subfunctionsController));

export default router;
