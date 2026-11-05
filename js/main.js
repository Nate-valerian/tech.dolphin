/* ═══════════════════════════════════════════
   TECH DOLPHIN — main.js
   ═══════════════════════════════════════════ */

/* ── LANGUAGE ─────────────────────────────── */
let currentLang = localStorage.getItem('td_lang') || 'ru';

function applyLang(lang) {
  if (!T[lang]) lang = 'ru';
  saveLeadChatDraft();
  currentLang = lang;
  localStorage.setItem('td_lang', lang);
  document.documentElement.lang = lang;

  const t = T[lang];

  // Update per-page meta
  const path = window.location.pathname;
  const pageKey = path.endsWith('projects.html') ? 'projects'
                : path.endsWith('pricing.html')  ? 'pricing'
                : path.endsWith('faq.html')      ? 'faq'
                : path.endsWith('contact.html')  ? 'contact'
                : 'home';
  const titleKey = 'meta_' + pageKey + '_title';
  const descKey  = 'meta_' + pageKey + '_desc';
  if (t[titleKey]) document.title = t[titleKey];
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc && t[descKey]) metaDesc.content = t[descKey];
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle && t[titleKey]) ogTitle.content = t[titleKey];

  const metaValues = {
    'og:description': t[descKey], 'og:locale': lang === 'ru' ? 'ru_RU' : 'en_US',
    'twitter:title': t[titleKey], 'twitter:description': t[descKey]
  };
  Object.entries(metaValues).forEach(([name, value]) => {
    const meta = document.querySelector('meta[property="' + name + '"],meta[name="' + name + '"]');
    if (meta && value) meta.content = value;
  });

  // Apply all data-i18n elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (!t[key]) return;
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = t[key];
    } else {
      el.innerHTML = t[key];
    }
  });

  // Toggle button
  const btn = document.getElementById('lang-toggle');
  if (btn) btn.textContent = lang === 'ru' ? 'EN' : 'RU';
  document.querySelectorAll('[data-lang-toggle]').forEach(control => {
    control.textContent = lang === 'ru' ? 'English' : 'Русский';
  });

  // Accessible labels
  const menuBtn = document.getElementById('nav-hamburger');
  if (menuBtn) menuBtn.setAttribute('aria-label', t.menu_label);

  // Cities label
  const cl = document.getElementById('cities-label');
  if (cl) cl.textContent = t.cities_label;

  // Re-render calculator prices after lang switch
  renderCalc();
  renderEstimateSummary();
  renderLeadChat();
}

function toggleLang() {
  applyLang(currentLang === 'ru' ? 'en' : 'ru');
}

function _lockBodyScroll() {
  if (document.body.dataset.scrollY !== undefined) return;
  // iOS Safari resets scroll when overflow:hidden is applied to body.
  // Fix: pin body with position:fixed at the current scroll offset.
  const scrollY = window.scrollY;
  document.body.style.overflow  = 'hidden';
  document.body.style.position  = 'fixed';
  document.body.style.top       = `-${scrollY}px`;
  document.body.style.width     = '100%';
  document.body.dataset.scrollY = scrollY;
}
function _unlockBodyScroll() {
  if (document.body.dataset.scrollY === undefined) return;
  const scrollY = parseInt(document.body.dataset.scrollY || '0', 10);
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.top      = '';
  document.body.style.width    = '';
  delete document.body.dataset.scrollY;
  window.scrollTo({ top: scrollY, behavior: 'instant' });
}

