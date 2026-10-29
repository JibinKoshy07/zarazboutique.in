const express = require('express');
const { asyncHandler } = require('../utils/helpers');
const { validate, profileSchema, passwordChangeSchema } = require('../utils/validate');
const { requireUser } = require('../middleware/auth');
const userService = require('../modules/users/user.service');

const router = express.Router();

router.use(requireUser);

router.get(
  '/me',
  asyncHandler(async (req, res) => {
    res.json({ user: await userService.getProfile(req.auth.id) });
  })
);

router.put(
  '/me',
  asyncHandler(async (req, res) => {
    const payload = validate(profileSchema, req.body);
    res.json({ user: await userService.updateProfile(req.auth.id, payload) });
  })
);

router.put(
  '/me/password',
  asyncHandler(async (req, res) => {
    const payload = validate(passwordChangeSchema, req.body);
    res.json(await userService.changePassword(req.auth.id, payload));
  })
);

module.exports = router;
