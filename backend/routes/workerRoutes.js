const express = require('express');
const router = express.Router();
const { getWorkers, createWorker } = require('../controllers/workerController');

// GET /api/workers
router.get('/workers', getWorkers);

// POST /api/workers
router.post('/workers', createWorker);

module.exports = router;
