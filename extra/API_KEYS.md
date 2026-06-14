# Backend API Endpoints Overview

This document lists all the REST API endpoints available in the backend, along with a brief description of their usage. All endpoints are prefixed with `/api`.

## Authentication (`/api/login`, `/api/worker-login`)
- `POST /api/login` - Authenticates a supervisor using phone and password.
- `POST /api/worker-login` - Authenticates a worker using their worker ID, phone, and 4-digit PIN.

## Worker Management (`/api/workers`)
- `GET /api/workers` - Retrieves a list of all workers (supports `include_inactive=true` query).
- `GET /api/workers/search` - Searches active workers by name, ID, or phone number.
- `GET /api/workers/next-id` - Retrieves the next available auto-generated worker ID (e.g., W005).
- `GET /api/workers/profile/:worker_id` - Retrieves detailed profile information for a single worker.
- `GET /api/contractors` - Retrieves a unique, dynamic list of registered contractors.
- `POST /api/workers` - Creates a new worker profile in the system.
- `PUT /api/workers/:id` - Updates an existing worker's details.
- `POST /api/workers/:id/deactivate` - Deactivates a worker, preventing them from logging in.
- `POST /api/workers/:id/activate` - Reactivates a previously deactivated worker.

## Attendance Management (`/api/attendance`)
- `GET /api/attendance/today` - Retrieves all attendance records marked for the current day.
- `GET /api/attendance/summary/today` - Retrieves high-level attendance summary stats (e.g. total present/absent) for today.
- `GET /api/attendance/history` - Retrieves the global attendance log with advanced filtering options.
- `GET /api/attendance/date-range` - Retrieves attendance logs spanning a specific date range.
- `GET /api/attendance/statistics` - Retrieves aggregated attendance statistics over a given number of days.
- `GET /api/workers/:worker_id/attendance` - Retrieves the personal attendance history for a specific worker.
- `GET /api/workers/:worker_id/notifications` - Retrieves unread notifications for a specific worker.
- `POST /api/workers/:worker_id/notifications/dismiss` - Dismisses all unread notifications for a specific worker.
- `POST /api/attendance/mark` - Marks or updates a single attendance record (Check-In/Check-Out).
- `POST /api/attendance/bulk` - Bulk marks or updates multiple attendance records simultaneously.

## Machine Learning Predictions (`/api/ml`)
- `POST /api/ml/predict` - Runs an ML prediction model on a provided raw worker data payload.
- `GET /api/ml/worker/:workerId/prediction` - Retrieves the cached Random Forest ML prediction (risk level, category) for a specific worker.
- `POST /api/ml/batch-predict` - Runs batch ML predictions for an array of multiple workers using a raw payload.
- `GET /api/ml/predictions` - Retrieves all cached batch predictions for the entire active workforce.
- `POST /api/ml/predictions/generate` - Supervisor action that explicitly triggers fresh ML inferences and saves the results to the database cache.

## Generative AI Insights (`/api/ai`)
- `POST /api/ai/generate-insights` - Generates AI text insights based on an arbitrary attendance data payload.
- `GET /api/ai/contractor/:contractorId/insights` - Generates and retrieves concise AI insights tailored for a specific contractor's workforce.
- `GET /api/ai/worker/:workerId/insights` - Generates and retrieves a 2-line, highly concise personal AI performance insight for a specific worker.
