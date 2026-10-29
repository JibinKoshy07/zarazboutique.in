/**
 * Account area: profile details, order history with tracking, and the address book.
 * Tabs are driven by `?tab=` so links can deep-link straight to orders.
 */
(function () {
  const { money, escapeHtml, date, dateTime, statusClass, toast, emptyState, ICONS, handleForm } = window.UI;

  const state = { tab: 'orders', orders: [], addresses: [], loading: true };
  const root = () => document.querySelector('[data-account-root]');

  const TABS = [
    { id: 'orders', label: 'My orders' },
    { id: 'addresses', label: 'Addresses' },
    { id: 'profile', label: 'Profile' },
  ];

  /* ------------------------------ order rendering -------------------------- */

  const orderCard = (order) => `
    <div class="order-card">
      <div class="order-card-head">
        <span class="order-no">${escapeHtml(order.orderNumber)}</span>
        <span class="status ${statusClass(order.status)}">${escapeHtml(order.status)}</span>
        <span class="status ${statusClass(order.paymentStatus)}">${escapeHtml(order.paymentStatus)}</span>
        <span class="spacer muted small">${date(order.createdAt)}</span>
      </div>
      <div class="order-card-body">
        <div class="order-thumbs">
          ${order.items.slice(0, 5).map((item) => `<img src="${escapeHtml(item.productImage || '')}" alt="${escapeHtml(item.productName)}" loading="lazy" />`).join('')}
        </div>
        <p class="small muted" style="margin-bottom:10px">
          ${order.items.map((item) => `${escapeHtml(item.productName)} × ${item.quantity}`).join(' · ')}
        </p>
        <div class="order-card-foot">
          <strong>${money(order.total)}</strong>
          <span class="muted small">${order.itemCount} item${order.itemCount > 1 ? 's' : ''} · ${escapeHtml(order.paymentMethod)}</span>
          <div style="margin-left:auto;display:flex;gap:10px;flex-wrap:wrap">
            <button class="btn btn-ghost btn-sm" type="button" data-track="${order.id}">Track order</button>
            ${['Pending', 'Confirmed', 'Processing'].includes(order.status) ? `<button class="btn btn-ghost btn-sm" type="button" data-cancel="${order.id}">Cancel</button>` : ''}
          </div>
        </div>
        <div class="hidden" data-track-panel="${order.id}" style="margin-top:16px;border-top:1px solid var(--line);padding-top:16px">
          <div class="timeline">
            ${(order.statusHistory || [])
              .map(
                (entry) => `
              <div class="tl-item done">
                <div class="tl-dot">${ICONS.check}</div>
                <div>
                  <div class="tl-status">${escapeHtml(entry.status)}</div>
                  <div class="tl-time">${dateTime(entry.createdAt)} · ${escapeHtml(entry.actor === 'customer' ? 'You' : 'Zaraz team')}</div>
                  ${entry.note ? `<div class="tl-note">${escapeHtml(entry.note)}</div>` : ''}
                </div>
              </div>`
              )
              .join('')}
          </div>
          ${order.trackingNumber ? `<p class="small"><strong>Tracking number:</strong> ${escapeHtml(order.trackingNumber)}</p>` : ''}
        </div>
      </div>
    </div>`;

  /* ------------------------------- tab content ---------------------------- */

  const ordersPanel = () => {
    if (state.loading) return '<div class="panel"><div class="skeleton skeleton-line" style="width:40%"></div><div class="skeleton" style="height:120px;margin-top:14px"></div></div>';
    if (!state.orders.length) {
      return `<div class="panel">${emptyState({ title: 'No orders yet', message: 'When you place your first order it will appear here with live status updates.', actionLabel: 'Start shopping', actionHref: 'shop.html', icon: 'box' })}</div>`;
    }
    return `
      <div class="panel-head" style="margin-bottom:16px">
        <h3 style="margin:0">${state.orders.length} order${state.orders.length > 1 ? 's' : ''}</h3>
      </div>
      ${state.orders.map(orderCard).join('')}`;
  };

  const addressCard = (address) => `
    <div class="address-card">
      <div class="addr-head">
        <strong>${escapeHtml(address.label || 'Address')}</strong>
        ${address.isDefault ? '<span class="default-pill">Default</span>' : ''}
      </div>
      <p>${escapeHtml(address.fullName)} · ${escapeHtml(address.phone)}</p>
      <p>${escapeHtml(address.line1)}${address.line2 ? `, ${escapeHtml(address.line2)}` : ''}</p>
      <p>${escapeHtml(address.city)}, ${escapeHtml(address.state)} ${escapeHtml(address.postalCode)}</p>
      <p>${escapeHtml(address.country)}</p>
      <div class="addr-actions">
        <button class="link-btn" type="button" data-edit-address="${address.id}">Edit</button>
        <button class="link-btn" type="button" data-delete-address="${address.id}">Delete</button>
        ${!address.isDefault ? `<button class="link-btn" type="button" data-default-address="${address.id}">Make default</button>` : ''}
      </div>
    </div>`;

  const addressesPanel = () => `
    <div class="panel">
      <div class="panel-head">
        <h3>Delivery addresses</h3>
        <button class="btn btn-primary btn-sm" type="button" data-add-address>${ICONS.plus} Add address</button>
      </div>
      ${state.addresses.length
        ? `<div class="address-list">${state.addresses.map(addressCard).join('')}</div>`
        : `<p class="muted">No addresses saved yet. Add one to speed up checkout.</p>`}
    </div>`;

  const profilePanel = () => {
    const user = Store.state.user || {};
    return `
      <div class="panel">
        <div class="panel-head"><h3>Personal details</h3></div>
        <div class="alert alert-error hidden" data-form-alert role="alert"></div>
        <form data-profile-form novalidate>
          <div class="form-row">
            <div class="field">
              <label for="pf-name">Full name <span class="req">*</span></label>
              <input class="input" id="pf-name" name="name" required value="${escapeHtml(user.name || '')}" />
              <div class="field-error"></div>
            </div>
            <div class="field">
              <label for="pf-phone">Phone</label>
              <input class="input" id="pf-phone" name="phone" value="${escapeHtml(user.phone || '')}" placeholder="+91 98765 43210" />
              <div class="field-error"></div>
            </div>
          </div>
          <div class="field">
            <label for="pf-email">Email address</label>
            <input class="input" id="pf-email" name="email" value="${escapeHtml(user.email || '')}" disabled />
            <div class="field-error"></div>
            <p class="small muted" style="margin-top:6px">Email addresses cannot be changed. Contact us if you need help.</p>
          </div>
          <button class="btn btn-primary" type="submit">Save changes</button>
        </form>
      </div>

      <div class="panel">
        <div class="panel-head"><h3>Change password</h3></div>
        <div class="alert alert-error hidden" data-form-alert role="alert"></div>
        <form data-password-form novalidate>
          <div class="form-row">
            <div class="field">
              <label for="pw-current">Current password <span class="req">*</span></label>
              <input class="input" id="pw-current" name="currentPassword" type="password" required autocomplete="current-password" />
              <div class="field-error"></div>
            </div>
            <div class="field">
              <label for="pw-new">New password <span class="req">*</span></label>
              <input class="input" id="pw-new" name="newPassword" type="password" required autocomplete="new-password" placeholder="At least 8 characters" />
              <div class="field-error"></div>
            </div>
          </div>
          <button class="btn btn-primary" type="submit">Update password</button>
        </form>
      </div>

      <div class="panel">
        <div class="panel-head"><h3>Session</h3></div>
        <p class="muted small">Signed in as ${escapeHtml(user.email || '')}.</p>
        <button class="btn btn-ghost" type="button" data-logout>${ICONS.logout} Sign out</button>
      </div>`;
  };

  /* --------------------------------- render ------------------------------- */

  const render = () => {
    if (!Store.state.user) {
      root().innerHTML = emptyState({
        title: 'Sign in to view your account',
        message: 'Sign in to see your orders, saved addresses and profile details.',
        actionLabel: 'Sign in',
        actionHref: 'login.html',
        icon: 'user',
      });
      return;
    }

    root().innerHTML = `
      <div class="split">
        <aside class="panel" style="position:sticky;top:calc(var(--header-h) + 20px)">
          <div style="text-align:center;padding-bottom:16px;border-bottom:1px solid var(--line);margin-bottom:14px">
            <div style="width:58px;height:58px;border-radius:50%;background:var(--maroon);color:var(--gold-light);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:1.5rem;margin:0 auto 10px">
              ${escapeHtml((Store.state.user.name || 'Z').charAt(0).toUpperCase())}
            </div>
            <strong style="display:block;color:var(--maroon-deep)">${escapeHtml(Store.state.user.name)}</strong>
            <span class="small muted">${escapeHtml(Store.state.user.email)}</span>
          </div>
          <nav class="account-nav">
            ${TABS.map((tab) => `<button type="button" class="${tab.id === state.tab ? 'active' : ''}" data-tab="${tab.id}">${tab.label}</button>`).join('')}
            <button type="button" data-logout>${ICONS.logout} Sign out</button>
          </nav>
        </aside>
        <div>
          ${state.tab === 'orders' ? ordersPanel() : ''}
          ${state.tab === 'addresses' ? addressesPanel() : ''}
          ${state.tab === 'profile' ? profilePanel() : ''}
        </div>
      </div>`;
  };

  /* ------------------------------ address form ---------------------------- */

  const openAddressForm = (address = null) => {
    const form = document.querySelector('[data-address-form]');
    form.reset();
    UI.clearFieldErrors(form);
    form.querySelector('[data-form-alert]').classList.add('hidden');
    document.querySelector('[data-address-title]').textContent = address ? 'Edit delivery address' : 'Add delivery address';

    if (address) {
      Object.entries(address).forEach(([key, value]) => {
        const input = form.querySelector(`[name="${key}"]`);
        if (!input) return;
        if (input.type === 'checkbox') input.checked = Boolean(value);
        else input.value = value ?? '';
      });
    } else {
      form.querySelector('[name="country"]').value = 'India';
      form.querySelector('[name="label"]').value = 'Home';
      form.querySelector('[name="full_name"]').value = Store.state.user?.name || '';
      form.querySelector('[name="phone"]').value = Store.state.user?.phone || '';
      form.querySelector('[name="is_default"]').checked = state.addresses.length === 0;
    }
    document.querySelector('[data-address-panel]').classList.add('open');
    document.querySelector('[data-address-backdrop]').classList.add('open');
    document.body.classList.add('no-scroll');
  };

  const closeAddressForm = () => {
    document.querySelector('[data-address-panel]').classList.remove('open');
    document.querySelector('[data-address-backdrop]').classList.remove('open');
    document.body.classList.remove('no-scroll');
  };

  /* --------------------------------- data --------------------------------- */

  const loadOrders = async () => {
    try {
      const { orders } = await API.orders();
      state.orders = orders;
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const loadAddresses = async () => {
    try {
      const { addresses } = await API.addresses();
      state.addresses = addresses;
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  /* --------------------------------- events ------------------------------- */

  const mountEvents = () => {
    root().addEventListener('click', async (event) => {
      const tab = event.target.closest('[data-tab]');
      if (tab) {
        state.tab = tab.dataset.tab;
        const url = new URL(window.location);
        url.searchParams.set('tab', state.tab);
        window.history.replaceState({}, '', url);
        render();
        mountForms();
        return;
      }

      const track = event.target.closest('[data-track]');
      if (track) {
        const panel = root().querySelector(`[data-track-panel="${track.dataset.track}"]`);
        panel.classList.toggle('hidden');
        track.textContent = panel.classList.contains('hidden') ? 'Track order' : 'Hide tracking';
        return;
      }

      const cancel = event.target.closest('[data-cancel]');
      if (cancel) {
        if (!window.confirm('Cancel this order? Reserved stock will be released.')) return;
        try {
          await API.cancelOrder(Number(cancel.dataset.cancel));
          await loadOrders();
          render();
          mountForms();
          toast('Order cancelled.', 'info');
        } catch (err) {
          toast(err.message, 'error');
        }
        return;
      }

      if (event.target.closest('[data-add-address]')) return openAddressForm();

      const edit = event.target.closest('[data-edit-address]');
      if (edit) {
        return openAddressForm(state.addresses.find((a) => a.id === Number(edit.dataset.editAddress)));
      }

      const del = event.target.closest('[data-delete-address]');
      if (del) {
        if (!window.confirm('Delete this address?')) return;
        try {
          await API.deleteAddress(Number(del.dataset.deleteAddress));
          await loadAddresses();
          render();
          mountForms();
          toast('Address deleted.', 'info');
        } catch (err) {
          toast(err.message, 'error');
        }
        return;
      }

      const makeDefault = event.target.closest('[data-default-address]');
      if (makeDefault) {
        try {
          await API.setDefaultAddress(Number(makeDefault.dataset.defaultAddress));
          await loadAddresses();
          render();
          mountForms();
          toast('Default address updated.', 'success');
        } catch (err) {
          toast(err.message, 'error');
        }
        return;
      }

      if (event.target.closest('[data-logout]')) {
        event.preventDefault();
        Store.logout();
      }
    });

    document.querySelector('[data-address-close]').addEventListener('click', closeAddressForm);
    document.querySelector('[data-address-backdrop]').addEventListener('click', closeAddressForm);
  };

  /** Forms are re-created on every render, so bind after each one. */
  const mountForms = () => {
    const profileForm = root().querySelector('[data-profile-form]');
    if (profileForm) {
      handleForm(profileForm, async (values) => {
        const { user } = await API.updateProfile({ name: values.name.trim(), phone: values.phone ? values.phone.trim() : null });
        Store.state.user = user;
        render();
        mountForms();
        toast('Profile updated.', 'success');
      }, { busyLabel: 'Saving' });
    }

    const passwordForm = root().querySelector('[data-password-form]');
    if (passwordForm) {
      handleForm(passwordForm, async (values) => {
        await API.changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword });
        passwordForm.reset();
        toast('Password updated successfully.', 'success');
      }, { busyLabel: 'Updating' });
    }
  };

  const init = async () => {
    state.tab = UI.query('tab') || 'orders';
    if (!TABS.some((t) => t.id === state.tab)) state.tab = 'orders';

    await Store.init();
    if (!Store.state.user) {
      render();
      return;
    }

    render();

    handleForm(document.querySelector('[data-address-form]'), async (values) => {
      const payload = {
        label: values.label || 'Home',
        full_name: values.full_name,
        phone: values.phone,
        line1: values.line1,
        line2: values.line2 || undefined,
        city: values.city,
        state: values.state,
        postal_code: values.postal_code,
        country: values.country || 'India',
        is_default: values.is_default === 'on',
      };
      if (values.id) await API.updateAddress(Number(values.id), payload);
      else await API.createAddress(payload);
      closeAddressForm();
      await loadAddresses();
      render();
      mountForms();
      toast(values.id ? 'Address updated.' : 'Address saved.', 'success');
    }, { busyLabel: 'Saving' });

    state.loading = true;
    render();
    await Promise.all([loadOrders(), loadAddresses()]);
    state.loading = false;
    render();
    mountForms();
    mountEvents();
  };

  document.addEventListener('DOMContentLoaded', init);
})();
