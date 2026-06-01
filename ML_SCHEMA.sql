-- BlueTrack Machine Learning Predictions Cache Schema
-- Copy and paste this script into your Supabase SQL Editor and click 'Run'

-- Create ml_predictions table to store pre-calculated behavioral scorings
CREATE TABLE IF NOT EXISTS ml_predictions (
  id SERIAL PRIMARY KEY,
  worker_id VARCHAR(50) NOT NULL UNIQUE REFERENCES workers(worker_id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  confidence FLOAT NOT NULL,
  probabilities JSONB NOT NULL,
  risk_level VARCHAR(50) NOT NULL,
  recommendations JSONB NOT NULL,
  days_recorded INT NOT NULL,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for performance lookups
CREATE INDEX IF NOT EXISTS idx_ml_predictions_worker_id ON ml_predictions(worker_id);

-- Disable Row Level Security (RLS) so that the Express backend client can read/write predictions
ALTER TABLE ml_predictions DISABLE ROW LEVEL SECURITY;

-- Fallback policy in case RLS remains active in some environments
DROP POLICY IF EXISTS "Allow all public operations on ml_predictions" ON ml_predictions;
CREATE POLICY "Allow all public operations on ml_predictions" 
ON ml_predictions 
FOR ALL 
TO public 
USING (true) 
WITH CHECK (true);

-- Verify setup
SELECT '✓ ml_predictions table successfully created & RLS disabled' as status;
