/* ═══════════════════════════════════════════
   TECH DOLPHIN — main.js
   ═══════════════════════════════════════════ */

/* ── LANGUAGE ─────────────────────────────── */
let currentLang = localStorage.getItem('td_lang') || 'ru';

function applyLang(lang) {
  if (!T[lang]) lang = 'ru';
  currentLang = lang;
  localStorage.setItem('td_lang', lang);
  document.documentElement.lang = lang;

  const t = T[lang];

  // Update per-page meta
  const isProjectsPage = window.location.pathname.endsWith('projects.html');
  document.title = isProjectsPage ? t.meta_projects_title : t.meta_home_title;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.content = isProjectsPage ? t.meta_projects_desc : t.meta_home_desc;
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.content = isProjectsPage ? t.meta_projects_title : t.meta_home_og_title;

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

  // Accessible labels
  const menuBtn = document.getElementById('nav-hamburger');
  if (menuBtn) menuBtn.setAttribute('aria-label', t.menu_label);

  // Cities label
  const cl = document.getElementById('cities-label');
  if (cl) cl.textContent = t.cities_label;

  // Re-render calculator prices after lang switch
  renderCalc();
  renderLeadChat();
}

function toggleLang() {
  applyLang(currentLang === 'ru' ? 'en' : 'ru');
}

