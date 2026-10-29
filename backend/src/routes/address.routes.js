const express = require('express');
const { asyncHandler } = require('../utils/helpers');
const { validate, addressSchema } = require('../utils/validate');
const { requireUser } = require('../middleware/auth');
const addressService = require('../modules/addresses/address.service');

const router = express.Router();

router.use(requireUser);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json({ addresses: await addressService.listAddresses(req.auth.id) });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const payload = validate(addressSchema, req.body);
    res.status(201).json({ address: await addressService.createAddress(req.auth.id, payload) });
  })
);

router.put(
  '/:addressId',
  asyncHandler(async (req, res) => {
    const payload = validate(addressSchema, req.body);
    res.json({ address: await addressService.updateAddress(req.auth.id, req.params.addressId, payload) });
  })
);

router.delete(
  '/:addressId',
  asyncHandler(async (req, res) => {
    res.json(await addressService.deleteAddress(req.auth.id, req.params.addressId));
  })
);

router.post(
  '/:addressId/default',
  asyncHandler(async (req, res) => {
    res.json({ address: await addressService.setDefaultAddress(req.auth.id, req.params.addressId) });
  })
);

module.exports = router;