function toggleMobileMenu() {
  const links = document.querySelector('.nav-links');
  const btn   = document.getElementById('nav-hamburger');
  const nav   = document.querySelector('.nav');
  if (!links || !btn) return;
  if (links.classList.contains('open')) { closeMobileMenu(); return; }
  const isOpen = links.classList.toggle('open');
  btn.classList.toggle('open', isOpen);
  btn.setAttribute('aria-expanded', String(isOpen));
  if (nav) nav.classList.toggle('menu-open', isOpen);

  if (isOpen) {
    _lockBodyScroll();
    // Move nav-links to <body> so position:fixed is relative to viewport,
    // not the transformed .nav pill (transform creates a new containing block).
    links._returnParent = links.parentNode;
    links._returnNext   = links.nextSibling;
    links._returnFocus = document.activeElement;
    document.body.appendChild(links);
    links.setAttribute('role', 'dialog');
    links.setAttribute('aria-modal', 'true');
    links.setAttribute('aria-label', T[currentLang].menu_label);
    links._background = [...document.body.children].filter(el => el !== links && !['SCRIPT','STYLE'].includes(el.tagName)).map(el => ({el, inert:el.inert}));
    links._background.forEach(({el}) => { el.inert = true; });
    links.querySelector('a,button')?.focus();
  } else {
    _unlockBodyScroll();
    if (links._returnParent) {
      links._returnParent.insertBefore(links, links._returnNext || null);
      delete links._returnParent;
      delete links._returnNext;
    }
  }
}
function closeMobileMenu() {
  const links = document.querySelector('.nav-links');
  const btn   = document.getElementById('nav-hamburger');
  const nav   = document.querySelector('.nav');
  if (!links || !links.classList.contains('open')) return;
  links.classList.remove('open');
  if (btn) {
    btn.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  }
  _unlockBodyScroll();
  links._background?.forEach(({el,inert}) => { el.inert = inert; });
  delete links._background;
  links.removeAttribute('aria-modal');
  links.removeAttribute('role');
  if (nav) nav.classList.remove('menu-open');

  if (links._returnParent) {
    links._returnParent.insertBefore(links, links._returnNext || null);
    delete links._returnParent;
    delete links._returnNext;
  }
  const focus = links._returnFocus;
  if (focus?.checkVisibility()) focus.focus({ preventScroll: true });
  delete links._returnFocus;
}

function initMenuBreakpoint() {
  const mobile = window.matchMedia('(max-width: 1100px)');
  mobile.addEventListener('change', event => { if (!event.matches) closeMobileMenu(); });
}

/* ── SCROLL PROGRESS ──────────────────────── */
function initProgress() {
  const bar = document.getElementById('progress-bar');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (docH > 0 ? (scrollTop / docH * 100) : 0) + '%';
  });
}

/* ── LEFT NAV ─────────────────────────────── */
const ALL_NAV_SECTIONS = ['hero','about','services','projects','calc','stack','why','faq','how','contact'];
let NAV_SECTIONS = ALL_NAV_SECTIONS;

function initLeftNav() {
  const items = document.querySelectorAll('.lnav-item');
  const line  = document.getElementById('nav-progress-line');

  items.forEach(item => {
    item.addEventListener('click', () => {
      const el = document.getElementById(item.dataset.section);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    });
  });

  window.addEventListener('scroll', () => {
    let current = 'hero', idx = 0;
    NAV_SECTIONS.forEach((id, i) => {
      const el = document.getElementById(id);
      if (el && window.scrollY >= el.offsetTop - 300) { current = id; idx = i; }
    });
    items.forEach(item => item.classList.toggle('active', item.dataset.section === current));
    if (line) line.style.height = (idx / (NAV_SECTIONS.length - 1) * 100) + '%';
  });
}

/* ── COOKIE ───────────────────────────────── */
function openCookieSettings() {
  const banner = document.getElementById('cookie-banner');
  if (banner) { banner.style.display = 'flex'; document.getElementById('cookie-btn')?.focus({preventScroll:true}); }
}

function initCookie() {
  const banner = document.getElementById('cookie-banner');
  if (!banner) return;
  if (['accepted','declined'].includes(window.techDolphinAnalytics?.consent)) banner.style.display = 'none';
  const chat = document.querySelector('.lead-chat');
  function clearChatLauncher() {
    if (chat) chat.style.bottom = innerWidth <= 1023 && banner.offsetHeight ? (banner.offsetHeight + 32) + 'px' : '';
  }
  if (window.ResizeObserver) new ResizeObserver(clearChatLauncher).observe(banner);
  window.addEventListener('resize', clearChatLauncher);
  clearChatLauncher();
  function choose(choice) {
    window.techDolphinAnalytics?.setConsent(choice);
    banner.style.display = 'none';
    clearChatLauncher();
  }
  document.getElementById('cookie-btn')?.addEventListener('click', () => choose('accepted'));
  document.getElementById('cookie-decline')?.addEventListener('click', () => choose('declined'));
}

/* ── FAQ ──────────────────────────────────── */
function initFaq() {
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q'), ans = item.querySelector('.faq-a');
    if (!q || !ans) return;
    q.addEventListener('click', () => {
      const expand = q.getAttribute('aria-expanded') !== 'true';
      document.querySelectorAll('.faq-q').forEach(button => button.setAttribute('aria-expanded', 'false'));
      document.querySelectorAll('.faq-a').forEach(panel => { panel.hidden = true; });
      document.querySelectorAll('.faq-icon').forEach(icon => { icon.textContent = '+'; });
      q.setAttribute('aria-expanded', String(expand));
      ans.hidden = !expand;
      item.querySelector('.faq-icon').textContent = expand ? '−' : '+';
    });
  });
}

