-- This is a SQL script to create the calculations table in Supabase

-- Enable Row Level Security (RLS)
ALTER TABLE IF EXISTS calculations ENABLE ROW LEVEL SECURITY;

-- Create the calculations table if it doesn't exist
CREATE TABLE IF NOT EXISTS calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create an index on user_id for faster queries
CREATE INDEX IF NOT EXISTS calculations_user_id_idx ON calculations(user_id);

-- Create an index on created_at for faster sorting
CREATE INDEX IF NOT EXISTS calculations_created_at_idx ON calculations(created_at);

-- Create RLS policies to ensure users can only access their own data

-- Policy for SELECT operations
CREATE POLICY "Users can view their own calculations" 
ON calculations FOR SELECT 
USING (user_id = auth.uid());

-- Policy for INSERT operations
CREATE POLICY "Users can insert their own calculations" 
ON calculations FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Policy for DELETE operations
CREATE POLICY "Users can delete their own calculations" 
ON calculations FOR DELETE 
USING (user_id = auth.uid());

-- Policy for UPDATE operations
CREATE POLICY "Users can update their own calculations" 
ON calculations FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
