const { query, withTransaction } = require('../../db/pool');
const { notFound, badRequest } = require('../../utils/errors');
const { toAddress } = require('../../utils/serialize');

const listAddresses = async (userId) => {
  const { rows } = await query(
    'SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
    [userId]
  );
  return rows.map(toAddress);
};

const getAddress = async (userId, addressId) => {
  const { rows } = await query('SELECT * FROM addresses WHERE id = $1 AND user_id = $2', [addressId, userId]);
  if (!rows[0]) throw notFound('Address not found');
  return toAddress(rows[0]);
};

/**
 * Creates an address and keeps "exactly one default" true: the first address a
 * customer saves always becomes the default.
 */
const createAddress = async (userId, payload) =>
  withTransaction(async (client) => {
    const countResult = await client.query('SELECT COUNT(*)::int AS count FROM addresses WHERE user_id = $1', [userId]);
    const isFirst = countResult.rows[0].count === 0;
    const makeDefault = isFirst || payload.is_default === true;

    if (makeDefault) {
      await client.query('UPDATE addresses SET is_default = false WHERE user_id = $1', [userId]);
    }

    const { rows } = await client.query(
      `INSERT INTO addresses
         (user_id, label, full_name, phone, line1, line2, city, state, postal_code, country, is_default)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        userId,
        payload.label || 'Home',
        payload.full_name,
        payload.phone,
        payload.line1,
        payload.line2 || null,
        payload.city,
        payload.state,
        payload.postal_code,
        payload.country || 'India',
        makeDefault,
      ]
    );
    return toAddress(rows[0]);
  });

const updateAddress = async (userId, addressId, payload) =>
  withTransaction(async (client) => {
    const existing = await client.query('SELECT id FROM addresses WHERE id = $1 AND user_id = $2', [addressId, userId]);
    if (!existing.rows[0]) throw notFound('Address not found');

    if (payload.is_default) {
      await client.query('UPDATE addresses SET is_default = false WHERE user_id = $1', [userId]);
    }

    const { rows } = await client.query(
      `UPDATE addresses
          SET label = $3, full_name = $4, phone = $5, line1 = $6, line2 = $7,
              city = $8, state = $9, postal_code = $10, country = $11,
              is_default = $12, updated_at = now()
        WHERE id = $1 AND user_id = $2
        RETURNING *`,
      [
        addressId,
        userId,
        payload.label || 'Home',
        payload.full_name,
        payload.phone,
        payload.line1,
        payload.line2 || null,
        payload.city,
        payload.state,
        payload.postal_code,
        payload.country || 'India',
        payload.is_default === true,
      ]
    );

    // A customer must never be left without a default address.
    if (payload.is_default !== true) {
      const { rows: defaults } = await client.query(
        'SELECT COUNT(*)::int AS count FROM addresses WHERE user_id = $1 AND is_default = true',
        [userId]
      );
      if (defaults[0].count === 0) {
        await client.query('UPDATE addresses SET is_default = true WHERE id = $1', [addressId]);
        rows[0].is_default = true;
      }
    }
    return toAddress(rows[0]);
  });

const deleteAddress = async (userId, addressId) =>
  withTransaction(async (client) => {
    const deleted = await client.query('DELETE FROM addresses WHERE id = $1 AND user_id = $2 RETURNING is_default', [
      addressId,
      userId,
    ]);
    if (!deleted.rows[0]) throw notFound('Address not found');

    // Never leave a customer with zero default address while they still have one.
    if (deleted.rows[0].is_default) {
      await client.query(
        `UPDATE addresses SET is_default = true
          WHERE id = (SELECT id FROM addresses WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1)`,
        [userId]
      );
    }
    return { id: Number(addressId) };
  });

const setDefaultAddress = async (userId, addressId) =>
  withTransaction(async (client) => {
    const existing = await client.query('SELECT id FROM addresses WHERE id = $1 AND user_id = $2', [addressId, userId]);
    if (!existing.rows[0]) throw notFound('Address not found');

    await client.query('UPDATE addresses SET is_default = false WHERE user_id = $1', [userId]);
    const { rows } = await client.query(
      'UPDATE addresses SET is_default = true, updated_at = now() WHERE id = $1 RETURNING *',
      [addressId]
    );
    return toAddress(rows[0]);
  });

/** Loads an address for checkout, enforcing ownership. */
const getOwnedAddressForOrder = async (client, userId, addressId) => {
  const { rows } = await client.query('SELECT * FROM addresses WHERE id = $1 AND user_id = $2', [addressId, userId]);
  if (!rows[0]) throw badRequest('Select a valid delivery address');
  return rows[0];
};

module.exports = {
  listAddresses,
  getAddress,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getOwnedAddressForOrder,
};