/* ── PROJECT FILTER ───────────────────────── */
function filterProj(cat, btn) {
  document.querySelectorAll('.ptab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.pcard').forEach(card => {
    if (cat === 'all') {
      card.classList.remove('hidden');
    } else {
      const cats = card.dataset.cat || '';
      cats.includes(cat) ? card.classList.remove('hidden') : card.classList.add('hidden');
    }
  });
}

/* ── CALCULATOR ───────────────────────────── */
const CALC_SERVICES = [
  { icon:'WEB', nKey:'c1n', dKey:'c1d', min:30000,   max:150000,  id:'c1' },
  { icon:'SHOP', nKey:'c2n', dKey:'c2d', min:150000,  max:500000,  id:'c2' },
  { icon:'APP', nKey:'c3n', dKey:'c3d', min:300000,  max:800000,  id:'c3' },
  { icon:'AI', nKey:'c4n', dKey:'c4d', min:50000,   max:600000,  id:'c4', tiersKey:'c4tiers' },
  { icon:'3D', nKey:'c5n', dKey:'c5d', min:150000,  max:400000,  id:'c5' },
  { icon:'SYS', nKey:'c6n', dKey:'c6d', min:700000,  max:5000000, id:'c6' },
];
const ESTIMATE_STORAGE_KEY = 'td_estimate_ru';
const selectedCalc = new Set();
try {
  const saved = JSON.parse(sessionStorage.getItem(ESTIMATE_STORAGE_KEY));
  if (Array.isArray(saved?.services)) saved.services.forEach(id => { if (CALC_SERVICES.some(service => service.id === id)) selectedCalc.add(id); });
} catch (_) {}

function saveEstimate() {
  try {
    if (!selectedCalc.size) sessionStorage.removeItem(ESTIMATE_STORAGE_KEY);
    else sessionStorage.setItem(ESTIMATE_STORAGE_KEY, JSON.stringify({ services:[...selectedCalc] }));
  } catch (_) {}
}

function getEstimateText() {
  if (!selectedCalc.size) return '';
  const services = CALC_SERVICES.filter(service => selectedCalc.has(service.id));
  return T[currentLang].estimate_title + ': ' + services.map(service => T[currentLang][service.nKey]).join(', ') + '\n' + T[currentLang].calc_from + ' ' + fmt(services.reduce((total, service) => total + service.min, 0));
}

function renderEstimateSummary() {
  const summary = document.getElementById('estimate-summary');
  if (!summary) return;
  summary.hidden = !selectedCalc.size;
  const text = getEstimateText();
  const content = document.getElementById('estimate-details');
  if (content) content.textContent = text;
  const message = document.getElementById('ct-message');
  if (message) {
    const previous = message.dataset.estimatePrefill || '';
    if (!message.value || message.value === previous) message.value = text;
    else if (previous && message.value.startsWith(previous + '\n')) message.value = text + message.value.slice(previous.length);
    message.dataset.estimatePrefill = text;
  }
}

function clearEstimate() {
  selectedCalc.clear();
  saveEstimate();
  renderCalc();
  renderEstimateSummary();
}


function fmt(n) { return n.toLocaleString('ru-RU') + ' ₽'; }

