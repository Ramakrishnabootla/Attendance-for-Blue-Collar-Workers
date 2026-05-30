-- BlueTrack PostgreSQL Schema Updates (Gradious V2 Vetting)
-- Run this in your Supabase SQL Editor

-- 1. Add shift_type to attendance table
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS shift_type VARCHAR(50) DEFAULT 'General';

-- 2. Add contractor and PIN fields to workers table
ALTER TABLE workers ADD COLUMN IF NOT EXISTS contractor_id VARCHAR(50) DEFAULT 'C001';
ALTER TABLE workers ADD COLUMN IF NOT EXISTS contractor_name VARCHAR(100) DEFAULT 'General Contractors';
ALTER TABLE workers ADD COLUMN IF NOT EXISTS pin VARCHAR(10) DEFAULT '1234';

-- 3. Verify columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('workers', 'attendance') 
AND column_name IN ('shift_type', 'contractor_id', 'contractor_name', 'pin');

-- 4. Create notifications table for worker notifications
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  worker_id VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'check_in', 'check_out', 'profile_update'
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (worker_id) REFERENCES workers(worker_id) ON DELETE CASCADE
);

