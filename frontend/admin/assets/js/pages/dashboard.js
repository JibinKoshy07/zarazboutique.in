/** Dashboard view: headline metrics, recent orders, low stock and top sellers. */
(function () {
  const { money, count, escapeHtml, date, ICONS, badgeFor, stockBadge, toast } = window.AUI;

  const statCard = (label, value, sub, icon) => `
    <div class="stat">
      <div class="stat-icon">${ICONS[icon] || ''}</div>
      <div class="stat-label">${escapeHtml(label)}</div>
      <div class="stat-value">${value}</div>
      ${sub ? `<div class="stat-sub">${sub}</div>` : ''}
    </div>`;

  const render = async (host) => {
    host.innerHTML = `
      <div class="stat-grid">
        ${Array.from({ length: 4 }).map(() => '<div class="stat"><div class="skeleton" style="height:70px"></div></div>').join('')}
      </div>
      <div class="grid-2">
        <div class="card"><div class="card-head"><h2>Recent orders</h2></div><div class="card-body"><div class="skeleton skeleton-row"></div><div class="skeleton skeleton-row"></div><div class="skeleton skeleton-row"></div></div></div>
        <div class="card"><div class="card-head"><h2>Low stock</h2></div><div class="card-body"><div class="skeleton skeleton-row"></div><div class="skeleton skeleton-row"></div></div></div>
      </div>`;

    const data = await AdminAPI.dashboard();
    const { stats, recentOrders, lowStock, topProducts, ordersByStatus } = data;

    const statusRows = ordersByStatus.length
      ? ordersByStatus
          .map((row) => {
            const pct = stats.totalOrders ? Math.round((row.count / stats.totalOrders) * 100) : 0;
            return `<div class="kv"><span>${badgeFor(row.status)}</span><strong>${row.count} <span class="cell-sub">(${pct}%)</span></strong></div>`;
          })
          .join('')
      : '<p class="muted small mb-0">No orders yet.</p>';

    host.innerHTML = `
      <div class="stat-grid">
        ${statCard('Total revenue', money(stats.revenue.gross), `${money(stats.revenue.paid)} collected · ${money(stats.revenue.pending)} pending`, 'money')}
        ${statCard('Total orders', count(stats.totalOrders), `${stats.pendingOrders} pending · ${stats.deliveredOrders} delivered`, 'orders')}
        ${statCard('Products', count(stats.totalProducts), `${stats.outOfStock} out of stock · ${stats.lowStock} low`, 'products')}
        ${statCard('Customers', count(stats.totalCustomers), `${count(stats.totalUnits)} units in inventory`, 'customers')}
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-head">
            <h2>Recent orders</h2>
            <div class="spacer"></div>
            <a class="btn btn-outline btn-sm" href="#orders">View all orders</a>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th>Placed</th></tr></thead>
              <tbody>
                ${recentOrders.length
                  ? recentOrders
                      .map(
                        (order) => `
                  <tr>
                    <td><span class="cell-strong">${escapeHtml(order.orderNumber)}</span><div class="cell-sub">${order.itemCount} item${order.itemCount === 1 ? '' : 's'}</div></td>
                    <td>${escapeHtml(order.customer?.name || '—')}<div class="cell-sub">${escapeHtml(order.customer?.email || '')}</div></td>
                    <td class="cell-strong">${money(order.total)}</td>
                    <td>${badgeFor(order.status)}</td>
                    <td class="nowrap">${date(order.createdAt)}</td>
                  </tr>`
                      )
                      .join('')
                  : '<tr><td colspan="5"><div class="empty"><h3>No orders yet</h3><p>New orders will appear here.</p></div></td></tr>'}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div class="card">
            <div class="card-head"><h2>Orders by status</h2></div>
            <div class="card-body">${statusRows}</div>
          </div>

          <div class="card">
            <div class="card-head">
              <h2>Low stock</h2>
              <div class="spacer"></div>
              <a class="btn btn-outline btn-sm" href="#inventory">Manage inventory</a>
            </div>
            <div class="table-wrap">
              <table>
                <thead><tr><th>Product</th><th>Stock</th></tr></thead>
                <tbody>
                  ${lowStock.length
                    ? lowStock
                        .map(
                          (item) => `
                    <tr>
                      <td><span class="cell-strong">${escapeHtml(item.name)}</span><div class="cell-sub">${escapeHtml(item.sku || '')}</div></td>
                      <td>${stockBadge(item.stock, item.threshold)}</td>
                    </tr>`
                        )
                        .join('')
                    : '<tr><td colspan="2"><div class="empty"><h3>All stocked up</h3><p>No products are running low.</p></div></td></tr>'}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h2>Top selling sarees</h2></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Product</th><th>Units sold</th><th>Revenue</th><th>Stock</th></tr></thead>
            <tbody>
              ${topProducts.length
                ? topProducts
                    .map(
                      (item) => `
                <tr>
                  <td><span class="cell-strong">${escapeHtml(item.name)}</span><div class="cell-sub">${escapeHtml(item.categoryName || '')}</div></td>
                  <td>${count(item.unitsSold)}</td>
                  <td class="cell-strong">${money(item.revenue)}</td>
                  <td>${stockBadge(item.stock, item.threshold)}</td>
                </tr>`
                    )
                    .join('')
                : '<tr><td colspan="4"><div class="empty"><h3>No sales data yet</h3><p>Once orders come in, your bestsellers will show up here.</p></div></td></tr>'}
            </tbody>
          </table>
        </div>
      </div>`;

    host.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', () => setTimeout(() => Console.activate(link.getAttribute('href').replace('#', ''), { force: true }), 0));
    });
  };

  window.AdminPages = window.AdminPages || {};
  window.AdminPages.dashboard = { render };
})();
