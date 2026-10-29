const { query } = require('../../db/pool');
const { slugify } = require('../../utils/helpers');
const { notFound, conflict } = require('../../utils/errors');
const { toCategory } = require('../../utils/serialize');

const BASE_SELECT = `
  SELECT c.*, p.name AS parent_name,
         (SELECT COUNT(*) FROM products pr
           WHERE pr.category_id = c.id
              OR pr.category_id IN (SELECT sc.id FROM categories sc WHERE sc.parent_id = c.id)
         ) AS product_count
    FROM categories c
    LEFT JOIN categories p ON p.id = c.parent_id
`;

/** Returns the category tree: top-level categories with their children nested. */
const listCategories = async ({ includeInactive = false } = {}) => {
  const { rows } = await query(
    `${BASE_SELECT}
     WHERE c.parent_id IS NULL ${includeInactive ? '' : 'AND c.is_active = true'}
     ORDER BY c.sort_order ASC, c.name ASC`
  );

  const { rows: childRows } = await query(
    `${BASE_SELECT}
     WHERE c.parent_id IS NOT NULL ${includeInactive ? '' : 'AND c.is_active = true'}
     ORDER BY c.sort_order ASC, c.name ASC`
  );
  const childrenByParent = new Map();
  childRows.map(toCategory).forEach((child) => {
    if (!childrenByParent.has(child.parentId)) childrenByParent.set(child.parentId, []);
    childrenByParent.get(child.parentId).push(child);
  });

  return rows.map(toCategory).map((root) => ({ ...root, children: childrenByParent.get(root.id) || [] }));
};

/** Flat list of every category, for admin tables and parent dropdowns. */
const listAllCategories = async ({ includeInactive = false } = {}) => {
  const { rows } = await query(
    `${BASE_SELECT}
     ${includeInactive ? '' : 'WHERE c.is_active = true'}
     ORDER BY c.sort_order ASC, c.name ASC`
  );
  return rows.map(toCategory);
};

const getCategoryBySlugOrId = async (identifier, { includeInactive = false } = {}) => {
  const numeric = Number.parseInt(identifier, 10);
  const { rows } = await query(
    `${BASE_SELECT}
     WHERE ${Number.isFinite(numeric) ? 'c.id = $1' : 'c.slug = $1'}
       ${includeInactive ? '' : 'AND c.is_active = true'}`,
    [Number.isFinite(numeric) ? numeric : identifier]
  );
  return rows[0] || null;
};

/** Ensures a parent has no parent of its own (exactly one nesting level). */
const assertValidParent = async (parentId, selfId = null) => {
  if (!parentId) return null;
  if (selfId && Number(parentId) === Number(selfId)) {
    throw conflict('A category cannot be its own parent');
  }
  const { rows } = await query('SELECT id, parent_id FROM categories WHERE id = $1', [parentId]);
  if (!rows[0]) throw notFound('Parent category not found');
  if (rows[0].parent_id) throw conflict('Subcategories cannot be nested further than one level');
  return rows[0].id;
};

/**
 * Generates a unique slug for the given table. `table` is only ever passed a
 * hard-coded literal from callers, never user input, so interpolating it is safe.
 */
const uniqueSlug = async (name, ignoreId = null, table = 'categories') => {
  const base = slugify(name) || 'item';
  let candidate = base;
  let suffix = 2;
  // Slugs are the public URL key, so collisions must resolve to a distinct value.
  for (;;) {
    const { rows } = await query(
      `SELECT id FROM ${table} WHERE slug = $1 ${ignoreId ? 'AND id <> $2' : ''}`,
      ignoreId ? [candidate, ignoreId] : [candidate]
    );
    if (rows.length === 0) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
};

const createCategory = async (payload) => {
  const parentId = await assertValidParent(payload.parent_id);
  const slug = await uniqueSlug(payload.name);
  const { rows } = await query(
    `INSERT INTO categories (name, slug, description, parent_id, sort_order, is_active)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [payload.name, slug, payload.description || null, parentId, payload.sort_order || 0, payload.is_active !== false]
  );
  return toCategory(rows[0]);
};

const updateCategory = async (id, payload) => {
  const existing = await query('SELECT * FROM categories WHERE id = $1', [id]);
  if (!existing.rows[0]) throw notFound('Category not found');

  const parentId = await assertValidParent(payload.parent_id, id);
  const slug = payload.name !== existing.rows[0].name ? await uniqueSlug(payload.name, id) : existing.rows[0].slug;

  const { rows } = await query(
    `UPDATE categories
        SET name = $2, slug = $3, description = $4, parent_id = $5,
            sort_order = $6, is_active = $7, updated_at = now()
      WHERE id = $1
      RETURNING *`,
    [
      id,
      payload.name,
      slug,
      payload.description || null,
      parentId,
      payload.sort_order ?? existing.rows[0].sort_order,
      payload.is_active !== false,
    ]
  );
  return toCategory(rows[0]);
};

const deleteCategory = async (id) => {
  const { rows } = await query('SELECT COUNT(*)::int AS count FROM products WHERE category_id = $1', [id]);
  if (rows[0].count > 0) {
    throw conflict('Move or delete the products in this category before removing it');
  }
  const result = await query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);
  if (result.rowCount === 0) throw notFound('Category not found');
  return { id: Number(id) };
};

module.exports = {
  listCategories,
  listAllCategories,
  getCategoryBySlugOrId,
  createCategory,
  updateCategory,
  deleteCategory,
  uniqueSlug,
};
