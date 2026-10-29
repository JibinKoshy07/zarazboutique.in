const express = require('express');
const { asyncHandler } = require('../utils/helpers');
const { validate, contactSchema } = require('../utils/validate');
const { authLimiter } = require('../middleware/rateLimit');
const { query } = require('../db/pool');

const router = express.Router();

router.post(
  '/',
  authLimiter,
  asyncHandler(async (req, res) => {
    const payload = validate(contactSchema, req.body);
    await query(
      `INSERT INTO contact_messages (name, email, phone, subject, message)
       VALUES ($1,$2,$3,$4,$5)`,
      [payload.name, payload.email, payload.phone || null, payload.subject || null, payload.message]
    );
    res.status(201).json({ received: true, message: 'Thank you for reaching out. We will reply shortly.' });
  })
);

module.exports = router;
