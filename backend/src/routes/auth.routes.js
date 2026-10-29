const express = require('express');
const { asyncHandler } = require('../utils/helpers');
const { validate, registerSchema, loginSchema } = require('../utils/validate');
const { authLimiter } = require('../middleware/rateLimit');
const authService = require('../modules/auth/auth.service');

const router = express.Router();

router.post(
  '/register',
  authLimiter,
  asyncHandler(async (req, res) => {
    const payload = validate(registerSchema, req.body);
    const result = await authService.registerCustomer(payload);
    res.status(201).json(result);
  })
);

router.post(
  '/login',
  authLimiter,
  asyncHandler(async (req, res) => {
    const payload = validate(loginSchema, req.body);
    const result = await authService.loginCustomer(payload);
    res.json(result);
  })
);

module.exports = router;
