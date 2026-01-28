import { Router } from 'express';
import { ruleFunctionsController } from '../controllers/rule-functions.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { PERMISSIONS } from '../constants/permissions';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET routes - anyone who can view rules
router.get('/', authorize(PERMISSIONS.VIEW_RULE, PERMISSIONS.VIEW_OWN_RULES, PERMISSIONS.VIEW_ALL_RULES), ruleFunctionsController.getAll.bind(ruleFunctionsController));
router.get('/:id', authorize(PERMISSIONS.VIEW_RULE, PERMISSIONS.VIEW_OWN_RULES, PERMISSIONS.VIEW_ALL_RULES), ruleFunctionsController.getById.bind(ruleFunctionsController));
router.get('/rule/:ruleId', authorize(PERMISSIONS.VIEW_RULE, PERMISSIONS.VIEW_OWN_RULES, PERMISSIONS.VIEW_ALL_RULES), ruleFunctionsController.getByRuleId.bind(ruleFunctionsController));

// Write routes - require create/edit rule permissions
router.post('/', authorize(PERMISSIONS.CREATE_RULE), ruleFunctionsController.create.bind(ruleFunctionsController));
router.put('/:id', authorize(PERMISSIONS.EDIT_RULE), ruleFunctionsController.update.bind(ruleFunctionsController));
router.delete('/:id', authorize(PERMISSIONS.EDIT_RULE), ruleFunctionsController.delete.bind(ruleFunctionsController));

export default router;
