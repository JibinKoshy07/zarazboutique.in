const express = require('express');
const { asyncHandler } = require('../utils/helpers');
const { validate, cartItemSchema, cartItemUpdateSchema } = require('../utils/validate');
const { requireUser } = require('../middleware/auth');
const cartService = require('../modules/cart/cart.service');

const router = express.Router();

router.use(requireUser);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await cartService.getCart(req.auth.id));
  })
);

router.post(
  '/items',
  asyncHandler(async (req, res) => {
    const payload = validate(cartItemSchema, req.body);
    res.status(201).json(await cartService.addItem(req.auth.id, payload));
  })
);

router.put(
  '/items/:itemId',
  asyncHandler(async (req, res) => {
    const payload = validate(cartItemUpdateSchema, req.body);
    res.json(await cartService.updateItem(req.auth.id, req.params.itemId, payload));
  })
);

router.delete(
  '/items/:itemId',
  asyncHandler(async (req, res) => {
    res.json(await cartService.removeItem(req.auth.id, req.params.itemId));
  })
);

router.delete(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await cartService.clearCart(req.auth.id));
  })
);

module.exports = router;
