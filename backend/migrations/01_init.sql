-- BlueTrack MySQL Schema (for Railway Database)

-- Create supervisors table
CREATE TABLE IF NOT EXISTS supervisors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(20) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create workers table
CREATE TABLE IF NOT EXISTS workers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  worker_id VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  job_type VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  deactivation_reason VARCHAR(255),
  worker_id_sequence INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  worker_id VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  check_in TIME,
  check_out TIME,
  status VARCHAR(50),
  absence_reason VARCHAR(255),
  time_spent_seconds INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (worker_id) REFERENCES workers(worker_id),
  UNIQUE KEY unique_worker_date (worker_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert demo supervisor
INSERT INTO supervisors (phone, password, name)
VALUES ('9999999999', 'admin123', 'Demo Supervisor')
ON DUPLICATE KEY UPDATE name = 'Demo Supervisor';

-- Insert demo workers
INSERT INTO workers (worker_id, name, phone, job_type, is_active) VALUES
('W001', 'Raj Kumar', '9876543210', 'Construction', TRUE),
('W002', 'Priya Singh', '9876543211', 'Factory', TRUE),
('W003', 'Vikram Patel', '9876543212', 'Delivery', TRUE),
('W004', 'Anita Sharma', '9876543213', 'Construction', TRUE),
('W005', 'Rohan Gupta', '9876543214', 'Contract Labour', TRUE),
('W006', 'Neha Verma', '9876543215', 'Daily Wage', TRUE),
('W007', 'Amit Kumar', '9876543216', 'Factory', TRUE),
('W008', 'Pooja Desai', '9876543217', 'Delivery', TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Create indexes for performance
CREATE INDEX idx_workers_job_type ON workers(job_type);
CREATE INDEX idx_attendance_worker_date ON attendance(worker_id, date);
CREATE INDEX idx_attendance_date ON attendance(date);
