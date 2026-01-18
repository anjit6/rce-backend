import { Router } from 'express';
import { ruleFunctionsController } from '../controllers/rule-functions.controller';

const router = Router();

router.get('/', ruleFunctionsController.getAll.bind(ruleFunctionsController));
router.get('/:id', ruleFunctionsController.getById.bind(ruleFunctionsController));
router.get('/rule/:ruleId', ruleFunctionsController.getByRuleId.bind(ruleFunctionsController));
router.post('/', ruleFunctionsController.create.bind(ruleFunctionsController));
router.put('/:id', ruleFunctionsController.update.bind(ruleFunctionsController));
router.delete('/:id', ruleFunctionsController.delete.bind(ruleFunctionsController));

export default router;
