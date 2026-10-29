/**
 * Admin console shell: auth guard, hash routing, navigation and the shared
 * modal/upload plumbing used by every view. Each view module registers itself
 * on `window.AdminPages` and owns its own data loading and rendering.
 */
(function () {
  const { toast, ICONS, modal } = window.AUI;

  const VIEWS = {
    dashboard: { title: 'Dashboard', icon: 'dashboard' },
    products: { title: 'Products', icon: 'products' },
    categories: { title: 'Categories', icon: 'categories' },
    inventory: { title: 'Inventory', icon: 'inventory' },
    orders: { title: 'Orders', icon: 'orders' },
    customers: { title: 'Customers', icon: 'customers' },
    messages: { title: 'Messages', icon: 'messages' },
  };

  const loaded = new Set();

  const currentView = () => {
    const hash = (window.location.hash || '#dashboard').replace('#', '');
    return VIEWS[hash] ? hash : 'dashboard';
  };

  const activate = async (name, { force = false } = {}) => {
    document.querySelectorAll('.view').forEach((view) => view.classList.toggle('active', view.dataset.view === name));
    document.querySelectorAll('[data-nav]').forEach((link) => link.classList.toggle('active', link.dataset.nav === name));
    document.querySelector('[data-page-title]').textContent = VIEWS[name].title;
    document.querySelector('[data-sidebar]').classList.remove('open');

    const page = window.AdminPages && window.AdminPages[name];
    if (!page) return;
    if (loaded.has(name) && !force) return;
    loaded.add(name);
    try {
      await page.render(document.querySelector(`[data-view="${name}"]`));
    } catch (err) {
      loaded.delete(name);
      document.querySelector(`[data-view="${name}"]`).innerHTML = `<div class="alert alert-error">${AUI.escapeHtml(err.message)}</div>`;
    }
  };

  const refresh = (name) => {
    loaded.delete(name);
    if (currentView() === name) activate(name, { force: true });
  };

  /** Rebuilds the sidebar nav with inline SVG icons. */
  const decorateNav = () => {
    document.querySelectorAll('[data-nav]').forEach((link) => {
      const name = link.dataset.nav;
      const existingPill = link.querySelector('.pill');
      const pillHtml = existingPill ? existingPill.outerHTML : '';
      link.innerHTML = `${ICONS[link.dataset.icon] || ''}<span>${AUI.escapeHtml(VIEWS[name].title)}</span>${pillHtml}`;
    });
    document.querySelector('[data-sidebar-toggle]').innerHTML = ICONS.menu;
    document.querySelectorAll('[data-close-modal]').forEach((button) => {
      button.innerHTML = ICONS.close;
      button.addEventListener('click', () => modal.close(button.dataset.closeModal));
    });
    document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
      backdrop.addEventListener('click', (event) => {
        if (event.target === backdrop) modal.close(backdrop.id);
      });
    });
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      document.querySelectorAll('.modal-backdrop.open').forEach((node) => modal.close(node.id));
    });
  };

  const loadAdminProfile = async () => {
    try {
      const { admin } = await AdminAPI.me();
      document.querySelector('[data-admin-name]').textContent = admin.name || 'Admin';
      document.querySelector('[data-admin-email]').textContent = admin.email || '';
      document.querySelector('[data-admin-initial]').textContent = (admin.name || 'A').charAt(0).toUpperCase();
    } catch {
      // The API layer already redirects on 401.
    }
  };

  /** Lightweight badge refresh so the sidebar shows outstanding work. */
  const refreshBadges = async () => {
    try {
      const { stats } = await AdminAPI.dashboard();
      const pending = stats.pendingOrders || 0;
      const pill = document.querySelector('[data-pending-pill]');
      pill.textContent = pending;
      pill.classList.toggle('hidden', pending === 0);

      const { messages } = await AdminAPI.messages();
      const unread = messages.filter((message) => !message.is_read).length;
      const msgPill = document.querySelector('[data-messages-pill]');
      msgPill.textContent = unread;
      msgPill.classList.toggle('hidden', unread === 0);
    } catch {
      /* non-critical */
    }
  };

  const init = async () => {
    if (!AdminAPI.isLoggedIn()) {
      window.location.href = 'login.html';
      return;
    }

    decorateNav();
    document.querySelector('[data-logout]').addEventListener('click', () => {
      AdminAPI.setToken(null);
      window.location.href = 'login.html';
    });
    document.querySelector('[data-sidebar-toggle]').addEventListener('click', () => {
      document.querySelector('[data-sidebar]').classList.toggle('open');
    });
    window.addEventListener('hashchange', () => activate(currentView()));

    await loadAdminProfile();
    await activate(currentView(), { force: true });
    refreshBadges();
    // Keep the outstanding-work badges reasonably fresh.
    setInterval(refreshBadges, 60000);

    window.addEventListener('unhandledrejection', (event) => {
      toast(event.reason?.message || 'Something went wrong.', 'error');
    });
  };

  window.Console = { activate, refresh, refreshBadges, toast };
  document.addEventListener('DOMContentLoaded', init);
})();
