-- Fix the unique constraint to allow multiple terms per year (Term 1, Term 2, Term 3)
-- Drop the old constraint that only allows one term per year
ALTER TABLE academic_years DROP CONSTRAINT IF EXISTS academic_years_school_year_unique;

-- Add new constraint that allows multiple terms per year but prevents duplicate term names
ALTER TABLE academic_years ADD CONSTRAINT academic_years_school_year_name_unique 
    UNIQUE (school_id, year, name);
