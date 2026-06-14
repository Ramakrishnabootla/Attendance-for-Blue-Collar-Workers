-- 👷 AI-Enhanced Attendance Management System - Complete Database Schema (PostgreSQL/Supabase)

-- 1. BASE TABLES

-- Create supervisors table
CREATE TABLE IF NOT EXISTS supervisors (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create workers table
CREATE TABLE IF NOT EXISTS workers (
  id SERIAL PRIMARY KEY,
  worker_id VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  job_type VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  deactivation_reason VARCHAR(255),
  worker_id_sequence INT,
  contractor_id VARCHAR(50) DEFAULT 'C001',
  contractor_name VARCHAR(100) DEFAULT 'General Contractors',
  pin VARCHAR(10) DEFAULT '1234',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  worker_id VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  check_in TIME,
  check_out TIME,
  status VARCHAR(50),
  absence_reason VARCHAR(255),
  time_spent_seconds INT,
  shift_type VARCHAR(50) DEFAULT 'General',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (worker_id) REFERENCES workers(worker_id) ON DELETE CASCADE,
  UNIQUE (worker_id, date)
);

-- --------------------------------------------------------
-- 2. NOTIFICATIONS & ML PREDICTIONS
-- --------------------------------------------------------

-- Create notifications table for worker notifications
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  worker_id VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'check_in', 'check_out', 'profile_update'
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (worker_id) REFERENCES workers(worker_id) ON DELETE CASCADE
);

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

-- --------------------------------------------------------
-- 3. INDEXES
-- --------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_workers_job_type ON workers(job_type);
CREATE INDEX IF NOT EXISTS idx_attendance_worker_date ON attendance(worker_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_worker_id ON ml_predictions(worker_id);

-- --------------------------------------------------------
-- 4. DUMMY / SEED DATA
-- --------------------------------------------------------

-- Insert demo supervisor
INSERT INTO supervisors (phone, password, name)
VALUES ('9999999999', 'admin123', 'Demo Supervisor')
ON CONFLICT (phone) DO UPDATE SET name = 'Demo Supervisor';

-- Insert demo workers
INSERT INTO workers (worker_id, name, phone, job_type, is_active, worker_id_sequence, contractor_id, contractor_name, pin) VALUES
('W001', 'Raj Kumar', '9876543210', 'Construction', TRUE, 1, 'C001', 'BuildRight Corp', '1234'),
('W002', 'Priya Singh', '9876543211', 'Factory', TRUE, 2, 'C002', 'TechMfg Ltd', '1234'),
('W003', 'Vikram Patel', '9876543212', 'Delivery', TRUE, 3, 'C001', 'BuildRight Corp', '1234'),
('W004', 'Anita Sharma', '9876543213', 'Construction', TRUE, 4, 'C003', 'Apex Builders', '1234'),
('W005', 'Rohan Gupta', '9876543214', 'Contract Labour', TRUE, 5, 'C002', 'TechMfg Ltd', '1234'),
('W006', 'Neha Verma', '9876543215', 'Daily Wage', TRUE, 6, 'C003', 'Apex Builders', '1234'),
('W007', 'Amit Kumar', '9876543216', 'Factory', TRUE, 7, 'C001', 'BuildRight Corp', '1234'),
('W008', 'Pooja Desai', '9876543217', 'Delivery', TRUE, 8, 'C002', 'TechMfg Ltd', '1234')
ON CONFLICT (worker_id) DO UPDATE SET 
  name = EXCLUDED.name,
  worker_id_sequence = EXCLUDED.worker_id_sequence,
  contractor_id = EXCLUDED.contractor_id,
  contractor_name = EXCLUDED.contractor_name,
  pin = EXCLUDED.pin;

-- --------------------------------------------------------
-- 5. VERIFICATION
-- --------------------------------------------------------
SELECT 'Database schema successfully initialized!' as status;