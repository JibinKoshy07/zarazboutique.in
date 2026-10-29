/** Messages view: contact-form submissions from the storefront. */
(function () {
  const { escapeHtml, dateTime, skeletonRows, emptyRow, toast, ICONS } = window.AUI;

  let items = [];
  let bound = false;

  const load = async () => {
    const tbody = document.querySelector('[data-messages-body]');
    tbody.innerHTML = skeletonRows(5, 5);
    const { messages } = await AdminAPI.messages();
    items = messages;
    render();
  };

  const render = () => {
    const tbody = document.querySelector('[data-messages-body]');
    const unread = items.filter((message) => !message.is_read).length;
    document.querySelector('[data-messages-summary]').textContent = items.length
      ? `${items.length} message${items.length === 1 ? '' : 's'} · ${unread} unread`
      : '';

    if (!items.length) {
      tbody.innerHTML = emptyRow(5, 'No messages from the contact form yet.');
      return;
    }

    tbody.innerHTML = items
      .map(
        (message) => `
      <tr style="${message.is_read ? '' : 'background:#fffdf7'}">
        <td>
          <div class="cell-strong">${escapeHtml(message.name)}</div>
          <div class="cell-sub">${escapeHtml(message.email)}</div>
          ${message.phone ? `<div class="cell-sub">${escapeHtml(message.phone)}</div>` : ''}
        </td>
        <td>
          <div class="cell-strong">${escapeHtml(message.subject || 'General enquiry')}</div>
          <div class="cell-sub">${escapeHtml((message.message || '').slice(0, 110))}${(message.message || '').length > 110 ? '…' : ''}</div>
        </td>
        <td class="nowrap cell-sub">${dateTime(message.created_at)}</td>
        <td>${message.is_read ? '<span class="badge badge-success">Read</span>' : '<span class="badge badge-warn">Unread</span>'}</td>
        <td class="actions">
          <button class="btn btn-outline btn-sm" type="button" data-view-message="${message.id}">Open</button>
          <button class="btn btn-outline btn-sm" type="button" data-mark-message="${message.id}" data-read="${message.is_read}">
            ${message.is_read ? 'Mark unread' : 'Mark read'}
          </button>
        </td>
      </tr>`
      )
      .join('');
  };

  const openMessage = async (message) => {
    const host = document.querySelector('[data-order-detail]');
    host.innerHTML = `
      <div class="flex gap-12 items-center wrap" style="margin-bottom:16px">
        <h3 class="mb-0">${escapeHtml(message.subject || 'General enquiry')}</h3>
        <span class="small muted" style="margin-left:auto">${dateTime(message.created_at)}</span>
      </div>
      <div class="detail-block" style="margin-bottom:16px">
        <h4>From</h4>
        <p><strong>${escapeHtml(message.name)}</strong></p>
        <p><a href="mailto:${escapeHtml(message.email)}">${escapeHtml(message.email)}</a></p>
        ${message.phone ? `<p>${escapeHtml(message.phone)}</p>` : ''}
      </div>
      <div class="detail-block">
        <h4>Message</h4>
        <p style="white-space:pre-wrap">${escapeHtml(message.message)}</p>
      </div>
      <div class="flex gap-8 wrap" style="margin-top:16px">
        <a class="btn btn-primary" href="mailto:${escapeHtml(message.email)}?subject=${encodeURIComponent(`Re: ${message.subject || 'Your enquiry'}`)}">Reply by email</a>
        ${message.is_read ? '' : `<button class="btn btn-outline" type="button" data-mark-message="${message.id}" data-read="false">Mark as read</button>`}
      </div>`;
    AUI.modal.open('order-modal');

    if (!message.is_read) {
      try {
        await AdminAPI.markMessage(message.id, true);
        await load();
        Console.refreshBadges();
      } catch {
        /* non-critical */
      }
    }
  };

  const bind = () => {
    if (bound) return;
    bound = true;

    const view = document.querySelector('[data-view="messages"]');
    view.addEventListener('click', async (event) => {
      const openBtn = event.target.closest('[data-view-message]');
      if (openBtn) {
        const message = items.find((m) => m.id === Number(openBtn.dataset.viewMessage));
        return openMessage(message);
      }

      const mark = event.target.closest('[data-mark-message]');
      if (mark) {
        const nextRead = mark.dataset.read !== 'true';
        try {
          await AdminAPI.markMessage(Number(mark.dataset.markMessage), nextRead);
          await load();
          Console.refreshBadges();
        } catch (err) {
          toast(err.message, 'error');
        }
      }
    });

    // The message modal reuses the order modal container; handle its buttons there.
    document.querySelector('#order-modal').addEventListener('click', async (event) => {
      const mark = event.target.closest('[data-mark-message]');
      if (!mark) return;
      try {
        await AdminAPI.markMessage(Number(mark.dataset.markMessage), true);
        AUI.modal.close('order-modal');
        await load();
        Console.refreshBadges();
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  };

  const renderView = async (host) => {
    host.innerHTML = `
      <div class="card">
        <div class="card-head">
          <h2>Contact messages</h2>
          <div class="spacer"></div>
          <span class="small muted" data-messages-summary></span>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>From</th><th>Enquiry</th><th>Received</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody data-messages-body></tbody>
          </table>
        </div>
      </div>`;
    await load();
    bind();
  };

  window.AdminPages = window.AdminPages || {};
  window.AdminPages.messages = { render: renderView };
})();
