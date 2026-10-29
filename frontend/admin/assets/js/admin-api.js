/**
 * Admin API client.
 *
 * Uses the same same-origin `/api` base as the storefront, so the console works
 * identically on localhost, in Docker, and behind any proxy. Admin tokens live
 * under a separate storage key from customer tokens.
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
  const base = override || (isFile ? 'http://localhost:4000/api' : `${window.location.origin}/api`);

  const TOKEN_KEY = 'zaraz_admin_token';

  const getToken = () => localStorage.getItem(TOKEN_KEY);
  const setToken = (token) => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  };

  class ApiError extends Error {
    constructor(message, status, details) {
      super(message);
      this.status = status;
      this.details = details || [];
    }
  }

  const request = async (path, { method = 'GET', body, headers = {} } = {}) => {
    const isFormData = body instanceof FormData;
    const finalHeaders = { ...headers };
    if (!isFormData && body !== undefined) finalHeaders['Content-Type'] = 'application/json';
    const token = getToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;

    let response;
    try {
      response = await fetch(`${base}${path}`, {
        method,
        headers: finalHeaders,
        body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
      });
    } catch {
      throw new ApiError('Cannot reach the server. Please check your connection.', 0);
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
      // Any 401 on a protected route means the session is gone.
      if (response.status === 401 && !/\/admin\/login$/.test(path)) {
        setToken(null);
        if (!/login\.html$/.test(window.location.pathname)) window.location.href = 'login.html';
      }
      throw new ApiError(payload?.error?.message || `Request failed (${response.status})`, response.status, payload?.error?.details);
    }
    return payload;
  };

  const qs = (params = {}) => {
    const search = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    return search ? `?${search}` : '';
  };

  window.AdminAPI = {
    base,
    ApiError,
    getToken,
    setToken,
    isLoggedIn: () => Boolean(getToken()),

    login: (payload) => request('/admin/login', { method: 'POST', body: payload }),
    me: () => request('/admin/me'),
    dashboard: () => request('/admin/dashboard'),

    categories: () => request('/admin/categories'),
    createCategory: (payload) => request('/admin/categories', { method: 'POST', body: payload }),
    updateCategory: (id, payload) => request(`/admin/categories/${id}`, { method: 'PUT', body: payload }),
    deleteCategory: (id) => request(`/admin/categories/${id}`, { method: 'DELETE' }),

    products: (params) => request(`/admin/products${qs(params)}`),
    product: (id) => request(`/admin/products/${id}`),
    createProduct: (payload) => request('/admin/products', { method: 'POST', body: payload }),
    updateProduct: (id, payload) => request(`/admin/products/${id}`, { method: 'PUT', body: payload }),
    deleteProduct: (id) => request(`/admin/products/${id}`, { method: 'DELETE' }),
    setStock: (id, payload) => request(`/admin/products/${id}/stock`, { method: 'PATCH', body: payload }),
    uploadImages: (formData) => request('/admin/uploads', { method: 'POST', body: formData }),

    orders: (params) => request(`/admin/orders${qs(params)}`),
    order: (id) => request(`/admin/orders/${id}`),
    setOrderStatus: (id, payload) => request(`/admin/orders/${id}/status`, { method: 'PUT', body: payload }),
    setPaymentStatus: (id, payload) => request(`/admin/orders/${id}/payment-status`, { method: 'PUT', body: payload }),

    customers: (params) => request(`/admin/customers${qs(params)}`),
    customer: (id) => request(`/admin/customers/${id}`),
    setCustomerActive: (id, isActive) => request(`/admin/customers/${id}/status`, { method: 'PATCH', body: { isActive } }),

    inventory: (params) => request(`/admin/inventory${qs(params)}`),

    messages: () => request('/admin/messages'),
    markMessage: (id, isRead) => request(`/admin/messages/${id}`, { method: 'PATCH', body: { isRead } }),
  };
})();
