const { query } = require('../../db/pool');
const { toProduct } = require('../../utils/serialize');

const SORTS = {
  newest: 'p.created_at DESC',
  oldest: 'p.created_at ASC',
  price_asc: 'p.price ASC',
  price_desc: 'p.price DESC',
  name_asc: 'p.name ASC',
  name_desc: 'p.name DESC',
  rating: 'p.rating DESC, p.review_count DESC',
  popular: 'p.is_bestseller DESC, p.review_count DESC',
};

const BASE_SELECT = `
  SELECT p.*, c.name AS category_name
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
`;

/**
 * Builds a parameterised WHERE clause from storefront filters. Category
 * filtering intentionally includes direct children so a parent category page
 * shows everything nested under it.
 */
const buildFilters = ({ categoryId, search, inStock, minPrice, maxPrice, featured, newArrival, bestseller, includeInactive }) => {
  const clauses = [];
  const params = [];

  if (!includeInactive) clauses.push('p.is_active = true');
  if (categoryId) {
    params.push(categoryId);
    clauses.push(`(p.category_id = $${params.length}
      OR p.category_id IN (SELECT sc.id FROM categories sc WHERE sc.parent_id = $${params.length}))`);
  }
  if (search) {
    params.push(`%${search}%`);
    clauses.push(`(p.name ILIKE $${params.length} OR p.description ILIKE $${params.length}
      OR p.fabric ILIKE $${params.length} OR c.name ILIKE $${params.length})`);
  }
  if (inStock) clauses.push('p.stock > 0');
  if (minPrice !== undefined && minPrice !== null) {
    params.push(minPrice);
    clauses.push(`p.price >= $${params.length}`);
  }
  if (maxPrice !== undefined && maxPrice !== null) {
    params.push(maxPrice);
    clauses.push(`p.price <= $${params.length}`);
  }
  if (featured) clauses.push('p.is_featured = true');
  if (newArrival) clauses.push('p.is_new_arrival = true');
  if (bestseller) clauses.push('p.is_bestseller = true');

  return { where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', params };
};

const listProducts = async (filters = {}) => {
  const { where, params } = buildFilters(filters);
  const sort = SORTS[filters.sort] || SORTS.newest;
  const limit = filters.limit ? `LIMIT ${Number(filters.limit)}` : '';
  const offset = filters.offset ? `OFFSET ${Number(filters.offset)}` : '';

  const { rows } = await query(`${BASE_SELECT} ${where} ORDER BY ${sort} ${limit} ${offset}`, params);
  return rows.map(toProduct);
};

const countProducts = async (filters = {}) => {
  const { where, params } = buildFilters(filters);
  const { rows } = await query(
    `SELECT COUNT(*)::int AS total
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       ${where}`,
    params
  );
  return rows[0].total;
};

const getProduct = async (identifier, { includeInactive = false } = {}) => {
  const numeric = Number.parseInt(identifier, 10);
  const { rows } = await query(
    `${BASE_SELECT}
      WHERE ${Number.isFinite(numeric) ? 'p.id = $1' : 'p.slug = $1'}
        ${includeInactive ? '' : 'AND p.is_active = true'}`,
    [Number.isFinite(numeric) ? numeric : identifier]
  );
  return toProduct(rows[0]) || null;
};

const listRelated = async (product, limit = 4) => {
  const { rows } = await query(
    `${BASE_SELECT}
      WHERE p.is_active = true AND p.id <> $1
        AND ($2::int IS NULL OR p.category_id = $2)
      ORDER BY p.is_bestseller DESC, p.rating DESC
      LIMIT ${Number(limit)}`,
    [product.id, product.categoryId]
  );
  return rows.map(toProduct);
};

module.exports = { listProducts, countProducts, getProduct, listRelated, SORTS };
