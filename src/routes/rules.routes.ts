import { Router } from 'express';
import { rulesController } from '../controllers/rules.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { PERMISSIONS } from '../constants/permissions';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Basic CRUD routes
router.get('/', authorize(PERMISSIONS.VIEW_RULE, PERMISSIONS.VIEW_OWN_RULES, PERMISSIONS.VIEW_ALL_RULES), rulesController.getAll.bind(rulesController));
router.get('/:id', authorize(PERMISSIONS.VIEW_RULE, PERMISSIONS.VIEW_OWN_RULES, PERMISSIONS.VIEW_ALL_RULES), rulesController.getById.bind(rulesController));
router.post('/', authorize(PERMISSIONS.CREATE_RULE), rulesController.create.bind(rulesController));
router.put('/:id', authorize(PERMISSIONS.EDIT_RULE), rulesController.update.bind(rulesController));
router.delete('/:id', authorize(PERMISSIONS.EDIT_RULE), rulesController.delete.bind(rulesController));

// Complete rule operations
router.post('/:id/save', authorize(PERMISSIONS.EDIT_RULE), rulesController.saveCompleteRule.bind(rulesController));
router.put('/:id/complete', authorize(PERMISSIONS.EDIT_RULE), rulesController.updateCompleteRule.bind(rulesController));
router.get('/:id/complete', authorize(PERMISSIONS.VIEW_RULE, PERMISSIONS.VIEW_OWN_RULES, PERMISSIONS.VIEW_ALL_RULES), rulesController.getCompleteRule.bind(rulesController));

// Version operations
router.post('/:id/version', authorize(PERMISSIONS.SAVE_VERSION), rulesController.saveVersion.bind(rulesController));

export default router;
