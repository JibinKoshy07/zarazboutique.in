const { randomBytes } = require('crypto');
const { pool, withTransaction } = require('./pool');
const env = require('../config/env');
const { hashPassword } = require('../middleware/auth');
const { slugify } = require('../utils/helpers');

/** URL-safe random password used when no ADMIN_PASSWORD is configured. */
const randomPassword = () => randomBytes(18).toString('base64url');

/**
 * Catalogue seed. Image URLs point at a stable public CDN so the storefront
 * looks complete on first boot; admins can replace them from the console.
 */
const CATEGORIES = [
  { name: 'Banarasi Silk', description: 'Handwoven Banarasi silks with zari brocade work.', children: ['Katan Silk', 'Tissue Silk'] },
  { name: 'Kanjeevaram', description: 'Temple-border Kanjeevaram sarees from Tamil Nadu.' },
  { name: 'Chiffon', description: 'Feather-light chiffon drapes for everyday elegance.' },
  { name: 'Georgette', description: 'Flowy georgette sarees with delicate embroidery.' },
  { name: 'Cotton Handloom', description: 'Breathable handloom cottons woven by artisan clusters.' },
  { name: 'Organza', description: 'Sheer organza sarees with painterly florals.' },
  { name: 'Bridal Couture', description: 'Statement bridal drapes with heavy hand embroidery.' },
  { name: 'Designer Party Wear', description: 'Sequins, crystals and contemporary silhouettes.' },
];

const SIZES = ['Free Size', 'S', 'M', 'L', 'XL', 'Unstitched'];

const IMG = {
  banarasi1: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&q=80',
  banarasi2: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=900&q=80',
  banarasi3: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=900&q=80',
  kanjeevaram1: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=900&q=80',
  kanjeevaram2: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=900&q=80',
  kanjeevaram3: 'https://images.unsplash.com/photo-1581338834647-b0fb40704e21?w=900&q=80',
  chiffon1: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=900&q=80',
  chiffon2: 'https://images.unsplash.com/photo-1611601322175-ef8ec8c85f01?w=900&q=80',
  chiffon3: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=900&q=80',
  georgette1: 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=900&q=80',
  georgette2: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=900&q=80',
  cotton1: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=900&q=80',
  cotton2: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=900&q=80',
  organza1: 'https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=900&q=80',
  organza2: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=900&q=80',
  bridal1: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=900&q=80',
  bridal2: 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=900&q=80',
  party1: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=900&q=80',
  party2: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=900&q=80',
};

