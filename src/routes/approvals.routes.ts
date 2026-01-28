import { Router } from 'express';
import { approvalsController } from '../controllers/approvals.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { PERMISSIONS } from '../constants/permissions';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /approvals - Fetch all approvals with search and filter options
router.get('/', authorize(PERMISSIONS.VIEW_PENDING_APPROVALS, PERMISSIONS.VIEW_OWN_REQUESTS, PERMISSIONS.VIEW_ALL_REQUESTS), approvalsController.getAll.bind(approvalsController));

// GET /approvals/:id - Fetch approval by ID (for view page)
router.get('/:id', authorize(PERMISSIONS.VIEW_APPROVAL_REQUEST_DETAILS), approvalsController.getById.bind(approvalsController));

// POST /approvals - Create new approval request
router.post('/', authorize(PERMISSIONS.CREATE_APPROVAL_REQUEST, PERMISSIONS.CREATE_WIP_TO_TEST_REQUEST, PERMISSIONS.CREATE_TEST_TO_PENDING_REQUEST, PERMISSIONS.CREATE_PENDING_TO_PROD_REQUEST), approvalsController.create.bind(approvalsController));

// PUT /approvals/:id/action - Approve or Reject approval
router.put('/:id/action', authorize(PERMISSIONS.APPROVE_WIP_TO_TEST, PERMISSIONS.APPROVE_TEST_TO_PENDING, PERMISSIONS.APPROVE_PENDING_TO_PROD, PERMISSIONS.REJECT_APPROVAL), approvalsController.approveOrReject.bind(approvalsController));

// PUT /approvals/:id/withdraw - Withdraw approval request
router.put('/:id/withdraw', authorize(PERMISSIONS.CREATE_APPROVAL_REQUEST), approvalsController.withdraw.bind(approvalsController));

export default router;
