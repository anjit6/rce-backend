import { Router } from 'express';
import { rulesController } from '../controllers/rules.controller';

const router = Router();

router.get('/', rulesController.getAll.bind(rulesController));
router.get('/:id', rulesController.getById.bind(rulesController));
router.post('/', rulesController.create.bind(rulesController));
router.put('/:id', rulesController.update.bind(rulesController));
router.delete('/:id', rulesController.delete.bind(rulesController));

export default router;
