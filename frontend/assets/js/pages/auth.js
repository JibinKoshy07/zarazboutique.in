/** Customer sign in and registration. */
(function () {
  const { toast, handleForm, showFieldErrors } = window.UI;

  /** Sends the visitor somewhere useful after auth, defaulting to the shop. */
  const redirectAfterAuth = () => {
    const next = UI.query('next');
    window.location.href = next && /^[\w.-]+\.html/.test(next) ? next : 'account.html';
  };

  const initLogin = () => {
    const form = document.querySelector('[data-login-form]');
    if (!form) return;
    handleForm(form, async ({ email, password }) => {
      const { token, user } = await API.login({ email: email.trim(), password });
      API.setToken(token);
      toast(`Welcome back, ${user.name.split(' ')[0]}.`, 'success');
      redirectAfterAuth();
    }, { busyLabel: 'Signing in' });
  };

  const initRegister = () => {
    const form = document.querySelector('[data-register-form]');
    if (!form) return;
    handleForm(form, async (values) => {
      // Password confirmation is a client-side concern; the server only sees one password.
      if (values.password !== values.confirmPassword) {
        showFieldErrors(form, [{ field: 'confirmPassword', message: 'Passwords do not match.' }]);
        throw new Error('Passwords do not match.');
      }
      const { token, user } = await API.register({
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone ? values.phone.trim() : undefined,
        password: values.password,
      });
      API.setToken(token);
      toast(`Welcome to Zaraz, ${user.name.split(' ')[0]}.`, 'success');
      redirectAfterAuth();
    }, { busyLabel: 'Creating account' });
  };

  const init = async () => {
    await Store.init();
    // Already signed in? Skip the form entirely.
    if (Store.state.user) {
      redirectAfterAuth();
      return;
    }
    initLogin();
    initRegister();
  };

  document.addEventListener('DOMContentLoaded', init);
})();