function renderCalcTiers(s, t) {
  const tiers = s.tiersKey ? t[s.tiersKey] : null;
  if (!Array.isArray(tiers)) return '';
  return `
    <div class="calc-tiers">
      ${tiers.map(item => `
        <div class="calc-tier">
          <span>${item}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function renderCalc() {
  const grid = document.getElementById('calc-grid');
  if (!grid) return;
  const t = T[currentLang];
  grid.innerHTML = CALC_SERVICES.map(s => `
    <label class="calc-card${selectedCalc.has(s.id) ? ' selected' : ''}">
      <input class="calc-choice" id="calc-${s.id}" type="checkbox" aria-label="${escapeHtml(t[s.nKey])}" ${selectedCalc.has(s.id) ? 'checked' : ''} onchange="toggleCalc('${s.id}',this)">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <div class="calc-mark">${s.icon}</div>
          <div style="font-size:16px;font-weight:700;color:var(--white);margin-bottom:6px;">${t[s.nKey]}</div>
          <div style="font-size:13px;color:var(--muted2);">${t[s.dKey]}</div>
          ${renderCalcTiers(s, t)}
        </div>
        <div class="calc-check">✓</div>
      </div>
      <div style="margin-top:16px;font-size:15px;font-weight:700;color:var(--cyan);">${t.calc_from} ${fmt(s.min)}</div>
    </label>
  `).join('');
  updateCalcResult();
}

function toggleCalc(id, el) {
  window.techDolphinAnalytics?.track('estimateSelect', { service_id:id, selected:!selectedCalc.has(id) });
  const focused = document.activeElement === el;
  selectedCalc.has(id) ? selectedCalc.delete(id) : selectedCalc.add(id);
  renderCalc();
  if (focused) document.getElementById('calc-' + id)?.focus({ preventScroll: true });
}

function updateCalcResult() {
  saveEstimate();
  const result = document.getElementById('calc-result');
  const empty  = document.getElementById('calc-empty');
  const priceEl = document.getElementById('calc-price');
  if (!result) return;
  const t = T[currentLang];
  if (selectedCalc.size === 0) {
    result.style.display = 'none';
    if (empty) empty.style.display = 'block';
    return;
  }
  let totalMin = 0;
  CALC_SERVICES.forEach(s => { if (selectedCalc.has(s.id)) totalMin += s.min; });
  result.style.display = 'block';
  if (empty) empty.style.display = 'none';
  if (priceEl) priceEl.textContent = t.calc_from + ' ' + fmt(totalMin);
  const noteEl = document.getElementById('calc-result-note');
  if (noteEl) noteEl.textContent = t.calc_result_note;
  const discEl = document.getElementById('calc-disc');
  if (discEl) discEl.textContent = t.calc_disc;
  const ctaEl = document.getElementById('calc-cta');
  if (ctaEl) ctaEl.textContent = t.calc_cta;
}

/* ── COUNTER ANIMATION ────────────────────── */
function initCounters() {
  const counters = document.querySelectorAll('.count-num');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting || entry.target.dataset.counted) return;
      entry.target.dataset.counted = true;
      const target = entry.target.dataset.target;
      if (target === '∞' || target.includes('+') && isNaN(parseInt(target))) return;
      const isPlus = target.includes('+');
      const num    = parseInt(target);
      let cur = 0;
      const step = Math.ceil(num / 40);
      const timer = setInterval(() => {
        cur += step;
        if (cur >= num) { cur = num; clearInterval(timer); }
        entry.target.textContent = cur + (isPlus ? '+' : '');
      }, 40);
    });
  }, { threshold: 0.5 });
  counters.forEach(c => obs.observe(c));
}

/* ── 3D TILT ──────────────────────────────── */
function initTilt() {
  document.querySelectorAll('.svc-card, .pcard, .why-card, .stat-pill').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r   = card.getBoundingClientRect();
      const rotX = ((e.clientY - r.top  - r.height/2) / (r.height/2)) * -5;
      const rotY = ((e.clientX - r.left - r.width /2) / (r.width /2)) *  5;
      card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
}

/* ── EMAILJS ──────────────────────────────── */
const EJ_PUBLIC  = '87_f2ZcU4pQ0LZlpc';
const EJ_SERVICE = 'service_8xs6t0i';
const EJ_TMPL    = 'template_u3fwuan';
const EJ_TO_EMAILS = ['n.nate1544@gmail.com', 'm.moleva@mail.ru'];

const leadSubmissions = new Map();
let emailQueue = Promise.resolve();
let lastEmailStarted = 0;

function queueLeadEmail(params) {
  const send = emailQueue.then(async () => {
    const delay = 1050 - (Date.now() - lastEmailStarted);
    if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay));
    lastEmailStarted = Date.now();
    return window.emailjs.send(EJ_SERVICE, EJ_TMPL, params, { publicKey: EJ_PUBLIC });
  });
  emailQueue = send.catch(() => {});
  return send;
}

function sendLeadEmail(templateParams) {
  if (!window.emailjs) return Promise.reject(new Error('EmailJS is not loaded'));
  const key = JSON.stringify(templateParams);
  if (leadSubmissions.has(key)) return leadSubmissions.get(key);

  const delivery = (async () => {
    const leadId = window.crypto?.randomUUID?.() || ('lead-' + Date.now() + '-' + Math.random().toString(36).slice(2));
    const leadEmail = templateParams.email || '';
    const message = leadEmail
      ? ('Email: ' + leadEmail + '\n\n' + (templateParams.message || '')).trim()
      : templateParams.message;
    const deliveredTo = [];
    let lastError;
    for (const recipient of EJ_TO_EMAILS) {
      try {
        await queueLeadEmail({ ...templateParams, lead_id: leadId, email: recipient,
          lead_email: leadEmail, reply_to: leadEmail || recipient, message });
        deliveredTo.push(recipient);
      } catch (error) { lastError = error; }
    }
    // One successful recipient means the business has the enquiry. Do not ask
    // the visitor to repeat it because another notification failed.
    if (!deliveredTo.length) throw lastError || new Error('No delivery recipient');
    return { status: 200, leadId, deliveredCount: deliveredTo.length };
  })();
  leadSubmissions.set(key, delivery);
  delivery.catch(() => leadSubmissions.delete(key));
  return delivery;
}

