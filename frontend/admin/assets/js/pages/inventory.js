/** Inventory view: stock levels, value summary and quick adjustments. */
(function () {
  const { money, count, escapeHtml, stockBadge, skeletonRows, emptyRow, toast, modal, setBusy, debounce } = window.AUI;

  const state = { q: '', low: false, out: false, items: [], summary: null };
  let bound = false;

  const load = async () => {
    const tbody = document.querySelector('[data-inventory-body]');
    tbody.innerHTML = skeletonRows(6, 5);
    const response = await AdminAPI.inventory({ q: state.q, low: state.low ? 'true' : '', out: state.out ? 'true' : '' });
    state.items = response.items;
    state.summary = response.summary;
    render();
  };

  const render = () => {
    const summary = state.summary || {};
    const summaryHost = document.querySelector('[data-inventory-summary]');
    summaryHost.innerHTML = `
      <div class="stat">
        <div class="stat-label">Products tracked</div>
        <div class="stat-value">${count(summary.totalProducts)}</div>
        <div class="stat-sub">${count(summary.totalUnits)} units on hand</div>
      </div>
      <div class="stat">
        <div class="stat-label">Inventory value</div>
        <div class="stat-value">${money(summary.inventoryValue)}</div>
        <div class="stat-sub">At current selling prices</div>
      </div>
      <div class="stat">
        <div class="stat-label">Low stock</div>
        <div class="stat-value">${count(summary.lowStock)}</div>
        <div class="stat-sub">At or below threshold</div>
      </div>
      <div class="stat">
        <div class="stat-label">Out of stock</div>
        <div class="stat-value">${count(summary.outOfStock)}</div>
        <div class="stat-sub">Needs restocking</div>
      </div>`;

    const tbody = document.querySelector('[data-inventory-body]');
    if (!state.items.length) {
      tbody.innerHTML = emptyRow(5, 'No products match these filters.');
      return;
    }

    const maxStock = Math.max(...state.items.map((item) => item.stock), 1);
    tbody.innerHTML = state.items
      .map(
        (item) => `
      <tr>
        <td>
          <div class="cell-strong">${escapeHtml(item.name)}</div>
          <div class="cell-sub">${escapeHtml(item.sku || '—')} · ${escapeHtml(item.categoryName || 'Uncategorised')}</div>
        </td>
        <td>
          ${stockBadge(item.stock, item.threshold)}
          <div class="bar" style="margin-top:6px"><span style="width:${Math.round((item.stock / maxStock) * 100)}%"></span></div>
        </td>
        <td class="cell-sub">${item.threshold}</td>
        <td class="nowrap">${money(item.price)}<div class="cell-sub">${money(item.stock * item.price)} on hand</div></td>
        <td class="actions">
          <button class="btn btn-outline btn-sm" type="button" data-adjust="${item.id}">Adjust stock</button>
        </td>
      </tr>`
      )
      .join('');
  };

  const openAdjust = (item) => {
    const form = document.querySelector('[data-stock-form]');
    form.reset();
    AUI.clearFieldErrors(form);
    form.querySelector('[data-form-alert]').classList.add('hidden');
    form.querySelector('[name="product_id"]').value = item.id;
    document.querySelector('[data-stock-product]').textContent = `${item.name} — currently ${item.stock} in stock.`;
    modal.open('stock-modal');
  };

  const bind = () => {
    if (bound) return;
    bound = true;

    const view = document.querySelector('[data-view="inventory"]');
    view.addEventListener('click', (event) => {
      const adjust = event.target.closest('[data-adjust]');
      if (adjust) openAdjust(state.items.find((i) => i.id === Number(adjust.dataset.adjust)));
    });

    view.addEventListener('input', debounce((event) => {
      if (event.target.matches('[data-inventory-search]')) {
        state.q = event.target.value.trim();
        load();
      }
    }, 400));

    view.addEventListener('change', (event) => {
      if (event.target.matches('[data-inventory-low]')) {
        state.low = event.target.checked;
        load();
      }
      if (event.target.matches('[data-inventory-out]')) {
        state.out = event.target.checked;
        load();
      }
    });

    // The stock modal is shared with the products view; refresh inventory after use.
    document.querySelector('[data-stock-form]').addEventListener('submit', () => {
      setTimeout(() => {
        if (document.querySelector('[data-view="inventory"]').classList.contains('active')) load();
      }, 600);
    });
  };

  const renderView = async (host) => {
    host.innerHTML = `
      <div class="stat-grid" data-inventory-summary></div>
      <div class="card">
        <div class="toolbar">
          <input class="input search" type="search" placeholder="Search by name or SKU…" data-inventory-search aria-label="Search inventory" />
          <label class="check"><input type="checkbox" data-inventory-low /> Low stock only</label>
          <label class="check"><input type="checkbox" data-inventory-out /> Out of stock only</label>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Product</th><th>Stock level</th><th>Alert at</th><th>Value</th><th>Actions</th></tr></thead>
            <tbody data-inventory-body></tbody>
          </table>
        </div>
      </div>`;
    await load();
    bind();
  };

  window.AdminPages = window.AdminPages || {};
  window.AdminPages.inventory = { render: renderView };
})();
