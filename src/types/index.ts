// Database entity types for Rules Configuration Engine

// Enums matching PostgreSQL types
export type RuleStatus = 'WIP' | 'ACTIVE' | 'ARCHIVED';
export type StepType = 'subFunction' | 'condition' | 'output';
export type ParamType = 'inputField' | 'metaDataField' | 'default';
export type DataSourceType = 'static' | 'inputParam' | 'stepOutputVariable';

// Input parameter for subfunctions
export interface SubfunctionInputParam {
  sequence: number;
  name: string;
  data_type: string;
  mandatory: boolean;
  default_value: string | null;
  description?: string;
}

// Input parameter for rule functions
export interface RuleFunctionInputParam {
  sequence: number;
  name: string;
  data_type: string;
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
  lhs_data_type: string;
  lhs_value: string;
  operator: '==' | '<=' | '<' | '>=' | '>' | '!=' | 'contains' | 'does not contain' | 'starts with' | 'ends with';
  rhs_type: DataSourceType;
  rhs_data_type: string;
  rhs_value: string;
}

// Output data for output type steps
export interface StepOutputData {
  data_type: DataSourceType;
  data_value_type: string;
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
