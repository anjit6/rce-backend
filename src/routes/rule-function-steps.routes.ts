import { Router } from 'express';
import { ruleFunctionStepsController } from '../controllers/rule-function-steps.controller';

const router = Router();

router.get('/', ruleFunctionStepsController.getAll.bind(ruleFunctionStepsController));
router.get('/rule-function/:ruleFunctionId', ruleFunctionStepsController.getByRuleFunctionId.bind(ruleFunctionStepsController));
router.get('/rule-function/:ruleFunctionId/step/:id', ruleFunctionStepsController.getById.bind(ruleFunctionStepsController));
router.post('/', ruleFunctionStepsController.create.bind(ruleFunctionStepsController));
router.put('/rule-function/:ruleFunctionId/step/:id', ruleFunctionStepsController.update.bind(ruleFunctionStepsController));
router.delete('/rule-function/:ruleFunctionId/step/:id', ruleFunctionStepsController.delete.bind(ruleFunctionStepsController));

export default router;