function toggleMobileMenu() {
  const links = document.querySelector('.nav-links');
  const btn   = document.getElementById('nav-hamburger');
  const nav   = document.querySelector('.nav');
  if (!links || !btn) return;
  const isOpen = links.classList.toggle('open');
  btn.classList.toggle('open', isOpen);
  btn.setAttribute('aria-expanded', String(isOpen));
  document.body.style.overflow = isOpen ? 'hidden' : '';
  if (nav) nav.classList.toggle('menu-open', isOpen);
}
function closeMobileMenu() {
  const links = document.querySelector('.nav-links');
  const btn   = document.getElementById('nav-hamburger');
  const nav   = document.querySelector('.nav');
  if (!links) return;
  links.classList.remove('open');
  if (btn) {
    btn.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  }
  document.body.style.overflow = '';
  if (nav) nav.classList.remove('menu-open');
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
const NAV_SECTIONS = ['hero','about','services','projects','calc','stack','why','faq','how','contact'];

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
function initCookie() {
  const banner = document.getElementById('cookie-banner');
  if (!banner) return;
  if (localStorage.getItem('cookieAccepted')) banner.style.display = 'none';
  const btn = document.getElementById('cookie-btn');
  if (btn) btn.addEventListener('click', () => {
    localStorage.setItem('cookieAccepted', 'true');
    banner.style.display = 'none';
  });
}

/* ── FAQ ──────────────────────────────────── */
function initFaq() {
  document.querySelectorAll('.faq-item').forEach(item => {
    const q    = item.querySelector('.faq-q');
    const ans  = item.querySelector('.faq-a');
    const icon = item.querySelector('.faq-icon');
    if (!q || !ans || !icon) return;
    q.addEventListener('click', () => {
      const isOpen = ans.style.display === 'block';
      // close all
      document.querySelectorAll('.faq-a').forEach(a => a.style.display = 'none');
      document.querySelectorAll('.faq-icon').forEach(i => { i.textContent = '+'; i.style.transform = 'rotate(0deg)'; });
      if (!isOpen) {
        ans.style.display = 'block';
        icon.textContent  = '×';
        icon.style.transform = 'rotate(90deg)';
      }
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
const selectedCalc = new Set();

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
    <div class="calc-card${selectedCalc.has(s.id) ? ' selected' : ''}" onclick="toggleCalc('${s.id}',this)">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <div class="calc-mark">${s.icon}</div>
          <div style="font-size:16px;font-weight:700;color:#E8F5EC;margin-bottom:6px;">${t[s.nKey]}</div>
          <div style="font-size:13px;color:#7AAF87;">${t[s.dKey]}</div>
          ${renderCalcTiers(s, t)}
        </div>
        <div class="calc-check"${selectedCalc.has(s.id) ? ' style="background:#0EA5E9;border-color:#0EA5E9;color:#fff;"' : ''}>✓</div>
      </div>
      <div style="margin-top:16px;font-size:15px;font-weight:700;color:#0EA5E9;">${t.calc_from} ${fmt(s.min)}</div>
    </div>
  `).join('');
  updateCalcResult();
}

function toggleCalc(id, el) {
  selectedCalc.has(id) ? selectedCalc.delete(id) : selectedCalc.add(id);
  renderCalc();
}

function updateCalcResult() {
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

async function sendLeadEmail(templateParams) {
  if (!window.emailjs) throw new Error('EmailJS is not loaded');
  const leadEmail = templateParams.email || '';
  const message = leadEmail
    ? `Email: ${leadEmail}\n\n${templateParams.message || ''}`.trim()
    : templateParams.message;
  let timeoutId;
  const sendTimeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const error = new Error('EmailJS request timed out');
      error.name = 'AbortError';
      reject(error);
    }, 15000);
  });

  try {
    return await Promise.race([
      Promise.all(EJ_TO_EMAILS.map(recipient => emailjs.send(EJ_SERVICE, EJ_TMPL, {
        ...templateParams,
        email: recipient,
        lead_email: leadEmail,
        reply_to: leadEmail || recipient,
        message
      }, {
        publicKey: EJ_PUBLIC
      }))),
      sendTimeout
    ]);
  } catch (error) {
    console.error('EmailJS submission failed:', error);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function beginFormSubmit(form, errEl) {
  if (!form || form.dataset.submitting === 'true') return false;
  form.dataset.submitting = 'true';
  const button = form.querySelector('button[type="submit"]');
  if (button) button.disabled = true;
  if (errEl) errEl.style.display = 'none';
  return true;
}

function endFormSubmit(form) {
  if (!form) return;
  delete form.dataset.submitting;
  const button = form.querySelector('button[type="submit"]');
  if (button) button.disabled = false;
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
  if (!beginFormSubmit(form, errEl)) return;
  try {
    await sendLeadEmail({
      subject: currentLang === 'ru' ? 'Заявка на обратный звонок' : 'Callback Request',
      name, phone, message: currentLang === 'ru' ? 'Перезвоните мне' : 'Please call me back'
    });
    window.techDolphinAnalytics?.trackLeadResult('cb-form', 'success');
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
  const message = document.getElementById('ct-message').value;
  const errEl   = document.getElementById('ct-error');
  if (!beginFormSubmit(form, errEl)) return;
  try {
    await sendLeadEmail({
      subject: currentLang === 'ru' ? 'Новая заявка с сайта' : 'New Request from Website',
      name, phone, email, message
    });
    window.techDolphinAnalytics?.trackLeadResult('ct-form', 'success');
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

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[ch]));
}

function toggleLeadChat(force) {
  const panel = document.getElementById('lead-chat-panel');
  if (!panel) return;
  leadChatOpen = typeof force === 'boolean' ? force : !leadChatOpen;
  panel.classList.toggle('open', leadChatOpen);
  panel.setAttribute('aria-hidden', String(!leadChatOpen));
  if (leadChatOpen) renderLeadChat();
}

function initLeadChat() {
  if (!document.getElementById('lead-chat')) return;
  renderLeadChat();
}

function resetLeadChat() {
  leadChatStep = 'type';
  leadChatData = {};
  renderLeadChat();
}

function addChatChoice(step, key) {
  const t = T[currentLang];
  leadChatData[step] = t[key] || key;
  const idx = CHAT_STEPS.indexOf(step);
  leadChatStep = CHAT_STEPS[idx + 1] || 'note';
  renderLeadChat();
}

function setChatNote(e) {
  e.preventDefault();
  const note = document.getElementById('chat-note');
  leadChatData.note = note ? note.value.trim() : '';
  leadChatStep = 'contact';
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
      parts.push(`<div class="chat-msg user">${escapeHtml(leadChatData[step])}</div>`);
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
  if (!body || !T[currentLang]) return;
  const t = T[currentLang];
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
        <textarea id="chat-note" class="form-input" rows="3" placeholder="${t.chat_note_placeholder}" required></textarea>
        <button class="form-btn" type="submit">${t.chat_next}</button>
      </form>
    `;
  } else if (leadChatStep === 'contact') {
    html += `
      <div class="chat-msg bot">${t.chat_q_contact}</div>
      <form class="chat-form" onsubmit="sendLeadChat(event)">
        <input id="chat-name" class="form-input" type="text" placeholder="${t.chat_name_placeholder}" required>
        <input id="chat-contact" class="form-input" type="text" placeholder="${t.chat_contact_placeholder}" required>
        <button class="form-btn" type="submit">${t.chat_send}</button>
        <div class="form-error" id="chat-error"></div>
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
  body.scrollTop = body.scrollHeight;
}

async function sendLeadChat(e) {
  e.preventDefault();
  const form = e.currentTarget || e.target;
  const t = T[currentLang];
  const name = document.getElementById('chat-name').value.trim();
  const contact = document.getElementById('chat-contact').value.trim();
  const errEl = document.getElementById('chat-error');
  if (!beginFormSubmit(form, errEl)) return;
  try {
    const message = [
      `${currentLang === 'ru' ? 'Тип проекта' : 'Project type'}: ${leadChatData.type || '-'}`,
      `${currentLang === 'ru' ? 'Бюджет' : 'Budget'}: ${leadChatData.budget || '-'}`,
      `${currentLang === 'ru' ? 'Старт' : 'Timeline'}: ${leadChatData.timeline || '-'}`,
      `${currentLang === 'ru' ? 'Задача' : 'Task'}: ${leadChatData.note || '-'}`
    ].join('\n');
    await sendLeadEmail({
      subject: currentLang === 'ru' ? 'Бриф из чат-бота' : 'Chatbot Brief',
      name,
      phone: contact,
      email: contact.includes('@') ? contact : '',
      message
    });
    leadChatStep = 'done';
    renderLeadChat();
  } catch (error) {
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
  if (window.emailjs) emailjs.init({ publicKey: EJ_PUBLIC });
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
    if (e.key === 'Escape') closeMobileMenu();
  });
});
