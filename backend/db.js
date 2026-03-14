const { Pool } = require("pg");
const config = require("./config");

/**
 * PostgreSQL Connection Pool
 * Uses configuration from config.js which reads .env variables
 */
const pool = new Pool({
  user: config.database.user,
  host: config.database.host,
  database: config.database.database,
  password: config.database.password,
  port: config.database.port,
  max: config.database.pool.max,
  idleTimeoutMillis: config.database.pool.idleTimeoutMillis,
  connectionTimeoutMillis: config.database.pool.connectionTimeoutMillis
});

// Log connection info (without password)
pool.on('connect', () => {
  console.log(`✅ Database connected: ${config.database.user}@${config.database.host}:${config.database.port}/${config.database.database}`);
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

module.exports = pool;