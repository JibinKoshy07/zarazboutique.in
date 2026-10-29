/** Categories view: hierarchical table (parent › sub) with add/edit/delete. */
(function () {
  const { escapeHtml, count, skeletonRows, emptyRow, confirmAction, modal, toast, setBusy, showFieldErrors, clearFieldErrors } = window.AUI;

  let categories = [];
  let bound = false;

  const load = async () => {
    const { categories: list } = await AdminAPI.categories();
    categories = list;
    renderRows();
  };

  const renderRows = () => {
    const tbody = document.querySelector('[data-categories-body]');
    if (!categories.length) {
      tbody.innerHTML = emptyRow(5, 'No categories yet. Create your first weave category.', 'Add category', 'data-new-category');
      tbody.querySelector('[data-new-category]')?.addEventListener('click', () => openForm());
      return;
    }

    // Parents first, each immediately followed by its children.
    const parents = categories.filter((c) => !c.parentId);
    const orphans = categories.filter((c) => c.parentId && !categories.some((p) => p.id === c.parentId));
    const rows = [];

    const rowFor = (category, isChild) => `
      <tr>
        <td>
          <div class="cell-strong" style="${isChild ? 'padding-left:18px;color:var(--a-ink-soft)' : ''}">
            ${isChild ? '› ' : ''}${escapeHtml(category.name)}
          </div>
          ${category.description ? `<div class="cell-sub">${escapeHtml(category.description.slice(0, 80))}</div>` : ''}
        </td>
        <td class="cell-sub">${isChild ? escapeHtml(category.parentName || '—') : '<span class="badge badge-maroon">Top level</span>'}</td>
        <td>${count(category.productCount)}</td>
        <td>${category.isActive ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-danger">Hidden</span>'}</td>
        <td class="actions">
          <button class="btn btn-outline btn-sm" type="button" data-edit="${category.id}">${AUI.ICONS.edit} Edit</button>
          <button class="btn btn-ghost-danger btn-sm" type="button" data-delete="${category.id}">${AUI.ICONS.trash}</button>
        </td>
      </tr>`;

    parents.forEach((parent) => {
      rows.push(rowFor(parent, false));
      categories.filter((c) => c.parentId === parent.id).forEach((child) => rows.push(rowFor(child, true)));
    });
    orphans.forEach((orphan) => rows.push(rowFor(orphan, false)));

    tbody.innerHTML = rows.join('');
  };

  const fillParentSelect = (currentId) => {
    const select = document.querySelector('[data-parent-select]');
    select.innerHTML =
      '<option value="">— None (top level) —</option>' +
      categories
        .filter((category) => !category.parentId && category.id !== Number(currentId))
        .map((category) => `<option value="${category.id}">${escapeHtml(category.name)}</option>`)
        .join('');
  };

  const openForm = (category = null) => {
    const form = document.querySelector('[data-category-form]');
    form.reset();
    clearFieldErrors(form);
    form.querySelector('[data-form-alert]').classList.add('hidden');
    document.querySelector('[data-category-modal-title]').textContent = category ? 'Edit category' : 'Add category';

    fillParentSelect(category ? category.id : null);

    if (category) {
      form.querySelector('[name="id"]').value = category.id;
      form.querySelector('[name="name"]').value = category.name;
      form.querySelector('[name="parent_id"]').value = category.parentId || '';
      form.querySelector('[name="description"]').value = category.description || '';
      form.querySelector('[name="sort_order"]').value = category.sortOrder ?? 0;
      form.querySelector('[name="is_active"]').checked = category.isActive !== false;
    } else {
      form.querySelector('[name="sort_order"]').value = 0;
      form.querySelector('[name="is_active"]').checked = true;
    }
    modal.open('category-modal');
  };

  const submit = async (event) => {
    event.preventDefault();
    const form = event.target;
    clearFieldErrors(form);
    const alertBox = form.querySelector('[data-form-alert]');
    alertBox.classList.add('hidden');
    const values = Object.fromEntries(new FormData(form).entries());
    const submitButton = form.querySelector('[type="submit"]');

    const payload = {
      name: values.name.trim(),
      description: values.description ? values.description.trim() : null,
      parent_id: values.parent_id ? Number(values.parent_id) : null,
      sort_order: Number(values.sort_order || 0),
      is_active: values.is_active === 'on',
    };

    setBusy(submitButton, true, 'Saving');
    try {
      if (values.id) await AdminAPI.updateCategory(values.id, payload);
      else await AdminAPI.createCategory(payload);
      modal.close('category-modal');
      toast(values.id ? 'Category updated.' : 'Category created.', 'success');
      await load();
      Console.refreshBadges();
    } catch (err) {
      if (err.details && err.details.length) showFieldErrors(form, err.details);
      alertBox.textContent = err.message;
      alertBox.classList.remove('hidden');
    } finally {
      setBusy(submitButton, false);
    }
  };

  const bind = () => {
    if (bound) return;
    bound = true;

    document.querySelector('[data-view="categories"]').addEventListener('click', async (event) => {
      if (event.target.closest('[data-new-category]')) return openForm();

      const edit = event.target.closest('[data-edit]');
      if (edit) return openForm(categories.find((c) => c.id === Number(edit.dataset.edit)));

      const del = event.target.closest('[data-delete]');
      if (del) {
        const category = categories.find((c) => c.id === Number(del.dataset.delete));
        const ok = await confirmAction(
          `Delete “${category.name}”? Subcategories become top-level and products lose this category. Categories with products cannot be deleted.`,
          { confirmLabel: 'Delete category' }
        );
        if (!ok) return;
        try {
          await AdminAPI.deleteCategory(category.id);
          toast('Category deleted.', 'success');
          await load();
          Console.refresh('products');
        } catch (err) {
          toast(err.message, 'error');
        }
      }
    });

    document.querySelector('[data-category-form]').addEventListener('submit', submit);
  };

  const render = async (host) => {
    host.innerHTML = `
      <div class="card">
        <div class="card-head">
          <h2>Product categories</h2>
          <div class="spacer"></div>
          <button class="btn btn-primary" type="button" data-new-category>${AUI.ICONS.plus} Add category</button>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Category</th><th>Parent</th><th>Products</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody data-categories-body>${skeletonRows(5, 5)}</tbody>
          </table>
        </div>
      </div>`;
    await load();
    bind();
  };

  window.AdminPages = window.AdminPages || {};
  window.AdminPages.categories = { render };
})();
