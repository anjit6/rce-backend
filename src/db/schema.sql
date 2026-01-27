-- Rules Configuration Engine Database Schema
-- Database schema to be implemented

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS (with IF NOT EXISTS check)
-- ============================================================
DO $$ BEGIN
    CREATE TYPE rule_status AS ENUM ('WIP', 'TEST', 'PENDING', 'PROD');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE step_type AS ENUM ('subFunction', 'condition', 'output');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE param_type AS ENUM ('inputField', 'metaDataField', 'default');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE data_source_type AS ENUM ('static', 'inputParam', 'stepOutputVariable');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE approval_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE approval_action AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'WITHDRAWN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_deleted_at ON categories(deleted_at);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(id) WHERE deleted_at IS NULL;

-- ============================================================
-- SUBFUNCTIONS (Reusable function definitions)
-- ============================================================
CREATE TABLE IF NOT EXISTS subfunctions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    version VARCHAR(20) DEFAULT 'v1.0',
    function_name VARCHAR(255) NOT NULL UNIQUE,
    category_id VARCHAR(50) REFERENCES categories(id) ON DELETE SET NULL,
    code TEXT NOT NULL,
    return_type VARCHAR(100),
    input_params JSONB DEFAULT '[]'::jsonb, -- Array of input parameter objects
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(name, version)
);

