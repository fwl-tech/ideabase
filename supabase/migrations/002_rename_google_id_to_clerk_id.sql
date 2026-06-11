-- Rename google_id to clerk_id to reflect actual auth provider (Clerk, not Google)
ALTER TABLE ideabase.users RENAME COLUMN google_id TO clerk_id;
