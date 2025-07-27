# Supabase Setup for Calculations History

This document provides instructions for setting up the Supabase database to store calculation history for users.

## Table Structure

The application uses a `calculations` table with the following structure:

```sql
CREATE TABLE calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Setup Instructions

1. Go to your Supabase project dashboard (https://app.supabase.io)
2. Navigate to the SQL Editor
3. Execute the SQL script in `migrations/20250726_create_calculations_table.sql`

Alternatively, you can set up the table manually:

1. Go to the "Table Editor"
2. Click "Create a new table"
3. Name it "calculations"
4. Add the following columns:
   - id (UUID, Primary Key, Default: gen_random_uuid())
   - user_id (Text, Not Null)
   - type (Text, Not Null)
   - description (Text)
   - data (JSONB, Not Null)
   - created_at (Timestamp with Timezone, Not Null, Default: NOW())
5. Enable Row Level Security (RLS)
6. Create the following policies:
   - "Users can view their own calculations" (SELECT) - `user_id = auth.uid()`
   - "Users can insert their own calculations" (INSERT) - `user_id = auth.uid()`
   - "Users can delete their own calculations" (DELETE) - `user_id = auth.uid()`
   - "Users can update their own calculations" (UPDATE) - `user_id = auth.uid()`

## Integration with Clerk Authentication

Since this project uses Clerk for authentication, you'll need to connect your user IDs:

1. Ensure your Clerk user ID is passed to the Supabase client
2. When saving calculations, include the Clerk user ID in the `user_id` field
3. Row-level security is enforced through custom policies that check the user_id

## Environment Variables

Ensure these variables are set in your `.env` file:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
```

## Testing the Setup

After setting up the table and policies, you can test the functionality by:

1. Signing in with Clerk
2. Using one of the calculators in the app
3. Visiting the History page to see your saved calculations
