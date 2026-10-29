const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Local development reads backend/.env, falling back to a repo-root .env.
// In Docker the values arrive as real environment variables, so this is a no-op.
[path.resolve(__dirname, '../../.env'), path.resolve(__dirname, '../../../.env')].forEach((envPath) => {
  if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
});

const bool = (value, fallback = false) => {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

const int = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const list = (value, fallback = []) =>
  value
    ? String(value)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : fallback;

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: int(process.env.PORT, 4000),
  isProduction: (process.env.NODE_ENV || 'development') === 'production',

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: int(process.env.DB_PORT, 5432),
    name: process.env.DB_NAME || 'zaraz',
    user: process.env.DB_USER || 'zaraz_user',
    password: process.env.DB_PASSWORD || 'zaraz_password',
    // Small pools keep the API and the one-shot migration container from
    // exhausting PostgreSQL's default 100 connection slots.
    poolMax: int(process.env.DB_POOL_MAX, 10),
    ssl: bool(process.env.DB_SSL, false),
  },

  jwt: {
    secret: process.env.JWT_SECRET || '',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: 'zaraz-boutique',
  },

  cors: {
    origins: list(process.env.ALLOWED_ORIGINS, ['http://localhost:3000', 'http://127.0.0.1:3000']),
  },

  storage: {
    driver: process.env.STORAGE_DRIVER || 'local',
    uploadDir: process.env.UPLOAD_DIR || path.resolve(__dirname, '../../uploads'),
    publicPath: '/uploads',
    maxFileSizeMb: int(process.env.UPLOAD_MAX_MB, 5),
  },

  apiPublicUrl: process.env.API_PUBLIC_URL || '',

  seed: {
    enabled: bool(process.env.SEED_ON_START, true),
    adminEmail: process.env.ADMIN_EMAIL || 'admin@zarazboutique.in',
    adminPassword: process.env.ADMIN_PASSWORD || 'Admin@12345',
    adminName: process.env.ADMIN_NAME || 'Store Admin',
    demoCustomerPassword: process.env.DEMO_CUSTOMER_PASSWORD || 'Customer@123',
  },

  payments: {
    // Only 'manual' (offline) is implemented. A real gateway plugs in later
    // by registering another provider in src/services/payment.
    provider: process.env.PAYMENT_PROVIDER || 'manual',
    currency: process.env.PAYMENT_CURRENCY || 'INR',
    codEnabled: bool(process.env.PAYMENT_COD_ENABLED, true),
    upiEnabled: bool(process.env.PAYMENT_UPI_ENABLED, true),
    cardEnabled: bool(process.env.PAYMENT_CARD_ENABLED, true),
    upiVpa: process.env.PAYMENT_UPI_VPA || 'zarazboutique@upi',
  },

  contact: {
    recipient: process.env.CONTACT_FORM_EMAIL || 'support@zarazboutique.in',
  },

  rateLimit: {
    windowMs: int(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    max: int(process.env.RATE_LIMIT_MAX, 300),
    authMax: int(process.env.AUTH_RATE_LIMIT_MAX, 30),
  },

  shipping: {
    flatRate: Number.parseFloat(process.env.SHIPPING_FLAT_RATE || '0'),
    freeAbove: Number.parseFloat(process.env.SHIPPING_FREE_ABOVE || '0'),
  },
};

// Fail fast in production instead of silently signing tokens with a weak secret.
if (env.isProduction && !env.jwt.secret) {
  throw new Error('JWT_SECRET must be set when NODE_ENV=production');
}
if (!env.jwt.secret) {
  env.jwt.secret = 'dev-only-insecure-secret-change-me';
}

module.exports = env;
