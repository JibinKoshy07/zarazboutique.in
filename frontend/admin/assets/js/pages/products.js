/**
 * Products view: searchable, filterable, paginated table plus the create/edit
 * modal with image URL + upload handling and chip-based size/colour inputs.
 */
(function () {
  const {
    money, count, escapeHtml, badgeFor, stockBadge, skeletonRows, emptyRow,
    confirmAction, modal, toast, setBusy, showFieldErrors, clearFieldErrors, debounce, pagination,
  } = window.AUI;

  const state = {
    page: 1,
    limit: 20,
    q: '',
    category: '',
    sort: 'newest',
    total: 0,
    pages: 1,
    items: [],
    categories: [],
    images: [],
    sizes: [],
    colors: [],
    editing: null,
  };

  let bound = false;

  /* ------------------------------ data loading ---------------------------- */

  const loadCategories = async () => {
    const { categories } = await AdminAPI.categories();
    state.categories = categories;
    const select = document.querySelector('[data-category-select]');
    // Subcategories are indented so the one-level hierarchy is obvious.
    select.innerHTML =
      '<option value="">— No category —</option>' +
      categories
        .map((category) =>
          category.parentId
            ? `<option value="${category.id}">&nbsp;&nbsp;› ${escapeHtml(category.name)}</option>`
            : `<option value="${category.id}">${escapeHtml(category.name)}</option>`
        )
        .join('');

    const filter = document.querySelector('[data-product-filter-category]');
    filter.innerHTML =
      '<option value="">All categories</option>' +
      categories
        .map((category) => `<option value="${category.id}">${category.parentId ? `&nbsp;&nbsp;› ` : ''}${escapeHtml(category.name)}</option>`)
        .join('');
    filter.value = state.category;
  };

  const loadProducts = async () => {
    const tbody = document.querySelector('[data-products-body]');
    tbody.innerHTML = skeletonRows(6, 6);
    const response = await AdminAPI.products({
      page: state.page,
      limit: state.limit,
      q: state.q,
      category: state.category,
      sort: state.sort,
    });
    state.items = response.products;
    state.total = response.pagination.total;
    state.pages = response.pagination.pages;
    renderRows();
  };

  /* -------------------------------- rendering ----------------------------- */

  const renderRows = () => {
    const tbody = document.querySelector('[data-products-body]');
    if (!state.items.length) {
      tbody.innerHTML = emptyRow(6, 'No products match your filters.', 'Add a product', 'data-new-product');
      tbody.querySelector('[data-new-product]')?.addEventListener('click', () => openForm());
    } else {
      tbody.innerHTML = state.items
        .map(
          (product) => `
        <tr>
          <td><img class="thumb" src="${escapeHtml(product.image || '')}" alt="" loading="lazy" /></td>
          <td>
            <div class="cell-strong">${escapeHtml(product.name)}</div>
            <div class="cell-sub">${escapeHtml(product.sku || '—')} · ${escapeHtml(product.categoryName || 'Uncategorised')}</div>
            <div class="flex gap-8 wrap" style="margin-top:5px">
              ${product.isFeatured ? '<span class="badge badge-maroon">Featured</span>' : ''}
              ${product.isNewArrival ? '<span class="badge badge-info">New</span>' : ''}
              ${product.isBestseller ? '<span class="badge badge-warn">Bestseller</span>' : ''}
              ${!product.isActive ? '<span class="badge badge-danger">Hidden</span>' : ''}
            </div>
          </td>
          <td class="nowrap">
            <div class="cell-strong">${money(product.price)}</div>
            ${product.compareAtPrice ? `<div class="cell-sub"><s>${money(product.compareAtPrice)}</s></div>` : ''}
          </td>
          <td>${stockBadge(product.stock, product.lowStockThreshold)}</td>
          <td class="cell-sub">${(product.colors || []).length ? escapeHtml(product.colors.join(', ')) : '—'}</td>
          <td class="actions">
            <button class="btn btn-outline btn-sm" type="button" data-edit="${product.id}">${AUI.ICONS.edit} Edit</button>
            <button class="btn btn-outline btn-sm" type="button" data-stock="${product.id}">Stock</button>
            <button class="btn btn-ghost-danger btn-sm" type="button" data-delete="${product.id}">${AUI.ICONS.trash}</button>
          </td>
        </tr>`
        )
        .join('');
    }

    document.querySelector('[data-products-count]').textContent = state.total
      ? `${count(state.total)} product${state.total === 1 ? '' : 's'}`
      : '';

    pagination(document.querySelector('[data-products-pagination]'), { page: state.page, pages: state.pages, total: state.total }, (page) => {
      state.page = page;
      loadProducts();
    });
  };

  /* --------------------------------- form --------------------------------- */

  const renderImages = () => {
    const host = document.querySelector('[data-image-list]');
    host.innerHTML = state.images
      .map(
        (url, index) => `
      <div class="image-item">
        <img src="${escapeHtml(url)}" alt="" />
        <button type="button" data-remove-image="${index}" aria-label="Remove image">✕</button>
        ${index === 0 ? '<div class="primary-flag">Thumbnail</div>' : ''}
      </div>`
      )
      .join('');
  };

  const renderChips = (field) => {
    const host = document.querySelector(`[data-chip-input="${field}"]`);
    const values = field === 'sizes' ? state.sizes : state.colors;
    const entry = host.querySelector('[data-chip-entry]');
    const entryHtml = entry ? entry.outerHTML : `<input type="text" placeholder="Type and press Enter" data-chip-entry />`;
    host.innerHTML =
      values.map((value) => `<span class="chip">${escapeHtml(value)}<button type="button" data-remove-chip="${field}" data-value="${escapeHtml(value)}" aria-label="Remove ${escapeHtml(value)}">×</button></span>`).join('') +
      entryHtml;
    const nextEntry = host.querySelector('[data-chip-entry]');
    nextEntry.placeholder = field === 'sizes' ? 'Add size and press Enter' : 'Add colour and press Enter';
    nextEntry.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      const value = event.target.value.trim();
      if (!value) return;
      const list = field === 'sizes' ? state.sizes : state.colors;
      if (!list.includes(value)) list.push(value);
      event.target.value = '';
      renderChips(field);
      host.querySelector('[data-chip-entry]').focus();
    });
  };

  const openForm = (product = null) => {
    const form = document.querySelector('[data-product-form]');
    form.reset();
    clearFieldErrors(form);
    form.querySelector('[data-form-alert]').classList.add('hidden');
    state.editing = product;
    state.images = product ? [...(product.images || [])] : [];
    state.sizes = product ? [...(product.sizes || [])] : ['Free Size', 'Unstitched'];
    state.colors = product ? [...(product.colors || [])] : [];

    document.querySelector('[data-product-modal-title]').textContent = product ? 'Edit product' : 'Add product';
    document.querySelector('[data-product-submit]').textContent = product ? 'Save changes' : 'Create product';

    if (product) {
      const fields = {
        id: product.id,
        name: product.name,
        sku: product.sku || '',
        category_id: product.categoryId || '',
        fabric: product.fabric || '',
        stock: product.stock,
        low_stock_threshold: product.lowStockThreshold ?? 5,
        price: product.price,
        compare_at_price: product.compareAtPrice || '',
        description: product.description || '',
      };
      Object.entries(fields).forEach(([key, value]) => {
        const input = form.querySelector(`[name="${key}"]`);
        if (input) input.value = value ?? '';
      });
      form.querySelector('[name="is_featured"]').checked = Boolean(product.isFeatured);
      form.querySelector('[name="is_new_arrival"]').checked = Boolean(product.isNewArrival);
      form.querySelector('[name="is_bestseller"]').checked = Boolean(product.isBestseller);
      form.querySelector('[name="is_active"]').checked = product.isActive !== false;
    } else {
      form.querySelector('[name="stock"]').value = 0;
      form.querySelector('[name="low_stock_threshold"]').value = 5;
      form.querySelector('[name="is_active"]').checked = true;
    }

    renderImages();
    renderChips('sizes');
    renderChips('colors');
    modal.open('product-modal');
  };

  const submitForm = async (event) => {
    event.preventDefault();
    const form = event.target;
    clearFieldErrors(form);
    const alertBox = form.querySelector('[data-form-alert]');
    alertBox.classList.add('hidden');
    const values = Object.fromEntries(new FormData(form).entries());
    const submit = form.querySelector('[data-product-submit]');

    if (!state.images.length) {
      alertBox.textContent = 'Add at least one product image.';
      alertBox.classList.remove('hidden');
      return;
    }

    const payload = {
      name: values.name.trim(),
      sku: values.sku ? values.sku.trim() : null,
      category_id: values.category_id ? Number(values.category_id) : null,
      fabric: values.fabric ? values.fabric.trim() : null,
      description: values.description ? values.description.trim() : null,
      price: Number(values.price),
      compare_at_price: values.compare_at_price ? Number(values.compare_at_price) : null,
      stock: Number(values.stock),
      low_stock_threshold: Number(values.low_stock_threshold || 5),
      sizes: state.sizes,
      colors: state.colors,
      images: state.images,
      is_featured: values.is_featured === 'on',
      is_new_arrival: values.is_new_arrival === 'on',
      is_bestseller: values.is_bestseller === 'on',
      is_active: values.is_active === 'on',
    };

    setBusy(submit, true, 'Saving');
    try {
      if (state.editing) await AdminAPI.updateProduct(state.editing.id, payload);
      else await AdminAPI.createProduct(payload);
      modal.close('product-modal');
      toast(state.editing ? 'Product updated.' : 'Product created.', 'success');
      Console.refresh('products');
      Console.refreshBadges();
    } catch (err) {
      if (err.details && err.details.length) showFieldErrors(form, err.details);
      alertBox.textContent = err.message;
      alertBox.classList.remove('hidden');
    } finally {
      setBusy(submit, false);
    }
  };

  /* --------------------------------- stock -------------------------------- */

  const openStockModal = (product) => {
    const form = document.querySelector('[data-stock-form]');
    form.reset();
    clearFieldErrors(form);
    form.querySelector('[data-form-alert]').classList.add('hidden');
    form.querySelector('[name="product_id"]').value = product.id;
    document.querySelector('[data-stock-product]').textContent = `${product.name} — currently ${product.stock} in stock.`;
    modal.open('stock-modal');
  };

  const submitStock = async (event) => {
    event.preventDefault();
    const form = event.target;
    const values = Object.fromEntries(new FormData(form).entries());
    const payload = {};
    if (values.stock !== '') payload.stock = Number(values.stock);
    if (values.delta !== '') payload.delta = Number(values.delta);
    if (payload.stock === undefined && payload.delta === undefined) {
      toast('Enter a new stock level or an adjustment.', 'info');
      return;
    }
    try {
      const result = await AdminAPI.setStock(values.product_id, payload);
      modal.close('stock-modal');
      toast(`Stock updated to ${result.stock}.`, 'success');
      Console.refresh('products');
      Console.refresh('inventory');
      Console.refreshBadges();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  /* --------------------------------- events ------------------------------- */

  const bind = () => {
    if (bound) return;
    bound = true;

    const view = document.querySelector('[data-view="products"]');
    view.addEventListener('click', async (event) => {
      if (event.target.closest('[data-new-product]')) return openForm();

      const edit = event.target.closest('[data-edit]');
      if (edit) {
        const product = state.items.find((p) => p.id === Number(edit.dataset.edit));
        return openForm(product);
      }

      const stock = event.target.closest('[data-stock]');
      if (stock) return openStockModal(state.items.find((p) => p.id === Number(stock.dataset.stock)));

      const del = event.target.closest('[data-delete]');
      if (del) {
        const product = state.items.find((p) => p.id === Number(del.dataset.delete));
        const ok = await confirmAction(`Delete “${product.name}”? Products with existing orders are archived instead of removed.`, { confirmLabel: 'Delete product' });
        if (!ok) return;
        try {
          const result = await AdminAPI.deleteProduct(product.id);
          toast(result.archived ? 'Product archived (it appears in past orders).' : 'Product deleted.', 'success');
          Console.refresh('products');
          Console.refreshBadges();
        } catch (err) {
          toast(err.message, 'error');
        }
      }
    });

    view.addEventListener('input', debounce((event) => {
      if (event.target.matches('[data-product-search]')) {
        state.q = event.target.value.trim();
        state.page = 1;
        loadProducts();
      }
    }, 400));

    view.addEventListener('change', (event) => {
      if (event.target.matches('[data-product-filter-category]')) {
        state.category = event.target.value;
        state.page = 1;
        loadProducts();
      }
      if (event.target.matches('[data-product-sort]')) {
        state.sort = event.target.value;
        state.page = 1;
        loadProducts();
      }
    });

    document.querySelector('[data-product-form]').addEventListener('submit', submitForm);
    document.querySelector('[data-stock-form]').addEventListener('submit', submitStock);

    // Image list is re-rendered on every change, so delegate from the form.
    document.querySelector('[data-product-form]').addEventListener('click', async (event) => {
      const remove = event.target.closest('[data-remove-image]');
      if (remove) {
        state.images.splice(Number(remove.dataset.removeImage), 1);
        renderImages();
        return;
      }
      if (event.target.closest('[data-image-add]')) {
        const input = document.querySelector('[data-image-url]');
        const url = input.value.trim();
        if (!/^https?:\/\//i.test(url)) return toast('Enter a valid image URL starting with http.', 'error');
        state.images.push(url);
        input.value = '';
        renderImages();
      }
    });

    document.querySelector('[data-image-url]').addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      document.querySelector('[data-image-add]').click();
    });

    document.querySelector('[data-image-upload]').addEventListener('change', async (event) => {
      const files = [...event.target.files];
      if (!files.length) return;
      const formData = new FormData();
      files.forEach((file) => formData.append('images', file));
      try {
        const { urls } = await AdminAPI.uploadImages(formData);
        state.images.push(...urls);
        renderImages();
        toast(`${urls.length} image${urls.length === 1 ? '' : 's'} uploaded.`, 'success');
      } catch (err) {
        toast(err.message, 'error');
      } finally {
        event.target.value = '';
      }
    });

    document.querySelector('[data-product-form]').addEventListener('click', (event) => {
      const remove = event.target.closest('[data-remove-chip]');
      if (!remove) return;
      const field = remove.dataset.removeChip;
      const list = field === 'sizes' ? state.sizes : state.colors;
      const index = list.indexOf(remove.dataset.value);
      if (index >= 0) list.splice(index, 1);
      renderChips(field);
    });
  };

  const render = async (host) => {
    host.innerHTML = `
      <div class="card">
        <div class="toolbar">
          <input class="input search" type="search" placeholder="Search products by name or SKU…" data-product-search value="${escapeHtml(state.q)}" aria-label="Search products" />
          <select class="select" data-product-filter-category style="width:auto;min-width:170px" aria-label="Filter by category"></select>
          <select class="select" data-product-sort style="width:auto" aria-label="Sort products">
            <option value="newest">Newest first</option>
            <option value="name_asc">Name A–Z</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
            <option value="stock_asc">Stock: low to high</option>
          </select>
          <span class="small muted" data-products-count></span>
          <div class="spacer"></div>
          <button class="btn btn-primary" type="button" data-new-product>${AUI.ICONS.plus} Add product</button>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>Image</th><th>Product</th><th>Price</th><th>Stock</th><th>Colours</th><th>Actions</th></tr>
            </thead>
            <tbody data-products-body></tbody>
          </table>
        </div>
        <div class="pagination" data-products-pagination></div>
      </div>`;

    document.querySelector('[data-product-sort]').value = state.sort;
    await loadCategories();
    await loadProducts();
    bind();
  };

  window.AdminPages = window.AdminPages || {};
  window.AdminPages.products = { render, openForm };
})();
