(function () {
  const config = window.TechDolphinAnalyticsConfig || {};
  const counterId = Number(config.yandexMetricaId);
  const isEnabled = Number.isFinite(counterId) && counterId > 0;
  const goals = {
    callbackFormStart:'callback_form_start', callbackFormAttempt:'callback_form_attempt', callbackFormSuccess:'callback_form_success', callbackFormError:'callback_form_error',
    contactFormStart:'contact_form_start', contactFormAttempt:'contact_form_attempt', contactFormSuccess:'contact_form_success', contactFormError:'contact_form_error',
    chatFormStart:'brief_form_start', chatFormAttempt:'brief_form_attempt', chatFormSuccess:'brief_form_success', chatFormError:'brief_form_error',
    briefOpen:'brief_open', briefStep:'brief_step', estimateSelect:'estimate_select',
    emailClick:'email_click', phoneClick:'phone_click', maxClick:'max_click', telegramClick:'telegram_click', whatsappClick:'whatsapp_click', contactCtaClick:'contact_cta_click',
    ...(config.goals || {})
  };
  function loadYandexMetrica() {
    if (!isEnabled || window.ym) return;
    window.ym = function () { (window.ym.a = window.ym.a || []).push(arguments); };
    window.ym.l = Date.now();
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://mc.yandex.ru/metrika/tag.js?id=' + counterId;
    document.head.appendChild(script);
    window.ym(counterId, 'init', { clickmap:true, trackLinks:true, accurateTrackBounce:true, webvisor:true, referrer:document.referrer, url:location.href });
  }
  function track(name, params = {}) {
    const target = goals[name] || name;
    const details = { page:location.pathname, ...params };
    if (isEnabled && window.ym) window.ym(counterId, 'reachGoal', target, details);
    if (config.debug) console.info('[analytics]', target, details);
  }
  function prefix(form) {
    return ({'cb-form':'callbackForm','ct-form':'contactForm','chat-contact-form':'chatForm'})[form?.id] || '';
  }
  function start(event) {
    const form = event.target.closest?.('form');
    const name = prefix(form);
    if (!name || form.dataset.analyticsStarted === 'true') return;
    form.dataset.analyticsStarted = 'true';
    track(name + 'Start', { form_id:form.id });
  }
  document.addEventListener('focusin', start);
  document.addEventListener('input', start);
  document.addEventListener('submit', event => {
    const name = prefix(event.target);
    if (name) track(name + 'Attempt', {form_id:event.target.id});
  }, true);
  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[href]');
    if (!link) return;
    const href = link.getAttribute('href').trim();
    const value = href.toLowerCase();
    const params = { href };
    if (value.startsWith('mailto:')) track('emailClick', params);
    else if (value.startsWith('tel:')) track('phoneClick', params);
    else if (value.includes('max.ru/')) track('maxClick', params);
    else if (value.includes('t.me/')) track('telegramClick', params);
    else if (value.includes('wa.me/')) track('whatsappClick', params);
    if (link.hasAttribute('data-contact-cta')) track('contactCtaClick', { source:link.id || (link.classList.contains('nav-cta') ? 'navigation' : 'page') });
  });
  window.techDolphinAnalytics = {
    isEnabled, counterId:isEnabled ? counterId : null, track,
    trackLeadResult(formId, status, params) {
      const name = prefix({id:formId});
      if (name) track(name + (status === 'success' ? 'Success' : 'Error'), {form_id:formId,...params});
    }
  };
  loadYandexMetrica();
})();
