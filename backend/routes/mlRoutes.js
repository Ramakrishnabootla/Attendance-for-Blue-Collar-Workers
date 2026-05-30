/**
 * ML Routes
 * API endpoints for ML predictions
 */

const express = require('express');
const router = express.Router();
const mlController = require('../controllers/mlController');

/**
 * POST /api/ml/predict
 * Make prediction with raw worker data
 * Body: { worker_data: { is_late, absences_30d, attendance_rate, ... } }
 */
router.post('/predict', mlController.predictWorkerCategory);

/**
 * GET /api/ml/worker/:workerId/prediction
 * Get prediction for a specific worker from database
 * Params: workerId
 */
router.get('/worker/:workerId/prediction', mlController.getWorkerPrediction);

/**
 * POST /api/ml/batch-predict
 * Batch prediction for multiple workers
 * Body: { workers_data: [ { ... }, { ... } ] }
 */
router.post('/batch-predict', mlController.batchPrediction);

/**
 * GET /api/ml/predictions
 * Get batch predictions for all active workers
 */
router.get('/predictions', mlController.getAllWorkerPredictions);

module.exports = router;
