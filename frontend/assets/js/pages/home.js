/** Home page: value strip, category tiles and the three product rails. */
(function () {
  const { escapeHtml, renderSkeletons, ICONS, toast } = window.UI;

  const VALUE_ITEMS = [
    { icon: 'truck', title: 'Free shipping over ₹4,999', text: 'Delivered in 3–6 working days' },
    { icon: 'shield', title: 'Authentic handloom', text: 'Direct from weaver clusters' },
    { icon: 'sparkle', title: 'Free blouse piece', text: 'Unstitched with every saree' },
    { icon: 'phone', title: 'Personal styling help', text: 'Talk to us on WhatsApp' },
  ];

  // Fallback imagery keeps category tiles looking complete before products load.
  const CATEGORY_IMAGES = {
    'Banarasi Silk': 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=700&q=80',
    Kanjeevaram: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=700&q=80',
    Chiffon: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=700&q=80',
    Georgette: 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=700&q=80',
    'Cotton Handloom': 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=700&q=80',
    Organza: 'https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=700&q=80',
    'Bridal Couture': 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=700&q=80',
    'Designer Party Wear': 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=700&q=80',
  };

  const mountValueStrip = () => {
    const host = document.querySelector('[data-value-strip]');
    host.innerHTML = VALUE_ITEMS.map(
      (item) => `
      <div class="value-item">
        ${ICONS[item.icon]}
        <div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.text)}</span></div>
      </div>`
    ).join('');
  };

  const mountNewsletter = () => {
    const form = document.querySelector('[data-newsletter]');
    if (!form) return;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      form.reset();
      toast('Thank you for subscribing to Zaraz.', 'success');
    });
  };

  const loadCategories = async () => {
    const host = document.querySelector('[data-categories]');
    host.innerHTML = Array.from({ length: 8 })
      .map(() => '<div class="skeleton" style="aspect-ratio:3/4;border-radius:12px"></div>')
      .join('');
    try {
      const { categories } = await API.categories();
      host.innerHTML = categories
        .slice(0, 8)
        .map(
          (category) => `
        <a class="category-card" href="shop.html?category=${category.id}">
          <img src="${escapeHtml(CATEGORY_IMAGES[category.name] || '')}" alt="${escapeHtml(category.name)} sarees" loading="lazy" />
          <div class="category-card-body">
            <h3>${escapeHtml(category.name)}</h3>
            <span>${category.productCount || 0} design${category.productCount === 1 ? '' : 's'}</span>
          </div>
        </a>`
        )
        .join('');
    } catch (err) {
      host.innerHTML = `<div style="grid-column:1/-1" class="alert alert-error">${escapeHtml(err.message)}</div>`;
    }
  };

  const loadRail = async (selector, params) => {
    const host = document.querySelector(selector);
    renderSkeletons(host, 4);
    try {
      const { products } = await API.products({ ...params, limit: 4 });
      Store.renderProducts(host, products);
    } catch (err) {
      host.innerHTML = `<div style="grid-column:1/-1" class="alert alert-error">${escapeHtml(err.message)}</div>`;
    }
  };

  const init = async () => {
    mountValueStrip();
    mountNewsletter();
    await Store.init();
    await Promise.all([
      loadCategories(),
      loadRail('[data-bestsellers]', { bestseller: true, sort: 'popular' }),
      loadRail('[data-new-arrivals]', { new: true, sort: 'newest' }),
    ]);
  };

  document.addEventListener('DOMContentLoaded', init);
})();
