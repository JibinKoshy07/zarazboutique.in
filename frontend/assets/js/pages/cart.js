/** Cart page: full line-item editing backed by the server cart. */
(function () {
  const { money, escapeHtml, toast, emptyState, ICONS } = window.UI;

  const root = () => document.querySelector('[data-cart-root]');

  const line = (item) => `
    <div class="cart-line" data-line="${item.id}">
      <a href="product.html?id=${item.productId}">
        <img src="${escapeHtml(item.product.image || '')}" alt="${escapeHtml(item.product.name)}" loading="lazy" />
      </a>
      <div>
        <div class="cart-line-name"><a href="product.html?id=${item.productId}">${escapeHtml(item.product.name)}</a></div>
        <div class="cart-line-variant">
          ${item.size ? `Size: ${escapeHtml(item.size)}` : ''}${item.size && item.color ? ' · ' : ''}${item.color ? escapeHtml(item.color) : ''}
          ${!item.size && !item.color ? 'Standard drape' : ''}
        </div>
        <div class="cart-line-actions">
          <div class="qty">
            <button type="button" data-step="${item.id}" data-next="${item.quantity - 1}" ${item.quantity <= 1 ? 'disabled' : ''} aria-label="Decrease quantity">−</button>
            <input value="${item.quantity}" readonly aria-label="Quantity for ${escapeHtml(item.product.name)}" />
            <button type="button" data-step="${item.id}" data-next="${item.quantity + 1}" ${item.quantity >= item.product.stock ? 'disabled' : ''} aria-label="Increase quantity">+</button>
          </div>
          <span class="muted small">${money(item.unitPrice)} each</span>
          <button class="link-btn" type="button" data-remove="${item.id}">Remove</button>
        </div>
        ${item.product.stock <= 3 ? `<div class="stock-line stock-low" style="margin-top:6px">Only ${item.product.stock} left in stock</div>` : ''}
      </div>
      <div class="cart-line-total">${money(item.lineTotal)}</div>
    </div>`;

  const render = () => {
    const cart = Store.state.cart;

    if (!Store.state.user) {
      root().innerHTML = emptyState({
        title: 'Sign in to view your bag',
        message: 'Your bag is saved to your Zaraz account so it follows you across devices.',
        actionLabel: 'Sign in',
        actionHref: 'login.html',
        icon: 'user',
      });
      return;
    }

    if (!cart.items.length) {
      root().innerHTML = emptyState({
        title: 'Your bag is empty',
        message: 'Add a saree you love and it will appear here, ready for checkout.',
        actionLabel: 'Explore the collection',
        actionHref: 'shop.html',
        icon: 'bag',
      });
      return;
    }

    root().innerHTML = `
      <div class="cart-layout">
        <div class="panel">
          <div class="panel-head">
            <h3>${cart.items.length} item${cart.items.length > 1 ? 's' : ''}</h3>
            <button class="link-btn" type="button" data-clear>Clear bag</button>
          </div>
          ${cart.items.map(line).join('')}
        </div>

        <aside class="summary panel">
          <h3>Order summary</h3>
          <div class="summary-row"><span>Subtotal</span><span>${money(cart.subtotal)}</span></div>
          <div class="summary-row"><span>Shipping</span><span class="${cart.shippingFee === 0 ? 'free' : ''}">${cart.shippingFee === 0 ? 'Free' : money(cart.shippingFee)}</span></div>
          <div class="summary-row total"><span>Total</span><span>${money(cart.total)}</span></div>
          ${cart.shippingFee > 0 ? `<p class="summary-note">Add ${money(4999 - cart.subtotal)} more to unlock free shipping.</p>` : '<p class="summary-note">Free shipping unlocked. 🎉</p>'}
          <a class="btn btn-primary btn-block" href="checkout.html" style="margin-top:16px">Proceed to checkout</a>
          <a class="btn btn-ghost btn-block" href="shop.html" style="margin-top:8px">Continue shopping</a>
        </aside>
      </div>`;
  };

  const mountEvents = () => {
    root().addEventListener('click', async (event) => {
      const step = event.target.closest('[data-step]');
      if (step) {
        const next = Number(step.dataset.next);
        if (next < 1) return;
        try {
          Store.state.cart = await API.updateCartItem(step.dataset.step, { quantity: next });
          render();
          syncBadge();
        } catch (err) {
          toast(err.message, 'error');
        }
        return;
      }
      const remove = event.target.closest('[data-remove]');
      if (remove) {
        try {
          Store.state.cart = await API.removeCartItem(remove.dataset.remove);
          render();
          syncBadge();
          toast('Removed from your bag.', 'info');
        } catch (err) {
          toast(err.message, 'error');
        }
        return;
      }
      if (event.target.closest('[data-clear]')) {
        if (!window.confirm('Remove all items from your bag?')) return;
        try {
          Store.state.cart = await API.clearCart();
          render();
          syncBadge();
          toast('Your bag is now empty.', 'info');
        } catch (err) {
          toast(err.message, 'error');
        }
      }
    });
  };

  const syncBadge = () => {
    document.querySelectorAll('[data-cart-count]').forEach((node) => {
      node.textContent = Store.state.cart.items.length || '';
      node.dataset.count = Store.state.cart.items.length;
    });
  };

  const signature = () =>
    Store.state.cart.items.map((i) => `${i.id}:${i.quantity}`).join('|') + `|${Store.state.user ? 'in' : 'out'}`;

  const init = async () => {
    await Store.init();
    render();
    mountEvents();
    let last = signature();
    // The cart drawer can mutate the same cart, so re-render whenever it changes.
    Store.subscribe(() => {
      const next = signature();
      if (next !== last) {
        last = next;
        render();
      }
    });
  };

  document.addEventListener('DOMContentLoaded', init);
})();
