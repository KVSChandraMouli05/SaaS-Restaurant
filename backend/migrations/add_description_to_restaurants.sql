-- Migration: Add description column to restaurants table
-- This adds the missing description column that's referenced in the codebase

ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS description TEXT;

-- If needed, you can add a default value for existing rows
-- UPDATE restaurants SET description = '' WHERE description IS NULL;
