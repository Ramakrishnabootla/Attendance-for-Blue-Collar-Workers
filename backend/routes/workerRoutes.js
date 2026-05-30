const express = require('express');
const router = express.Router();
const {
  getWorkers,
  createWorker,
  searchWorkers,
  getNextWorkerId,
  updateWorker,
  deactivateWorker,
  activateWorker,
  getWorkerByWorkerId,
  getContractors
} = require('../controllers/workerController');

// GET /api/workers - List all workers
router.get('/workers', getWorkers);

// GET /api/workers/search - Search workers by name, ID, or phone
router.get('/workers/search', searchWorkers);

// GET /api/workers/next-id - Get next worker ID
router.get('/workers/next-id', getNextWorkerId);

// GET /api/workers/profile/:worker_id - Get single worker details by worker_id
router.get('/workers/profile/:worker_id', getWorkerByWorkerId);

// GET /api/contractors - Dynamic list of registered contractors
router.get('/contractors', getContractors);

// POST /api/workers - Create new worker
router.post('/workers', createWorker);

// PUT /api/workers/:id - Update worker details
router.put('/workers/:id', updateWorker);

// POST /api/workers/:id/deactivate - Deactivate worker
router.post('/workers/:id/deactivate', deactivateWorker);

// POST /api/workers/:id/activate - Activate worker
router.post('/workers/:id/activate', activateWorker);

module.exports = router;
