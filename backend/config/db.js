const mysql = require('mysql2/promise');
require('dotenv').config();

// Read credentials from .env
const dbPassword = process.env.DB_PASSWORD || '';
const dbUser = process.env.DB_USER || 'root';
const dbHost = process.env.DB_HOST || 'localhost';
const dbName = process.env.DB_NAME || 'bluetrack_db';

// Database connection pool
const pool = mysql.createPool({
  host: dbHost,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.on('error', (err) => {
  console.error('Database error:', err);
});

console.log(`📊 Connected to MySQL as: ${dbUser}@${dbHost} (${dbName})`);

module.exports = { pool };
