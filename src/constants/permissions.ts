// Permission constants matching the database seed.sql
// These are used for RBAC checks throughout the backend

export const PERMISSIONS = {
  // Rule Management Permissions (IDs 1-7)
  CREATE_RULE: 1,
  EDIT_RULE: 2,
  VIEW_RULE: 3,
  TEST_RULE: 4,
  VIEW_OWN_RULES: 5,
  VIEW_ALL_RULES: 6,
  SAVE_VERSION: 7,

  // Rule Promotion Permissions (IDs 10-12)
  PROMOTE_WIP_TO_TEST: 10,
  PROMOTE_TEST_TO_PENDING: 11,
  PROMOTE_PENDING_TO_PROD: 12,

  // Approval Request Permissions (IDs 20-24)
  VIEW_PENDING_APPROVALS: 20,
  VIEW_OWN_REQUESTS: 21,
  VIEW_ALL_REQUESTS: 22,
  CREATE_APPROVAL_REQUEST: 23,
  VIEW_APPROVAL_REQUEST_DETAILS: 24,

  // Approval Action Permissions (IDs 30-33)
  APPROVE_WIP_TO_TEST: 30,
  APPROVE_TEST_TO_PENDING: 31,
  APPROVE_PENDING_TO_PROD: 32,
  REJECT_APPROVAL: 33,

  // Stage-Specific Create Request Permissions (IDs 34-36)
  CREATE_WIP_TO_TEST_REQUEST: 34,
  CREATE_TEST_TO_PENDING_REQUEST: 35,
  CREATE_PENDING_TO_PROD_REQUEST: 36,
} as const;

export type PermissionId = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Role IDs matching database
export const ROLES = {
  DEVELOPER: 1,
  QA: 2,
  APPROVER: 3,
} as const;

export type RoleId = typeof ROLES[keyof typeof ROLES];

// Stage transition permission mapping
export const STAGE_TRANSITION_PERMISSIONS = {
  'WIP_TO_TEST': {
    promote: PERMISSIONS.PROMOTE_WIP_TO_TEST,
    approve: PERMISSIONS.APPROVE_WIP_TO_TEST,
    createRequest: PERMISSIONS.CREATE_WIP_TO_TEST_REQUEST,
  },
  'TEST_TO_PENDING': {
    promote: PERMISSIONS.PROMOTE_TEST_TO_PENDING,
    approve: PERMISSIONS.APPROVE_TEST_TO_PENDING,
    createRequest: PERMISSIONS.CREATE_TEST_TO_PENDING_REQUEST,
  },
  'PENDING_TO_PROD': {
    promote: PERMISSIONS.PROMOTE_PENDING_TO_PROD,
    approve: PERMISSIONS.APPROVE_PENDING_TO_PROD,
    createRequest: PERMISSIONS.CREATE_PENDING_TO_PROD_REQUEST,
  },
} as const;

// Helper function to get required permission for stage transition
export function getPromotePermission(fromStage: string, toStage: string): PermissionId | null {
  const key = `${fromStage}_TO_${toStage}` as keyof typeof STAGE_TRANSITION_PERMISSIONS;
  return STAGE_TRANSITION_PERMISSIONS[key]?.promote || null;
}

export function getApprovePermission(fromStage: string, toStage: string): PermissionId | null {
  const key = `${fromStage}_TO_${toStage}` as keyof typeof STAGE_TRANSITION_PERMISSIONS;
  return STAGE_TRANSITION_PERMISSIONS[key]?.approve || null;
}

export function getCreateRequestPermission(fromStage: string, toStage: string): PermissionId | null {
  const key = `${fromStage}_TO_${toStage}` as keyof typeof STAGE_TRANSITION_PERMISSIONS;
  return STAGE_TRANSITION_PERMISSIONS[key]?.createRequest || null;
}
