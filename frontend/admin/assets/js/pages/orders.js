/**
 * Orders view: search, status/payment filters, pagination, a detailed order
 * modal and inline status updates that append to the order history.
 */
(function () {
  const {
    money, count, escapeHtml, date, dateTime, badgeFor, skeletonRows, emptyRow,
    modal, toast, pagination, debounce, setBusy,
  } = window.AUI;

  const STATUSES = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned', 'Refunded'];
  const PAYMENT_STATUSES = ['Pending', 'Paid', 'Failed', 'Refunded'];

  const state = { page: 1, limit: 20, q: '', status: '', paymentStatus: '', total: 0, pages: 1, items: [], current: null };
  let bound = false;

  const load = async () => {
    const tbody = document.querySelector('[data-orders-body]');
    tbody.innerHTML = skeletonRows(6, 7);
    const response = await AdminAPI.orders({
      page: state.page,
      limit: state.limit,
      q: state.q,
      status: state.status,
      paymentStatus: state.paymentStatus,
    });
    state.items = response.orders;
    state.total = response.pagination.total;
    state.pages = response.pagination.pages;
    renderRows();
  };

  const renderRows = () => {
    const tbody = document.querySelector('[data-orders-body]');
    if (!state.items.length) {
      tbody.innerHTML = emptyRow(7, 'No orders match these filters.');
    } else {
      tbody.innerHTML = state.items
        .map(
          (order) => `
        <tr>
          <td>
            <div class="cell-strong">${escapeHtml(order.orderNumber)}</div>
            <div class="cell-sub">${date(order.createdAt)}</div>
          </td>
          <td>
            <div class="cell-strong">${escapeHtml(order.customer?.name || '—')}</div>
            <div class="cell-sub">${escapeHtml(order.customer?.email || '')}</div>
          </td>
          <td class="cell-sub nowrap">${escapeHtml(order.shippingAddress?.city || '—')}<br />${escapeHtml(order.shippingAddress?.state || '')}</td>
          <td class="nowrap">${order.itemCount} item${order.itemCount === 1 ? '' : 's'}<div class="cell-sub">${money(order.total)}</div></td>
          <td class="cell-sub nowrap">${escapeHtml(order.paymentMethod)}<div style="margin-top:4px">${badgeFor(order.paymentStatus)}</div></td>
          <td>${badgeFor(order.status)}</td>
          <td class="actions">
            <button class="btn btn-outline btn-sm" type="button" data-view-order="${order.id}">View</button>
            <button class="btn btn-outline btn-sm" type="button" data-quick-status="${order.id}">Update</button>
          </td>
        </tr>`
        )
        .join('');
    }

    document.querySelector('[data-orders-count]').textContent = state.total ? `${count(state.total)} order${state.total === 1 ? '' : 's'}` : '';
    pagination(document.querySelector('[data-orders-pagination]'), { page: state.page, pages: state.pages, total: state.total }, (page) => {
      state.page = page;
      load();
    });
  };

  /* ------------------------------ detail modal ---------------------------- */

  const openDetail = async (orderId) => {
    const host = document.querySelector('[data-order-detail]');
    host.innerHTML = '<div class="skeleton skeleton-row"></div><div class="skeleton" style="height:160px"></div>';
    modal.open('order-modal');
    try {
      const { order } = await AdminAPI.order(orderId);
      state.current = order;
      renderDetail(order);
    } catch (err) {
      host.innerHTML = `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
    }
  };

  const renderDetail = (order) => {
    const address = order.shippingAddress || {};
    document.querySelector('[data-order-detail]').innerHTML = `
      <div class="flex gap-12 items-center wrap" style="margin-bottom:16px">
        <h3 class="mb-0">${escapeHtml(order.orderNumber)}</h3>
        ${badgeFor(order.status)}
        ${badgeFor(order.paymentStatus)}
        <span class="small muted" style="margin-left:auto">Placed ${dateTime(order.createdAt)}</span>
      </div>

      <div class="detail-grid">
        <div class="detail-block">
          <h4>Customer</h4>
          <p><strong>${escapeHtml(order.customer?.name || '—')}</strong></p>
          <p>${escapeHtml(order.customer?.email || '')}</p>
          <p>${escapeHtml(order.customer?.phone || order.shippingAddress?.phone || '')}</p>
          ${order.customer?.id ? `<p><a href="#customers" data-goto-customer="${order.customer.id}">View customer profile →</a></p>` : ''}
        </div>
        <div class="detail-block">
          <h4>Delivery address</h4>
          <p><strong>${escapeHtml(address.fullName || order.customer?.name || '')}</strong></p>
          <p>${escapeHtml(address.line1 || '')}${address.line2 ? `, ${escapeHtml(address.line2)}` : ''}</p>
          <p>${escapeHtml(address.city || '')}, ${escapeHtml(address.state || '')} ${escapeHtml(address.postalCode || '')}</p>
          <p>${escapeHtml(address.country || 'India')}</p>
          <p>${escapeHtml(address.phone || '')}</p>
        </div>
        <div class="detail-block">
          <h4>Payment</h4>
          <div class="kv"><span>Method</span><strong>${escapeHtml(order.paymentMethod)}</strong></div>
          <div class="kv"><span>Status</span><strong>${escapeHtml(order.paymentStatus)}</strong></div>
          <div class="kv"><span>Subtotal</span><strong>${money(order.subtotal)}</strong></div>
          <div class="kv"><span>Shipping</span><strong>${order.shippingFee === 0 ? 'Free' : money(order.shippingFee)}</strong></div>
          <div class="kv"><span>Total</span><strong>${money(order.total)}</strong></div>
          <div class="field" style="margin-top:10px">
            <label for="od-payment">Update payment status</label>
            <select class="select" id="od-payment" data-payment-select>
              ${PAYMENT_STATUSES.map((status) => `<option value="${status}" ${status === order.paymentStatus ? 'selected' : ''}>${status}</option>`).join('')}
            </select>
          </div>
          <button class="btn btn-outline btn-sm" type="button" data-save-payment>Save payment status</button>
        </div>
        <div class="detail-block">
          <h4>Update order</h4>
          <div class="field">
            <label for="od-status">Order status</label>
            <select class="select" id="od-status" data-status-select>
              ${STATUSES.map((status) => `<option value="${status}" ${status === order.status ? 'selected' : ''}>${status}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label for="od-note">Note (shown in history)</label>
            <input class="input" id="od-note" placeholder="e.g. Handed to courier" />
          </div>
          <div class="field">
            <label for="od-tracking">Tracking number</label>
            <input class="input" id="od-tracking" value="${escapeHtml(order.trackingNumber || '')}" placeholder="Optional" />
          </div>
          <button class="btn btn-primary btn-sm" type="button" data-save-status>Update order status</button>
          ${order.notes ? `<p class="small muted" style="margin-top:12px"><strong>Customer note:</strong> ${escapeHtml(order.notes)}</p>` : ''}
        </div>
      </div>

      <div class="card" style="margin-top:18px">
        <div class="card-head"><h3>Items</h3></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Item</th><th>Variant</th><th>Unit price</th><th>Qty</th><th>Total</th></tr></thead>
            <tbody>
              ${order.items
                .map(
                  (item) => `
                <tr>
                  <td>
                    <div class="flex gap-8 items-center">
                      <img class="thumb" src="${escapeHtml(item.productImage || '')}" alt="" />
                      <span class="cell-strong">${escapeHtml(item.productName)}</span>
                    </div>
                  </td>
                  <td class="cell-sub">${escapeHtml([item.size, item.color].filter(Boolean).join(' · ') || '—')}</td>
                  <td>${money(item.unitPrice)}</td>
                  <td>${item.quantity}</td>
                  <td class="cell-strong">${money(item.lineTotal)}</td>
                </tr>`
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card" style="margin-top:18px">
        <div class="card-head"><h3>Status history</h3></div>
        <div class="card-body">
          <div class="timeline">
            ${(order.statusHistory || [])
              .map(
                (entry) => `
              <div class="tl-item">
                <div class="tl-status">${escapeHtml(entry.status)}</div>
                <div class="tl-meta">${dateTime(entry.createdAt)} · ${escapeHtml(entry.actor || 'system')}</div>
                ${entry.note ? `<div class="small muted">${escapeHtml(entry.note)}</div>` : ''}
              </div>`
              )
              .join('')}
          </div>
        </div>
      </div>`;
  };

  /* ------------------------------- quick update --------------------------- */

  const openQuickStatus = (order) => {
    document.querySelector('[data-order-detail]').innerHTML = `
      <h3>${escapeHtml(order.orderNumber)}</h3>
      <p class="muted small">${escapeHtml(order.customer?.name || '')} · ${money(order.total)}</p>
      <div class="field">
        <label for="qs-status">New status</label>
        <select class="select" id="qs-status" data-status-select>
          ${STATUSES.map((status) => `<option value="${status}" ${status === order.status ? 'selected' : ''}>${status}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label for="qs-note">Note</label>
        <input class="input" id="qs-note" placeholder="Optional note for the history log" />
      </div>
      <div class="field">
        <label for="qs-tracking">Tracking number</label>
        <input class="input" id="qs-tracking" value="${escapeHtml(order.trackingNumber || '')}" />
      </div>
      <button class="btn btn-primary" type="button" data-save-status>Update status</button>`;
    state.current = order;
    modal.open('order-modal');
  };

  const saveStatus = async (button) => {
    const order = state.current;
    if (!order) return;
    const status = document.querySelector('[data-status-select]').value;
    const note = document.querySelector('#od-note, #qs-note')?.value.trim();
    const tracking = document.querySelector('#od-tracking, #qs-tracking')?.value.trim();

    setBusy(button, true, 'Updating');
    try {
      await AdminAPI.setOrderStatus(order.id, {
        status,
        note: note || undefined,
        tracking_number: tracking || undefined,
      });
      toast(`Order ${order.orderNumber} set to ${status}.`, 'success');
      modal.close('order-modal');
      await load();
      Console.refresh('dashboard');
      Console.refreshBadges();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(button, false);
    }
  };

  const savePayment = async (button) => {
    const order = state.current;
    if (!order) return;
    const payment_status = document.querySelector('[data-payment-select]').value;
    setBusy(button, true, 'Saving');
    try {
      await AdminAPI.setPaymentStatus(order.id, { payment_status });
      toast(`Payment marked ${payment_status}.`, 'success');
      await load();
      Console.refresh('dashboard');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(button, false);
    }
  };

  /* --------------------------------- events ------------------------------- */

  const bind = () => {
    if (bound) return;
    bound = true;

    const view = document.querySelector('[data-view="orders"]');
    view.addEventListener('click', (event) => {
      const viewOrder = event.target.closest('[data-view-order]');
      if (viewOrder) return openDetail(Number(viewOrder.dataset.viewOrder));

      const quick = event.target.closest('[data-quick-status]');
      if (quick) {
        const order = state.items.find((o) => o.id === Number(quick.dataset.quickStatus));
        return openQuickStatus(order);
      }
    });

    view.addEventListener('input', debounce((event) => {
      if (event.target.matches('[data-order-search]')) {
        state.q = event.target.value.trim();
        state.page = 1;
        load();
      }
    }, 400));

    view.addEventListener('change', (event) => {
      if (event.target.matches('[data-order-status-filter]')) {
        state.status = event.target.value;
        state.page = 1;
        load();
      }
      if (event.target.matches('[data-order-payment-filter]')) {
        state.paymentStatus = event.target.value;
        state.page = 1;
        load();
      }
    });

    document.querySelector('#order-modal').addEventListener('click', (event) => {
      const save = event.target.closest('[data-save-status]');
      if (save) return saveStatus(save);
      const pay = event.target.closest('[data-save-payment]');
      if (pay) return savePayment(pay);
      const goto = event.target.closest('[data-goto-customer]');
      if (goto) {
        modal.close('order-modal');
        window.location.hash = '#customers';
        setTimeout(() => Console.activate('customers', { force: true }).then(() => {
          window.AdminPages.customers.open(goto.dataset.gotoCustomer);
        }), 60);
      }
    });
  };

  const render = async (host) => {
    host.innerHTML = `
      <div class="card">
        <div class="toolbar">
          <input class="input search" type="search" placeholder="Search order number, customer or email…" data-order-search aria-label="Search orders" />
          <select class="select" data-order-status-filter style="width:auto" aria-label="Filter by status">
            <option value="">All statuses</option>
            ${STATUSES.map((status) => `<option value="${status}">${status}</option>`).join('')}
          </select>
          <select class="select" data-order-payment-filter style="width:auto" aria-label="Filter by payment">
            <option value="">All payments</option>
            ${PAYMENT_STATUSES.map((status) => `<option value="${status}">${status}</option>`).join('')}
          </select>
          <span class="small muted" data-orders-count></span>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Order</th><th>Customer</th><th>Ship to</th><th>Items</th><th>Payment</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody data-orders-body></tbody>
          </table>
        </div>
        <div class="pagination" data-orders-pagination></div>
      </div>`;

    document.querySelector('[data-order-status-filter]').value = state.status;
    document.querySelector('[data-order-payment-filter]').value = state.paymentStatus;
    await load();
    bind();
  };

  window.AdminPages = window.AdminPages || {};
  window.AdminPages.orders = { render };
})();
