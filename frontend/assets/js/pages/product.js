/** Product detail: gallery, variant picker, quantity, add to bag and buy now. */
(function () {
  const { money, escapeHtml, stars, discount, toast, ICONS, emptyState } = window.UI;

  const root = () => document.querySelector('[data-product-root]');

  const state = { product: null, related: [], imageIndex: 0, size: '', color: '', quantity: 1 };

  const variantLine = () => {
    const parts = [];
    if (state.size) parts.push(`Size: ${state.size}`);
    if (state.color) parts.push(`Colour: ${state.color}`);
    return parts.join(' · ');
  };

  const render = () => {
    const product = state.product;
    const off = discount(product.price, product.compareAtPrice);
    const gallery = product.images && product.images.length ? product.images : [product.image].filter(Boolean);

    const stockBlock = product.stock === 0
      ? '<span class="stock-line stock-out">Out of stock — join the waitlist</span>'
      : product.stock <= 3
        ? `<span class="stock-line stock-low">Hurry — only ${product.stock} left</span>`
        : `<span class="stock-line stock-in">In stock (${product.stock} available)</span>`;

    root().innerHTML = `
      <div class="product-detail">
        <div class="gallery">
          <div class="gallery-main">
            <img src="${escapeHtml(gallery[state.imageIndex] || '')}" alt="${escapeHtml(product.name)}" data-gallery-main />
          </div>
          ${gallery.length > 1 ? `<div class="gallery-thumbs">${gallery
            .map((url, index) => `<button type="button" class="${index === state.imageIndex ? 'active' : ''}" data-thumb="${index}" aria-label="View image ${index + 1}"><img src="${escapeHtml(url)}" alt="" loading="lazy" /></button>`)
            .join('')}</div>` : ''}
        </div>

        <div>
          <span class="eyebrow">${escapeHtml(product.categoryName || 'Saree')}</span>
          <h1 style="font-size:clamp(1.6rem,3vw,2.2rem)">${escapeHtml(product.name)}</h1>
          <div class="product-rating" style="margin-bottom:6px">
            <span class="stars">${stars(product.rating)}</span>
            <span>${Number(product.rating || 0).toFixed(1)}${product.reviewCount ? ` · ${product.reviewCount} reviews` : ''}</span>
            ${product.sku ? `<span class="muted small">· SKU ${escapeHtml(product.sku)}</span>` : ''}
          </div>

          <div class="detail-price">
            <span class="price-now">${money(product.price)}</span>
            ${product.compareAtPrice ? `<span class="price-was">${money(product.compareAtPrice)}</span>` : ''}
            ${off ? `<span class="price-off">Save ${off}%</span>` : ''}
          </div>
          ${stockBlock}

          <p class="muted" style="margin-top:16px">${escapeHtml(product.description || '')}</p>

          ${product.sizes && product.sizes.length ? `
            <div class="option-group" style="margin-top:22px">
              <span>Size / Blouse</span>
              <div class="option-row">${product.sizes
                .map((size) => `<button type="button" class="option ${size === state.size ? 'active' : ''}" data-size="${escapeHtml(size)}">${escapeHtml(size)}</button>`)
                .join('')}</div>
            </div>` : ''}

          ${product.colors && product.colors.length ? `
            <div class="option-group">
              <span>Colour</span>
              <div class="option-row">${product.colors
                .map((color) => `<button type="button" class="option ${color === state.color ? 'active' : ''}" data-color="${escapeHtml(color)}">${escapeHtml(color)}</button>`)
                .join('')}</div>
            </div>` : ''}

          <div class="option-group">
            <span>Quantity</span>
            <div class="qty">
              <button type="button" data-qty="down" ${state.quantity <= 1 ? 'disabled' : ''} aria-label="Decrease quantity">−</button>
              <input value="${state.quantity}" readonly aria-label="Quantity" />
              <button type="button" data-qty="up" ${state.quantity >= product.stock ? 'disabled' : ''} aria-label="Increase quantity">+</button>
            </div>
          </div>

          <div class="buy-row">
            <button class="btn btn-primary btn-lg" type="button" data-add ${product.stock === 0 ? 'disabled' : ''}>
              ${ICONS.bag} ${product.stock === 0 ? 'Out of stock' : 'Add to bag'}
            </button>
            <button class="btn btn-gold btn-lg" type="button" data-buy-now ${product.stock === 0 ? 'disabled' : ''}>Buy it now</button>
          </div>

          <div class="detail-notes">
            <div class="detail-note">${ICONS.truck}<span>Free shipping on orders above ₹4,999 · dispatched in 24 hours</span></div>
            <div class="detail-note">${ICONS.shield}<span>Authentic handloom with an unstitched blouse piece included</span></div>
            <div class="detail-note">${ICONS.clock}<span>Easy 7-day returns on unused, untagged sarees</span></div>
          </div>
        </div>
      </div>

      <section class="section">
        <div class="tabs" role="tablist">
          <button class="tab active" type="button" data-tab="description" role="tab">Description</button>
          <button class="tab" type="button" data-tab="details" role="tab">Details</button>
          <button class="tab" type="button" data-tab="care" role="tab">Care &amp; shipping</button>
        </div>
        <div class="tab-panel active" data-panel="description">
          <p class="muted" style="max-width:760px">${escapeHtml(product.description || '')}</p>
        </div>
        <div class="tab-panel" data-panel="details">
          <dl class="detail-meta" style="max-width:760px">
            <div><dt>Fabric</dt><dd>${escapeHtml(product.fabric || '—')}</dd></div>
            <div><dt>Category</dt><dd>${escapeHtml(product.categoryName || '—')}</dd></div>
            <div><dt>Saree length</dt><dd>5.5 m · Blouse 0.8 m</dd></div>
            <div><dt>Available colours</dt><dd>${(product.colors || []).map(escapeHtml).join(', ') || '—'}</dd></div>
            <div><dt>Available sizes</dt><dd>${(product.sizes || []).map(escapeHtml).join(', ') || '—'}</dd></div>
            <div><dt>SKU</dt><dd>${escapeHtml(product.sku || '—')}</dd></div>
          </dl>
        </div>
        <div class="tab-panel" data-panel="care">
          <ul class="muted" style="max-width:760px;display:grid;gap:8px">
            <li>• Dry clean only for silks; gentle hand wash in cold water for cottons.</li>
            <li>• Store wrapped in a soft muslin cloth, away from direct sunlight.</li>
            <li>• Refold along a different line every few months to protect the zari.</li>
            <li>• Dispatched within 24 hours; delivery in 3–6 working days across India.</li>
            <li>• 7-day returns on unused sarees with tags and packaging intact.</li>
          </ul>
        </div>
      </section>

      ${state.related.length ? `
        <section class="section" style="border-top:1px solid var(--line)">
          <div class="section-head left">
            <span class="eyebrow">You may also love</span>
            <h2>Complete the look</h2>
          </div>
          <div class="product-grid" data-related></div>
        </section>` : ''}`;

    if (state.related.length) Store.renderProducts(document.querySelector('[data-related]'), state.related);

    document.querySelector('[data-breadcrumb]').innerHTML = `
      <a href="index.html">Home</a><span class="sep">/</span>
      <a href="shop.html">Shop</a><span class="sep">/</span>
      <a href="shop.html?category=${product.categoryId || ''}">${escapeHtml(product.categoryName || 'Saree')}</a>
      <span class="sep">/</span><span>${escapeHtml(product.name)}</span>`;
  };

  const addToBag = async (button, buyNow = false) => {
    if (!Store.state.user) {
      toast('Please sign in to continue.', 'info');
      setTimeout(() => { window.location.href = 'login.html'; }, 900);
      return;
    }
    const original = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<span class="spinner"></span>';
    try {
      await API.addToCart({
        productId: state.product.id,
        quantity: state.quantity,
        size: state.size || undefined,
        color: state.color || undefined,
      });
      await Store.refresh();
      if (buyNow) {
        window.location.href = 'checkout.html';
      } else {
        toast(`${state.quantity} × ${state.product.name} added to your bag.`, 'success');
        Store.openCart();
      }
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      button.disabled = false;
      button.innerHTML = original;
    }
  };

  const mountEvents = () => {
    root().addEventListener('click', (event) => {
      const thumb = event.target.closest('[data-thumb]');
      if (thumb) {
        state.imageIndex = Number(thumb.dataset.thumb);
        render();
        return;
      }
      const size = event.target.closest('[data-size]');
      if (size) {
        state.size = size.dataset.size === state.size ? '' : size.dataset.size;
        render();
        return;
      }
      const color = event.target.closest('[data-color]');
      if (color) {
        state.color = color.dataset.color === state.color ? '' : color.dataset.color;
        render();
        return;
      }
      const qty = event.target.closest('[data-qty]');
      if (qty) {
        const next = qty.dataset.qty === 'up' ? state.quantity + 1 : state.quantity - 1;
        state.quantity = Math.max(1, Math.min(state.product.stock, next));
        render();
        return;
      }
      const add = event.target.closest('[data-add]');
      if (add) return addToBag(add, false);
      const buy = event.target.closest('[data-buy-now]');
      if (buy) return addToBag(buy, true);
      const tab = event.target.closest('[data-tab]');
      if (tab) {
        root().querySelectorAll('.tab').forEach((node) => node.classList.toggle('active', node === tab));
        root().querySelectorAll('.tab-panel').forEach((panel) => {
          panel.classList.toggle('active', panel.dataset.panel === tab.dataset.tab);
        });
      }
    });
  };

  const init = async () => {
    await Store.init();
    const id = window.UI.query('id');
    if (!id) {
      root().innerHTML = emptyState({
        title: 'Saree not found',
        message: 'The link you followed did not include a saree. Browse the collection instead.',
        actionLabel: 'Browse all sarees',
        actionHref: 'shop.html',
        icon: 'search',
      });
      return;
    }
    try {
      const { product, related } = await API.product(id);
      state.product = product;
      state.related = related || [];
      state.imageIndex = 0;
      state.size = (product.sizes || [])[0] || '';
      state.color = (product.colors || [])[0] || '';
      state.quantity = 1;
      render();
      mountEvents();
      document.title = `${product.name} — Zaraz Boutique`;
    } catch (err) {
      root().innerHTML = emptyState({
        title: 'Saree not found',
        message: err.message || 'This saree is no longer available.',
        actionLabel: 'Browse all sarees',
        actionHref: 'shop.html',
        icon: 'search',
      });
    }
  };

  document.addEventListener('DOMContentLoaded', init);
})();