function isHoneypotTripped(form) {
  const hp = form && form.querySelector('.hp-field');
  return !!(hp && hp.value.trim());
}

/* Scripted submissions tend to fire right after the form becomes
   available; real visitors -- even with autofill -- take a beat to
   click submit. This is too unreliable to silently block on (autofill
   can legitimately clear it), so it's only ever used to flag a send in
   analytics, never to withhold one. */
const MIN_FORM_FILL_MS = 1500;
const PAGE_LOAD_TS = Date.now();

function isSubmittedTooFast(sinceTs) {
  return Date.now() - sinceTs < MIN_FORM_FILL_MS;
}

function beginFormSubmit(form, errEl) {
  if (!form || form.dataset.submitting === 'true') return false;
  form.dataset.submitting = 'true';
  form.dataset.fastSubmit = String(isSubmittedTooFast(PAGE_LOAD_TS));
  const button = form.querySelector('button[type="submit"]');
  if (button) {
    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.textContent = T[currentLang].form_sending;
    button.setAttribute('aria-busy', 'true');
  }
  if (errEl) errEl.style.display = 'none';
  return true;
}

function endFormSubmit(form) {
  if (!form) return;
  delete form.dataset.submitting;
  const button = form.querySelector('button[type="submit"]');
  if (button) { button.disabled = false; button.textContent = button.dataset.originalText || button.textContent; button.removeAttribute('aria-busy'); }
}

function showLeadError(errEl, error, fallback) {
  if (!errEl) return;
  const status = Number(error && error.status);
  let message = fallback;

  if (status === 429) {
    message = currentLang === 'ru'
      ? 'Слишком много попыток. Подождите несколько секунд и попробуйте ещё раз.'
      : 'Too many attempts. Wait a few seconds and try again.';
  } else if (status === 412) {
    message = currentLang === 'ru'
      ? 'Ошибка почтового сервиса (412). Напишите нам напрямую.'
      : 'Email service error (412). Please contact us directly.';
  } else if (status === 422) {
    message = currentLang === 'ru'
      ? 'Ошибка настройки формы (422). Напишите нам напрямую.'
      : 'Form configuration error (422). Please contact us directly.';
  } else if (status) {
    message = `${fallback} (${status})`;
  } else if (error && error.name === 'AbortError') {
    message = currentLang === 'ru'
      ? 'Почтовый сервис не ответил вовремя. Попробуйте ещё раз.'
      : 'The email service took too long to respond. Please try again.';
  } else if (error instanceof TypeError) {
    message = currentLang === 'ru'
      ? 'Не удалось подключиться к почтовому сервису. Проверьте сеть или блокировщик рекламы.'
      : 'Could not connect to the email service. Check your network or ad blocker.';
  }

  errEl.style.display = 'block';
  errEl.textContent = message;
}

async function sendCallback(e) {
  e.preventDefault();
  const form = e.currentTarget || e.target;
  const name  = document.getElementById('cb-name').value;
  const phone = document.getElementById('cb-phone').value;
  const errEl = document.getElementById('cb-error');
  if (isHoneypotTripped(form)) {
    form.style.display = 'none';
    document.getElementById('cb-success').style.display = 'block';
    return;
  }
  if (!beginFormSubmit(form, errEl)) return;
  try {
    await sendLeadEmail({
      subject: currentLang === 'ru' ? 'Заявка на обратный звонок' : 'Callback Request',
      name, phone, message: currentLang === 'ru' ? 'Перезвоните мне' : 'Please call me back'
    });
    window.techDolphinAnalytics?.trackLeadResult('cb-form', 'success', {
      fast_submit: form.dataset.fastSubmit === 'true'
    });
    document.getElementById('cb-form').style.display = 'none';
    document.getElementById('cb-success').style.display = 'block';
  } catch (error) {
    window.techDolphinAnalytics?.trackLeadResult('cb-form', 'error', {
      error_status: error && (error.status || error.code || error.name || 'unknown')
    });
    endFormSubmit(form);
    showLeadError(errEl, error, currentLang === 'ru' ? 'Ошибка. Попробуйте ещё раз.' : 'Error. Please try again.');
  }
}

