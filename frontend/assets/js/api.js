/**
 * Single place that knows how to talk to the API.
 *
 * The base URL is always derived from the current page, so the same build works
 * on localhost, in Docker, and behind any reverse proxy — never hard-code a host.
 * Override order: window.ZARAZ_API_URL -> localStorage -> same-origin /api.
 * Docker serves the app and proxies /api to the backend, so same-origin is right
 * in every deployed case.
 */
(function () {
  const isFile = window.location.protocol === 'file:';
  const override =
    window.ZARAZ_API_URL ||
    (() => {
      try {
        return localStorage.getItem('zaraz_api_url');
      } catch {
        return null;
      }
    })();

  const base =
    override ||
    // Opening the HTML straight off disk needs an explicit backend address.
    (isFile ? 'http://localhost:4000/api' : `${window.location.origin}/api`);

  const TOKEN_KEY = 'zaraz_token';
  const ADMIN_TOKEN_KEY = 'zaraz_admin_token';

  const getToken = () => localStorage.getItem(TOKEN_KEY);
  const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY);

  const setToken = (token) => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  };
  const setAdminToken = (token) => {
    if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token);
    else localStorage.removeItem(ADMIN_TOKEN_KEY);
  };

  /** Error that carries the server message plus any field-level details. */
  class ApiError extends Error {
    constructor(message, status, details) {
      super(message);
      this.status = status;
      this.details = details || [];
    }
  }

  const request = async (path, { method = 'GET', body, auth = 'none', headers = {} } = {}) => {
    const token = auth === 'admin' ? getAdminToken() : auth === 'user' ? getToken() : null;
    const isFormData = body instanceof FormData;
    const finalHeaders = { ...headers };
    if (!isFormData && body !== undefined) finalHeaders['Content-Type'] = 'application/json';
    if (token) finalHeaders.Authorization = `Bearer ${token}`;

    let response;
    try {
      response = await fetch(`${base}${path}`, {
        method,
        headers: finalHeaders,
        body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
      });
    } catch {
      throw new ApiError('Cannot reach the server. Please check your connection and try again.', 0);
    }

    if (response.status === 204) return {};

    const text = await response.text();
    let payload = {};
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { error: { message: text.slice(0, 200) } };
      }
    }

    if (!response.ok) {
      const message = payload?.error?.message || `Request failed (${response.status})`;
      // A stale or revoked token must not leave the UI in a half-logged-in state.
      if (response.status === 401 && auth !== 'none') {
        if (auth === 'admin') setAdminToken(null);
        else setToken(null);
      }
      throw new ApiError(message, response.status, payload?.error?.details);
    }

    return payload;
  };

  window.API = {
    base,
    ApiError,
    getToken,
    getAdminToken,
    setToken,
    setAdminToken,
    isLoggedIn: () => Boolean(getToken()),
    isAdminLoggedIn: () => Boolean(getAdminToken()),

    // public catalogue
    categories: () => request('/categories'),
    category: (id) => request(`/categories/${id}`),
    products: (params = {}) => {
      const qs = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
      ).toString();
      return request(`/products${qs ? `?${qs}` : ''}`);
    },
    product: (id) => request(`/products/${id}`),
    paymentMethods: () => request('/payment-methods'),

    // auth
    register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
    login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
    me: () => request('/users/me', { auth: 'user' }),
    updateProfile: (payload) => request('/users/me', { method: 'PUT', body: payload, auth: 'user' }),
    changePassword: (payload) => request('/users/me/password', { method: 'PUT', body: payload, auth: 'user' }),

    // addresses
    addresses: () => request('/addresses', { auth: 'user' }),
    createAddress: (payload) => request('/addresses', { method: 'POST', body: payload, auth: 'user' }),
    updateAddress: (id, payload) => request(`/addresses/${id}`, { method: 'PUT', body: payload, auth: 'user' }),
    deleteAddress: (id) => request(`/addresses/${id}`, { method: 'DELETE', auth: 'user' }),
    setDefaultAddress: (id) => request(`/addresses/${id}/default`, { method: 'POST', auth: 'user' }),

    // cart
    cart: () => request('/cart', { auth: 'user' }),
    addToCart: (payload) => request('/cart/items', { method: 'POST', body: payload, auth: 'user' }),
    updateCartItem: (id, payload) => request(`/cart/items/${id}`, { method: 'PUT', body: payload, auth: 'user' }),
    removeCartItem: (id) => request(`/cart/items/${id}`, { method: 'DELETE', auth: 'user' }),
    clearCart: () => request('/cart', { method: 'DELETE', auth: 'user' }),

    // orders
    orders: (params = {}) => {
      const qs = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
      ).toString();
      return request(`/orders${qs ? `?${qs}` : ''}`, { auth: 'user' });
    },
    order: (id) => request(`/orders/${id}`, { auth: 'user' }),
    checkout: (payload) => request('/orders', { method: 'POST', body: payload, auth: 'user' }),
    cancelOrder: (id) => request(`/orders/${id}/cancel`, { method: 'POST', auth: 'user' }),

    contact: (payload) => request('/contact', { method: 'POST', body: payload }),

    // admin
    admin: {
      login: (payload) => request('/admin/login', { method: 'POST', body: payload }),
      me: () => request('/admin/me', { auth: 'admin' }),
      dashboard: () => request('/admin/dashboard', { auth: 'admin' }),
      categories: () => request('/admin/categories', { auth: 'admin' }),
      createCategory: (payload) => request('/admin/categories', { method: 'POST', body: payload, auth: 'admin' }),
      updateCategory: (id, payload) => request(`/admin/categories/${id}`, { method: 'PUT', body: payload, auth: 'admin' }),
      deleteCategory: (id) => request(`/admin/categories/${id}`, { method: 'DELETE', auth: 'admin' }),
      products: (params = {}) => {
        const qs = new URLSearchParams(
          Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
        ).toString();
        return request(`/admin/products${qs ? `?${qs}` : ''}`, { auth: 'admin' });
      },
      product: (id) => request(`/admin/products/${id}`, { auth: 'admin' }),
      createProduct: (payload) => request('/admin/products', { method: 'POST', body: payload, auth: 'admin' }),
      updateProduct: (id, payload) => request(`/admin/products/${id}`, { method: 'PUT', body: payload, auth: 'admin' }),
      deleteProduct: (id) => request(`/admin/products/${id}`, { method: 'DELETE', auth: 'admin' }),
      setStock: (id, payload) => request(`/admin/products/${id}/stock`, { method: 'PATCH', body: payload, auth: 'admin' }),
      uploadImages: (formData) => request('/admin/uploads', { method: 'POST', body: formData, auth: 'admin' }),
      orders: (params = {}) => {
        const qs = new URLSearchParams(
          Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
        ).toString();
        return request(`/admin/orders${qs ? `?${qs}` : ''}`, { auth: 'admin' });
      },
      order: (id) => request(`/admin/orders/${id}`, { auth: 'admin' }),
      setOrderStatus: (id, payload) => request(`/admin/orders/${id}/status`, { method: 'PUT', body: payload, auth: 'admin' }),
      setPaymentStatus: (id, payload) => request(`/admin/orders/${id}/payment-status`, { method: 'PUT', body: payload, auth: 'admin' }),
      customers: (params = {}) => {
        const qs = new URLSearchParams(
          Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
        ).toString();
        return request(`/admin/customers${qs ? `?${qs}` : ''}`, { auth: 'admin' });
      },
      customer: (id) => request(`/admin/customers/${id}`, { auth: 'admin' }),
      setCustomerActive: (id, isActive) => request(`/admin/customers/${id}/status`, { method: 'PATCH', body: { isActive }, auth: 'admin' }),
      inventory: (params = {}) => {
        const qs = new URLSearchParams(
          Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
        ).toString();
        return request(`/admin/inventory${qs ? `?${qs}` : ''}`, { auth: 'admin' });
      },
      messages: () => request('/admin/messages', { auth: 'admin' }),
      markMessage: (id, isRead) => request(`/admin/messages/${id}`, { method: 'PATCH', body: { isRead }, auth: 'admin' }),
    },
  };
})();
