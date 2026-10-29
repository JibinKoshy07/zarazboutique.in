/** Order confirmation: summary, delivery address, payment state and timeline. */
(function () {
  const { money, escapeHtml, dateTime, statusClass, emptyState, ICONS } = window.UI;

  const root = () => document.querySelector('[data-confirmation-root]');

  const render = (order) => {
    root().innerHTML = `
      <div class="confirm-hero">
        <div class="confirm-icon">${ICONS.check}</div>
        <span class="eyebrow">Thank you for your order</span>
        <h1 style="font-size:clamp(1.7rem,3.4vw,2.4rem)">Your saree is on its way</h1>
        <p class="muted">We have received your order and will confirm it shortly.</p>
        <div class="order-ref">Order ${escapeHtml(order.orderNumber)}</div>
      </div>

      <div class="split" style="grid-template-columns:1fr 340px">
        <div>
          <div class="panel">
            <div class="panel-head">
              <h3>Items in this order</h3>
              <span class="status ${statusClass(order.status)}">${escapeHtml(order.status)}</span>
            </div>
            ${order.items
              .map(
                (item) => `
              <div class="cart-line">
                <img src="${escapeHtml(item.productImage || '')}" alt="${escapeHtml(item.productName)}" />
                <div>
                  <div class="cart-line-name"><a href="product.html?id=${item.productId}">${escapeHtml(item.productName)}</a></div>
                  <div class="cart-line-variant">
                    ${item.size ? `Size: ${escapeHtml(item.size)}` : ''}${item.size && item.color ? ' · ' : ''}${item.color ? escapeHtml(item.color) : ''}
                    · Qty ${item.quantity}
                  </div>
                  <span class="muted small">${money(item.unitPrice)} each</span>
                </div>
                <div class="cart-line-total">${money(item.lineTotal)}</div>
              </div>`
              )
              .join('')}
            <div class="summary-row" style="margin-top:16px"><span>Subtotal</span><span>${money(order.subtotal)}</span></div>
            <div class="summary-row"><span>Shipping</span><span class="${order.shippingFee === 0 ? 'free' : ''}">${order.shippingFee === 0 ? 'Free' : money(order.shippingFee)}</span></div>
            <div class="summary-row total"><span>Total</span><span>${money(order.total)}</span></div>
          </div>

          <div class="panel">
            <div class="panel-head"><h3>Order status</h3></div>
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
          </div>
        </div>

        <aside>
          <div class="panel">
            <div class="panel-head"><h3>Delivery</h3></div>
            <p class="small muted" style="margin-bottom:4px">Shipping to</p>
            <p style="margin-bottom:14px">
              <strong>${escapeHtml(order.shippingAddress.fullName || order.customer.name)}</strong><br />
              ${escapeHtml(order.shippingAddress.line1)}${order.shippingAddress.line2 ? `<br />${escapeHtml(order.shippingAddress.line2)}` : ''}<br />
              ${escapeHtml(order.shippingAddress.city)}, ${escapeHtml(order.shippingAddress.state)} ${escapeHtml(order.shippingAddress.postalCode)}<br />
              ${escapeHtml(order.shippingAddress.country || 'India')}<br />
              ${escapeHtml(order.shippingAddress.phone || order.customer.phone || '')}
            </p>
            ${order.trackingNumber ? `<p class="small"><strong>Tracking:</strong> ${escapeHtml(order.trackingNumber)}</p>` : ''}
            <p class="small muted">Placed on ${dateTime(order.createdAt)}</p>
          </div>

          <div class="panel">
            <div class="panel-head"><h3>Payment</h3></div>
            <div class="summary-row"><span>Method</span><span>${escapeHtml(order.paymentMethod)}</span></div>
            <div class="summary-row"><span>Status</span><span class="status ${statusClass(order.paymentStatus)}">${escapeHtml(order.paymentStatus)}</span></div>
            <p class="summary-note">${order.paymentStatus === 'Paid'
              ? 'Payment received. Thank you!'
              : 'Our team will reach out to complete payment for this order.'}</p>
          </div>
          <div class="panel">
            <a class="btn btn-primary btn-block" href="account.html?tab=orders">Track my order</a>
            <a class="btn btn-ghost btn-block" href="shop.html" style="margin-top:8px">Continue shopping</a>
          </div>
        </aside>
      </div>`;
  };

  const init = async () => {
    await Store.init();
    const id = UI.query('orderId');
    if (!id) {
      root().innerHTML = emptyState({
        title: 'No order selected',
        message: 'Open your account to see your order history and track orders.',
        actionLabel: 'View my orders',
        actionHref: 'account.html?tab=orders',
        icon: 'box',
      });
      return;
    }
    try {
      const { order } = await API.order(id);
      render(order);
      document.title = `Order ${order.orderNumber} — Zaraz Boutique`;
    } catch (err) {
      root().innerHTML = emptyState({
        title: 'Order not found',
        message: err.message || 'We could not find that order on your account.',
        actionLabel: 'View my orders',
        actionHref: 'account.html?tab=orders',
        icon: 'box',
      });
    }
  };

  document.addEventListener('DOMContentLoaded', init);
})();
