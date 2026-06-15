(function () {
  const config = window.TechDolphinAnalyticsConfig || {};
  const counterId = Number(config.yandexMetricaId);
  const isEnabled = Number.isFinite(counterId) && counterId > 0;

  const defaultGoals = {
    callbackFormStart: 'callback_form_start',
    callbackFormAttempt: 'callback_form_attempt',
    callbackFormSuccess: 'callback_form_success',
    callbackFormError: 'callback_form_error',
    contactFormStart: 'contact_form_start',
    contactFormAttempt: 'contact_form_attempt',
    contactFormSuccess: 'contact_form_success',
    contactFormError: 'contact_form_error',
    emailClick: 'email_click',
    phoneClick: 'phone_click',
    maxClick: 'max_click',
    telegramClick: 'telegram_click',
    whatsappClick: 'whatsapp_click',
    contactCtaClick: 'contact_cta_click'
  };
  const goals = { ...defaultGoals, ...(config.goals || {}) };

  function loadYandexMetrica() {
    if (!isEnabled || window.ym) return;

    window.ym = window.ym || function () {
      (window.ym.a = window.ym.a || []).push(arguments);
    };
    window.ym.l = 1 * new Date();

    const firstScript = document.getElementsByTagName('script')[0];
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://mc.yandex.ru/metrika/tag.js?id=${counterId}`;
    firstScript.parentNode.insertBefore(script, firstScript);

    window.ym(counterId, 'init', {
      ssr: true,
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: true,
      ecommerce: 'dataLayer',
      referrer: document.referrer,
      url: location.href
    });
  }

  function track(goalName, params) {
    const target = goals[goalName] || goalName;
    if (!target) return;

    if (isEnabled && window.ym) {
      window.ym(counterId, 'reachGoal', target, params || {});
    }

    if (config.debug) {
      console.info('[analytics]', target, params || {});
    }
  }

  function getFormGoalPrefix(form) {
    if (!form) return '';
    if (form.id === 'cb-form') return 'callbackForm';
    if (form.id === 'ct-form') return 'contactForm';
    return '';
  }

  function trackFormStart(form) {
    const prefix = getFormGoalPrefix(form);
    if (!prefix || form.dataset.analyticsStarted === 'true') return;
    form.dataset.analyticsStarted = 'true';
    track(`${prefix}Start`, { form_id: form.id, page: window.location.pathname });
  }

  function initFormTracking() {
    document.querySelectorAll('form').forEach(form => {
      form.addEventListener('focusin', () => trackFormStart(form), { once: true });
      form.addEventListener('input', () => trackFormStart(form), { once: true });
      form.addEventListener('submit', () => {
        const prefix = getFormGoalPrefix(form);
        if (prefix) track(`${prefix}Attempt`, { form_id: form.id, page: window.location.pathname });
      }, true);
    });
  }

  function initContactLinkTracking() {
    document.addEventListener('click', event => {
      const link = event.target.closest && event.target.closest('a[href]');
      if (!link) return;

      const href = (link.getAttribute('href') || '').trim();
      const hrefLower = href.toLowerCase();
      const params = {
        href,
        text: (link.textContent || link.getAttribute('aria-label') || '').trim().slice(0, 80),
        page: window.location.pathname
      };

      if (hrefLower.startsWith('mailto:')) track('emailClick', params);
      else if (hrefLower.startsWith('tel:')) track('phoneClick', params);
      else if (hrefLower.includes('max.ru/')) track('maxClick', params);
      else if (hrefLower.includes('t.me/') || hrefLower.includes('telegram')) track('telegramClick', params);
      else if (hrefLower.includes('wa.me/') || hrefLower.includes('whatsapp')) track('whatsappClick', params);

      if (href === '#contact' || href.endsWith('index.html#contact')) {
        track('contactCtaClick', params);
      }
    });
  }

  window.techDolphinAnalytics = {
    isEnabled,
    counterId: isEnabled ? counterId : null,
    track,
    trackLeadResult(formId, status, params) {
      const prefix = formId === 'cb-form' ? 'callbackForm' : formId === 'ct-form' ? 'contactForm' : '';
      if (!prefix) return;
      track(`${prefix}${status === 'success' ? 'Success' : 'Error'}`, {
        form_id: formId,
        page: window.location.pathname,
        ...(params || {})
      });
    }
  };

  loadYandexMetrica();

  document.addEventListener('DOMContentLoaded', () => {
    initFormTracking();
    initContactLinkTracking();
  });
})();
