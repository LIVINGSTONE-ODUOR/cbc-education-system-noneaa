-- Migration: Make tsc_number optional in teachers table
-- Run this in Supabase Dashboard > SQL Editor

-- Remove NOT NULL constraint (keeps any existing CHECK if present)
ALTER TABLE teachers 
ALTER COLUMN tsc_number DROP NOT NULL;

-- Optional: Add default NULL explicitly
-- ALTER TABLE teachers 
-- ALTER COLUMN tsc_number SET DEFAULT NULL;

-- Verify:
-- SELECT column_name, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'teachers' AND column_name = 'tsc_number';

-- Expected: is_nullable = 'YES'

