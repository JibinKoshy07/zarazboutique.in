/** Shared formatting helpers and DOM/UI utilities used by every page. */
(function () {
  const currency = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });

  const money = (value) => currency.format(Number(value) || 0);

  const escapeHtml = (value) =>
    String(value === null || value === undefined ? '' : value).replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[char]));

  const date = (value) => {
    if (!value) return '—';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const dateTime = (value) => {
    if (!value) return '—';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  /** `Pending` / `Out for Delivery` -> `status-Pending` / `status-Out-for-Delivery`. */
  const statusClass = (value) => `status-${String(value || '').trim().replace(/\s+/g, '-')}`;

  const stars = (rating) => {
    const rounded = Math.round(Number(rating) || 0);
    return '★★★★★'.slice(0, rounded) + '☆☆☆☆☆'.slice(0, 5 - rounded);
  };

  const discount = (price, compareAt) => {
    if (!compareAt || compareAt <= price) return null;
    return Math.round(((compareAt - price) / compareAt) * 100);
  };

  const query = (name) => new URLSearchParams(window.location.search).get(name);

  /* ------------------------------- toasts -------------------------------- */

  const toast = (message, variant = 'info', timeout = 3600) => {
    let stack = document.querySelector('.toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      document.body.appendChild(stack);
    }
    const node = document.createElement('div');
    node.className = `toast ${variant}`;
    node.setAttribute('role', 'status');
    node.textContent = message;
    stack.appendChild(node);
    setTimeout(() => {
      node.style.transition = 'opacity .3s, transform .3s';
      node.style.opacity = '0';
      node.style.transform = 'translateX(30px)';
      setTimeout(() => node.remove(), 320);
    }, timeout);
  };

  /* --------------------------- loading / errors --------------------------- */

  const setBusy = (button, busy, busyLabel) => {
    if (!button) return;
    if (busy) {
      button.dataset.originalHtml = button.innerHTML;
      button.disabled = true;
      button.innerHTML = `<span class="spinner"></span> ${escapeHtml(busyLabel || 'Please wait')}`;
    } else {
      button.disabled = false;
      if (button.dataset.originalHtml) button.innerHTML = button.dataset.originalHtml;
    }
  };

  const renderSkeletons = (container, count = 8) => {
    if (!container) return;
    container.innerHTML = Array.from({ length: count })
      .map(() => '<div class="skeleton skeleton-card"></div>')
      .join('');
  };

  const emptyState = ({ title, message, actionLabel, actionHref, icon = 'bag' }) => `
    <div class="empty-state">
      ${ICONS[icon] || ''}
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(message)}</p>
      ${actionLabel ? `<a class="btn btn-primary" href="${escapeHtml(actionHref || '#')}">${escapeHtml(actionLabel)}</a>` : ''}
    </div>`;

  /** Applies field-level errors returned by the API onto a form. */
  const showFieldErrors = (form, details = []) => {
    clearFieldErrors(form);
    let firstField = null;
    details.forEach((detail) => {
      const input = form.querySelector(`[name="${detail.field}"]`);
      if (!input) return;
      const wrapper = input.closest('.field') || input.parentElement;
      wrapper.classList.add('invalid');
      const errorNode = wrapper.querySelector('.field-error');
      if (errorNode) errorNode.textContent = detail.message;
      if (!firstField) firstField = input;
    });
    if (firstField) firstField.focus();
  };

  const clearFieldErrors = (form) => {
    form.querySelectorAll('.field.invalid').forEach((node) => node.classList.remove('invalid'));
  };

  /** Wires a form to a submit handler with busy state and error surfacing. */
  const handleForm = (form, handler, { busyLabel = 'Please wait' } = {}) => {
    if (!form) return;
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      clearFieldErrors(form);
      const alertBox = form.querySelector('[data-form-alert]');
      if (alertBox) alertBox.classList.add('hidden');
      const submit = form.querySelector('[type="submit"]');
      setBusy(submit, true, busyLabel);
      try {
        await handler(Object.fromEntries(new FormData(form).entries()), form);
      } catch (err) {
        if (err instanceof API.ApiError && err.details && err.details.length) {
          showFieldErrors(form, err.details);
        }
        if (alertBox) {
          alertBox.textContent = err.message || 'Something went wrong.';
          alertBox.classList.remove('hidden');
        } else {
          toast(err.message || 'Something went wrong.', 'error');
        }
      } finally {
        setBusy(submit, false);
      }
    });
  };

  /* ------------------------------ icons ---------------------------------- */

  const ICONS = {
    bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 2l1.5 3M18 2l-1.5 3M3 6h18l-1.4 13.2a2 2 0 01-2 1.8H6.4a2 2 0 01-2-1.8L3 6z"/><path d="M9 10a3 3 0 006 0"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 20s-7-4.4-7-9.4A4.1 4.1 0 0112 8a4.1 4.1 0 017 2.6c0 5-7 9.4-7 9.4z"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 13l4.5 4.5L19 7"/></svg>',
    truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 7h11v10H3zM14 10h4l3 3v4h-7z"/><circle cx="7" cy="18.5" r="1.6"/><circle cx="17.5" cy="18.5" r="1.6"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3l7 3v6c0 4.4-3 8-7 9-4-1-7-4.6-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/></svg>',
    sparkle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/></svg>',
    tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 12l9-9 9 9-9 9z"/><circle cx="9" cy="9" r="1.4"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 3h3l2 5-2.5 1.5a11 11 0 005 5L14 12l5 2v3a2 2 0 01-2.2 2A16 16 0 013 5.2 2 2 0 015 3z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
    box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 7.5L12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5L12 12l9-4.5M12 12v9"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="8" r="3.4"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 5.2A3.4 3.4 0 0116 12M18 20c0-2.6-.8-4.6-2.2-5.8"/></svg>',
    layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/></svg>',
    logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3"/><path d="M10 8l-4 4 4 4M6 12h9"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 5v14M5 12h14"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 20h4l10-10-4-4L4 16z"/><path d="M14 6l4 4"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg>',
  };

  window.UI = {
    money,
    escapeHtml,
    date,
    dateTime,
    statusClass,
    stars,
    discount,
    query,
    toast,
    setBusy,
    renderSkeletons,
    emptyState,
    showFieldErrors,
    clearFieldErrors,
    handleForm,
    ICONS,
  };
})();
