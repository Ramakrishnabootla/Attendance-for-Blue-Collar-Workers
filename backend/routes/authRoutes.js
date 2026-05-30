const express = require('express');
const router = express.Router();
const { login, workerLogin } = require('../controllers/authController');

// POST /api/login
router.post('/login', login);

// POST /api/worker-login
router.post('/worker-login', workerLogin);

module.exports = router;
