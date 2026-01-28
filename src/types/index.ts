// Database entity types for Rules Configuration Engine

// Enums matching PostgreSQL types
export type RuleStatus = 'WIP' | 'TEST' | 'PENDING' | 'PROD';
export type StepType = 'subFunction' | 'condition' | 'output';
export type ParamType = 'inputField' | 'metaDataField' | 'default';
export type DataSourceType = 'static' | 'inputParam' | 'stepOutputVariable';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';
export type ApprovalAction = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';

// Data types for parameters - support both legacy uppercase and proper case
export type FieldDataType = 
  | 'STRING' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'ANY'
  | 'String' | 'Number' | 'Boolean' | 'Date';

// Input parameter for subfunctions
export interface SubfunctionInputParam {
  sequence: number;
  name: string;
  data_type: FieldDataType;
  mandatory: boolean;
  default_value: string | null;
  description?: string;
}

// Input parameter for rule functions
export interface RuleFunctionInputParam {
  sequence: number;
  name: string;
  data_type: FieldDataType;
  param_type: ParamType;
  mandatory: boolean;
  default_value: string | null;
  description?: string;
}

// Subfunction parameter mapping for steps
export interface SubfunctionParamMapping {
  subfunction_param_name: string;
  data_type: DataSourceType;
  data_value: string;
}

// Condition object for condition type steps
export interface StepCondition {
  sequence: number;
  and_or: 'AND' | 'OR' | null;
  lhs_type: DataSourceType;
  lhs_data_type: FieldDataType;
  lhs_value: string;
  operator: '==' | '<=' | '<' | '>=' | '>' | '!=' | 'contains' | 'does not contain' | 'starts with' | 'ends with';
  rhs_type: DataSourceType;
  rhs_data_type: FieldDataType;
  rhs_value: string;
}

// Output data for output type steps
export interface StepOutputData {
  data_type: DataSourceType;
  data_value_type: FieldDataType;
  data_value: string;
}

// Next step configuration
export type NextStep = string | { true: string; false: string } | null;

// ============================================================
// ENTITY INTERFACES
// ============================================================

export interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface Subfunction {
  id: number;
  name: string;
  description: string | null;
  version: string;
  function_name: string;
  category_id: string | null;
  code: string;
  return_type: string | null;
  input_params: SubfunctionInputParam[];
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface Rule {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  status: RuleStatus;
  version_major: number;
  version_minor: number;
  author: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface RuleFunction {
  id: number;
  rule_id: number;
  code: string;
  return_type: string | null;
  input_params: RuleFunctionInputParam[];
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface RuleFunctionStep {
  id: string;
  rule_function_id: number;
  type: StepType;
  output_variable_name: string | null;
  return_type: string | null;
  next_step: NextStep;
  sequence: number;
  subfunction_id: number | null;
  subfunction_params: SubfunctionParamMapping[];
  conditions: StepCondition[];
  output_data: StepOutputData | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

// ============================================================
// CREATE/UPDATE DTOs
// ============================================================

export interface CreateCategoryDto {
  id: string;
  name: string;
  description?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
}

export interface CreateSubfunctionDto {
  name: string;
  description?: string;
  version?: string;
  function_name: string;
  category_id?: string;
  code: string;
  return_type?: string;
  input_params?: SubfunctionInputParam[];
}

export interface UpdateSubfunctionDto {
  name?: string;
  description?: string;
  version?: string;
  function_name?: string;
  category_id?: string | null;
  code?: string;
  return_type?: string;
  input_params?: SubfunctionInputParam[];
}

export interface CreateRuleDto {
  slug: string;
  name: string;
  description?: string;
  status?: RuleStatus;
  version_major?: number;
  version_minor?: number;
  author?: string;
}

export interface UpdateRuleDto {
  slug?: string;
  name?: string;
  description?: string;
  status?: RuleStatus;
  version_major?: number;
  version_minor?: number;
  author?: string;
}

export interface CreateRuleFunctionDto {
  rule_id: number;
  code: string;
  return_type?: string;
  input_params?: RuleFunctionInputParam[];
}

export interface UpdateRuleFunctionDto {
  code?: string;
  return_type?: string;
  input_params?: RuleFunctionInputParam[];
}

export interface CreateRuleFunctionStepDto {
  id: string;
  rule_function_id: number;
  type: StepType;
  output_variable_name?: string;
  return_type?: string;
  next_step?: NextStep;
  sequence: number;
  subfunction_id?: number;
  subfunction_params?: SubfunctionParamMapping[];
  conditions?: StepCondition[];
  output_data?: StepOutputData;
}

export interface UpdateRuleFunctionStepDto {
  type?: StepType;
  output_variable_name?: string;
  return_type?: string;
  next_step?: NextStep;
  sequence?: number;
  subfunction_id?: number;
  subfunction_params?: SubfunctionParamMapping[];
  conditions?: StepCondition[];
  output_data?: StepOutputData;
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

// ============================================================
// APPROVAL TYPES
// ============================================================

export interface RuleApproval {
  id: string;
  rule_version_id: string;
  rule_id: number;
  from_stage: RuleStatus;
  to_stage: RuleStatus;
  moved_to_stage: RuleStatus | null;
  requested_by: string;
  requested_at: Date;
  request_comment: string | null;
  status: ApprovalStatus;
  action: ApprovalAction | null;
  action_by: string | null;
  action_at: Date | null;
  action_comment: string | null;
  created_at: Date;
  updated_at: Date;
}

// USER, ROLE, PERMISSION TYPES
// ============================================================
export interface Permission {
  id: number;
  name: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}
export interface RuleStageHistory {
  id: string;
  rule_version_id: string;
  from_stage: RuleStatus | null;
  to_stage: RuleStatus;
  changed_by: string;
  changed_at: Date;
  reason: string | null;
}

export interface CreateApprovalDto {
  rule_version_id: string;
  rule_id: number;
  from_stage: RuleStatus;
  to_stage: RuleStatus;
  requested_by: string;
  request_comment?: string;
}

export interface ApproveRejectDto {
  action: 'APPROVED' | 'REJECTED';
  action_by: string;
  action_comment?: string;
}

export interface ApprovalFilterParams extends PaginationParams {
  status?: ApprovalStatus | 'ALL';
  rule_id?: number;
  requested_by?: string;
  search?: string;
}

export interface Role {
  id: number;
  name: string;
  description: string | null;
  permission_ids: number[];
  created_at: Date;
  updated_at: Date;
}

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role_id: number | null;
  is_active: boolean;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface UserSession {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
}

// User without password for API responses
export interface UserPublic {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role_id: number | null;
  role?: Role;
  permissions?: string[];
  is_active: boolean;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserDto {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role_id: number;
}

export interface UpdateUserDto {
  first_name?: string;
  last_name?: string;
  email?: string;
  password?: string;
  role_id?: number;
  is_active?: boolean;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: UserPublic;
  token: string;
  expiresAt: Date;
}

export interface JwtPayload {
  userId: string;
  email: string;
  roleId: number | null;
  permissions: string[];
  iat?: number;
  exp?: number;
}

// ============================================================
// COMPLETE RULE TYPES (for save/update/fetch entire rule JSON)
// ============================================================

export interface SaveRuleStepDto {
  id: string;
  type: StepType;
  output_variable_name?: string;
  return_type?: string;
  next_step?: NextStep;
  sequence: number;
  subfunction_id?: number;
  subfunction_params?: SubfunctionParamMapping[];
  conditions?: StepCondition[];
  output_data?: StepOutputData;
}

export interface SaveRuleDto {
  code: string;
  return_type?: string;
  input_params?: RuleFunctionInputParam[];
  steps: SaveRuleStepDto[];
  created_by?: string;
  comment?: string;
}

export interface UpdateCompleteRuleDto {
  code: string;
  return_type?: string;
  input_params?: RuleFunctionInputParam[];
  steps: SaveRuleStepDto[];
}

export interface CompleteRuleResponse {
  rule: Rule;
  rule_function: {
    id: number;
    code: string;
    return_type: string | null;
    input_params: RuleFunctionInputParam[];
  };
  steps: RuleFunctionStep[];
}

// ============================================================
// RULE VERSION TYPES
// ============================================================

export interface RuleVersion {
  id: number;
  rule_id: number;
  major_version: number;
  minor_version: number;
  stage: RuleStatus;
  rule_function_code: string;
  rule_function_input_params: RuleFunctionInputParam[];
  rule_steps: SaveRuleStepDto[];
  test_status: boolean;
  created_by: string | null;
  created_at: Date;
  comment: string | null;
}

export interface SaveVersionDto {
  created_by: string;
  comment?: string;
}

export interface SaveVersionResponse {
  rule: Rule;
  rule_version: RuleVersion;
}
