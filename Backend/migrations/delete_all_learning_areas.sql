-- ================================================================
-- Delete All Learning Areas Script
-- Run this in Supabase SQL Editor to delete all curriculum data
-- ================================================================

-- First, delete child records (competencies, sub_strands, strands)
-- This is required due to foreign key constraints

-- Delete all competencies
DELETE FROM competencies WHERE deleted_at IS NULL;
SELECT 'Deleted all competencies' AS status;

-- Delete all sub_strands
DELETE FROM sub_strands WHERE deleted_at IS NULL;
SELECT 'Deleted all sub_strands' AS status;

-- Delete all strands
DELETE FROM strands WHERE deleted_at IS NULL;
SELECT 'Deleted all strands' AS status;

-- Delete all learning areas
DELETE FROM learning_areas WHERE deleted_at IS NULL;
SELECT 'Deleted all learning_areas' AS status;

-- Verify deletion
SELECT COUNT(*) AS remaining_learning_areas FROM learning_areas;
SELECT COUNT(*) AS remaining_strands FROM strands;
SELECT COUNT(*) AS remaining_sub_strands FROM sub_strands;
SELECT COUNT(*) AS remaining_competencies FROM competencies;

