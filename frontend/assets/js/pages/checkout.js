/**
 * Checkout: address book, payment method selection and order placement.
 *
 * The payment step is intentionally abstracted. It renders whatever methods the
 * server advertises and shows a clear "gateway coming soon" notice for online
 * payments, so a real provider can be wired up later without touching the flow.
 */
(function () {
  const { money, escapeHtml, toast, emptyState, ICONS, handleForm, setBusy } = window.UI;

  const state = { addresses: [], methods: [], selectedAddressId: null, paymentMethod: '' };
  const root = () => document.querySelector('[data-checkout-root]');

  /* ------------------------------ address form ---------------------------- */

  const openAddressForm = (address = null) => {
    const form = document.querySelector('[data-address-form]');
    form.reset();
    UI.clearFieldErrors(form);
    form.querySelector('[data-form-alert]').classList.add('hidden');
    document.querySelector('[data-address-title]').textContent = address ? 'Edit delivery address' : 'Add delivery address';

    if (address) {
      Object.entries(address).forEach(([key, value]) => {
        const input = form.querySelector(`[name="${key}"]`);
        if (!input) return;
        if (input.type === 'checkbox') input.checked = Boolean(value);
        else input.value = value ?? '';
      });
    } else {
      form.querySelector('[name="country"]').value = 'India';
      form.querySelector('[name="label"]').value = 'Home';
      form.querySelector('[name="is_default"]').checked = state.addresses.length === 0;
    }

    document.querySelector('[data-address-panel]').classList.add('open');
    document.querySelector('[data-address-backdrop]').classList.add('open');
    document.querySelector('[data-address-panel]').setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
  };

  const closeAddressForm = () => {
    document.querySelector('[data-address-panel]').classList.remove('open');
    document.querySelector('[data-address-backdrop]').classList.remove('open');
    document.querySelector('[data-address-panel]').setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
  };

  /* -------------------------------- rendering ----------------------------- */

  const addressCard = (address) => `
    <div class="address-card ${address.id === state.selectedAddressId ? 'selected' : ''}" data-select-address="${address.id}" role="button" tabindex="0">
      <div class="addr-head">
        <strong>${escapeHtml(address.label || 'Address')}</strong>
        ${address.isDefault ? '<span class="default-pill">Default</span>' : ''}
      </div>
      <p>${escapeHtml(address.fullName)} · ${escapeHtml(address.phone)}</p>
      <p>${escapeHtml(address.line1)}${address.line2 ? `, ${escapeHtml(address.line2)}` : ''}</p>
      <p>${escapeHtml(address.city)}, ${escapeHtml(address.state)} ${escapeHtml(address.postalCode)}</p>
      <p>${escapeHtml(address.country)}</p>
      <div class="addr-actions">
        <button class="link-btn" type="button" data-edit-address="${address.id}">Edit</button>
        <button class="link-btn" type="button" data-delete-address="${address.id}">Delete</button>
        ${!address.isDefault ? `<button class="link-btn" type="button" data-default-address="${address.id}">Make default</button>` : ''}
      </div>
    </div>`;

  const render = () => {
    if (!Store.state.user) {
      root().innerHTML = emptyState({
        title: 'Sign in to check out',
        message: 'Sign in to use your saved addresses and place an order.',
        actionLabel: 'Sign in',
        actionHref: 'login.html',
        icon: 'user',
      });
      return;
    }

    const cart = Store.state.cart;
    if (!cart.items.length) {
      root().innerHTML = emptyState({
        title: 'Your bag is empty',
        message: 'Add a saree to your bag before checking out.',
        actionLabel: 'Explore the collection',
        actionHref: 'shop.html',
        icon: 'bag',
      });
      return;
    }

    root().innerHTML = `
      <div class="checkout-layout">
        <div>
          <div class="panel">
            <div class="panel-head">
              <h3>Delivery address</h3>
              <button class="btn btn-ghost btn-sm" type="button" data-add-address>${ICONS.plus} Add new</button>
            </div>
            ${state.addresses.length
              ? `<div class="address-list">${state.addresses.map(addressCard).join('')}</div>`
              : '<p class="muted small">No saved addresses yet. Add one to continue.</p>'}
          </div>

          <div class="panel">
            <div class="panel-head"><h3>Payment method</h3></div>
            <div class="pay-methods">
              ${state.methods
                .map(
                  (method) => `
                <label class="pay-method ${method.id === state.paymentMethod ? 'selected' : ''}">
                  <input type="radio" name="payment" value="${escapeHtml(method.id)}" ${method.id === state.paymentMethod ? 'checked' : ''} />
                  <div>
                    <strong>${escapeHtml(method.label)}</strong>
                    <span>${escapeHtml(method.description)}</span>
                    ${method.requiresGateway ? '<span class="status" style="margin-top:8px;display:inline-flex">Online payment gateway coming soon</span>' : ''}
                  </div>
                </label>`
                )
                .join('')}
            </div>
            <div class="alert alert-info" style="margin:18px 0 0">
              Online payments are not enabled yet. Your order will be recorded with the selected method and our team will contact you to complete payment.
            </div>
          </div>

          <div class="panel">
            <div class="panel-head"><h3>Order notes</h3></div>
            <div class="field">
              <label for="order-notes">Anything we should know?</label>
              <textarea class="textarea" id="order-notes" name="notes" placeholder="Gift wrap, delivery instructions, preferred delivery window…" maxlength="500"></textarea>
            </div>
          </div>
        </div>

        <aside class="summary panel">
          <h3>Order summary</h3>
          ${cart.items
            .map(
              (item) => `
            <div class="summary-row">
              <span>${escapeHtml(item.product.name)} × ${item.quantity}
                ${item.size || item.color ? `<br /><span class="small muted">${escapeHtml([item.size, item.color].filter(Boolean).join(' · '))}</span>` : ''}
              </span>
              <span>${money(item.lineTotal)}</span>
            </div>`
            )
            .join('')}
          <div class="summary-row" style="border-top:1px solid var(--line);margin-top:10px;padding-top:14px"><span>Subtotal</span><span>${money(cart.subtotal)}</span></div>
          <div class="summary-row"><span>Shipping</span><span class="${cart.shippingFee === 0 ? 'free' : ''}">${cart.shippingFee === 0 ? 'Free' : money(cart.shippingFee)}</span></div>
          <div class="summary-row total"><span>Total payable</span><span>${money(cart.total)}</span></div>
          <button class="btn btn-primary btn-block btn-lg" type="button" data-place-order style="margin-top:16px" ${state.addresses.length ? '' : 'disabled'}>
            ${state.addresses.length ? 'Place order' : 'Add an address to continue'}
          </button>
          <p class="summary-note">By placing this order you agree to our terms of sale and return policy.</p>
        </aside>
      </div>`;
  };

  /* ------------------------------ interactions ---------------------------- */

  const selectAddress = (id) => {
    state.selectedAddressId = Number(id);
    render();
  };

  const mountEvents = () => {
    root().addEventListener('click', async (event) => {
      if (event.target.closest('[data-add-address]')) return openAddressForm();

      const edit = event.target.closest('[data-edit-address]');
      if (edit) {
        const address = state.addresses.find((a) => a.id === Number(edit.dataset.editAddress));
        return openAddressForm(address);
      }

      const del = event.target.closest('[data-delete-address]');
      if (del) {
        const id = Number(del.dataset.deleteAddress);
        if (!window.confirm('Delete this address?')) return;
        try {
          await API.deleteAddress(id);
          await loadAddresses();
          toast('Address deleted.', 'info');
        } catch (err) {
          toast(err.message, 'error');
        }
        return;
      }

      const makeDefault = event.target.closest('[data-default-address]');
      if (makeDefault) {
        try {
          await API.setDefaultAddress(Number(makeDefault.dataset.defaultAddress));
          await loadAddresses();
          toast('Default address updated.', 'success');
        } catch (err) {
          toast(err.message, 'error');
        }
        return;
      }

      const card = event.target.closest('[data-select-address]');
      if (card && !event.target.closest('button')) return selectAddress(card.dataset.selectAddress);

      if (event.target.closest('[data-place-order]')) return placeOrder();
    });

    root().addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const card = event.target.closest('[data-select-address]');
      if (card) {
        event.preventDefault();
        selectAddress(card.dataset.selectAddress);
      }
    });

    root().addEventListener('change', (event) => {
      if (event.target.name === 'payment') {
        state.paymentMethod = event.target.value;
        render();
      }
    });

    document.querySelector('[data-address-close]').addEventListener('click', closeAddressForm);
    document.querySelector('[data-address-backdrop]').addEventListener('click', closeAddressForm);
  };

  const placeOrder = async () => {
    if (!state.selectedAddressId) return toast('Please choose a delivery address.', 'info');
    if (!state.paymentMethod) return toast('Please choose a payment method.', 'info');

    const button = root().querySelector('[data-place-order]');
    setBusy(button, true, 'Placing order');
    try {
      const notes = root().querySelector('[name="notes"]')?.value.trim();
      const { order, payment } = await API.checkout({
        addressId: state.selectedAddressId,
        paymentMethod: state.paymentMethod,
        notes: notes || undefined,
      });
      await Store.refresh();
      if (payment && payment.requiresGateway && payment.checkoutUrl) {
        // A real gateway would redirect here; today no provider returns one.
        window.location.href = payment.checkoutUrl;
        return;
      }
      window.location.href = `order-confirmation.html?orderId=${order.id}`;
    } catch (err) {
      toast(err.message, 'error');
      setBusy(button, false);
    }
  };

  /* --------------------------------- data --------------------------------- */

  const loadAddresses = async () => {
    const { addresses } = await API.addresses();
    state.addresses = addresses;
    const preferred = addresses.find((a) => a.isDefault) || addresses[0];
    if (!addresses.some((a) => a.id === state.selectedAddressId)) {
      state.selectedAddressId = preferred ? preferred.id : null;
    }
    render();
  };

  const init = async () => {
    await Store.init();
    if (!Store.state.user) {
      render();
      return;
    }

    handleForm(document.querySelector('[data-address-form]'), async (values) => {
      const payload = {
        label: values.label || 'Home',
        full_name: values.full_name,
        phone: values.phone,
        line1: values.line1,
        line2: values.line2 || undefined,
        city: values.city,
        state: values.state,
        postal_code: values.postal_code,
        country: values.country || 'India',
        is_default: values.is_default === 'on',
      };
      const editing = values.id;
      if (editing) await API.updateAddress(Number(editing), payload);
      else await API.createAddress(payload);
      closeAddressForm();
      await loadAddresses();
      toast(editing ? 'Address updated.' : 'Address saved.', 'success');
    }, { busyLabel: 'Saving' });

    try {
      const [{ methods }] = await Promise.all([API.paymentMethods(), loadAddresses()]);
      state.methods = methods;
      if (!state.paymentMethod && methods.length) {
        state.paymentMethod = (methods.find((m) => !m.requiresGateway) || methods[0]).id;
      }
      render();
      mountEvents();
    } catch (err) {
      toast(err.message, 'error');
      render();
    }
  };

  document.addEventListener('DOMContentLoaded', init);
})();
