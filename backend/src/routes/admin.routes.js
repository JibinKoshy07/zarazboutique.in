const express = require('express');
const { asyncHandler, paginate } = require('../utils/helpers');
const {
  validate,
  loginSchema,
  categorySchema,
  productSchema,
  orderStatusSchema,
  paymentStatusSchema,
} = require('../utils/validate');
const { requireAdmin, verifyToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const { upload, publicUrlFor } = require('../services/storageService');
const { notFound } = require('../utils/errors');
const authService = require('../modules/auth/auth.service');
const adminService = require('../modules/admin/admin.service');
const categoryService = require('../modules/categories/category.service');
const productService = require('../modules/products/product.service');

const router = express.Router();

router.post(
  '/login',
  authLimiter,
  asyncHandler(async (req, res) => {
    const payload = validate(loginSchema, req.body);
    const result = await authService.loginAdmin(payload);
    res.json({ ...result, isAdmin: true });
  })
);

// Everything past this point requires a valid admin token.
router.use(requireAdmin);

router.get(
  '/me',
  asyncHandler(async (req, res) => {
    res.json({ admin: req.auth });
  })
);

/** Verifies a token without requiring it, so the admin UI can restore sessions. */
router.get(
  '/session',
  asyncHandler(async (req, res) => {
    const header = req.headers.authorization || '';
    const token = header.split(' ')[1];
    if (!token) throw notFound('No session');
    const decoded = verifyToken(token);
    res.json({ admin: { id: decoded.sub, email: decoded.email, name: decoded.name, role: decoded.role } });
  })
);

router.get(
  '/dashboard',
  asyncHandler(async (_req, res) => {
    res.json(await adminService.getDashboard());
  })
);

/* ------------------------------- categories ------------------------------ */

router.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    res.json({ categories: await categoryService.listAllCategories({ includeInactive: true }) });
  })
);

router.post(
  '/categories',
  asyncHandler(async (req, res) => {
    const payload = validate(categorySchema, req.body);
    res.status(201).json({ category: await categoryService.createCategory(payload) });
  })
);

router.put(
  '/categories/:categoryId',
  asyncHandler(async (req, res) => {
    const payload = validate(categorySchema, req.body);
    res.json({ category: await categoryService.updateCategory(req.params.categoryId, payload) });
  })
);

router.delete(
  '/categories/:categoryId',
  asyncHandler(async (req, res) => {
    res.json(await categoryService.deleteCategory(req.params.categoryId));
  })
);

/* -------------------------------- products ------------------------------- */

router.get(
  '/products',
  asyncHandler(async (req, res) => {
    const { page, limit, offset } = paginate({ ...req.query, limit: req.query.limit || 20 });
    const filters = {
      categoryId: req.query.category ? Number.parseInt(req.query.category, 10) : undefined,
      search: req.query.q ? String(req.query.q).trim().slice(0, 100) : undefined,
      sort: req.query.sort || 'newest',
      includeInactive: true,
      limit,
      offset,
    };
    const [products, total] = await Promise.all([
      productService.listProducts(filters),
      productService.countProducts(filters),
    ]);
    res.json({ products, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } });
  })
);

router.get(
  '/products/:productId',
  asyncHandler(async (req, res) => {
    const product = await productService.getProduct(req.params.productId, { includeInactive: true });
    if (!product) throw notFound('Product not found');
    res.json({ product });
  })
);

router.post(
  '/products',
  asyncHandler(async (req, res) => {
    const payload = validate(productSchema, req.body);
    res.status(201).json({ product: await adminService.createProduct(payload) });
  })
);

router.put(
  '/products/:productId',
  asyncHandler(async (req, res) => {
    const payload = validate(productSchema, req.body);
    res.json({ product: await adminService.updateProduct(req.params.productId, payload) });
  })
);

router.delete(
  '/products/:productId',
  asyncHandler(async (req, res) => {
    res.json(await adminService.deleteProduct(req.params.productId));
  })
);

router.patch(
  '/products/:productId/stock',
  asyncHandler(async (req, res) => {
    const { stock, delta } = req.body;
    res.json(
      await adminService.adjustStock(req.params.productId, {
        stock: stock === undefined ? undefined : Number(stock),
        delta: delta === undefined ? undefined : Number(delta),
      })
    );
  })
);

/* ------------------------------ image upload ----------------------------- */

router.post(
  '/uploads',
  upload.array('images', 6),
  asyncHandler(async (req, res) => {
    const urls = (req.files || []).map((file) => publicUrlFor(file));
    res.status(201).json({ urls, url: urls[0] || null });
  })
);

/* --------------------------------- orders -------------------------------- */

router.get(
  '/orders',
  asyncHandler(async (req, res) => {
    const { page, limit } = paginate({ ...req.query, limit: req.query.limit || 20 });
    res.json(
      await adminService.listOrders({
        q: req.query.q,
        status: req.query.status,
        paymentStatus: req.query.paymentStatus,
        from: req.query.from,
        to: req.query.to,
        page,
        limit,
      })
    );
  })
);

router.get(
  '/orders/:orderId',
  asyncHandler(async (req, res) => {
    res.json({ order: await adminService.getOrder(req.params.orderId) });
  })
);

router.put(
  '/orders/:orderId/status',
  asyncHandler(async (req, res) => {
    const payload = validate(orderStatusSchema, req.body);
    res.json({ order: await adminService.updateOrderStatus(req.params.orderId, payload, `admin:${req.auth.id}`) });
  })
);

router.put(
  '/orders/:orderId/payment-status',
  asyncHandler(async (req, res) => {
    const payload = validate(paymentStatusSchema, req.body);
    res.json({ order: await adminService.updatePaymentStatus(req.params.orderId, payload.payment_status) });
  })
);

/* ------------------------------- customers ------------------------------- */

router.get(
  '/customers',
  asyncHandler(async (req, res) => {
    const { page, limit } = paginate({ ...req.query, limit: req.query.limit || 20 });
    res.json(await adminService.listCustomers({ q: req.query.q, page, limit }));
  })
);

router.get(
  '/customers/:customerId',
  asyncHandler(async (req, res) => {
    res.json(await adminService.getCustomer(req.params.customerId));
  })
);

router.patch(
  '/customers/:customerId/status',
  asyncHandler(async (req, res) => {
    res.json({ customer: await adminService.setCustomerActive(req.params.customerId, req.body.isActive !== false) });
  })
);

/* ------------------------------- inventory ------------------------------- */

router.get(
  '/inventory',
  asyncHandler(async (req, res) => {
    res.json(
      await adminService.getInventory({
        q: req.query.q,
        lowOnly: req.query.low === 'true',
        outOfStock: req.query.out === 'true',
      })
    );
  })
);

/* -------------------------------- messages ------------------------------- */

router.get(
  '/messages',
  asyncHandler(async (_req, res) => {
    res.json({ messages: await adminService.listContactMessages() });
  })
);

router.patch(
  '/messages/:messageId',
  asyncHandler(async (req, res) => {
    res.json({ message: await adminService.markContactRead(req.params.messageId, req.body.isRead !== false) });
  })
);

module.exports = router;
