/** Contact form: posts to the backend and shows a success panel. */
(function () {
  const { handleForm, toast } = window.UI;

  const init = async () => {
    await Store.init();
    const form = document.querySelector('[data-contact-form]');
    handleForm(form, async (values, formEl) => {
      await API.contact({
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone ? values.phone.trim() : undefined,
        subject: values.subject ? values.subject.trim() : undefined,
        message: values.message.trim(),
      });
      formEl.reset();
      const alertBox = formEl.querySelector('[data-form-alert]');
      alertBox.textContent = 'Thank you — your message is with our team. We reply within one working day.';
      alertBox.classList.remove('hidden');
      toast('Message sent.', 'success');
    }, { busyLabel: 'Sending' });
  };

  document.addEventListener('DOMContentLoaded', init);
})();
