/**
 * AI Routes
 * API endpoints for generative AI insights
 */

const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

/**
 * POST /api/ai/generate-insights
 * Generate AI insights for attendance data
 * Body: { period: 'daily|weekly|monthly', contractor_id, worker_ids?: [...] }
 */
router.post('/generate-insights', aiController.generateInsights);

/**
 * GET /api/ai/contractor/:contractorId/insights
 * Get AI insights for a specific contractor
 * Query params: period (default: weekly)
 */
router.get('/contractor/:contractorId/insights', aiController.getContractorInsights);

/**
 * GET /api/ai/worker/:workerId/insights
 * Get AI insights for a specific worker
 * Query params: period (default: monthly)
 */
router.get('/worker/:workerId/insights', aiController.getWorkerInsights);

module.exports = router;