CREATE INDEX IF NOT EXISTS idx_subfunctions_name ON subfunctions(name);
CREATE INDEX IF NOT EXISTS idx_subfunctions_category_id ON subfunctions(category_id);
CREATE INDEX IF NOT EXISTS idx_subfunctions_function_name ON subfunctions(function_name);
CREATE INDEX IF NOT EXISTS idx_subfunctions_deleted_at ON subfunctions(deleted_at);
CREATE INDEX IF NOT EXISTS idx_subfunctions_active ON subfunctions(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_subfunctions_input_params ON subfunctions USING GIN (input_params);

-- ============================================================
-- RULES (Rule list metadata)
-- ============================================================
CREATE TABLE IF NOT EXISTS rules (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status rule_status DEFAULT 'WIP',
    version_major INTEGER DEFAULT 0,
    version_minor INTEGER DEFAULT 1,
    author VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_rules_name ON rules(name);
CREATE INDEX IF NOT EXISTS idx_rules_slug ON rules(slug);
CREATE INDEX IF NOT EXISTS idx_rules_status ON rules(status);
CREATE INDEX IF NOT EXISTS idx_rules_deleted_at ON rules(deleted_at);
CREATE INDEX IF NOT EXISTS idx_rules_active ON rules(id) WHERE deleted_at IS NULL;

-- ============================================================
-- RULE FUNCTIONS (Rule implementation details)
-- ============================================================
CREATE TABLE IF NOT EXISTS rule_functions (
    id SERIAL PRIMARY KEY,
    rule_id INTEGER NOT NULL UNIQUE REFERENCES rules(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    return_type VARCHAR(100),
    input_params JSONB DEFAULT '[]'::jsonb, -- Array of input parameter objects
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_rule_functions_rule_id ON rule_functions(rule_id);
CREATE INDEX IF NOT EXISTS idx_rule_functions_deleted_at ON rule_functions(deleted_at);
CREATE INDEX IF NOT EXISTS idx_rule_functions_active ON rule_functions(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_rule_functions_input_params ON rule_functions USING GIN (input_params);

-- ============================================================
-- RULE FUNCTION STEPS
-- ============================================================
CREATE TABLE IF NOT EXISTS rule_function_steps (
    id VARCHAR(50) NOT NULL,
    rule_function_id INTEGER NOT NULL REFERENCES rule_functions(id) ON DELETE CASCADE,
    type step_type NOT NULL,
    output_variable_name VARCHAR(255),
    return_type VARCHAR(100),
    next_step JSONB, -- For conditions: {"true": "stepId", "false": "stepId"}, For others: "stepId" or null
    sequence INTEGER NOT NULL,
    subfunction_id INTEGER REFERENCES subfunctions(id) ON DELETE CASCADE, -- For subFunction type steps
    subfunction_params JSONB DEFAULT '[]'::jsonb, -- For subFunction type: array of param mappings
    conditions JSONB DEFAULT '[]'::jsonb, -- For condition type: array of condition objects
    output_data JSONB, -- For output type: single output data object
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (id, rule_function_id),
    UNIQUE(rule_function_id, sequence),
    CHECK (
        (type = 'subFunction' AND subfunction_id IS NOT NULL AND subfunction_params IS NOT NULL) OR
        (type = 'condition' AND conditions IS NOT NULL) OR
        (type = 'output' AND output_data IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_rule_function_steps_rule_function_id ON rule_function_steps(rule_function_id);
CREATE INDEX IF NOT EXISTS idx_rule_function_steps_type ON rule_function_steps(type);
CREATE INDEX IF NOT EXISTS idx_rule_function_steps_sequence ON rule_function_steps(rule_function_id, sequence);
CREATE INDEX IF NOT EXISTS idx_rule_function_steps_subfunction_id ON rule_function_steps(subfunction_id);
CREATE INDEX IF NOT EXISTS idx_rule_function_steps_deleted_at ON rule_function_steps(deleted_at);
CREATE INDEX IF NOT EXISTS idx_rule_function_steps_active ON rule_function_steps(id, rule_function_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_rule_function_steps_subfunction_params ON rule_function_steps USING GIN (subfunction_params);
CREATE INDEX IF NOT EXISTS idx_rule_function_steps_conditions ON rule_function_steps USING GIN (conditions);
CREATE INDEX IF NOT EXISTS idx_rule_function_steps_output_data ON rule_function_steps USING GIN (output_data);

-- ============================================================
-- RULE VERSIONS
-- Stores every saved version of a rule (immutable once created)
-- ============================================================
CREATE TABLE IF NOT EXISTS rule_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_id INTEGER NOT NULL REFERENCES rules(id) ON DELETE CASCADE,

    -- Version info
    major_version INTEGER NOT NULL DEFAULT 1,
    minor_version INTEGER NOT NULL DEFAULT 0,
    stage rule_status NOT NULL DEFAULT 'WIP',  -- WIP / TEST / PENDING / PROD

    -- Rule function data (snapshot)
    rule_function_code TEXT NOT NULL,
    rule_function_input_params JSONB DEFAULT '[]'::jsonb,
    rule_steps JSONB DEFAULT '[]'::jsonb,

    -- Testing status
    test_status BOOLEAN DEFAULT FALSE,  -- Y / N (true/false)

    -- Audit fields
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    comment TEXT,  -- optional save comment

    -- Ensure unique version per rule
    UNIQUE(rule_id, major_version, minor_version)
);

-- Indexes for rule_versions
CREATE INDEX IF NOT EXISTS idx_rule_versions_rule_id ON rule_versions(rule_id);
CREATE INDEX IF NOT EXISTS idx_rule_versions_stage ON rule_versions(stage);
CREATE INDEX IF NOT EXISTS idx_rule_versions_created_at ON rule_versions(created_at);
CREATE INDEX IF NOT EXISTS idx_rule_versions_created_by ON rule_versions(created_by);
CREATE INDEX IF NOT EXISTS idx_rule_versions_version ON rule_versions(rule_id, major_version, minor_version);
CREATE INDEX IF NOT EXISTS idx_rule_versions_input_params ON rule_versions USING GIN (rule_function_input_params);
CREATE INDEX IF NOT EXISTS idx_rule_versions_steps ON rule_versions USING GIN (rule_steps);

-- ============================================================
-- RULE APPROVALS
-- Represents live approval requests (only one active per rule_version)
-- ============================================================
CREATE TABLE IF NOT EXISTS rule_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_version_id UUID NOT NULL REFERENCES rule_versions(id) ON DELETE CASCADE,
    rule_id INTEGER NOT NULL REFERENCES rules(id) ON DELETE CASCADE,

    -- Stage transition
    from_stage rule_status NOT NULL,
    to_stage rule_status NOT NULL,
    moved_to_stage rule_status,  -- Actual stage after action (WIP/TEST/PENDING/PROD)

    -- Request info
    requested_by VARCHAR(255) NOT NULL,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    request_comment TEXT,

    -- Approval status
    status approval_status NOT NULL DEFAULT 'PENDING',

    -- Action info
    action approval_action,
    action_by VARCHAR(255),
    action_at TIMESTAMP WITH TIME ZONE,
    action_comment TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for rule_approvals
CREATE INDEX IF NOT EXISTS idx_rule_approvals_rule_version_id ON rule_approvals(rule_version_id);
CREATE INDEX IF NOT EXISTS idx_rule_approvals_rule_id ON rule_approvals(rule_id);
CREATE INDEX IF NOT EXISTS idx_rule_approvals_status ON rule_approvals(status);
CREATE INDEX IF NOT EXISTS idx_rule_approvals_requested_by ON rule_approvals(requested_by);
CREATE INDEX IF NOT EXISTS idx_rule_approvals_requested_at ON rule_approvals(requested_at);
CREATE INDEX IF NOT EXISTS idx_rule_approvals_from_stage ON rule_approvals(from_stage);
CREATE INDEX IF NOT EXISTS idx_rule_approvals_to_stage ON rule_approvals(to_stage);
CREATE INDEX IF NOT EXISTS idx_rule_approvals_action_by ON rule_approvals(action_by);

-- Partial unique index to ensure only one PENDING approval per rule_version
CREATE UNIQUE INDEX IF NOT EXISTS idx_rule_approvals_one_pending
    ON rule_approvals(rule_version_id)
    WHERE status = 'PENDING';

-- ============================================================
-- RULE STAGE HISTORY
-- Tracks every lifecycle movement
-- ============================================================
CREATE TABLE IF NOT EXISTS rule_stage_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_version_id UUID NOT NULL REFERENCES rule_versions(id) ON DELETE CASCADE,

    -- Stage transition
    from_stage rule_status,
    to_stage rule_status NOT NULL,

    -- Audit fields
    changed_by VARCHAR(255) NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reason TEXT
);

-- Indexes for rule_stage_history
CREATE INDEX IF NOT EXISTS idx_rule_stage_history_rule_version_id ON rule_stage_history(rule_version_id);
CREATE INDEX IF NOT EXISTS idx_rule_stage_history_from_stage ON rule_stage_history(from_stage);
CREATE INDEX IF NOT EXISTS idx_rule_stage_history_to_stage ON rule_stage_history(to_stage);
CREATE INDEX IF NOT EXISTS idx_rule_stage_history_changed_by ON rule_stage_history(changed_by);
CREATE INDEX IF NOT EXISTS idx_rule_stage_history_changed_at ON rule_stage_history(changed_at);

-- ============================================================
-- TRIGGERS FOR updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subfunctions_updated_at ON subfunctions;
CREATE TRIGGER update_subfunctions_updated_at
    BEFORE UPDATE ON subfunctions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rules_updated_at ON rules;
CREATE TRIGGER update_rules_updated_at
    BEFORE UPDATE ON rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rule_functions_updated_at ON rule_functions;
CREATE TRIGGER update_rule_functions_updated_at
    BEFORE UPDATE ON rule_functions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rule_function_steps_updated_at ON rule_function_steps;
CREATE TRIGGER update_rule_function_steps_updated_at
    BEFORE UPDATE ON rule_function_steps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rule_approvals_updated_at ON rule_approvals;
CREATE TRIGGER update_rule_approvals_updated_at
    BEFORE UPDATE ON rule_approvals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- COMMENTS
-- ============================================================
COMMENT ON TABLE categories IS 'Category groups for organizing subfunctions. Supports soft delete.';
COMMENT ON TABLE subfunctions IS 'Reusable function definitions with executable code and input parameters stored as JSONB. Unique by (name, version). Supports soft delete.';
COMMENT ON TABLE rules IS 'Rule list with metadata and versioning. Each rule has a unique slug. Supports soft delete.';
COMMENT ON TABLE rule_functions IS 'Rule implementation with generated code and input parameters stored as JSONB. One-to-one relationship with rules. Supports soft delete.';
COMMENT ON TABLE rule_function_steps IS 'Steps within a rule with all step data stored as JSONB (subfunction params, conditions, or output data). Supports soft delete and includes CHECK constraints to validate step type consistency.';

COMMENT ON COLUMN categories.id IS 'Custom string identifier for the category (e.g., STR, NUM, DATE, UTIL)';
COMMENT ON COLUMN categories.name IS 'Unique category name for organizing subfunctions';
COMMENT ON COLUMN categories.description IS 'Description of what types of functions belong in this category';
COMMENT ON COLUMN subfunctions.name IS 'Subfunction name, unique per version';
COMMENT ON COLUMN subfunctions.function_name IS 'Unique JavaScript function name used in code generation';
COMMENT ON COLUMN subfunctions.input_params IS 'Array of input parameter objects: [{"sequence": 1, "name": "param1", "data_type": "string", "mandatory": true, "default_value": null, "description": "..."}]';
COMMENT ON COLUMN rule_functions.code IS 'Generated JavaScript code for the rule function (required)';
COMMENT ON COLUMN rule_functions.input_params IS 'Array of input parameter objects: [{"sequence": 1, "name": "param1", "data_type": "string", "param_type": "inputField|metaDataField|default", "mandatory": true, "default_value": null, "description": "..."}]';
COMMENT ON COLUMN rule_function_steps.sequence IS 'Execution order of the step within the rule function, must be unique per rule_function_id';
COMMENT ON COLUMN rule_function_steps.subfunction_id IS 'Reference to the subfunction to execute (required for subFunction type steps)';
COMMENT ON COLUMN rule_function_steps.next_step IS 'Flow control: For conditions: {"true": "step_2", "false": "step_3"}, For sequential steps: "step_4" or null for terminal steps';
COMMENT ON COLUMN rule_function_steps.subfunction_params IS 'For subFunction type: [{"subfunction_param_name": "param1", "data_type": "static|inputParam|stepOutputVariable", "data_value": "value|paramId|stepId"}]';
COMMENT ON COLUMN rule_function_steps.conditions IS 'For condition type: [{"sequence": 1, "and_or": null|"AND"|"OR", "lhs_type": "static|inputParam|stepOutputVariable", "lhs_data_type": "string", "lhs_value": "...", "operator": "==|<=|<|>=|>|!=|contains|does not contain|starts with|ends with", "rhs_type": "static|inputParam|stepOutputVariable", "rhs_data_type": "string", "rhs_value": "..."}]';
COMMENT ON COLUMN rule_function_steps.output_data IS 'For output type: {"data_type": "static|inputParam|stepOutputVariable", "data_value_type": "string|number|...", "data_value": "..."}';

COMMENT ON TABLE rule_versions IS 'Stores every saved version of a rule. Immutable once created. Contains snapshots of rule function code, input params, and steps.';
COMMENT ON TABLE rule_approvals IS 'Represents live approval requests for stage transitions. Only one PENDING approval allowed per rule_version.';
COMMENT ON TABLE rule_stage_history IS 'Tracks every lifecycle movement of a rule version between stages.';

COMMENT ON COLUMN rule_versions.id IS 'UUID primary key';
COMMENT ON COLUMN rule_versions.rule_id IS 'Reference to the parent rule';
COMMENT ON COLUMN rule_versions.major_version IS 'Major version number (incremented for breaking changes)';
COMMENT ON COLUMN rule_versions.minor_version IS 'Minor version number (incremented for minor changes)';
COMMENT ON COLUMN rule_versions.stage IS 'Current stage: WIP, TEST, PENDING, or PROD';
COMMENT ON COLUMN rule_versions.rule_function_code IS 'Generated JavaScript code snapshot';
COMMENT ON COLUMN rule_versions.rule_function_input_params IS 'Input parameters snapshot as JSONB array';
COMMENT ON COLUMN rule_versions.rule_steps IS 'Rule steps snapshot as JSONB array';
COMMENT ON COLUMN rule_versions.test_status IS 'Whether testing has been completed (true/false)';
COMMENT ON COLUMN rule_versions.created_by IS 'User who created this version';
COMMENT ON COLUMN rule_versions.comment IS 'Optional save comment';

COMMENT ON COLUMN rule_approvals.rule_id IS 'Reference to the parent rule';
COMMENT ON COLUMN rule_approvals.from_stage IS 'Stage before the transition';
COMMENT ON COLUMN rule_approvals.to_stage IS 'Target stage for the transition';
COMMENT ON COLUMN rule_approvals.moved_to_stage IS 'Actual stage after action is taken';
COMMENT ON COLUMN rule_approvals.request_comment IS 'Comment provided when the approval request was made';
COMMENT ON COLUMN rule_approvals.status IS 'Current status: PENDING, APPROVED, REJECTED, WITHDRAWN';
COMMENT ON COLUMN rule_approvals.action IS 'Action taken: REQUESTED, APPROVED, REJECTED, WITHDRAWN';
COMMENT ON COLUMN rule_approvals.action_comment IS 'Comment provided when action was taken on the approval request';

COMMENT ON COLUMN rule_stage_history.from_stage IS 'Previous stage (null for initial creation)';
COMMENT ON COLUMN rule_stage_history.to_stage IS 'New stage';
COMMENT ON COLUMN rule_stage_history.reason IS 'Reason for the stage change';

