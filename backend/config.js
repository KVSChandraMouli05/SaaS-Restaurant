/**
 * Configuration Management
 * Loads and validates environment variables
 */

require('dotenv').config();

const config = {
  // Server Configuration
  server: {
    port: parseInt(process.env.PORT, 10) || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    apiUrl: process.env.API_URL || 'http://localhost:5000'
  },

  // Database Configuration
  database: {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'Restaurant_Saas',
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX, 10) || 20,
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT, 10) || 30000,
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT, 10) || 2000
    }
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-this',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-this',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100, // limit each IP to 100 requests per windowMs
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined'
  },

  // Security
  security: {
    requireHttps: process.env.REQUIRE_HTTPS === 'true',
    trustProxy: process.env.TRUST_PROXY === 'true',
    enableHsts: process.env.ENABLE_HSTS !== 'false'
  }
};

/**
 * Validate critical configuration on startup
 */
const validateConfig = () => {
  const requiredVars = ['DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];

  if (config.server.nodeEnv === 'production') {
    requiredVars.push('JWT_SECRET', 'DB_PASSWORD');
  }

  const missing = requiredVars.filter(varName => {
    return !process.env[varName];
  });

  if (missing.length > 0) {
    console.error(`\n❌ Missing required environment variables: ${missing.join(', ')}`);
    if (config.server.nodeEnv === 'production') {
      process.exit(1);
    }
  }

  if (config.jwt.secret === 'your-secret-key-change-this' && config.server.nodeEnv === 'production') {
    console.error('\n❌ CRITICAL: JWT_SECRET not configured! Change in .env file.');
    process.exit(1);
  }
};

// Validate on load
validateConfig();

module.exports = config;
