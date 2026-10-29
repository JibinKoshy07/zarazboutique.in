/**
 * Storefront shared behaviour: session state, header/footer chrome, the cart
 * drawer, and the product card renderer. Loaded on every storefront page.
 */
(function () {
  const { money, escapeHtml, stars, discount, toast, ICONS } = window.UI;

  const state = { user: null, cart: { items: [], subtotal: 0, shippingFee: 0, total: 0, itemCount: 0 }, ready: false };
  const listeners = new Set();

  const notify = () => listeners.forEach((fn) => fn(state));
  const subscribe = (fn) => {
    listeners.add(fn);
    if (state.ready) fn(state);
  };

  /* ------------------------------- session -------------------------------- */

  const loadSession = async () => {
    if (!API.isLoggedIn()) {
      state.user = null;
      return;
    }
    try {
      const { user } = await API.me();
      state.user = user;
    } catch {
      // A token that no longer resolves is cleared by the API layer.
      state.user = null;
    }
  };

  const loadCart = async () => {
    if (!state.user) {
      state.cart = { items: [], subtotal: 0, shippingFee: 0, total: 0, itemCount: 0 };
      return;
    }
    try {
      state.cart = await API.cart();
    } catch {
      state.cart = { items: [], subtotal: 0, shippingFee: 0, total: 0, itemCount: 0 };
    }
  };

  const refresh = async () => {
    await loadSession();
    await loadCart();
    state.ready = true;
    notify();
  };

  const logout = () => {
    API.setToken(null);
    API.setAdminToken(null);
    state.user = null;
    state.cart = { items: [], subtotal: 0, shippingFee: 0, total: 0, itemCount: 0 };
    state.ready = true;
    notify();
    toast('You have been signed out.', 'info');
    // Account-only pages cannot render anything useful once signed out.
    if (/account\.html/.test(window.location.pathname)) {
      window.location.href = 'login.html';
    }
  };

  /* -------------------------------- header -------------------------------- */

  const NAV = [
    { href: 'index.html', label: 'Home' },
    { href: 'shop.html', label: 'Shop' },
    { href: 'about.html', label: 'About' },
    { href: 'contact.html', label: 'Contact' },
  ];

  const mountHeader = () => {
    const host = document.querySelector('[data-header]');
    if (!host) return;

    const current = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    const links = NAV.map(
      (item) => `<a href="${item.href}" class="${item.href === current ? 'active' : ''}">${item.label}</a>`
    ).join('');

    host.innerHTML = `
      <div class="announce">Complimentary shipping across India on orders above ₹4,999 &nbsp;•&nbsp; Handpicked sarees, woven to last</div>
      <header class="site-header">
        <div class="container container-wide header-inner">
          <button class="icon-btn nav-toggle" type="button" aria-label="Open menu" data-nav-toggle>${ICONS.menu}</button>
          <a class="brand" href="index.html">
            <span class="brand-name">Zaraz</span>
            <span class="brand-tag">Boutique</span>
          </a>
          <nav class="nav" data-nav>${links}</nav>
          <div class="header-actions">
            <button class="icon-btn" type="button" aria-label="Search" data-search-toggle>${ICONS.search}</button>
            <a class="icon-btn" href="account.html" aria-label="My account">${ICONS.user}</a>
            <button class="icon-btn" type="button" aria-label="Open cart" data-cart-toggle>
              ${ICONS.bag}<span class="badge" data-cart-count data-count="0"></span>
            </button>
          </div>
        </div>
      </header>`;

    host.querySelector('[data-nav-toggle]').addEventListener('click', () => {
      host.querySelector('[data-nav]').classList.toggle('open');
    });
    host.querySelector('[data-search-toggle]').addEventListener('click', () => {
      window.location.href = 'shop.html';
    });
    host.querySelector('[data-cart-toggle]').addEventListener('click', openCart);
  };

  const mountFooter = () => {
    const host = document.querySelector('[data-footer]');
    if (!host) return;
    host.innerHTML = `
      <footer class="site-footer">
        <div class="container">
          <div class="footer-grid">
            <div class="footer-about">
              <span class="brand-name">Zaraz</span>
              <p>Handpicked sarees from weaver clusters across India - Banarasi, Kanjeevaram, handloom cotton and modern designer drapes.</p>
              <div class="socials">
                <a href="#" aria-label="Instagram">${ICONS.sparkle}</a>
                <a href="#" aria-label="Email">${ICONS.mail}</a>
                <a href="#" aria-label="Call">${ICONS.phone}</a>
              </div>
            </div>
            <div>
              <h4>Shop</h4>
              <ul>
                <li><a href="shop.html">All Sarees</a></li>
                <li><a href="shop.html?featured=true">Featured</a></li>
                <li><a href="shop.html?new=true">New Arrivals</a></li>
                <li><a href="shop.html?bestseller=true">Bestsellers</a></li>
              </ul>
            </div>
            <div>
              <h4>Help</h4>
              <ul>
                <li><a href="contact.html">Contact Us</a></li>
                <li><a href="account.html">My Orders</a></li>
                <li><a href="about.html">About Us</a></li>
                <li><a href="about.html#care">Saree Care</a></li>
              </ul>
            </div>
            <div>
              <h4>Stay in touch</h4>
              <p class="small">New weaves, festive edits and early access - straight to your inbox.</p>
              <form class="newsletter-form" data-newsletter>
                <input class="input" type="email" name="email" placeholder="Your email address" required aria-label="Email address" />
                <button class="btn" type="submit">Join</button>
              </form>
            </div>
          </div>
          <div class="footer-bottom">
            <span>© ${new Date().getFullYear()} Zaraz Boutique. All rights reserved.</span>
            <span>Crafted in India · Secure checkout</span>
          </div>
        </div>
      </footer>`;

    const form = host.querySelector('[data-newsletter]');
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      form.reset();
      toast('Thank you for subscribing to Zaraz.', 'success');
    });
  };

  /* ------------------------------ cart drawer ----------------------------- */

  const drawerLine = (item) => `
    <div class="drawer-line">
      <img src="${escapeHtml(item.product.image || '')}" alt="${escapeHtml(item.product.name)}" loading="lazy" />
      <div>
        <div class="cart-line-name"><a href="product.html?id=${item.productId}">${escapeHtml(item.product.name)}</a></div>
        <div class="cart-line-variant">
          ${item.size ? `Size: ${escapeHtml(item.size)}` : ''}${item.size && item.color ? ' · ' : ''}${item.color ? escapeHtml(item.color) : ''}
        </div>
        <div class="cart-line-actions">
          <div class="qty">
            <button type="button" data-drawer-qty="${item.id}" data-next="${item.quantity - 1}" aria-label="Decrease quantity">−</button>
            <input value="${item.quantity}" readonly aria-label="Quantity" />
            <button type="button" data-drawer-qty="${item.id}" data-next="${item.quantity + 1}" aria-label="Increase quantity">+</button>
          </div>
          <button class="link-btn" type="button" data-drawer-remove="${item.id}">Remove</button>
        </div>
      </div>
      <div class="cart-line-total">${money(item.lineTotal)}</div>
    </div>`;

  const renderDrawer = () => {
    const body = document.querySelector('[data-drawer-body]');
    const foot = document.querySelector('[data-drawer-foot]');
    const count = document.querySelector('[data-drawer-count]');
    if (!body) return;

    if (count) count.textContent = state.cart.items.length ? `${state.cart.items.length} item${state.cart.items.length > 1 ? 's' : ''}` : '';

    if (!state.user) {
      body.innerHTML = `<div class="empty-state">${ICONS.user}<h3>Sign in to shop</h3><p>Create an account or sign in to start adding sarees to your bag.</p><a class="btn btn-primary" href="login.html">Sign In</a></div>`;
      foot.innerHTML = '';
      return;
    }
    if (!state.cart.items.length) {
      body.innerHTML = `<div class="empty-state">${ICONS.bag}<h3>Your bag is empty</h3><p>Explore our handpicked sarees and add your favourites.</p><a class="btn btn-primary" href="shop.html">Start Shopping</a></div>`;
      foot.innerHTML = '';
      return;
    }

    body.innerHTML = state.cart.items.map(drawerLine).join('');
    foot.innerHTML = `
      <div class="summary-row"><span>Subtotal</span><span>${money(state.cart.subtotal)}</span></div>
      <div class="summary-row"><span>Shipping</span><span class="${state.cart.shippingFee === 0 ? 'free' : ''}">${state.cart.shippingFee === 0 ? 'Free' : money(state.cart.shippingFee)}</span></div>
      <div class="summary-row total"><span>Total</span><span>${money(state.cart.total)}</span></div>
      <a class="btn btn-primary btn-block" href="checkout.html" style="margin-top:14px">Proceed to Checkout</a>
      <a class="btn btn-ghost btn-block" href="cart.html" style="margin-top:8px">View Bag</a>`;
  };

  const mountCartDrawer = () => {
    if (document.querySelector('[data-cart-drawer]')) return;
    const wrapper = document.createElement('div');
    wrapper.setAttribute('data-cart-drawer', '');
    wrapper.innerHTML = `
      <div class="drawer-backdrop" data-drawer-backdrop></div>
      <aside class="drawer" data-drawer-panel aria-label="Shopping bag" aria-hidden="true">
        <div class="drawer-head">
          <h3>Your Bag <span class="small muted" data-drawer-count></span></h3>
          <button class="icon-btn" type="button" aria-label="Close bag" data-drawer-close>${ICONS.close}</button>
        </div>
        <div class="drawer-body" data-drawer-body></div>
        <div class="drawer-foot" data-drawer-foot></div>
      </aside>`;
    document.body.appendChild(wrapper);

    wrapper.querySelector('[data-drawer-backdrop]').addEventListener('click', closeCart);
    wrapper.querySelector('[data-drawer-close]').addEventListener('click', closeCart);
    wrapper.addEventListener('click', async (event) => {
      const qtyBtn = event.target.closest('[data-drawer-qty]');
      if (qtyBtn) {
        const next = Number(qtyBtn.dataset.next);
        if (next < 1) return;
        try {
          state.cart = await API.updateCartItem(qtyBtn.dataset.drawerQty, { quantity: next });
          notify();
        } catch (err) {
          toast(err.message, 'error');
        }
        return;
      }
      const removeBtn = event.target.closest('[data-drawer-remove]');
      if (removeBtn) {
        try {
          state.cart = await API.removeCartItem(removeBtn.dataset.drawerRemove);
          notify();
          toast('Item removed from your bag.', 'info');
        } catch (err) {
          toast(err.message, 'error');
        }
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeCart();
    });
  };

  const openCart = () => {
    mountCartDrawer();
    renderDrawer();
    document.querySelector('[data-drawer-panel]').classList.add('open');
    document.querySelector('[data-drawer-backdrop]').classList.add('open');
    document.querySelector('[data-drawer-panel]').setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
  };

  const closeCart = () => {
    const panel = document.querySelector('[data-drawer-panel]');
    if (!panel) return;
    panel.classList.remove('open');
    document.querySelector('[data-drawer-backdrop]').classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
  };

  /* ---------------------------- product rendering ------------------------- */

  const productCard = (product, index = 0) => {
    const off = discount(product.price, product.compareAtPrice);
    const tags = [];
    if (off) tags.push(`<span class="tag tag-rose">${off}% off</span>`);
    if (product.isNewArrival) tags.push('<span class="tag tag-gold">New</span>');
    if (product.isBestseller) tags.push('<span class="tag">Bestseller</span>');

    const stockLine = product.stock === 0
      ? '<span class="stock-line stock-out">Out of stock</span>'
      : product.stock <= 3
        ? `<span class="stock-line stock-low">Only ${product.stock} left</span>`
        : '<span class="stock-line stock-in">In stock</span>';

    return `
      <article class="product-card" style="animation-delay:${Math.min(index * 40, 320)}ms">
        <a class="product-media" href="product.html?id=${product.id}">
          <img src="${escapeHtml(product.image || '')}" alt="${escapeHtml(product.name)}" loading="lazy" />
          ${tags.length ? `<div class="product-tags">${tags.join('')}</div>` : ''}
        </a>
        <div class="product-body">
          <span class="product-cat">${escapeHtml(product.categoryName || 'Saree')}</span>
          <h3 class="product-name"><a href="product.html?id=${product.id}">${escapeHtml(product.name)}</a></h3>
          <div class="product-rating">
            <span class="stars">${stars(product.rating)}</span>
            <span>${Number(product.rating || 0).toFixed(1)}${product.reviewCount ? ` (${product.reviewCount})` : ''}</span>
          </div>
          <div class="product-price">
            <span class="price-now">${money(product.price)}</span>
            ${product.compareAtPrice ? `<span class="price-was">${money(product.compareAtPrice)}</span>` : ''}
          </div>
          ${stockLine}
        </div>
        <div class="quick-add">
          <button class="btn ${product.stock === 0 ? 'btn-ghost' : 'btn-primary'} btn-block btn-sm" type="button"
            data-add-to-cart="${product.id}" ${product.stock === 0 ? 'disabled' : ''}>
            ${product.stock === 0 ? 'Notify me' : 'Add to Bag'}
          </button>
        </div>
      </article>`;
  };

  const renderProducts = (container, products, emptyMessage = 'No sarees matched your filters.') => {
    if (!container) return;
    if (!products.length) {
      container.innerHTML = `<div style="grid-column:1/-1">${window.UI.emptyState({ title: 'Nothing here yet', message: emptyMessage, actionLabel: 'Browse all sarees', actionHref: 'shop.html', icon: 'search' })}</div>`;
      return;
    }
    container.innerHTML = products.map(productCard).join('');
  };

  /** One delegated listener serves every product grid on the page. */
  const mountAddToCart = () => {
    document.addEventListener('click', async (event) => {
      const button = event.target.closest('[data-add-to-cart]');
      if (!button) return;
      if (!state.user) {
        toast('Please sign in to add items to your bag.', 'info');
        setTimeout(() => { window.location.href = 'login.html'; }, 900);
        return;
      }
      const original = button.innerHTML;
      button.disabled = true;
      button.innerHTML = '<span class="spinner spinner-dark"></span>';
      try {
        state.cart = await API.addToCart({ productId: Number(button.dataset.addToCart), quantity: 1 });
        notify();
        toast('Added to your bag.', 'success');
        openCart();
      } catch (err) {
        toast(err.message, 'error');
      } finally {
        button.disabled = false;
        button.innerHTML = original;
      }
    });
  };

  /* ------------------------------ header sync ----------------------------- */

  const syncChrome = () => {
    document.querySelectorAll('[data-cart-count]').forEach((node) => {
      node.textContent = state.cart.items.length || '';
      node.dataset.count = state.cart.items.length;
    });
    document.querySelectorAll('[data-user-name]').forEach((node) => {
      node.textContent = state.user ? state.user.name.split(' ')[0] : 'Sign In';
    });
    document.querySelectorAll('[data-auth-only]').forEach((node) => {
      node.classList.toggle('hidden', !state.user);
    });
    document.querySelectorAll('[data-guest-only]').forEach((node) => {
      node.classList.toggle('hidden', Boolean(state.user));
    });
    document.querySelectorAll('[data-logout]').forEach((node) => {
      node.onclick = (event) => {
        event.preventDefault();
        logout();
      };
    });
    renderDrawer();
  };

  const init = async () => {
    mountHeader();
    mountFooter();
    mountCartDrawer();
    mountAddToCart();
    subscribe(syncChrome);
    await refresh();
  };

  window.Store = { init, state, subscribe, refresh, logout, openCart, closeCart, productCard, renderProducts, money };
})();
