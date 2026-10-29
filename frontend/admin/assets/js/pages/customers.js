/** Customers view: list with spend/order counts and a profile detail modal. */
(function () {
  const {
    money, count, escapeHtml, date, dateTime, badgeFor, skeletonRows, emptyRow,
    modal, toast, pagination, debounce,
  } = window.AUI;

  const state = { page: 1, limit: 20, q: '', total: 0, pages: 1, items: [] };
  let bound = false;

  const load = async () => {
    const tbody = document.querySelector('[data-customers-body]');
    tbody.innerHTML = skeletonRows(6, 6);
    const response = await AdminAPI.customers({ page: state.page, limit: state.limit, q: state.q });
    state.items = response.customers;
    state.total = response.pagination.total;
    state.pages = response.pagination.pages;
    renderRows();
  };

  const renderRows = () => {
    const tbody = document.querySelector('[data-customers-body]');
    if (!state.items.length) {
      tbody.innerHTML = emptyRow(6, 'No customers match your search.');
    } else {
      tbody.innerHTML = state.items
        .map(
          (customer) => `
        <tr>
          <td>
            <div class="cell-strong">${escapeHtml(customer.name)}</div>
            <div class="cell-sub">${escapeHtml(customer.email)}</div>
          </td>
          <td class="cell-sub">${escapeHtml(customer.phone || '—')}</td>
          <td class="nowrap">${count(customer.orderCount)}<div class="cell-sub">${money(customer.totalSpent)}</div></td>
          <td class="nowrap cell-sub">${date(customer.lastOrderAt)}</td>
          <td>${customer.isActive ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-danger">Disabled</span>'}</td>
          <td class="actions">
            <button class="btn btn-outline btn-sm" type="button" data-view-customer="${customer.id}">View</button>
            <button class="btn ${customer.isActive ? 'btn-ghost-danger' : 'btn-outline'} btn-sm" type="button" data-toggle-customer="${customer.id}" data-active="${customer.isActive}">
              ${customer.isActive ? 'Disable' : 'Enable'}
            </button>
          </td>
        </tr>`
        )
        .join('');
    }
    document.querySelector('[data-customers-count]').textContent = state.total ? `${count(state.total)} customer${state.total === 1 ? '' : 's'}` : '';
    pagination(document.querySelector('[data-customers-pagination]'), { page: state.page, pages: state.pages, total: state.total }, (page) => {
      state.page = page;
      load();
    });
  };

  const open = async (customerId) => {
    const host = document.querySelector('[data-customer-detail]');
    host.innerHTML = '<div class="skeleton skeleton-row"></div><div class="skeleton" style="height:140px"></div>';
    modal.open('customer-modal');
    try {
      const data = await AdminAPI.customer(customerId);
      renderDetail(data);
    } catch (err) {
      host.innerHTML = `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
    }
  };

  const renderDetail = ({ customer, addresses, orders, stats }) => {
    document.querySelector('[data-customer-detail]').innerHTML = `
      <div class="flex gap-12 items-center wrap" style="margin-bottom:16px">
        <h3 class="mb-0">${escapeHtml(customer.name)}</h3>
        ${customer.isActive ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-danger">Disabled</span>'}
        <span class="small muted" style="margin-left:auto">Joined ${date(customer.createdAt)}</span>
      </div>

      <div class="detail-grid">
        <div class="detail-block">
          <h4>Contact</h4>
          <p>${escapeHtml(customer.email)}</p>
          <p>${escapeHtml(customer.phone || 'No phone on file')}</p>
        </div>
        <div class="detail-block">
          <h4>Lifetime value</h4>
          <div class="kv"><span>Orders</span><strong>${count(stats?.orderCount ?? customer.orderCount)}</strong></div>
          <div class="kv"><span>Total spent</span><strong>${money(stats?.totalSpent ?? customer.totalSpent)}</strong></div>
          <div class="kv"><span>Average order</span><strong>${money(stats?.averageOrderValue || 0)}</strong></div>
        </div>
        <div class="detail-block">
          <h4>Addresses (${addresses.length})</h4>
          ${addresses.length
            ? addresses
                .map(
                  (address) => `
            <p>
              <strong>${escapeHtml(address.label || 'Address')}</strong>${address.isDefault ? ' · default' : ''}<br />
              ${escapeHtml(address.line1)}${address.line2 ? `, ${escapeHtml(address.line2)}` : ''}<br />
              ${escapeHtml(address.city)}, ${escapeHtml(address.state)} ${escapeHtml(address.postalCode)}
            </p>`
                )
                .join('')
            : '<p class="muted small mb-0">No saved addresses.</p>'}
        </div>
        <div class="detail-block">
          <h4>Account</h4>
          <div class="kv"><span>Customer ID</span><strong>#${customer.id}</strong></div>
          <div class="kv"><span>Role</span><strong>${escapeHtml(customer.role || 'customer')}</strong></div>
          <div class="kv"><span>Last order</span><strong>${date(customer.lastOrderAt)}</strong></div>
        </div>
      </div>

      <div class="card" style="margin-top:18px">
        <div class="card-head"><h3>Order history</h3></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Order</th><th>Placed</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead>
            <tbody>
              ${orders.length
                ? orders
                    .map(
                      (order) => `
                <tr>
                  <td class="cell-strong">${escapeHtml(order.orderNumber)}</td>
                  <td class="nowrap cell-sub">${dateTime(order.createdAt)}</td>
                  <td>${money(order.total)}</td>
                  <td>${badgeFor(order.paymentStatus)}</td>
                  <td>${badgeFor(order.status)}</td>
                </tr>`
                    )
                    .join('')
                : '<tr><td colspan="5"><div class="empty"><h3>No orders</h3><p>This customer has not ordered yet.</p></div></td></tr>'}
            </tbody>
          </table>
        </div>
      </div>`;
  };

  const bind = () => {
    if (bound) return;
    bound = true;

    const view = document.querySelector('[data-view="customers"]');
    view.addEventListener('click', async (event) => {
      const openBtn = event.target.closest('[data-view-customer]');
      if (openBtn) return open(Number(openBtn.dataset.viewCustomer));

      const toggle = event.target.closest('[data-toggle-customer]');
      if (toggle) {
        const isActive = toggle.dataset.active !== 'true';
        try {
          await AdminAPI.setCustomerActive(Number(toggle.dataset.toggleCustomer), isActive);
          toast(isActive ? 'Customer enabled.' : 'Customer disabled.', 'success');
          await load();
        } catch (err) {
          toast(err.message, 'error');
        }
      }
    });

    view.addEventListener('input', debounce((event) => {
      if (event.target.matches('[data-customer-search]')) {
        state.q = event.target.value.trim();
        state.page = 1;
        load();
      }
    }, 400));
  };

  const render = async (host) => {
    host.innerHTML = `
      <div class="card">
        <div class="toolbar">
          <input class="input search" type="search" placeholder="Search by name, email or phone…" data-customer-search aria-label="Search customers" />
          <span class="small muted" data-customers-count></span>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Customer</th><th>Phone</th><th>Orders / spent</th><th>Last order</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody data-customers-body></tbody>
          </table>
        </div>
        <div class="pagination" data-customers-pagination></div>
      </div>`;
    await load();
    bind();
  };

  window.AdminPages = window.AdminPages || {};
  window.AdminPages.customers = { render, open };
})();
