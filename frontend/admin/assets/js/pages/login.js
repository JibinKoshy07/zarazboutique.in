/** Admin sign in. Stores the admin token and forwards to the console. */
(function () {
  const { toast, setBusy, showFieldErrors, clearFieldErrors } = window.AUI;

  const init = () => {
    if (AdminAPI.isLoggedIn()) {
      window.location.href = 'index.html';
      return;
    }

    const form = document.querySelector('[data-admin-login]');
    const alertBox = document.querySelector('[data-form-alert]');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      clearFieldErrors(form);
      alertBox.classList.add('hidden');
      const submit = form.querySelector('[type="submit"]');
      setBusy(submit, true, 'Signing in');

      const values = Object.fromEntries(new FormData(form).entries());
      try {
        const { token, admin } = await AdminAPI.login({
          email: values.email.trim(),
          password: values.password,
        });
        AdminAPI.setToken(token);
        toast(`Welcome back, ${admin.name || 'admin'}.`, 'success');
        window.location.href = 'index.html';
      } catch (err) {
        if (err.details && err.details.length) showFieldErrors(form, err.details);
        alertBox.textContent = err.message || 'Sign in failed.';
        alertBox.classList.remove('hidden');
        setBusy(submit, false);
      }
    });
  };

  document.addEventListener('DOMContentLoaded', init);
})();
