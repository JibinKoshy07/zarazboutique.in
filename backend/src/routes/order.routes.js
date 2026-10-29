const express = require('express');
const { asyncHandler } = require('../utils/helpers');
const { validate, checkoutSchema } = require('../utils/validate');
const { requireUser } = require('../middleware/auth');
const orderService = require('../modules/orders/order.service');

const router = express.Router();

router.use(requireUser);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const orders = await orderService.listUserOrders(req.auth.id, { status: req.query.status });
    res.json({ orders });
  })
);

router.get(
  '/:orderId',
  asyncHandler(async (req, res) => {
    res.json({ order: await orderService.getUserOrder(req.auth.id, req.params.orderId) });
  })
);

/**
 * Checkout. The user id comes from the verified token and every price is
 * recomputed server-side from locked product rows, so a tampered client payload
 * cannot change what is charged.
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const payload = validate(checkoutSchema, req.body);
    const result = await orderService.placeOrder(req.auth.id, payload);
    res.status(201).json(result);
  })
);

router.post(
  '/:orderId/cancel',
  asyncHandler(async (req, res) => {
    res.json(await orderService.cancelUserOrder(req.auth.id, req.params.orderId));
  })
);

module.exports = router;
