/**
 * Shop page: category / price / availability filters, search, sort and
 * pagination. Filter state lives in the URL so results are shareable.
 */
(function () {
  const { escapeHtml, renderSkeletons, toast } = window.UI;

  const filters = {
    category: '',
    q: '',
    sort: 'newest',
    minPrice: '',
    maxPrice: '',
    inStock: false,
    new: false,
    bestseller: false,
    page: 1,
  };

  let categories = [];
  let totalPages = 1;

  const readUrl = () => {
    const params = new URLSearchParams(window.location.search);
    filters.category = params.get('category') || '';
    filters.q = params.get('q') || '';
    filters.sort = params.get('sort') || 'newest';
    filters.inStock = params.get('inStock') === 'true';
    filters.new = params.get('new') === 'true';
    filters.bestseller = params.get('bestseller') === 'true';
    filters.page = Number(params.get('page')) || 1;
    const price = params.get('price') || '';
    const [min, max] = price.split('-');
    filters.minPrice = min || '';
    filters.maxPrice = max || '';
  };

  const writeUrl = () => {
    const params = new URLSearchParams();
    if (filters.category) params.set('category', filters.category);
    if (filters.q) params.set('q', filters.q);
    if (filters.sort !== 'newest') params.set('sort', filters.sort);
    if (filters.minPrice || filters.maxPrice) params.set('price', `${filters.minPrice}-${filters.maxPrice}`);
    if (filters.inStock) params.set('inStock', 'true');
    if (filters.new) params.set('new', 'true');
    if (filters.bestseller) params.set('bestseller', 'true');
    if (filters.page > 1) params.set('page', String(filters.page));
    const qs = params.toString();
    window.history.replaceState({}, '', qs ? `?${qs}` : window.location.pathname);
  };

  /* --------------------------------- chips -------------------------------- */

  const activeChips = () => {
    const chips = [];
    if (filters.category) {
      const found = categories.find((c) => String(c.id) === String(filters.category));
      chips.push({ key: 'category', label: found ? found.name : 'Category' });
    }
    if (filters.q) chips.push({ key: 'q', label: `“${filters.q}”` });
    if (filters.minPrice || filters.maxPrice) {
      chips.push({ key: 'price', label: `₹${filters.minPrice || '0'} – ₹${filters.maxPrice || '∞'}` });
    }
    if (filters.inStock) chips.push({ key: 'inStock', label: 'In stock' });
    if (filters.new) chips.push({ key: 'new', label: 'New arrivals' });
    if (filters.bestseller) chips.push({ key: 'bestseller', label: 'Bestsellers' });

    const host = document.querySelector('[data-chips]');
    if (!chips.length) {
      host.innerHTML = '';
      return;
    }
    host.innerHTML =
      chips
        .map((chip) => `<button class="chip active" type="button" data-remove-chip="${chip.key}">${escapeHtml(chip.label)} ×</button>`)
        .join('') +
      '<button class="chip" type="button" data-remove-chip="all">Clear all</button>';
  };

  /* ------------------------------- sidebar -------------------------------- */

  const renderCategoryFilters = () => {
    const host = document.querySelector('[data-category-filters]');
    const rows = [
      `<li><label><input type="radio" name="cat" value="" ${!filters.category ? 'checked' : ''} /> All sarees</label></li>`,
    ];
    categories.forEach((category) => {
      rows.push(
        `<li><label><input type="radio" name="cat" value="${category.id}" ${String(filters.category) === String(category.id) ? 'checked' : ''} /> ${escapeHtml(category.name)}<span class="count">${category.productCount || 0}</span></label></li>`
      );
      (category.children || []).forEach((child) => {
        rows.push(
          `<li style="padding-left:18px"><label><input type="radio" name="cat" value="${child.id}" ${String(filters.category) === String(child.id) ? 'checked' : ''} /> ${escapeHtml(child.name)}<span class="count">${child.productCount || 0}</span></label></li>`
        );
      });
    });
    host.innerHTML = rows.join('');
  };

  const syncSidebar = () => {
    document.querySelectorAll('[data-flag]').forEach((input) => {
      input.checked = Boolean(filters[input.dataset.flag]);
    });
    const priceValue = `${filters.minPrice}-${filters.maxPrice}`;
    document.querySelectorAll('input[name="price"]').forEach((input) => {
      input.checked = input.value === priceValue || (!priceValue.replace('-', '') && input.value === '');
    });
    const searchInput = document.querySelector('[data-search-input]');
    if (searchInput && searchInput.value !== filters.q) searchInput.value = filters.q;
    document.querySelector('[data-sort]').value = filters.sort;
    renderCategoryFilters();
    activeChips();
  };

  /* -------------------------------- results ------------------------------- */

  const loadProducts = async () => {
    const host = document.querySelector('[data-products]');
    const countHost = document.querySelector('[data-result-count]');
    renderSkeletons(host, 8);
    countHost.textContent = 'Loading…';
    writeUrl();

    try {
      const { products, pagination } = await API.products({
        category: filters.category,
        q: filters.q,
        sort: filters.sort,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        inStock: filters.inStock ? 'true' : '',
        new: filters.new ? 'true' : '',
        bestseller: filters.bestseller ? 'true' : '',
        page: filters.page,
        limit: 12,
      });
      totalPages = pagination.pages;
      countHost.textContent = pagination.total
        ? `${pagination.total} saree${pagination.total > 1 ? 's' : ''} found`
        : 'No sarees found';
      Store.renderProducts(host, products, 'Try widening your filters or search for a different weave.');
      renderPagination(pagination);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      host.innerHTML = `<div style="grid-column:1/-1" class="alert alert-error">${escapeHtml(err.message)}</div>`;
      countHost.textContent = '';
      renderPagination({ page: 1, pages: 1 });
    }
  };

  const renderPagination = ({ page, pages }) => {
    const host = document.querySelector('[data-pagination]');
    if (!pages || pages <= 1) {
      host.innerHTML = '';
      return;
    }
    const buttons = [`<button type="button" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>‹</button>`];
    for (let i = 1; i <= pages; i += 1) {
      // Show first, last and a window around the current page.
      if (i === 1 || i === pages || Math.abs(i - page) <= 1) {
        buttons.push(`<button type="button" data-page="${i}" class="${i === page ? 'active' : ''}">${i}</button>`);
      } else if (Math.abs(i - page) === 2) {
        buttons.push('<button type="button" disabled>…</button>');
      }
    }
    buttons.push(`<button type="button" data-page="${page + 1}" ${page >= pages ? 'disabled' : ''}>›</button>`);
    host.innerHTML = buttons.join('');
  };

  /* --------------------------------- events ------------------------------- */

  const debounce = (fn, delay = 350) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  };

  const resetTo = (changes) => {
    Object.assign(filters, changes);
    if (!('page' in changes)) filters.page = 1;
    syncSidebar();
    loadProducts();
  };

  const mountEvents = () => {
    document.querySelector('[data-search-input]').addEventListener(
      'input',
      debounce((event) => resetTo({ q: event.target.value.trim() }), 400)
    );

    document.querySelector('[data-category-filters]').addEventListener('change', (event) => {
      if (event.target.name === 'cat') resetTo({ category: event.target.value });
    });

    document.querySelector('[data-price-filters]').addEventListener('change', (event) => {
      if (event.target.name !== 'price') return;
      const [min, max] = event.target.value.split('-');
      resetTo({ minPrice: min || '', maxPrice: max || '' });
    });

    document.querySelectorAll('[data-flag]').forEach((input) => {
      input.addEventListener('change', () => resetTo({ [input.dataset.flag]: input.checked }));
    });

    document.querySelector('[data-sort]').addEventListener('change', (event) => resetTo({ sort: event.target.value }));

    document.querySelector('[data-clear-filters]').addEventListener('click', () => {
      resetTo({ category: '', q: '', minPrice: '', maxPrice: '', inStock: false, new: false, bestseller: false });
      toast('Filters cleared.', 'info');
    });

    document.querySelector('[data-chips]').addEventListener('click', (event) => {
      const button = event.target.closest('[data-remove-chip]');
      if (!button) return;
      const key = button.dataset.removeChip;
      if (key === 'all') {
        resetTo({ category: '', q: '', minPrice: '', maxPrice: '', inStock: false, new: false, bestseller: false });
        return;
      }
      if (key === 'price') return resetTo({ minPrice: '', maxPrice: '' });
      if (key === 'q') return resetTo({ q: '' });
      resetTo({ [key]: key === 'category' ? '' : false });
    });

    document.querySelector('[data-pagination]').addEventListener('click', (event) => {
      const button = event.target.closest('[data-page]');
      if (!button || button.disabled) return;
      const next = Number(button.dataset.page);
      if (next < 1 || next > totalPages) return;
      filters.page = next;
      syncSidebar();
      loadProducts();
    });
  };

  const init = async () => {
    readUrl();
    await Store.init();
    try {
      const response = await API.categories();
      categories = response.categories;
    } catch {
      categories = [];
    }
    syncSidebar();
    mountEvents();
    await loadProducts();
  };

  document.addEventListener('DOMContentLoaded', init);
})();
