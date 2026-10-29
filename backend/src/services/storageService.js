const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const env = require('../config/env');
const { badRequest } = require('../utils/errors');

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']);

fs.mkdirSync(env.storage.uploadDir, { recursive: true });

const extensionFor = (file) => {
  const fromName = path.extname(file.originalname || '').toLowerCase();
  if (fromName && fromName.length <= 6) return fromName;
  return `.${(file.mimetype || 'image/jpeg').split('/')[1] || 'jpg'}`;
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, env.storage.uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    cb(null, `${unique}${extensionFor(file)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: env.storage.maxFileSizeMb * 1024 * 1024, files: 6 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(badRequest('Only JPEG, PNG, WebP, AVIF or GIF images are allowed'));
    }
    return cb(null, true);
  },
});

/**
 * Builds the publicly reachable URL for a stored file. The storage driver is
 * swappable (local disk today, S3/CDN later) without touching call sites.
 */
const publicUrlFor = (file) => {
  if (!file) return null;
  if (file.url) return file.url;
  if (env.storage.driver === 'local') {
    return `${env.apiPublicUrl}${env.storage.publicPath}/${path.basename(file.path || file.filename)}`;
  }
  throw badRequest(`Unsupported storage driver: ${env.storage.driver}`);
};

module.exports = { upload, publicUrlFor, ALLOWED_MIME };
