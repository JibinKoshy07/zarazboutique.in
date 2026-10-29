/** Shared admin helpers: formatting, icons, modals, toasts and table rendering. */
(function () {
  const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
  const number = new Intl.NumberFormat('en-IN');

  const money = (value) => currency.format(Number(value) || 0);
  const count = (value) => number.format(Number(value) || 0);

  const escapeHtml = (value) =>
    String(value === null || value === undefined ? '' : value).replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[char]));

  const date = (value) => {
    if (!value) return '—';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const dateTime = (value) => {
    if (!value) return '—';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const ICONS = {
    dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
    orders: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 7.5L12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5L12 12l9-4.5M12 12v9"/></svg>',
    products: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 12l9-9 9 9-9 9z"/><circle cx="9" cy="9" r="1.5"/></svg>',
    categories: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/></svg>',
    customers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16.5 5.5a3.5 3.5 0 010 7"/></svg>',
    inventory: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
    messages: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
    logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3"/><path d="M10 8l-4 4 4 4M6 12h9"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M12 5v14M5 12h14"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 20h4l10-10-4-4L4 16z"/><path d="M14 6l4 4"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    money: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
    box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 7.5L12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5L12 12l9-4.5"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
  };

  const toast = (message, variant = 'info', timeout = 3400) => {
    let stack = document.querySelector('.toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      document.body.appendChild(stack);
    }
    const node = document.createElement('div');
    node.className = `toast ${variant}`;
    node.textContent = message;
    stack.appendChild(node);
    setTimeout(() => {
      node.style.transition = 'opacity .25s, transform .25s';
      node.style.opacity = '0';
      node.style.transform = 'translateX(20px)';
      setTimeout(() => node.remove(), 260);
    }, timeout);
  };

  const setBusy = (button, busy, label) => {
    if (!button) return;
    if (busy) {
      button.dataset.originalHtml = button.innerHTML;
      button.disabled = true;
      button.innerHTML = `<span class="spinner"></span> ${escapeHtml(label || 'Working')}`;
    } else {
      button.disabled = false;
      if (button.dataset.originalHtml) button.innerHTML = button.dataset.originalHtml;
    }
  };

  const badgeFor = (value) => {
    const map = {
      Pending: 'badge-warn',
      Confirmed: 'badge-info',
      Processing: 'badge-maroon',
      Shipped: 'badge-info',
      Delivered: 'badge-success',
      Cancelled: 'badge-danger',
      Returned: 'badge-danger',
      Paid: 'badge-success',
      Failed: 'badge-danger',
      Refunded: 'badge-info',
    };
    return `<span class="badge ${map[value] || ''}">${escapeHtml(value || '—')}</span>`;
  };

  const stockBadge = (stock, threshold = 5) => {
    if (stock === 0) return '<span class="badge badge-danger">Out of stock</span>';
    if (stock <= threshold) return `<span class="badge badge-warn">Low · ${stock}</span>`;
    return `<span class="badge badge-success">${stock} in stock</span>`;
  };

  const skeletonRows = (rows = 6, cols = 5) =>
    Array.from({ length: rows })
      .map(() => `<tr>${Array.from({ length: cols }).map(() => '<td><div class="skeleton" style="height:16px"></div></td>').join('')}</tr>`)
      .join('');

  const emptyRow = (colspan, message, actionLabel, actionAttr) => `
    <tr><td colspan="${colspan}">
      <div class="empty">
        ${ICONS.box}
        <h3>Nothing to show</h3>
        <p>${escapeHtml(message)}</p>
        ${actionLabel ? `<button class="btn btn-primary btn-sm" type="button" ${actionAttr}>${escapeHtml(actionLabel)}</button>` : ''}
      </div>
    </td></tr>`;

  /** Small promise-based confirm dialog so destructive actions stay intentional. */
  const confirmAction = (message, { title = 'Please confirm', confirmLabel = 'Confirm', danger = true } = {}) =>
    new Promise((resolve) => {
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop open';
      backdrop.innerHTML = `
        <div class="modal" style="max-width:420px">
          <div class="modal-head"><h2>${escapeHtml(title)}</h2></div>
          <div class="modal-body"><p style="margin:0">${escapeHtml(message)}</p></div>
          <div class="modal-foot">
            <button class="btn btn-outline" type="button" data-cancel>Cancel</button>
            <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" type="button" data-confirm>${escapeHtml(confirmLabel)}</button>
          </div>
        </div>`;
      document.body.appendChild(backdrop);
      const finish = (result) => {
        backdrop.remove();
        resolve(result);
      };
      backdrop.querySelector('[data-cancel]').addEventListener('click', () => finish(false));
      backdrop.querySelector('[data-confirm]').addEventListener('click', () => finish(true));
      backdrop.addEventListener('click', (event) => {
        if (event.target === backdrop) finish(false);
      });
    });

  const modal = {
    open(id) {
      const node = document.getElementById(id);
      if (node) {
        node.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
    },
    close(id) {
      const node = document.getElementById(id);
      if (node) {
        node.classList.remove('open');
        document.body.style.overflow = '';
      }
    },
  };

  const clearFieldErrors = (form) => form.querySelectorAll('.field.invalid').forEach((n) => n.classList.remove('invalid'));

  const showFieldErrors = (form, details = []) => {
    clearFieldErrors(form);
    details.forEach((detail) => {
      const input = form.querySelector(`[name="${detail.field}"]`);
      if (!input) return;
      const wrapper = input.closest('.field') || input.parentElement;
      wrapper.classList.add('invalid');
      const errorNode = wrapper.querySelector('.field-error');
      if (errorNode) errorNode.textContent = detail.message;
    });
  };

  const debounce = (fn, delay = 350) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  };

  const pagination = (container, { page, pages, total }, onGo) => {
    if (!container) return;
    if (!pages || pages <= 1) {
      container.innerHTML = total ? `<span class="page-info">${count(total)} record${total === 1 ? '' : 's'}</span>` : '';
      return;
    }
    const buttons = [`<button type="button" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>‹</button>`];
    for (let i = 1; i <= pages; i += 1) {
      if (i === 1 || i === pages || Math.abs(i - page) <= 1) {
        buttons.push(`<button type="button" data-page="${i}" class="${i === page ? 'active' : ''}">${i}</button>`);
      } else if (Math.abs(i - page) === 2) {
        buttons.push('<button type="button" disabled>…</button>');
      }
    }
    buttons.push(`<button type="button" data-page="${page + 1}" ${page >= pages ? 'disabled' : ''}>›</button>`);
    container.innerHTML = `<span class="page-info">${count(total)} records · page ${page} of ${pages}</span>${buttons.join('')}`;
    container.querySelectorAll('[data-page]').forEach((button) => {
      button.addEventListener('click', () => onGo(Number(button.dataset.page)));
    });
  };

  window.AUI = {
    money, count, escapeHtml, date, dateTime, ICONS, toast, setBusy, badgeFor, stockBadge,
    skeletonRows, emptyRow, confirmAction, modal, clearFieldErrors, showFieldErrors, debounce, pagination,
  };
})();
