-- Rules Configuration Engine Database Schema
-- PostgreSQL Database Schema for Rule Engine
-- Created: 2026-01-07

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE rule_status AS ENUM ('WIP', 'ACTIVE', 'ARCHIVED');
CREATE TYPE step_type AS ENUM ('subFunction', 'condition', 'output');
CREATE TYPE param_type AS ENUM ('inputField', 'metaDataField', 'default');
CREATE TYPE data_source_type AS ENUM ('static', 'inputParam', 'stepOutputVariable');

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_categories_name ON categories(name);
CREATE INDEX idx_categories_deleted_at ON categories(deleted_at);
CREATE INDEX idx_categories_active ON categories(id) WHERE deleted_at IS NULL;

-- ============================================================
-- SUBFUNCTIONS (Reusable function definitions)
-- ============================================================
CREATE TABLE subfunctions (
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

CREATE INDEX idx_subfunctions_name ON subfunctions(name);
CREATE INDEX idx_subfunctions_category_id ON subfunctions(category_id);
CREATE INDEX idx_subfunctions_function_name ON subfunctions(function_name);
CREATE INDEX idx_subfunctions_deleted_at ON subfunctions(deleted_at);
CREATE INDEX idx_subfunctions_active ON subfunctions(id) WHERE deleted_at IS NULL;
CREATE INDEX idx_subfunctions_input_params ON subfunctions USING GIN (input_params);

-- ============================================================
-- RULES (Rule list metadata)
-- ============================================================
CREATE TABLE rules (
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

CREATE INDEX idx_rules_name ON rules(name);
CREATE INDEX idx_rules_slug ON rules(slug);
CREATE INDEX idx_rules_status ON rules(status);
CREATE INDEX idx_rules_deleted_at ON rules(deleted_at);
CREATE INDEX idx_rules_active ON rules(id) WHERE deleted_at IS NULL;

-- ============================================================
-- RULE FUNCTIONS (Rule implementation details)
-- ============================================================
CREATE TABLE rule_functions (
    id SERIAL PRIMARY KEY,
    rule_id INTEGER NOT NULL UNIQUE REFERENCES rules(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    return_type VARCHAR(100),
    input_params JSONB DEFAULT '[]'::jsonb, -- Array of input parameter objects
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_rule_functions_rule_id ON rule_functions(rule_id);
CREATE INDEX idx_rule_functions_deleted_at ON rule_functions(deleted_at);
CREATE INDEX idx_rule_functions_active ON rule_functions(id) WHERE deleted_at IS NULL;
CREATE INDEX idx_rule_functions_input_params ON rule_functions USING GIN (input_params);

-- ============================================================
-- RULE FUNCTION STEPS
-- ============================================================
CREATE TABLE rule_function_steps (
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

CREATE INDEX idx_rule_function_steps_rule_function_id ON rule_function_steps(rule_function_id);
CREATE INDEX idx_rule_function_steps_type ON rule_function_steps(type);
CREATE INDEX idx_rule_function_steps_sequence ON rule_function_steps(rule_function_id, sequence);
CREATE INDEX idx_rule_function_steps_subfunction_id ON rule_function_steps(subfunction_id);
CREATE INDEX idx_rule_function_steps_deleted_at ON rule_function_steps(deleted_at);
CREATE INDEX idx_rule_function_steps_active ON rule_function_steps(id, rule_function_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_rule_function_steps_subfunction_params ON rule_function_steps USING GIN (subfunction_params);
CREATE INDEX idx_rule_function_steps_conditions ON rule_function_steps USING GIN (conditions);
CREATE INDEX idx_rule_function_steps_output_data ON rule_function_steps USING GIN (output_data);

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

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subfunctions_updated_at
    BEFORE UPDATE ON subfunctions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rules_updated_at
    BEFORE UPDATE ON rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rule_functions_updated_at
    BEFORE UPDATE ON rule_functions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rule_function_steps_updated_at
    BEFORE UPDATE ON rule_function_steps
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
