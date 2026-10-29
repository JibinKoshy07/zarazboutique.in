const express = require('express');
const { asyncHandler, paginate } = require('../utils/helpers');
const { notFound } = require('../utils/errors');
const productService = require('../modules/products/product.service');
const categoryService = require('../modules/categories/category.service');
const { listMethods } = require('../services/payment');

const router = express.Router();

router.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    res.json({ categories: await categoryService.listCategories() });
  })
);

router.get(
  '/categories/:identifier',
  asyncHandler(async (req, res) => {
    const category = await categoryService.getCategoryBySlugOrId(req.params.identifier);
    if (!category) throw notFound('Category not found');
    res.json({ category });
  })
);

/**
 * Storefront product listing. All filters are validated and pushed into SQL so
 * pagination stays correct regardless of catalogue size.
 */
router.get(
  '/products',
  asyncHandler(async (req, res) => {
    const { page, limit, offset } = paginate(req.query);
    const filters = {
      categoryId: req.query.category ? Number.parseInt(req.query.category, 10) : undefined,
      search: req.query.q ? String(req.query.q).trim().slice(0, 100) : undefined,
      sort: req.query.sort || 'newest',
      minPrice: req.query.minPrice !== undefined ? Number(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice !== undefined ? Number(req.query.maxPrice) : undefined,
      inStock: req.query.inStock === 'true',
      featured: req.query.featured === 'true',
      newArrival: req.query.new === 'true',
      bestseller: req.query.bestseller === 'true',
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
  '/products/:identifier',
  asyncHandler(async (req, res) => {
    const product = await productService.getProduct(req.params.identifier);
    if (!product) throw notFound('Product not found');
    const related = await productService.listRelated(product, 4);
    res.json({ product, related });
  })
);

/** Lets the checkout UI render the payment options the server will accept. */
router.get('/payment-methods', (_req, res) => {
  res.json({ methods: listMethods() });
});

module.exports = router;