async function sendContact(e) {
  e.preventDefault();
  const form = e.currentTarget || e.target;
  const name    = document.getElementById('ct-name').value;
  const phone   = document.getElementById('ct-phone').value;
  const email   = document.getElementById('ct-email').value;
  const enteredMessage = document.getElementById('ct-message').value;
  const estimate = getEstimateText();
  const message = estimate && !enteredMessage.includes(estimate) ? estimate + '\n\n' + enteredMessage : enteredMessage;
  const errEl   = document.getElementById('ct-error');
  if (isHoneypotTripped(form)) {
    form.style.display = 'none';
    document.getElementById('ct-success').style.display = 'block';
    return;
  }
  if (!beginFormSubmit(form, errEl)) return;
  try {
    await sendLeadEmail({
      subject: currentLang === 'ru' ? 'Новая заявка с сайта' : 'New Request from Website',
      name, phone, email, message
    });
    window.techDolphinAnalytics?.trackLeadResult('ct-form', 'success', {
      fast_submit: form.dataset.fastSubmit === 'true'
    });
    document.getElementById('ct-form').style.display = 'none';
    document.getElementById('ct-success').style.display = 'block';
  } catch (error) {
    window.techDolphinAnalytics?.trackLeadResult('ct-form', 'error', {
      error_status: error && (error.status || error.code || error.name || 'unknown')
    });
    endFormSubmit(form);
    showLeadError(errEl, error, currentLang === 'ru' ? 'Ошибка. Попробуйте ещё раз.' : 'Error. Please try again.');
  }
}

/* ── LEAD CHATBOT ─────────────────────────── */
const CHAT_STEPS = ['type', 'budget', 'timeline'];
const CHAT_OPTIONS = {
  type: ['chat_type_site', 'chat_type_app', 'chat_type_ai', 'chat_type_3d', 'chat_type_unsure'],
  budget: ['chat_budget_1', 'chat_budget_2', 'chat_budget_3', 'chat_budget_4'],
  timeline: ['chat_timeline_now', 'chat_timeline_month', 'chat_timeline_later']
};
let leadChatOpen = false;
let leadChatStep = 'type';
let leadChatData = {};
let leadChatSubmitting = false;
const BRIEF_STORAGE_KEY = 'td_brief_ru';

function saveLeadChatDraft() {
  const fields = { 'chat-note': 'note', 'chat-name': 'name', 'chat-contact': 'contact' };
  Object.entries(fields).forEach(([id, key]) => {
    const field = document.getElementById(id);
    if (field) leadChatData[key] = field.value;
  });
  try { sessionStorage.setItem(BRIEF_STORAGE_KEY, JSON.stringify({ step: leadChatStep, data: leadChatData })); } catch (_) {}
}

function restoreLeadChatDraft() {
  try {
    const draft = JSON.parse(sessionStorage.getItem(BRIEF_STORAGE_KEY));
    if (draft && [...CHAT_STEPS, 'note', 'contact', 'done'].includes(draft.step) && draft.data && typeof draft.data === 'object') {
      leadChatStep = draft.step;
      ['type','budget','timeline','note','name','contact'].forEach(key => {
        if (typeof draft.data[key] === 'string') leadChatData[key] = draft.data[key].slice(0, 10000);
      });
    }
  } catch (_) {}
}


function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[ch]));
}

function toggleLeadChat(force) {
  const panel = document.getElementById('lead-chat-panel');
  if (!panel) return;
  saveLeadChatDraft();
  const wasOpen = leadChatOpen;
  leadChatOpen = typeof force === 'boolean' ? force : !leadChatOpen;
  if (leadChatOpen && !wasOpen) window.techDolphinAnalytics?.track('briefOpen');
  panel.classList.toggle('open', leadChatOpen);
  document.getElementById('lead-chat').classList.toggle('is-open', leadChatOpen);
  updateLeadChatViewport();
  panel.setAttribute('aria-hidden', String(!leadChatOpen));
  if (leadChatOpen && !leadChatSubmitting) { renderLeadChat(); panel.querySelector('input:not(.hp-field),textarea,button')?.focus({preventScroll:true}); }
  if (!leadChatOpen) document.getElementById('lead-chat-toggle')?.focus({preventScroll:true});
}