const PRODUCTS = [
  {
    name: 'Rajwadi Crimson Banarasi Silk Saree',
    category: 'Banarasi Silk',
    sub: 'Katan Silk',
    price: 12499,
    compareAt: 15999,
    fabric: 'Pure Katan Silk',
    stock: 12,
    colors: ['Crimson', 'Maroon', 'Gold'],
    images: [IMG.banarasi1, IMG.banarasi2, IMG.banarasi3],
    description:
      'A heirloom-worthy Katan silk saree handwoven in Varanasi with dense gold zari brocade across the body and a regal pallu. Comes with an unstitched blouse piece.',
    flags: { featured: true, bestseller: true, newArrival: true },
    rating: 4.9,
    reviews: 128,
  },
  {
    name: 'Meenakari Gold Tissue Silk Saree',
    category: 'Banarasi Silk',
    sub: 'Tissue Silk',
    price: 9899,
    compareAt: 12499,
    fabric: 'Tissue Silk',
    stock: 9,
    colors: ['Gold', 'Rose Gold'],
    images: [IMG.banarasi2, IMG.banarasi1],
    description:
      'Liquid-gold tissue silk with meenakari enamel detailing along the border. Light on the shoulder yet unmissable in a lit room.',
    flags: { featured: true, newArrival: true },
    rating: 4.7,
    reviews: 64,
  },
  {
    name: 'Kanjeevaram Peacock Blue Silk Saree',
    category: 'Kanjeevaram',
    price: 14500,
    compareAt: 17999,
    fabric: 'Mulberry Silk',
    stock: 7,
    colors: ['Peacock Blue', 'Teal', 'Gold'],
    images: [IMG.kanjeevaram1, IMG.kanjeevaram2, IMG.kanjeevaram3],
    description:
      'A classic Kanjeevaram with a contrast temple border and peacock motifs on the pallu, woven in pure mulberry silk with tested zari.',
    flags: { featured: true, bestseller: true },
    rating: 4.8,
    reviews: 96,
  },
  {
    name: 'Ivory Kanjeevaram With Coral Border',
    category: 'Kanjeevaram',
    price: 13250,
    fabric: 'Mulberry Silk',
    stock: 6,
    colors: ['Ivory', 'Coral'],
    images: [IMG.kanjeevaram2, IMG.kanjeevaram3],
    description:
      'Soft ivory body framed by a deep coral korvai border. A graceful pick for engagements and temple weddings.',
    flags: { newArrival: true },
    rating: 4.6,
    reviews: 41,
  },
  {
    name: 'Powder Rose Chiffon Saree',
    category: 'Chiffon',
    price: 3499,
    compareAt: 4599,
    fabric: 'Pure Chiffon',
    stock: 24,
    colors: ['Powder Rose', 'Blush', 'Off White'],
    images: [IMG.chiffon1, IMG.chiffon2, IMG.chiffon3],
    description:
      'Weightless chiffon in a muted rose with a satin piping border. Drapes beautifully and travels even better.',
    flags: { featured: true, bestseller: true },
    rating: 4.5,
    reviews: 212,
  },
  {
    name: 'Midnight Blue Sequin Chiffon Saree',
    category: 'Chiffon',
    price: 4999,
    fabric: 'Chiffon with Sequins',
    stock: 15,
    colors: ['Midnight Blue', 'Silver'],
    images: [IMG.chiffon2, IMG.chiffon1],
    description:
      'Scattered sequins catch every bit of light on this midnight chiffon. Pre-draped pleating available on request.',
    flags: { newArrival: true },
    rating: 4.4,
    reviews: 57,
  },
  {
    name: 'Emerald Georgette Embroidered Saree',
    category: 'Georgette',
    price: 6799,
    compareAt: 8499,
    fabric: 'Georgette',
    stock: 11,
    colors: ['Emerald', 'Gold'],
    images: [IMG.georgette1, IMG.georgette2],
    description:
      'Deep emerald georgette with hand-embroidered zardosi vines along the border and a scalloped pallu.',
    flags: { featured: true, bestseller: true },
    rating: 4.7,
    reviews: 88,
  },
  {
    name: 'Lilac Georgette Ruffle Saree',
    category: 'Georgette',
    price: 5499,
    fabric: 'Georgette',
    stock: 14,
    colors: ['Lilac', 'Mauve'],
    images: [IMG.georgette2, IMG.georgette1],
    description:
      'A playful ruffled hem in soft lilac, finished with a slim sequin belt. Modern, easy and photogenic.',
    flags: { newArrival: true },
    rating: 4.5,
    reviews: 39,
  },
  {
    name: 'Indigo Handloom Cotton Saree',
    category: 'Cotton Handloom',
    price: 2299,
    compareAt: 2999,
    fabric: 'Handloom Cotton',
    stock: 30,
    colors: ['Indigo', 'Natural'],
    images: [IMG.cotton1, IMG.cotton2],
    description:
      'Natural-dye indigo cotton woven on a pit loom by our Bengal artisan cluster. Breathable, crisp and everyday-perfect.',
    flags: { bestseller: true },
    rating: 4.6,
    reviews: 174,
  },
  {
    name: 'Mustard Handloom Cotton Saree',
    category: 'Cotton Handloom',
    price: 1999,
    fabric: 'Handloom Cotton',
    stock: 26,
    colors: ['Mustard', 'Rust'],
    images: [IMG.cotton2, IMG.cotton1],
    description:
      'Sunny mustard cotton with a woven temple border. Comes starched and ready to drape straight out of the box.',
    flags: {},
    rating: 4.3,
    reviews: 66,
  },
  {
    name: 'Blush Organza Floral Saree',
    category: 'Organza',
    price: 4599,
    compareAt: 5899,
    fabric: 'Organza Silk',
    stock: 13,
    colors: ['Blush', 'Sage'],
    images: [IMG.organza1, IMG.organza2],
    description:
      'Sheer organza hand-painted with watercolour florals and edged in satin. A favourite for day weddings.',
    flags: { featured: true, newArrival: true },
    rating: 4.8,
    reviews: 73,
  },
  {
    name: 'Sage Green Organza Saree',
    category: 'Organza',
    price: 4299,
    fabric: 'Organza Silk',
    stock: 10,
    colors: ['Sage Green'],
    images: [IMG.organza2, IMG.organza1],
    description: 'Cool sage organza with a fine gold tissue border for a quietly luxurious finish.',
    flags: {},
    rating: 4.4,
    reviews: 28,
  },
  {
    name: 'Scarlet Bridal Lehenga Saree',
    category: 'Bridal Couture',
    price: 34999,
    compareAt: 42999,
    fabric: 'Raw Silk with Zardosi',
    stock: 4,
    colors: ['Scarlet', 'Gold', 'Maroon'],
    images: [IMG.bridal1, IMG.bridal2],
    description:
      'Our most requested bridal drape: scarlet raw silk with over 300 hours of zardosi, dabka and kundan handwork, plus a fully stitched blouse.',
    flags: { featured: true, bestseller: true },
    rating: 5.0,
    reviews: 52,
  },
  {
    name: 'Rose Gold Reception Saree',
    category: 'Bridal Couture',
    price: 26999,
    fabric: 'Satin Silk with Crystal',
    stock: 5,
    colors: ['Rose Gold', 'Champagne'],
    images: [IMG.bridal2, IMG.bridal1],
    description:
      'A reception-ready satin silk saree with crystal embellishments that move with you. Includes a fitted corset blouse.',
    flags: { newArrival: true },
    rating: 4.9,
    reviews: 33,
  },
  {
    name: 'Wine Sequin Party Saree',
    category: 'Designer Party Wear',
    price: 8999,
    compareAt: 11499,
    fabric: 'Sequin Net',
    stock: 8,
    colors: ['Wine', 'Black'],
    images: [IMG.party1, IMG.party2],
    description: 'All-over wine sequins on a stretch net base. Cut close, cut glamorous.',
    flags: { featured: true, bestseller: true },
    rating: 4.6,
    reviews: 91,
  },
  {
    name: 'Champagne Draped Party Saree',
    category: 'Designer Party Wear',
    price: 7499,
    fabric: 'Lycra Satin',
    stock: 12,
    colors: ['Champagne', 'Ivory'],
    images: [IMG.party2, IMG.party1],
    description: 'Pre-draped champagne satin with a metallic belt - zero pinning, maximum impact.',
    flags: { newArrival: true },
    rating: 4.5,
    reviews: 44,
  },
];

