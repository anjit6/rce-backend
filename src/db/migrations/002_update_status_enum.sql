-- Migration: Update rule_status enum to use WIP, TEST, PENDING, PROD
-- This migration updates the status values in the database

-- Step 1: Create a temporary new enum type
CREATE TYPE rule_status_new AS ENUM ('WIP', 'TEST', 'PENDING', 'PROD');

-- Step 2: Update existing data to map to new values
-- ACTIVE -> PROD, ARCHIVED -> TEST, WIP -> WIP
UPDATE rules
SET status = CASE
    WHEN status = 'ACTIVE' THEN 'PROD'
    WHEN status = 'ARCHIVED' THEN 'TEST'
    ELSE status::text
END::rule_status_new::text::rule_status;

-- Step 3: Alter the column to use the new enum type
ALTER TABLE rules
    ALTER COLUMN status TYPE rule_status_new
    USING (
        CASE status::text
            WHEN 'WIP' THEN 'WIP'
            WHEN 'ACTIVE' THEN 'PROD'
            WHEN 'ARCHIVED' THEN 'TEST'
        END::rule_status_new
    );

-- Step 4: Drop the old enum and rename the new one
DROP TYPE rule_status;
ALTER TYPE rule_status_new RENAME TO rule_status;

-- Step 5: Update default value
ALTER TABLE rules ALTER COLUMN status SET DEFAULT 'WIP';