function updateLeadChatViewport() {
  const viewport = window.visualViewport;
  document.documentElement.style.setProperty('--chat-visible-top', ((viewport?.offsetTop || 0) + 12) + 'px');
  document.documentElement.style.setProperty('--chat-visible-height', Math.max(120, (viewport?.height || innerHeight) - 24) + 'px');
}

function initLeadChat() {
  if (!document.getElementById('lead-chat')) return;
  updateLeadChatViewport();
  window.addEventListener('resize', updateLeadChatViewport);
  window.visualViewport?.addEventListener('resize', updateLeadChatViewport);
  window.visualViewport?.addEventListener('scroll', updateLeadChatViewport);
  restoreLeadChatDraft();
  document.getElementById('lead-chat-body').addEventListener('input', saveLeadChatDraft);
  renderLeadChat();
}

function resetLeadChat() {
  leadChatStep = 'type';
  leadChatData = {};
  try { sessionStorage.removeItem(BRIEF_STORAGE_KEY); } catch (_) {}
  renderLeadChat();
}

function addChatChoice(step, key) {
  const t = T[currentLang];
  saveLeadChatDraft();
  leadChatData[step] = key;
  window.techDolphinAnalytics?.track('briefStep', { step });
  const idx = CHAT_STEPS.indexOf(step);
  leadChatStep = CHAT_STEPS[idx + 1] || 'note';
  saveLeadChatDraft();
  renderLeadChat();
}

function setChatNote(e) {
  e.preventDefault();
  const note = document.getElementById('chat-note');
  leadChatData.note = note ? note.value.trim() : '';
  leadChatStep = 'contact';
  saveLeadChatDraft();
  renderLeadChat();
}

function chatQuestionKey(step) {
  return ({ type: 'chat_q_type', budget: 'chat_q_budget', timeline: 'chat_q_timeline' })[step];
}

function renderChatHistory(t) {
  const parts = [`<div class="chat-msg bot">${t.chat_intro}</div>`];
  CHAT_STEPS.forEach(step => {
    if (leadChatData[step]) {
      parts.push(`<div class="chat-msg bot">${t[chatQuestionKey(step)]}</div>`);
      parts.push(`<div class="chat-msg user">${escapeHtml(t[leadChatData[step]] || leadChatData[step])}</div>`);
    }
  });
  if (leadChatData.note) {
    parts.push(`<div class="chat-msg bot">${t.chat_q_note}</div>`);
    parts.push(`<div class="chat-msg user">${escapeHtml(leadChatData.note)}</div>`);
  }
  return parts.join('');
}

function renderLeadChat() {
  const body = document.getElementById('lead-chat-body');
  if (!body || !T[currentLang] || leadChatSubmitting) return;
  const t = T[currentLang];
  const wasInside = body.contains(document.activeElement);
  const focusedId = document.activeElement?.id;
  let html = renderChatHistory(t);

  if (CHAT_STEPS.includes(leadChatStep)) {
    html += `<div class="chat-msg bot">${t[chatQuestionKey(leadChatStep)]}</div>`;
    html += '<div class="chat-options">';
    CHAT_OPTIONS[leadChatStep].forEach(key => {
      html += `<button class="chat-option" type="button" onclick="addChatChoice('${leadChatStep}','${key}')">${t[key]}</button>`;
    });
    html += '</div>';
  } else if (leadChatStep === 'note') {
    html += `
      <div class="chat-msg bot">${t.chat_q_note}</div>
      <form class="chat-form" onsubmit="setChatNote(event)">
        <div class="form-field"><label class="field-label" for="chat-note">${t.chat_q_note}</label><textarea id="chat-note" class="form-input" rows="3" placeholder="${t.chat_note_placeholder}" required>${escapeHtml(leadChatData.note || '')}</textarea></div>
        <button class="form-btn" type="submit">${t.chat_next}</button>
      </form>
    `;
  } else if (leadChatStep === 'contact') {
    html += `
      <div class="chat-msg bot">${t.chat_q_contact}</div>
      <form id="chat-contact-form" class="chat-form" onsubmit="sendLeadChat(event)">
        <input type="text" name="hp_website" class="hp-field" tabindex="-1" autocomplete="off" aria-hidden="true">
        <div class="form-field"><label class="field-label" for="chat-name">${t.chat_name_placeholder}</label><input id="chat-name" class="form-input" type="text" value="${escapeHtml(leadChatData.name)}" placeholder="${t.chat_name_placeholder}" required></div>
        <div class="form-field"><label class="field-label" for="chat-contact">${t.chat_contact_placeholder}</label><input id="chat-contact" class="form-input" type="text" value="${escapeHtml(leadChatData.contact)}" placeholder="${t.chat_contact_placeholder}" required></div>
        <button class="form-btn" type="submit">${t.chat_send}</button>
        <div class="form-error" role="alert" id="chat-error"></div>
        <p class="chat-small">${t.chat_privacy}</p>
      </form>
    `;
  } else if (leadChatStep === 'done') {
    html += `
      <div class="chat-msg bot">${t.chat_success}</div>
      <button class="chat-option" type="button" onclick="resetLeadChat()">${t.chat_reset}</button>
    `;
  }
  body.innerHTML = html;
  if (wasInside && leadChatOpen) (document.getElementById(focusedId) || body.querySelector('input:not(.hp-field),textarea,button'))?.focus({preventScroll:true});
  body.scrollTop = body.scrollHeight;
}

