const env = require('../../config/env');
const { badRequest } = require('../../utils/errors');

/**
 * Payment providers are registered here. Each provider describes what the
 * storefront must do after an order is placed and what payment status the order
 * starts in. `manual` covers the offline methods shipped today (COD / UPI /
 * Card captured later); a real gateway is added by registering another provider
 * below and flipping PAYMENT_PROVIDER - no order or checkout code changes.
 */
const providers = {
  manual: {
    key: 'manual',
    label: 'Manual / offline',
    // Offline methods stay uncollected until an admin marks them paid, so every
    // order starts as Pending.
    initialPaymentStatus: () => 'Pending',
    requiresOnlinePayment: false,
    createIntent: async (order) => ({
      provider: 'manual',
      orderNumber: order.order_number,
      // A real gateway returns a client secret / redirect URL here. The
      // storefront checks `requiresGateway` and only redirects when true.
      requiresGateway: false,
      checkoutUrl: null,
      clientAction: null,
      message: 'Order placed. Payment will be collected using the selected method.',
    }),
  },
};

const getProvider = (key = env.payments.provider) => {
  const provider = providers[key];
  if (!provider) throw badRequest(`Unknown payment provider: ${key}`);
  return provider;
};

/** Payment methods surfaced to the storefront checkout, gated by env flags. */
const listMethods = () => {
  const methods = [];
  if (env.payments.codEnabled) {
    methods.push({
      id: 'Cash on Delivery',
      label: 'Cash on Delivery',
      description: 'Pay in cash when your order arrives.',
      kind: 'offline',
    });
  }
  if (env.payments.upiEnabled) {
    methods.push({
      id: 'UPI',
      label: 'UPI',
      description: `Pay to ${env.payments.upiVpa} and share the reference.`,
      kind: 'offline',
      vpa: env.payments.upiVpa,
    });
  }
  if (env.payments.cardEnabled) {
    methods.push({
      id: 'Card',
      label: 'Credit / Debit Card',
      description: 'Card payment is confirmed by our team after checkout.',
      kind: 'offline',
    });
  }
  return methods;
};

const isValidMethod = (method) => listMethods().some((item) => item.id === method);

module.exports = { getProvider, listMethods, isValidMethod, providers };
