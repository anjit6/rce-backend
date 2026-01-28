import { Router } from 'express';
import { ruleFunctionStepsController } from '../controllers/rule-function-steps.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { PERMISSIONS } from '../constants/permissions';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET routes - anyone who can view rules
router.get('/', authorize(PERMISSIONS.VIEW_RULE, PERMISSIONS.VIEW_OWN_RULES, PERMISSIONS.VIEW_ALL_RULES), ruleFunctionStepsController.getAll.bind(ruleFunctionStepsController));
router.get('/rule-function/:ruleFunctionId', authorize(PERMISSIONS.VIEW_RULE, PERMISSIONS.VIEW_OWN_RULES, PERMISSIONS.VIEW_ALL_RULES), ruleFunctionStepsController.getByRuleFunctionId.bind(ruleFunctionStepsController));
router.get('/rule-function/:ruleFunctionId/step/:id', authorize(PERMISSIONS.VIEW_RULE, PERMISSIONS.VIEW_OWN_RULES, PERMISSIONS.VIEW_ALL_RULES), ruleFunctionStepsController.getById.bind(ruleFunctionStepsController));

// Write routes - require create/edit rule permissions
router.post('/', authorize(PERMISSIONS.CREATE_RULE), ruleFunctionStepsController.create.bind(ruleFunctionStepsController));
router.put('/rule-function/:ruleFunctionId/step/:id', authorize(PERMISSIONS.EDIT_RULE), ruleFunctionStepsController.update.bind(ruleFunctionStepsController));
router.delete('/rule-function/:ruleFunctionId/step/:id', authorize(PERMISSIONS.EDIT_RULE), ruleFunctionStepsController.delete.bind(ruleFunctionStepsController));

export default router;
