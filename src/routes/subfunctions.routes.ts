import { Router } from 'express';
import { subfunctionsController } from '../controllers/subfunctions.controller';

const router = Router();

router.get('/', subfunctionsController.getAll.bind(subfunctionsController));
router.get('/:id', subfunctionsController.getById.bind(subfunctionsController));
router.post('/', subfunctionsController.create.bind(subfunctionsController));
router.put('/:id', subfunctionsController.update.bind(subfunctionsController));
router.delete('/:id', subfunctionsController.delete.bind(subfunctionsController));

export default router;
