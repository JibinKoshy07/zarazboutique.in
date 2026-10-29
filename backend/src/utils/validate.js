const { z } = require('zod');
const { badRequest } = require('./errors');

const email = z.string().trim().toLowerCase().email('A valid email address is required');
const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long');
const phone = z
  .string()
  .trim()
  .regex(/^[0-9+\-\s()]{7,20}$/, 'Enter a valid phone number');
const money = z.coerce.number().min(0, 'Price cannot be negative');
const nonNegativeInt = z.coerce.number().int().min(0, 'Value cannot be negative');

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short').max(255),
  email,
  phone: phone.optional().or(z.literal('')),
  password,
});

const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});

const profileSchema = z.object({
  name: z.string().trim().min(2).max(255),
  phone: phone.optional().or(z.literal('')),
});

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: password,
});

const addressSchema = z.object({
  label: z.string().trim().max(64).optional().default('Home'),
  full_name: z.string().trim().min(2, 'Full name is required').max(255),
  phone,
  line1: z.string().trim().min(3, 'Address line 1 is required').max(255),
  line2: z.string().trim().max(255).optional().or(z.literal('')),
  city: z.string().trim().min(2, 'City is required').max(120),
  state: z.string().trim().min(2, 'State is required').max(120),
  postal_code: z.string().trim().regex(/^[0-9A-Za-z\s-]{4,12}$/, 'Enter a valid postal code'),
  country: z.string().trim().min(2).max(120).optional().default('India'),
  is_default: z.coerce.boolean().optional().default(false),
});

const cartItemSchema = z.object({
  productId: z.coerce.number().int().positive('A valid product is required'),
  quantity: z.coerce.number().int().min(1).max(20).default(1),
  size: z.string().trim().max(32).optional().nullable(),
  color: z.string().trim().max(64).optional().nullable(),
});

const cartItemUpdateSchema = z.object({
  quantity: z.coerce.number().int().min(0).max(20),
});

const checkoutSchema = z.object({
  addressId: z.coerce.number().int().positive('Select a delivery address'),
  paymentMethod: z.enum(['Cash on Delivery', 'UPI', 'Card', 'Net Banking']),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
});

const categorySchema = z.object({
  name: z.string().trim().min(2, 'Category name is required').max(255),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  parent_id: z.coerce.number().int().positive().nullable().optional(),
  sort_order: z.coerce.number().int().optional().default(0),
  is_active: z.coerce.boolean().optional().default(true),
});

const productSchema = z.object({
  name: z.string().trim().min(2, 'Product name is required').max(255),
  sku: z.string().trim().max(64).optional().or(z.literal('')),
  category_id: z.coerce.number().int().positive().nullable().optional(),
  description: z.string().trim().max(5000).optional().or(z.literal('')),
  fabric: z.string().trim().max(120).optional().or(z.literal('')),
  price: money,
  compare_at_price: money.optional().nullable(),
  image: z.string().trim().max(1024).optional().or(z.literal('')),
  images: z.array(z.string().trim().max(1024)).optional().default([]),
  sizes: z.array(z.string().trim().max(32)).optional().default([]),
  colors: z.array(z.string().trim().max(64)).optional().default([]),
  stock: nonNegativeInt.default(0),
  low_stock_threshold: nonNegativeInt.optional().default(3),
  is_active: z.coerce.boolean().optional().default(true),
  is_featured: z.coerce.boolean().optional().default(false),
  is_new_arrival: z.coerce.boolean().optional().default(false),
  is_bestseller: z.coerce.boolean().optional().default(false),
});

const orderStatusSchema = z.object({
  status: z.enum([
    'Pending',
    'Confirmed',
    'Processing',
    'Shipped',
    'Out for Delivery',
    'Delivered',
    'Cancelled',
    'Returned',
  ]),
  note: z.string().trim().max(500).optional().or(z.literal('')),
  tracking_number: z.string().trim().max(64).optional().or(z.literal('')),
});

const paymentStatusSchema = z.object({
  payment_status: z.enum(['Pending', 'Paid', 'Failed', 'Refunded']),
});

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(255),
  email,
  phone: phone.optional().or(z.literal('')),
  subject: z.string().trim().max(255).optional().or(z.literal('')),
  message: z.string().trim().min(10, 'Please tell us a little more').max(3000),
});

/** Parses `data` with a zod schema, converting issues into a 400 AppError. */
const validate = (schema, data) => {
  const result = schema.safeParse(data);
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.') || 'body',
      message: issue.message,
    }));
    throw badRequest(details[0]?.message || 'Invalid request', details);
  }
  return result.data;
};

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  profileSchema,
  passwordChangeSchema,
  addressSchema,
  cartItemSchema,
  cartItemUpdateSchema,
  checkoutSchema,
  categorySchema,
  productSchema,
  orderStatusSchema,
  paymentStatusSchema,
  contactSchema,
};
