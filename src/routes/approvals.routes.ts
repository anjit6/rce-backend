import { Router } from 'express';
import { approvalsController } from '../controllers/approvals.controller';

const router = Router();

// GET /approvals - Fetch all approvals with search and filter options
router.get('/', approvalsController.getAll.bind(approvalsController));

// GET /approvals/:id - Fetch approval by ID (for view page)
router.get('/:id', approvalsController.getById.bind(approvalsController));

// POST /approvals - Create new approval request
router.post('/', approvalsController.create.bind(approvalsController));

// PUT /approvals/:id/action - Approve or Reject approval
router.put('/:id/action', approvalsController.approveOrReject.bind(approvalsController));

// PUT /approvals/:id/withdraw - Withdraw approval request
router.put('/:id/withdraw', approvalsController.withdraw.bind(approvalsController));

export default router;
