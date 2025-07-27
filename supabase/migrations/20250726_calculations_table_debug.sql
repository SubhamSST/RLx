-- Drop the existing table if needed (be careful with this in production!)
-- DROP TABLE IF EXISTS public.calculations;

-- Create calculations table with the correct structure
CREATE TABLE IF NOT EXISTS public.calculations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  calculator_type TEXT NOT NULL,
  description TEXT,
  calculation_data JSONB NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.calculations ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see only their own calculations
CREATE POLICY "Users can only see their own calculations" 
  ON public.calculations 
  FOR SELECT 
  USING (auth.uid()::text = user_id);

-- Create policy for users to insert their own calculations
CREATE POLICY "Users can insert their own calculations" 
  ON public.calculations 
  FOR INSERT 
  WITH CHECK (auth.uid()::text = user_id);

-- Create policy for users to delete their own calculations
CREATE POLICY "Users can delete their own calculations" 
  ON public.calculations 
  FOR DELETE 
  USING (auth.uid()::text = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS calculations_user_id_idx ON public.calculations(user_id);
CREATE INDEX IF NOT EXISTS calculations_created_at_idx ON public.calculations(created_at DESC);

-- For debug purposes, insert a test record
INSERT INTO public.calculations (
  user_id, 
  calculator_type, 
  description, 
  calculation_data, 
  result, 
  created_at
) VALUES (
  'user_2ZJDw5AaBvbM2Vb8X1lsKLkjgvo', -- Replace with your actual Clerk user ID
  'test_calculator',
  'Test Calculation',
  '{"test": true, "value": 1000}'::jsonb,
  '{"value": 1000}'::jsonb,
  now()
);
