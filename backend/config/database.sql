-- Run this script in MySQL to set up the database

CREATE DATABASE IF NOT EXISTS staff_permission_db;
USE staff_permission_db;

-- Users table (staff, head_of_department, head_of_college)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('staff', 'head_of_department', 'head_of_college') DEFAULT 'staff',
  department VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT NOT NULL,
  reason TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  type ENUM('annual_leave', 'sick_leave', 'emergency_leave', 'other') DEFAULT 'other',
  
  -- HOD review
  hod_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  hod_comment TEXT,
  hod_reviewed_by INT,
  hod_reviewed_at TIMESTAMP NULL,

  -- HOC review
  hoc_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  hoc_comment TEXT,
  hoc_reviewed_by INT,
  hoc_reviewed_at TIMESTAMP NULL,

  -- Overall status
  final_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (hod_reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (hoc_reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Insert default admin accounts
INSERT IGNORE INTO users (full_name, email, password, role, department) VALUES
('Head of Department', 'hod@college.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'head_of_department', 'General'),
('Head of College', 'hoc@college.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'head_of_college', 'Administration');

-- Default password for above accounts is: password
-- Staff can register themselves
