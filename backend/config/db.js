const mysql = require('mysql2/promise');

// Read credentials from .env
const dbPassword = process.env.DB_PASSWORD || '';
const dbUser = process.env.DB_USER || 'root';

// Database connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: dbUser,
  password: dbPassword,
  database: 'bluetrack_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log(`📊 Connected to MySQL as: ${dbUser}`);

module.exports = { pool };
