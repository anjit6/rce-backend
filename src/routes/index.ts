import { Router } from 'express';
import categoriesRoutes from './categories.routes';
import subfunctionsRoutes from './subfunctions.routes';
import rulesRoutes from './rules.routes';
import ruleFunctionsRoutes from './rule-functions.routes';
import ruleFunctionStepsRoutes from './rule-function-steps.routes';
import approvalsRoutes from './approvals.routes';

const router = Router();

router.use('/categories', categoriesRoutes);
router.use('/subfunctions', subfunctionsRoutes);
router.use('/rules', rulesRoutes);
router.use('/rule-functions', ruleFunctionsRoutes);
router.use('/rule-function-steps', ruleFunctionStepsRoutes);
router.use('/approvals', approvalsRoutes);

export default router;
