import { Router } from 'express';
import { rulesController } from '../controllers/rules.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Basic CRUD routes
router.get('/', rulesController.getAll.bind(rulesController));
router.get('/:id', rulesController.getById.bind(rulesController));
router.post('/', rulesController.create.bind(rulesController));
router.put('/:id', rulesController.update.bind(rulesController));
router.delete('/:id', rulesController.delete.bind(rulesController));

// Complete rule operations
router.post('/:id/save', rulesController.saveCompleteRule.bind(rulesController));
router.put('/:id/complete', rulesController.updateCompleteRule.bind(rulesController));
router.get('/:id/complete', rulesController.getCompleteRule.bind(rulesController));

// Version operations
router.post('/:id/version', authenticate, rulesController.saveVersion.bind(rulesController));

export default router;
