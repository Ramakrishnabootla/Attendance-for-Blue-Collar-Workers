require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import routes
const authRoutes = require('./routes/authRoutes');
const workerRoutes = require('./routes/workerRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', authRoutes);
app.use('/api', workerRoutes);
app.use('/api', attendanceRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend running ✓' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 BlueTrack Backend running on http://localhost:${PORT}`);
  console.log('📝 Endpoints ready:');
  console.log('   POST   /api/login');
  console.log('   GET    /api/workers');
  console.log('   POST   /api/workers');
  console.log('   GET    /api/attendance/today');
  console.log('   POST   /api/attendance/mark');
  console.log('   POST   /api/attendance/bulk');
  console.log('\n');
});