async function sendLeadChat(e) {
  e.preventDefault();
  const form = e.currentTarget || e.target;
  const t = T[currentLang];
  const name = document.getElementById('chat-name').value.trim();
  const contact = document.getElementById('chat-contact').value.trim();
  const errEl = document.getElementById('chat-error');
  if (isHoneypotTripped(form)) {
    leadChatSubmitting = false;
    leadChatStep = 'done';
    leadChatData = {};
    try { sessionStorage.removeItem(BRIEF_STORAGE_KEY); } catch (_) {}
    renderLeadChat();
    return;
  }
  saveLeadChatDraft();
  if (!beginFormSubmit(form, errEl)) return;
  leadChatSubmitting = true;
  try {
    const message = [
      `${currentLang === 'ru' ? 'Тип проекта' : 'Project type'}: ${t[leadChatData.type] || leadChatData.type || '-'}`,
      `${currentLang === 'ru' ? 'Бюджет' : 'Budget'}: ${t[leadChatData.budget] || leadChatData.budget || '-'}`,
      `${currentLang === 'ru' ? 'Старт' : 'Timeline'}: ${t[leadChatData.timeline] || leadChatData.timeline || '-'}`,
      `${currentLang === 'ru' ? 'Задача' : 'Task'}: ${leadChatData.note || '-'}`
    ].join('\n');
    await sendLeadEmail({
      subject: currentLang === 'ru' ? 'Бриф из чат-бота' : 'Chatbot Brief',
      name,
      phone: contact,
      email: contact.includes('@') ? contact : '',
      message
    });
    window.techDolphinAnalytics?.trackLeadResult('chat-contact-form', 'success', { fast_submit:form.dataset.fastSubmit === 'true' });
    leadChatSubmitting = false;
    leadChatStep = 'done';
    leadChatData = {};
    try { sessionStorage.removeItem(BRIEF_STORAGE_KEY); } catch (_) {}
    renderLeadChat();
  } catch (error) {
    window.techDolphinAnalytics?.trackLeadResult('chat-contact-form', 'error', { error_status:error?.status || 'unknown' });
    leadChatSubmitting = false;
    endFormSubmit(form);
    showLeadError(errEl, error, t.chat_error);
  }
}

/* ── MOUSE PARALLAX ───────────────────────── */
function initParallax() {
  document.addEventListener('mousemove', e => {
    const x = (e.clientX / window.innerWidth  - 0.5) * 2;
    const y = (e.clientY / window.innerHeight - 0.5) * 2;
    document.querySelectorAll('.aurora-1,.aurora-2').forEach((a, i) => {
      const f = [0.015, 0.025][i];
      a.style.transform += ` translate(${x*f*100}px,${y*f*100}px)`;
    });
  });
}

/* ── INIT ─────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  NAV_SECTIONS = ALL_NAV_SECTIONS.filter(id => !!document.getElementById(id));
  if (window.emailjs) emailjs.init({ publicKey: EJ_PUBLIC });
  initMenuBreakpoint();
  initProgress();
  initLeftNav();
  initCookie();
  initFaq();
  initCounters();
  initTilt();
  initLeadChat();
  renderCalc();
  applyLang(currentLang);
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.addEventListener('click', closeMobileMenu);
  });
  document.addEventListener('keydown', e => {
    const menu = document.querySelector('.nav-links.open');
    if (e.key === 'Escape') {
      if (leadChatOpen) toggleLeadChat(false); else closeMobileMenu();
    }
    if (e.key === 'Tab' && menu) {
      const controls = [...menu.querySelectorAll('a[href],button')].filter(el => el.checkVisibility() && !el.disabled);
      const first = controls[0], last = controls[controls.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
});