const seedAdmin = async (client) => {
  const { rows } = await client.query('SELECT id FROM admins WHERE email = $1', [env.seed.adminEmail]);
  if (rows.length) return false;

  // No ADMIN_PASSWORD configured: generate a strong one and print it once.
  // It is never stored in plain text, so this log line is the only copy.
  const generated = !env.seed.adminPassword;
  const password = env.seed.adminPassword || randomPassword();
  const passwordHash = await hashPassword(password);
  await client.query('INSERT INTO admins (name, email, password_hash, role) VALUES ($1,$2,$3,$4)', [
    env.seed.adminName,
    env.seed.adminEmail,
    passwordHash,
    'superadmin',
  ]);
  console.log(`[seed] admin created: ${env.seed.adminEmail}`);
  if (generated) {
    console.log(`[seed] generated admin password (shown once, change it after login): ${password}`);
  }
  return true;
};

const seedCategories = async (client) => {
  const { rows } = await client.query('SELECT COUNT(*)::int AS count FROM categories');
  if (rows[0].count > 0) return false;

  const ids = {};
  let order = 0;
  for (const category of CATEGORIES) {
    const parent = await client.query(
      `INSERT INTO categories (name, slug, description, sort_order) VALUES ($1,$2,$3,$4) RETURNING id`,
      [category.name, slugify(category.name), category.description, order++]
    );
    ids[category.name] = parent.rows[0].id;

    for (const child of category.children || []) {
      const sub = await client.query(
        `INSERT INTO categories (name, slug, description, parent_id, sort_order) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [child, slugify(child), `${child} - a curated selection under ${category.name}.`, parent.rows[0].id, order++]
      );
      ids[`${category.name}/${child}`] = sub.rows[0].id;
    }
  }
  console.log(`[seed] ${CATEGORIES.length} categories created`);
  return ids;
};

const seedProducts = async (client, categoryIds) => {
  const { rows } = await client.query('SELECT COUNT(*)::int AS count FROM products');
  if (rows[0].count > 0) return false;

  let skuCounter = 1001;
  for (const product of PRODUCTS) {
    const categoryId = product.sub
      ? categoryIds[`${product.category}/${product.sub}`]
      : categoryIds[product.category];

    await client.query(
      `INSERT INTO products
         (name, slug, sku, category_id, description, fabric, price, compare_at_price, image, images,
          sizes, colors, stock, is_featured, is_new_arrival, is_bestseller, rating, review_count)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
      [
        product.name,
        slugify(product.name),
        `ZB-${skuCounter++}`,
        categoryId || null,
        product.description,
        product.fabric,
        product.price,
        product.compareAt || null,
        product.images[0],
        JSON.stringify(product.images),
        JSON.stringify(SIZES),
        JSON.stringify(product.colors || []),
        product.stock,
        product.flags?.featured === true,
        product.flags?.newArrival === true,
        product.flags?.bestseller === true,
        product.rating || 0,
        product.reviews || 0,
      ]
    );
  }
  console.log(`[seed] ${PRODUCTS.length} products created`);
  return true;
};

/** Adds a demo shopper with an address and a sample order so the console has data. */
const seedDemoCustomer = async (client) => {
  // Optional sample shopper. Skipped unless a password is configured, so the
  // app never ships a known customer login.
  if (!env.seed.demoCustomerPassword) return false;

  const email = 'priya@example.com';
  const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length) return false;

  const passwordHash = await hashPassword(env.seed.demoCustomerPassword);
  const user = await client.query(
    `INSERT INTO users (name, email, phone, password_hash) VALUES ($1,$2,$3,$4) RETURNING id`,
    ['Priya Sharma', email, '+91 98765 43210', passwordHash]
  );
  const userId = user.rows[0].id;

  const address = await client.query(
    `INSERT INTO addresses (user_id, label, full_name, phone, line1, line2, city, state, postal_code, country, is_default)
     VALUES ($1,'Home','Priya Sharma','+91 98765 43210','14 Rose Garden Lane','Banjara Hills','Hyderabad','Telangana','500034','India',true)
     RETURNING *`,
    [userId]
  );

  const products = await client.query('SELECT id, name, price, image FROM products ORDER BY id LIMIT 2');
  if (products.rows.length === 0) return true;

  const lines = products.rows.map((product) => ({
    product,
    quantity: product.id === products.rows[0].id ? 1 : 2,
    lineTotal: Number(product.price) * (product.id === products.rows[0].id ? 1 : 2),
  }));
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);

  const order = await client.query(
    `INSERT INTO orders
       (order_number, user_id, status, payment_status, payment_method, subtotal, shipping_fee, total_amount,
        item_count, customer_name, customer_email, customer_phone, shipping_address, notes)
     VALUES ($1,$2,'Confirmed','Paid','UPI',$3,0,$3,$4,'Priya Sharma',$5,'+91 98765 43210',$6,'Gift wrap requested')
     RETURNING id`,
    [
      `ZB-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-DEMO01`,
      userId,
      subtotal,
      lines.length,
      email,
      JSON.stringify({
        fullName: 'Priya Sharma',
        phone: '+91 98765 43210',
        line1: address.rows[0].line1,
        line2: address.rows[0].line2,
        city: 'Hyderabad',
        state: 'Telangana',
        postalCode: '500034',
        country: 'India',
        label: 'Home',
      }),
    ]
  );

  for (const line of lines) {
    await client.query(
      `INSERT INTO order_items (order_id, product_id, product_name, product_image, size, color, unit_price, quantity, line_total)
       VALUES ($1,$2,$3,$4,'Free Size','Crimson',$5,$6,$7)`,
      [order.rows[0].id, line.product.id, line.product.name, line.product.image, line.product.price, line.quantity, line.lineTotal]
    );
  }

  await client.query(
    `INSERT INTO order_status_history (order_id, status, note, actor) VALUES
       ($1,'Pending','Order placed by customer','customer'),
       ($1,'Confirmed','Payment verified via UPI','admin:1')`,
    [order.rows[0].id]
  );

  console.log(`[seed] demo customer created: ${email}`);
  return true;
};

const seed = async () => {
  await withTransaction(async (client) => {
    await seedAdmin(client);
    const categoryIds = await seedCategories(client);
    if (categoryIds) await seedProducts(client, categoryIds);
    await seedDemoCustomer(client);
  });
};

if (require.main === module) {
  seed()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('[seed] failed:', err.message);
      await pool.end();
      process.exit(1);
    });
}

module.exports = { seed, CATEGORIES, PRODUCTS };
