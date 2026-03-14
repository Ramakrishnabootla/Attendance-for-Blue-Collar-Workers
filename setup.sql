-- BlueTrack Database Setup
-- Run this SQL file manually in MySQL to set up the database

-- Create database
CREATE DATABASE IF NOT EXISTS bluetrack_db;
USE bluetrack_db;

-- Create supervisors table
CREATE TABLE IF NOT EXISTS supervisors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  phone VARCHAR(20) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create workers table
CREATE TABLE IF NOT EXISTS workers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  worker_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  job_type ENUM('Construction', 'Factory', 'Delivery', 'Contract Labour', 'Daily Wage') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id INT PRIMARY KEY AUTO_INCREMENT,
  worker_id VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  check_in DATETIME,
  check_out DATETIME,
  status ENUM('Present', 'Absent') DEFAULT 'Absent',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (worker_id) REFERENCES workers(worker_id),
  UNIQUE KEY unique_attendance (worker_id, date)
);

-- Insert default supervisor
INSERT IGNORE INTO supervisors (phone, password, name)
VALUES ('9999999999', 'admin123', 'Admin Supervisor');

-- Insert dummy workers
INSERT INTO workers (worker_id, name, phone, job_type) VALUES
('W001', 'Rajesh Kumar', '9876543210', 'Construction'),
('W002', 'Priya Singh', '9876543211', 'Factory'),
('W003', 'Amit Patel', '9876543212', 'Delivery'),
('W004', 'Neha Sharma', '9876543213', 'Contract Labour'),
('W005', 'Vikram Gupta', '9876543214', 'Daily Wage'),
('W006', 'Pooja Desai', '9876543215', 'Construction'),
('W007', 'Rohit Singh', '9876543216', 'Factory'),
('W008', 'Divya Nair', '9876543217', 'Delivery');

-- Schema enhancements for v2 features
-- Add worker status and deactivation tracking
ALTER TABLE workers ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE workers ADD COLUMN deactivation_reason VARCHAR(255) DEFAULT NULL;
ALTER TABLE workers ADD COLUMN worker_id_sequence INT DEFAULT NULL;

-- Populate worker_id_sequence with existing id values
UPDATE workers SET worker_id_sequence = id WHERE id > 0 AND worker_id_sequence IS NULL;

-- Add attendance tracking enhancements
ALTER TABLE attendance ADD COLUMN absence_reason VARCHAR(255) DEFAULT NULL;
ALTER TABLE attendance ADD COLUMN time_spent_seconds INT DEFAULT NULL;

-- Verify setup
SELECT '✓ Supervisors' as table_name, COUNT(*) as count FROM supervisors;
SELECT '✓ Workers' as table_name, COUNT(*) as count FROM workers;
SELECT '✓ Attendance' as table_name, COUNT(*) as count FROM attendance;
