const num = (value) => (value === null || value === undefined ? null : Number(value));
const arr = (value) => (Array.isArray(value) ? value : []);

const toCategory = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    parentId: row.parent_id,
    parentName: row.parent_name || null,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    productCount: row.product_count !== undefined ? Number(row.product_count) : undefined,
    children: row.children || undefined,
  };
};

const toProduct = (row) => {
  if (!row) return null;
  const images = arr(row.images);
  const primary = row.image || images[0] || null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sku: row.sku,
    categoryId: row.category_id,
    categoryName: row.category_name || null,
    description: row.description,
    fabric: row.fabric,
    price: num(row.price),
    compareAtPrice: num(row.compare_at_price),
    image: primary,
    images: images.length ? images : primary ? [primary] : [],
    sizes: arr(row.sizes),
    colors: arr(row.colors),
    stock: row.stock,
    lowStockThreshold: row.low_stock_threshold,
    inStock: row.stock > 0,
    isActive: row.is_active,
    isFeatured: row.is_featured,
    isNewArrival: row.is_new_arrival,
    isBestseller: row.is_bestseller,
    rating: num(row.rating),
    reviewCount: row.review_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const toAddress = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    label: row.label,
    fullName: row.full_name,
    phone: row.phone,
    line1: row.line1,
    line2: row.line2,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    country: row.country,
    isDefault: row.is_default,
    createdAt: row.created_at,
  };
};

const toCartItem = (row) => ({
  id: row.id,
  productId: row.product_id,
  quantity: row.quantity,
  size: row.size,
  color: row.color,
  unitPrice: num(row.price),
  lineTotal: Math.round(Number(row.price) * row.quantity * 100) / 100,
  product: {
    id: row.product_id,
    name: row.name,
    slug: row.slug,
    image: row.image || arr(row.images)[0] || null,
    price: num(row.price),
    stock: row.stock,
    isActive: row.is_active,
    categoryName: row.category_name || null,
  },
});

const toOrderItem = (row) => ({
  id: row.id,
  productId: row.product_id,
  productName: row.product_name,
  productImage: row.product_image,
  size: row.size,
  color: row.color,
  unitPrice: num(row.unit_price),
  quantity: row.quantity,
  lineTotal: num(row.line_total),
});

const toStatusHistory = (rows) =>
  Array.isArray(rows)
    ? rows.map((row) => ({ status: row.status, note: row.note, actor: row.actor, createdAt: row.created_at }))
    : undefined;

const toOrder = (row, items = []) => ({
  id: row.id,
  orderNumber: row.order_number,
  userId: row.user_id,
  status: row.status,
  paymentStatus: row.payment_status,
  paymentMethod: row.payment_method,
  subtotal: num(row.subtotal),
  shippingFee: num(row.shipping_fee),
  total: num(row.total_amount),
  currency: row.currency,
  itemCount: row.item_count,
  customer: {
    id: row.user_id,
    name: row.customer_name,
    email: row.customer_email,
    phone: row.customer_phone,
  },
  shippingAddress: row.shipping_address,
  notes: row.notes,
  trackingNumber: row.tracking_number,
  createdAt: row.placed_at,
  placedAt: row.placed_at,
  updatedAt: row.updated_at,
  items,
  statusHistory: toStatusHistory(row.status_history),
});

const toCustomer = (row) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  phone: row.phone,
  isActive: row.is_active,
  createdAt: row.created_at,
  lastLoginAt: row.last_login_at,
  orderCount: row.order_count !== undefined ? Number(row.order_count) : undefined,
  totalSpent: row.total_spent !== undefined ? num(row.total_spent) : undefined,
  lastOrderAt: row.last_order_at || null,
});

module.exports = { toCategory, toProduct, toAddress, toCartItem, toOrderItem, toOrder, toCustomer };
