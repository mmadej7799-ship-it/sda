(() => {
  'use strict';

  const STORAGE_KEY = 'cv-builder:v1';
  const LISTS = ['experience', 'education', 'certificates', 'skills', 'languages'];
  const SIMPLE_FIELDS = [
    'fullName', 'title', 'email', 'phone', 'location', 'website',
    'summary', 'interests', 'consent',
  ];
  const TEMPLATES = ['modern', 'classic', 'minimal', 'bold'];
  const HTML2PDF_URL = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
  // GoatCounter site code (the "NAME" in NAME.goatcounter.com). Empty = no counting.
  // Only page views and PDF clicks are sent, never anything typed into the form.
  const GOATCOUNTER = '';
  const { LANGS, UI, DOC, DRAFT, SAMPLES, CURRENT_JOB, detectLang, certSection } = window.CVI18N;

  const LETTER_FIELDS = [
    'position', 'company', 'jobAd', 'recipient', 'address', 'date',
    'tone', 'gender', 'extra', 'greeting', 'body', 'closing',
  ];
  const LETTER_CHOICES = { tone: ['formal', 'warm', 'concise'], gender: ['neutral', 'f', 'm'] };

  // `lang` is the document language: it decides the default greeting,
  // closing and consent clause.
  const emptyLetter = (lang = 'pl') => ({
    position: '', company: '', jobAd: '', recipient: '', address: '', date: '',
    tone: 'formal', gender: 'neutral', extra: '',
    greeting: DOC[lang].greeting, body: '', closing: DOC[lang].closing,
    consentEnabled: true,
  });

  const emptyState = (lang = 'pl') => ({
    fullName: '', title: '', email: '', phone: '', location: '', website: '',
    photo: '', summary: '', interests: '',
    consentEnabled: true, consent: DOC[lang].consent,
    skillBars: true,
    experience: [], education: [], certificates: [], skills: [], languages: [],
    template: 'modern', accent: '#2563eb',
    letter: emptyLetter(lang),
    doc: 'cv',
    uiLang: lang,
    docLang: lang,
    isSample: false,
  });

  const sampleState = (lang = 'pl') => {
    const sample = JSON.parse(JSON.stringify(SAMPLES[lang]));
    return {
      ...emptyState(lang),
      ...sample.cv,
      letter: { ...emptyLetter(lang), ...sample.letter },
      isSample: true,
    };
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const form = $('#editor');
  const letterForm = $('#letter-editor');
  const cv = $('#cv');
  const letterSheet = $('#letter');
  const accentCustom = $('#accent-custom');

  let state;

  // ---------- Persistence ----------

  // Coerces anything (saved state, an imported file) into a valid state object,
  // so a corrupt or hand-edited file can never break rendering.
  function normalize(data) {
    if (!data || typeof data !== 'object') return emptyState();
    // Files saved before languages existed are Polish.
    const docLang = LANGS.includes(data.docLang) ? data.docLang : 'pl';
    const out = emptyState(docLang);
    out.uiLang = LANGS.includes(data.uiLang) ? data.uiLang : docLang;
    SIMPLE_FIELDS.forEach((f) => { if (typeof data[f] === 'string') out[f] = data[f]; });
    LISTS.forEach((l) => {
      if (!Array.isArray(data[l])) return;
      out[l] = data[l]
        .filter((i) => i && typeof i === 'object')
        .map((i) => Object.fromEntries(Object.entries(i).map(([k, v]) => [k, v == null ? '' : String(v)])));
    });
    if (typeof data.photo === 'string' && /^data:image\//.test(data.photo)) out.photo = data.photo;
    if (TEMPLATES.includes(data.template)) out.template = data.template;
    if (typeof data.accent === 'string' && /^#[0-9a-f]{6}$/i.test(data.accent)) out.accent = data.accent;
    out.consentEnabled = data.consentEnabled !== false;
    out.skillBars = data.skillBars !== false;
    const letter = data.letter && typeof data.letter === 'object' ? data.letter : {};
    out.letter = emptyLetter(docLang);
    LETTER_FIELDS.forEach((f) => { if (typeof letter[f] === 'string') out.letter[f] = letter[f]; });
    Object.entries(LETTER_CHOICES).forEach(([f, allowed]) => {
      if (!allowed.includes(out.letter[f])) out.letter[f] = allowed[0];
    });
    out.letter.consentEnabled = letter.consentEnabled !== false;
    out.doc = data.doc === 'letter' ? 'letter' : 'cv';
    out.isSample = data.isSample === true;
    return out;
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return normalize(JSON.parse(raw));
    } catch (_) { /* storage unavailable or corrupt */ }
    return null;
  }

  let storageWarned = false;
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {
      if (!storageWarned) {
        storageWarned = true;
        toast(t('toastSaveFail'));
      }
    }
  }

  // ---------- Languages ----------

  // t(): interface text in the UI language; d(): text printed on the documents.
  const t = (key) => UI[state.uiLang][key] ?? UI.pl[key] ?? key;
  const d = (key) => DOC[state.docLang][key];

  function applyI18n(root = document) {
    $$('[data-i18n]', root).forEach((el) => { el.textContent = t(el.dataset.i18n); });
    $$('[data-i18n-attr]', root).forEach((el) => {
      el.dataset.i18nAttr.split(';').forEach((pair) => {
        const [attr, key] = pair.split(':');
        el.setAttribute(attr, t(key));
      });
    });
  }

  function applyLanguage() {
    applyI18n();
    $$('template').forEach((tpl) => applyI18n(tpl.content));
    document.documentElement.lang = state.uiLang;
    $('#ui-lang').value = state.uiLang;
    $$('.doc-lang').forEach((s) => { s.value = state.docLang; });
    $$('.sheet').forEach((s) => { s.lang = state.docLang; });
    // English has no grammatical gender in the first person.
    $('.gender-field').hidden = state.docLang === 'en';
  }

  // Switching the document language swaps texts the user never changed
  // (default greeting, closing, consent) and reloads the example if one is shown.
  function setDocLang(lang) {
    const prev = state.docLang;
    if (lang === prev) return;
    if (state.isSample) {
      const keep = { template: state.template, accent: state.accent, doc: state.doc, uiLang: state.uiLang, skillBars: state.skillBars };
      state = { ...sampleState(lang), ...keep };
    } else {
      state.docLang = lang;
      const L = state.letter;
      if (L.greeting === DOC[prev].greeting) L.greeting = DOC[lang].greeting;
      if (L.closing === DOC[prev].closing) L.closing = DOC[lang].closing;
      if (state.consent === DOC[prev].consent) state.consent = DOC[lang].consent;
    }
    state.docLang = lang;
    fillForm();
    save();
    render();
  }

  // While the document language matches the interface, it follows it.
  function setUiLang(lang) {
    const followDoc = state.docLang === state.uiLang;
    state.uiLang = lang;
    applyLanguage();
    if (followDoc) setDocLang(lang);
    applyLanguage();
    save();
    render();
  }

  // ---------- Small UI helpers ----------

  let toastTimer;
  function toast(message) {
    const el = $('#toast');
    el.textContent = message;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 3500);
  }

  // In-page replacement for confirm(), which is blocked inside sandboxed frames.
  function ask(message, okLabel = t('ok')) {
    const dialog = $('#dialog');
    $('#dialog-text').textContent = message;
    $('#dialog-ok').textContent = okLabel;
    dialog.hidden = false;
    $('#dialog-ok').focus();
    return new Promise((resolve) => {
      const done = (answer) => {
        dialog.hidden = true;
        dialog.removeEventListener('click', onClick);
        document.removeEventListener('keydown', onKey);
        resolve(answer);
      };
      const onClick = (ev) => {
        if (ev.target === dialog) return done(false);
        const btn = ev.target.closest('[data-answer]');
        if (btn) done(btn.dataset.answer === 'yes');
      };
      const onKey = (ev) => { if (ev.key === 'Escape') done(false); };
      dialog.addEventListener('click', onClick);
      document.addEventListener('keydown', onKey);
    });
  }

  // ---------- Form <-> state ----------

  let radioGroup = 0;
  function addItem(list, data = {}) {
    const tpl = $(`#tpl-${list}`);
    const node = tpl.content.firstElementChild.cloneNode(true);
    radioGroup += 1;
    $$('[data-field]', node).forEach((el) => {
      const value = data[el.dataset.field];
      if (el.type === 'radio') {
        el.name = `${el.dataset.field}-${radioGroup}`;
        if (value !== undefined) el.checked = el.value === value;
      } else if (value !== undefined) {
        el.value = value;
      }
    });
    $(`[data-list="${list}"] .list`).appendChild(node);
    refreshItem(node);
    return node;
  }

  // Updates the item's heading ("Stanowisko · Firma") and the skill level label.
  function refreshItem(item) {
    const title = $('.item-title', item);
    if (title) {
      title.textContent = $$('[data-title]', item)
        .sort((a, b) => a.dataset.title - b.dataset.title)
        .map((el) => el.value.trim())
        .filter(Boolean)
        .join(' · ');
    }
    const out = $('.level-out', item);
    if (out) out.textContent = $('[data-field="level"]', item).value;
  }

  function fillForm() {
    SIMPLE_FIELDS.forEach((name) => { form.elements[name].value = state[name]; });
    form.elements.consentEnabled.checked = state.consentEnabled;
    form.elements.skillBars.checked = state.skillBars;
    form.classList.toggle('no-skill-bars', !state.skillBars);
    LISTS.forEach((list) => {
      $(`[data-list="${list}"] .list`).innerHTML = '';
      state[list].forEach((item) => addItem(list, item));
    });
    syncLookControls();
    fillLetter();
  }

  function fillLetter() {
    LETTER_FIELDS.forEach((name) => { letterForm.elements[name].value = state.letter[name]; });
    letterForm.elements.consentEnabled.checked = state.letter.consentEnabled;
    $$('input[name="doc"]').forEach((r) => { r.checked = r.value === state.doc; });
    document.body.dataset.doc = state.doc;
  }

  function readLetter() {
    LETTER_FIELDS.forEach((name) => { state.letter[name] = letterForm.elements[name].value; });
    state.letter.consentEnabled = letterForm.elements.consentEnabled.checked;
  }

  function syncLookControls() {
    $$('input[name="template"]').forEach((r) => { r.checked = r.value === state.template; });
    let matched = false;
    $$('input[name="accent"]').forEach((r) => {
      r.checked = r.value.toLowerCase() === state.accent.toLowerCase();
      matched = matched || r.checked;
    });
    accentCustom.value = state.accent;
    accentCustom.parentElement.style.boxShadow = matched ? '' : '0 0 0 2px var(--fg)';
  }

  function readForm() {
    SIMPLE_FIELDS.forEach((name) => { state[name] = form.elements[name].value; });
    state.consentEnabled = form.elements.consentEnabled.checked;
    state.skillBars = form.elements.skillBars.checked;
    form.classList.toggle('no-skill-bars', !state.skillBars);
    LISTS.forEach((list) => {
      state[list] = $$(`[data-list="${list}"] .item`).map((item) => {
        const obj = {};
        $$('[data-field]', item).forEach((el) => {
          if (el.type !== 'radio' || el.checked) obj[el.dataset.field] = el.value;
        });
        return obj;
      });
    });
  }

  function commit() {
    state.isSample = false;
    save();
    render();
  }

  function update(ev) {
    const item = ev?.target?.closest?.('.item');
    if (item) refreshItem(item);
    readForm();
    commit();
  }

  // ---------- Rendering ----------

  const esc = (str) => String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));

  const hasText = (obj) => Object.values(obj).some((v) => String(v).trim());
  const filled = (list, keys) => list.filter((item) => keys.some((k) => (item[k] || '').trim()));
  const dateRange = (item) => [item.start, item.end].map((s) => (s || '').trim()).filter(Boolean).map(esc).join(' – ');

  const section = (title, body) => (body ? `
    <section class="section">
      <h2 class="section-title">${esc(title)}</h2>
      ${body}
    </section>` : '');

  function contactList() {
    const row = (label, value) => `<li><span class="k">${label}</span>${value}</li>`;
    const items = [
      state.email.trim() && row(d('kEmail'), esc(state.email)),
      state.phone.trim() && row(d('kPhone'), esc(state.phone)),
      state.location.trim() && row(d('kLocation'), esc(state.location)),
      state.website.trim() && row(d('kWww'), esc(state.website)),
    ].filter(Boolean);
    return items.length ? `<ul class="contact">${items.join('')}</ul>` : '';
  }

  function experienceHtml() {
    return filled(state.experience, ['role', 'company']).map((e) => {
      const bullets = (e.description || '').split('\n').map((l) => l.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);
      return `
        <div class="entry">
          <div class="entry-head">
            <div>
              <div class="entry-title">${esc(e.role)}</div>
              <div class="entry-sub">${esc(e.company)}</div>
            </div>
            <div class="entry-date">${dateRange(e)}</div>
          </div>
          ${bullets.length ? `<ul>${bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
        </div>`;
    }).join('');
  }

  const certHeading = () => certSection(filled(state.certificates, ['name', 'issuer']), DOC[state.docLang]).heading;

  function certificatesHtml() {
    const certs = filled(state.certificates, ['name', 'issuer']);
    const { label } = certSection(certs, DOC[state.docLang]);
    return certs.map((c) => `
      <div class="entry">
        <div class="entry-head">
          <div>
            <div class="entry-title">${esc(c.name)}</div>
            <div class="entry-sub">${esc([label(c), (c.issuer || '').trim()].filter(Boolean).join(' · '))}</div>
          </div>
          <div class="entry-date">${esc((c.date || '').trim())}</div>
        </div>
      </div>`).join('');
  }

  function educationHtml() {
    return filled(state.education, ['school', 'degree']).map((e) => `
      <div class="entry">
        <div class="entry-head">
          <div>
            <div class="entry-title">${esc(e.school)}</div>
            <div class="entry-sub">${esc(e.degree)}</div>
          </div>
          <div class="entry-date">${dateRange(e)}</div>
        </div>
      </div>`).join('');
  }

  function skillsHtml() {
    const skills = filled(state.skills, ['name']);
    if (!state.skillBars) {
      return skills.length
        ? `<div class="tags">${skills.map((s) => `<span class="tag">${esc(s.name.trim())}</span>`).join('')}</div>` : '';
    }
    return skills.map((s) => {
      const level = Math.min(5, Math.max(1, Number(s.level) || 3));
      return `
        <div class="skill">
          ${esc(s.name)}
          <div class="bar"><span style="width:${level * 20}%"></span></div>
        </div>`;
    }).join('');
  }

  function languagesHtml() {
    return filled(state.languages, ['name']).map((l) => `
      <div class="entry-head"><span>${esc(l.name)}</span><span class="entry-date">${esc(l.level === 'ojczysty' ? d('native') : l.level)}</span></div>`).join('');
  }

  function interestsHtml() {
    const tags = state.interests.split(',').map((t) => t.trim()).filter(Boolean);
    return tags.length ? `<div class="tags">${tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : '';
  }

  const photoHtml = () => (state.photo ? `<img class="photo" src="${esc(state.photo)}" alt="">` : '');
  const consentHtml = () => (state.consentEnabled && state.consent.trim()
    ? `<p class="consent">${esc(state.consent)}</p>` : '');
  const summaryHtml = () => (state.summary.trim() ? `<p>${esc(state.summary)}</p>` : '');

  const templates = {
    modern: () => `
      <aside class="sidebar">
        ${photoHtml()}
        ${section(d('contact'), contactList())}
        ${section(d('skills'), skillsHtml())}
        ${section(d('languages'), languagesHtml())}
        ${section(d('interests'), interestsHtml())}
      </aside>
      <div class="main">
        <h1 class="name">${esc(state.fullName)}</h1>
        <div class="role">${esc(state.title)}</div>
        ${section(d('profile'), summaryHtml())}
        ${section(d('experience'), experienceHtml())}
        ${section(d('education'), educationHtml())}
        ${section(certHeading(), certificatesHtml())}
        ${consentHtml()}
      </div>`,

    classic: () => {
      const skills = section(d('skills'), skillsHtml());
      const side = section(d('languages'), languagesHtml()) + section(d('interests'), interestsHtml());
      return `
        <header>
          ${photoHtml()}
          <h1 class="name">${esc(state.fullName)}</h1>
          <div class="role">${esc(state.title)}</div>
          ${contactList()}
        </header>
        ${section(d('profile'), summaryHtml())}
        ${section(d('experience'), experienceHtml())}
        ${section(d('education'), educationHtml())}
        ${section(certHeading(), certificatesHtml())}
        ${skills && side.trim() ? `<div class="two-col"><div>${skills}</div><div>${side}</div></div>` : skills + side}
        ${consentHtml()}`;
    },

    minimal: () => {
      const row = (title, body) => (body ? `
        <div class="row section">
          <h2 class="section-title">${esc(title)}</h2>
          <div>${body}</div>
        </div>` : '');
      return `
        <header>
          <div>
            <h1 class="name">${esc(state.fullName)}</h1>
            <div class="role">${esc(state.title)}</div>
            ${contactList()}
          </div>
          ${photoHtml()}
        </header>
        ${row(d('profile'), summaryHtml())}
        ${row(d('experience'), experienceHtml())}
        ${row(d('education'), educationHtml())}
        ${row(certHeading(), certificatesHtml())}
        ${row(d('skills'), skillsHtml())}
        ${row(d('languages'), languagesHtml())}
        ${row(d('interests'), interestsHtml())}
        ${consentHtml()}`;
    },

    // Full-width colour band, then a main column with a timeline and a side column.
    bold: () => `
      <header class="band">
        <div class="band-text">
          <h1 class="name">${esc(state.fullName)}</h1>
          <div class="role">${esc(state.title)}</div>
          ${contactList()}
        </div>
        ${photoHtml()}
      </header>
      <div class="cols">
        <div class="col-main">
          ${section(d('profile'), summaryHtml())}
          ${section(d('experience'), experienceHtml())}
          ${section(d('education'), educationHtml())}
          ${section(certHeading(), certificatesHtml())}
        </div>
        <aside class="col-side">
          ${section(d('skills'), skillsHtml())}
          ${section(d('languages'), languagesHtml())}
          ${section(d('interests'), interestsHtml())}
        </aside>
      </div>
      <div class="foot">${consentHtml()}</div>`,
  };

  function isEmpty() {
    return SIMPLE_FIELDS.filter((f) => f !== 'consent').every((f) => !state[f].trim())
      && !state.photo
      && LISTS.every((l) => !state[l].some(hasText));
  }

  const letterEmpty = () => !state.letter.body.trim();
  const docEmpty = () => (state.doc === 'letter' ? letterEmpty() : isEmpty());

  function todayLine() {
    const date = new Date().toLocaleDateString(d('dateLocale'), { day: 'numeric', month: 'long', year: 'numeric' }) + d('dateSuffix');
    return `${state.location.trim() ? `${state.location.trim()}, ` : ''}${date}`;
  }

  function renderLetter() {
    const L = state.letter;
    letterSheet.className = `sheet letter tpl-${state.template}`;
    letterSheet.style.setProperty('--accent', state.accent);
    letterForm.elements.date.placeholder = todayLine();
    if (letterEmpty()) {
      letterSheet.innerHTML = `<p class="empty">${esc(t('emptyLetter'))}</p>`;
      return;
    }
    const contact = [state.email, state.phone, state.location, state.website]
      .map((s) => s.trim()).filter(Boolean).map(esc).join('<br>');
    const to = [
      L.recipient.trim() && `<strong>${esc(L.recipient.trim())}</strong>`,
      L.company.trim() && `<strong>${esc(L.company.trim())}</strong>`,
      L.address.trim() && esc(L.address.trim()),
    ].filter(Boolean).join('');
    const paragraphs = L.body.trim().split(/\n\s*\n/)
      .map((p) => `<p>${esc(p.trim()).replace(/\n/g, '<br>')}</p>`).join('');
    const consent = L.consentEnabled && state.consent.trim() ? `<p class="consent">${esc(state.consent)}</p>` : '';
    letterSheet.innerHTML = `
      <header class="lh">
        <div>
          <div class="lh-name">${esc(state.fullName)}</div>
          ${state.title.trim() ? `<div class="lh-role">${esc(state.title)}</div>` : ''}
        </div>
        <div class="lh-contact">${contact}</div>
      </header>
      <p class="date">${esc(L.date.trim() || todayLine())}</p>
      ${to ? `<div class="to">${to}</div>` : ''}
      ${L.position.trim() ? `<p class="subject">${esc(d('subject')(L.position.trim()))}</p>` : ''}
      ${L.greeting.trim() ? `<p class="greeting">${esc(L.greeting.trim())}</p>` : ''}
      <div class="body">${paragraphs}</div>
      ${L.closing.trim() ? `<p class="closing">${esc(L.closing.trim())}</p>` : ''}
      <p class="signature">${esc(state.fullName)}</p>
      ${consent}`;
  }

  function render() {
    renderLetter();
    cv.className = `sheet cv tpl-${state.template}`;
    cv.style.setProperty('--accent', state.accent);
    cv.innerHTML = isEmpty()
      ? `<p class="empty">${esc(t('emptyCv'))}</p>`
      : templates[state.template]();

    LISTS.forEach((l) => {
      const n = state[l].filter(hasText).length;
      $(`[data-list="${l}"] .count`).textContent = n ? String(n) : '';
    });
    const thumb = $('#photo-thumb');
    thumb.style.backgroundImage = state.photo ? `url("${state.photo}")` : '';
    thumb.classList.toggle('has-photo', !!state.photo);
    $('#photo-remove').hidden = !state.photo;
    $('#sample-banner').hidden = !state.isSample;
    document.title = state.fullName.trim() ? `CV – ${state.fullName.trim()}` : t('appName');
    fitPreview();
  }

  // Scales the fixed-width A4 sheets down to the width available on screen.
  function fitPreview() {
    $$('.paper-wrap').forEach((wrap) => {
      const sheet = $('.sheet', wrap);
      const available = wrap.clientWidth;
      if (!available) return;
      const scale = Math.min(1, available / sheet.offsetWidth);
      sheet.style.transform = scale < 1 ? `scale(${scale})` : '';
      wrap.style.height = `${Math.ceil(sheet.offsetHeight * scale)}px`;
    });
  }

  function setDoc(doc) {
    state.doc = doc;
    document.body.dataset.doc = doc;
    save();
    window.scrollTo(0, 0);
    fitPreview();
  }

  // ---------- View switching (phones) ----------

  function setView(view) {
    document.body.dataset.view = view;
    $$('[data-view-btn]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.viewBtn === view)));
    window.scrollTo(0, 0);
    if (view === 'preview') fitPreview();
  }

  // ---------- Photo ----------

  function resizeImage(file, maxSize = 480) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // ---------- Files: PDF and JSON ----------

  // Inside claude.ai the page runs in a sandbox where downloads and printing
  // are blocked; there files go through the "downloads" capability instead.
  const downloadsPromise = window.claude?.use
    ? window.claude.use('downloads').catch(() => null)
    : Promise.resolve(null);
  const inSandbox = !!window.claude?.use;

  // Cookie-free counting through GoatCounter's image endpoint (no third-party script).
  function track(path, title, isEvent = false) {
    if (!GOATCOUNTER || inSandbox || location.protocol === 'file:') return;
    const params = new URLSearchParams({ p: path, t: title, rnd: String(Math.random()).slice(2, 10) });
    if (isEvent) params.set('e', 'true');
    else if (document.referrer) params.set('r', document.referrer);
    try {
      new Image().src = `https://${GOATCOUNTER}.goatcounter.com/count?${params}`;
    } catch (_) { /* counting must never break the app */ }
  }

  // File names are kept to ASCII: browsers drop non-Latin download names
  // (the file then arrives as "download" with no extension), and plain names
  // travel better as e-mail attachments. Cyrillic uses Ukrainian romanisation.
  const TRANSLIT = {
    ł: 'l', а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie', ж: 'zh', з: 'z',
    и: 'y', і: 'i', ї: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
    с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ь: '',
    ю: 'iu', я: 'ia', ё: 'e', ы: 'y', э: 'e', ъ: '', '’': '', 'ʼ': '', "'": '',
  };
  const asciiSlug = (s) => s.toLowerCase()
    .replace(/[łа-яёєіїґ’ʼ']/g, (c) => TRANSLIT[c] ?? c)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const fileBase = (prefix = 'cv') => {
    const slug = asciiSlug(state.fullName.trim());
    const base = asciiSlug(prefix) || 'cv';
    return slug ? `${base}-${slug}` : base;
  };

  async function saveFile(filename, data) {
    const downloads = await downloadsPromise;
    if (downloads) {
      try {
        await downloads.save({ filename, data });
        toast(t('toastSaved'));
      } catch (err) {
        if (['rejected_extension', 'extension_not_enabled'].includes(err?.code)) toast(t('formatUnavailable'));
        else if (err?.code !== 'declined') toast(t('toastSaveError'));
      }
      return;
    }
    if (inSandbox) {
      toast(t('toastNoSave'));
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(data instanceof Blob ? data : new Blob([data]));
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  let html2pdfPromise;
  function loadHtml2pdf() {
    html2pdfPromise ||= new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = HTML2PDF_URL;
      s.onload = () => (window.html2pdf ? resolve(window.html2pdf) : reject(new Error('html2pdf missing')));
      s.onerror = () => { html2pdfPromise = null; reject(new Error('html2pdf failed to load')); };
      document.head.appendChild(s);
    });
    return html2pdfPromise;
  }

  // Square, centre-cropped JPEG bytes of the photo, for the round photo in Word.
  function squarePhotoBytes() {
    if (!state.photo) return Promise.resolve(null);
    return new Promise((resolve) => {
      const img = new Image();
      img.onerror = () => resolve(null);
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = Math.min(side, 400);
        canvas.getContext('2d').drawImage(
          img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, canvas.width, canvas.height,
        );
        canvas.toBlob(async (blob) => {
          resolve(blob ? new Uint8Array(await blob.arrayBuffer()) : null);
        }, 'image/jpeg', 0.9);
      };
      img.src = state.photo;
    });
  }

  async function exportDocx() {
    const isLetter = state.doc === 'letter';
    if (docEmpty()) {
      toast(t(isLetter ? 'needLetter' : 'needCv'));
      return;
    }
    track(isLetter ? 'docx-list' : 'docx-cv', isLetter ? 'Word: list motywacyjny' : 'Word: CV', true);
    let blob;
    try {
      const ctx = { doc: DOC[state.docLang], filled, dateLine: todayLine() };
      blob = isLetter
        ? window.CVDocx.buildLetter(state, ctx)
        : window.CVDocx.buildCv(state, { ...ctx, photo: await squarePhotoBytes() });
    } catch (_) {
      toast(t('docxFail'));
      return;
    }
    await saveFile(`${fileBase(isLetter ? d('fileLetter') : 'cv')}.docx`, blob);
  }

  async function exportPdf() {
    const isLetter = state.doc === 'letter';
    if (docEmpty()) {
      toast(t(isLetter ? 'needLetter' : 'needCv'));
      return;
    }
    track(isLetter ? 'pdf-list' : 'pdf-cv', isLetter ? 'Pobierz PDF: list motywacyjny' : 'Pobierz PDF: CV', true);
    // Standalone: the browser's print dialog gives a crisp PDF with selectable text.
    if (!inSandbox) {
      window.print();
      return;
    }
    const btn = $('#btn-pdf');
    btn.disabled = true;
    const label = btn.innerHTML;
    btn.textContent = t('pdfBusy');
    try {
      const html2pdf = await loadHtml2pdf();
      await document.fonts?.ready;
      // Render an unscaled copy off-screen so the PDF does not depend on the
      // phone's screen size.
      const holder = document.createElement('div');
      holder.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;';
      const copy = (isLetter ? letterSheet : cv).cloneNode(true);
      copy.style.transform = '';
      copy.style.boxShadow = 'none';
      // A hair under A4 height, so rounding never spills a blank second page.
      copy.style.minHeight = '1118px';
      holder.appendChild(copy);
      document.body.appendChild(holder);
      try {
        const blob = await html2pdf().set({
          margin: 0,
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', windowWidth: 794 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['css', 'legacy'], avoid: ['.entry', '.skill', '.body p'] },
        }).from(copy).outputPdf('blob');
        await saveFile(`${fileBase(isLetter ? d('fileLetter') : 'cv')}.pdf`, blob);
      } finally {
        holder.remove();
      }
    } catch (_) {
      toast(t('pdfFail'));
    } finally {
      btn.disabled = false;
      btn.innerHTML = label;
    }
  }

  // ---------- Events ----------

  form.addEventListener('input', update);
  form.addEventListener('change', update);
  form.addEventListener('submit', (ev) => ev.preventDefault());

  form.addEventListener('click', async (ev) => {
    const btn = ev.target.closest('button');
    if (!btn) return;
    if (btn.dataset.add) {
      const node = addItem(btn.dataset.add);
      $('input, textarea', node)?.focus();
    } else if (btn.hasAttribute('data-remove')) {
      const item = btn.closest('.item');
      const typed = $$('input:not([type=range]):not([type=radio]), textarea', item).some((el) => el.value.trim());
      if (typed && !(await ask(t('confirmRemoveItem'), t('remove')))) return;
      item.remove();
    } else if (btn.dataset.move) {
      const item = btn.closest('.item');
      if (btn.dataset.move === '-1' && item.previousElementSibling) {
        item.parentNode.insertBefore(item, item.previousElementSibling);
      } else if (btn.dataset.move === '1' && item.nextElementSibling) {
        item.parentNode.insertBefore(item.nextElementSibling, item);
      }
      btn.focus();
    } else {
      return;
    }
    readForm();
    commit();
  });

  $('#template-picker').addEventListener('change', (ev) => {
    state.template = ev.target.value;
    commit();
  });
  $('#accent-picker').addEventListener('change', (ev) => {
    if (ev.target.name === 'accent') {
      state.accent = ev.target.value;
      syncLookControls();
      commit();
    }
  });
  accentCustom.addEventListener('input', () => {
    state.accent = accentCustom.value;
    syncLookControls();
    commit();
  });

  $('#photo-input').addEventListener('change', async (ev) => {
    ev.stopPropagation();
    const file = ev.target.files[0];
    ev.target.value = '';
    if (!file) return;
    try {
      state.photo = await resizeImage(file);
      commit();
    } catch (_) {
      toast(t('photoFail'));
    }
  });
  $('#photo-input').addEventListener('input', (ev) => ev.stopPropagation());

  $('#photo-remove').addEventListener('click', () => {
    state.photo = '';
    commit();
  });

  // ---------- Cover letter ----------

  $('#doc-picker').addEventListener('change', (ev) => setDoc(ev.target.value));

  letterForm.addEventListener('input', () => { readLetter(); commit(); });
  letterForm.addEventListener('change', () => { readLetter(); commit(); });
  letterForm.addEventListener('submit', (ev) => ev.preventDefault());

  function setBody(text) {
    letterForm.elements.body.value = text;
    readLetter();
    commit();
  }

  // Builds a letter from the CV without AI, in the document language
  // (the sentences live in i18n.js).
  function draftFromCv() {
    const L = state.letter;
    const jobs = filled(state.experience, ['role', 'company']).map((j) => ({
      role: j.role.trim(),
      company: j.company.trim(),
      current: CURRENT_JOB.test(j.end || ''),
      bullets: (j.description || '').split('\n')
        .map((l) => l.replace(/^[-•*]\s*/, '').trim().replace(/\.$/, '')).filter(Boolean).slice(0, 3),
    }));
    return DRAFT[state.docLang]({
      gender: L.gender,
      tone: L.tone,
      position: L.position.trim() || state.title.trim(),
      company: L.company.trim(),
      jobs,
      skills: filled(state.skills, ['name']).map((s) => s.name.trim()).slice(0, 5),
      langs: filled(state.languages, ['name'])
        .filter((l) => l.level !== 'ojczysty')
        .map((l) => ({ name: l.name.trim(), level: l.level })),
      summary: state.summary.trim(),
    });
  }

  $('#btn-draft').addEventListener('click', async () => {
    if (state.letter.body.trim() && !(await ask(t('confirmDraft'), t('replace')))) return;
    setBody(draftFromCv());
    toast(t('draftDone'));
  });

  // Plain-text CV for the AI prompt.
  function cvAsText() {
    const lines = [];
    const push = (label, value) => { if (value && value.trim()) lines.push(`${label}: ${value.trim()}`); };
    const span = (e) => [e.start, e.end].filter(Boolean).join(' – ');
    push('Name', state.fullName);
    push('Current title', state.title);
    push('Summary', state.summary);
    filled(state.experience, ['role', 'company']).forEach((e) => {
      lines.push(`Experience: ${[e.role, e.company].map((s) => s.trim()).filter(Boolean).join(', ')} (${span(e)})`);
      (e.description || '').split('\n').map((l) => l.trim()).filter(Boolean).forEach((l) => lines.push(`  - ${l}`));
    });
    filled(state.education, ['school', 'degree']).forEach((e) => {
      lines.push(`Education: ${[e.school, e.degree].map((s) => s.trim()).filter(Boolean).join(', ')} (${span(e)})`);
    });
    filled(state.certificates, ['name', 'issuer']).forEach((c) => {
      lines.push(`${c.type === 'course' ? 'Course' : 'Certificate'}: ${[c.name, c.issuer, c.date].map((s) => (s || '').trim()).filter(Boolean).join(', ')}`);
    });
    const skills = filled(state.skills, ['name'])
      .map((s) => (state.skillBars ? `${s.name.trim()} (${s.level}/5)` : s.name.trim()));
    if (skills.length) lines.push(`Skills: ${skills.join(', ')}`);
    const langs = filled(state.languages, ['name'])
      .map((l) => `${l.name.trim()} (${l.level === 'ojczysty' ? 'native' : l.level})`);
    if (langs.length) lines.push(`Languages: ${langs.join(', ')}`);
    push('Interests', state.interests);
    return lines.join('\n');
  }

  function aiPrompt() {
    const L = state.letter;
    const language = d('promptName');
    const tone = {
      formal: 'formal and professional',
      warm: 'warm and personal, but professional',
      concise: 'concise and to the point (about 150 words)',
    }[L.tone];
    const gender = state.docLang === 'en' ? '' : {
      f: ' Use feminine grammatical forms for the writer.',
      m: ' Use masculine grammatical forms for the writer.',
      neutral: ' Avoid gendered grammatical forms for the writer (e.g. prefer present tense or phrases like "my experience includes").',
    }[L.gender];
    return [
      `Write the body of a cover letter in ${language}.`,
      '',
      'Rules:',
      `- Return ONLY the body paragraphs in ${language} (3–4 paragraphs, 180–280 words in total), separated by a blank line.`,
      '- No greeting at the start, no closing such as "Yours sincerely", no signature, no date, no headings and no Markdown.',
      `- First person singular.${gender}`,
      `- Tone: ${tone}.`,
      '- Use only facts from the CV. Do not invent experience, numbers, companies or certificates. If the job ad asks for something that is not in the CV, do not claim the candidate has it.',
      '- If a job ad is given, refer specifically to its 2–3 most important requirements and show how the candidate\'s experience matches them.',
      '- Avoid empty clichés ("I am a creative and communicative person"); use concrete details from the CV.',
      '- The CV and the job ad may be in another language; the letter must still be written entirely in ' + language + '.',
      '',
      `Position: ${L.position.trim() || state.title.trim() || '(not given)'}`,
      `Company: ${L.company.trim() || '(not given)'}`,
      L.extra.trim() ? `Emphasise: ${L.extra.trim()}` : '',
      '',
      'Job ad:',
      `"""${L.jobAd.trim() || '(not given)'}"""`,
      '',
      'Candidate CV:',
      `"""${cvAsText() || '(empty)'}"""`,
    ].filter((line, i, all) => line !== '' || all[i - 1] !== '').join('\n');
  }

  const samplePromise = window.claude?.use
    ? window.claude.use('sample').catch(() => null)
    : Promise.resolve(null);
  let sampleFn = null;
  let aiAbort = null;
  const aiStatus = $('#ai-status');
  const setAiStatus = (text) => { aiStatus.textContent = text; aiStatus.hidden = !text; };
  const hideAi = () => { $$('.ai-only').forEach((el) => { el.hidden = true; }); };

  samplePromise.then((fn) => {
    sampleFn = fn;
    if (fn) $$('.ai-only').forEach((el) => { el.hidden = false; });
  });

  $('#btn-ai').addEventListener('click', async () => {
    if (!sampleFn) return;
    if (isEmpty()) {
      toast(t('aiNeedCv'));
      return;
    }
    if (state.letter.body.trim() && !(await ask(t('confirmAi'), t('replace')))) return;
    const previous = state.letter.body;
    const body = letterForm.elements.body;
    const aiBtn = $('#btn-ai');
    const stopBtn = $('#btn-ai-stop');
    aiAbort = new AbortController();
    aiBtn.disabled = true;
    stopBtn.hidden = false;
    body.readOnly = true;
    setAiStatus(t('aiThinking'));
    let got = false;
    try {
      const { text } = await sampleFn(aiPrompt(), {
        signal: aiAbort.signal,
        cache: false,
        onText: ({ text: partial }) => {
          got = true;
          setAiStatus(t('aiWriting'));
          body.value = partial;
          state.letter.body = partial;
          renderLetter();
          fitPreview();
        },
      });
      setBody(text.trim());
      setAiStatus(t('aiDone'));
    } catch (err) {
      const kept = (err?.text || '').trim();
      setBody(kept || (got ? body.value : previous));
      const messages = {
        cancelled: t(kept ? 'aiCancelledKept' : 'aiCancelled'),
        not_granted: t('aiNotGranted'),
        rate_limited: t('aiRateLimited'),
        prompt_too_large: t('aiTooLarge'),
      };
      setAiStatus(messages[err?.code] || t('aiFailed'));
      if (['not_granted', 'sampling_disabled', 'capability_disabled', 'capability_removed', 'not_declared'].includes(err?.code)) hideAi();
    } finally {
      aiBtn.disabled = false;
      stopBtn.hidden = true;
      body.readOnly = false;
      aiAbort = null;
    }
  });
  $('#btn-ai-stop').addEventListener('click', () => aiAbort?.abort());

  const menu = $('#menu');
  const moreBtn = $('#btn-more');
  const closeMenu = () => { menu.classList.remove('open'); moreBtn.setAttribute('aria-expanded', 'false'); };
  moreBtn.addEventListener('click', (ev) => {
    ev.stopPropagation();
    const open = menu.classList.toggle('open');
    moreBtn.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', (ev) => { if (!menu.contains(ev.target)) closeMenu(); });
  menu.addEventListener('click', (ev) => { if (ev.target.closest('button')) closeMenu(); });

  $('#btn-sample').addEventListener('click', async () => {
    if ((!isEmpty() || !letterEmpty()) && !state.isSample
      && !(await ask(t('confirmSample'), t('replace')))) return;
    state = {
      ...sampleState(state.docLang),
      template: state.template, accent: state.accent, doc: state.doc, uiLang: state.uiLang,
    };
    fillForm();
    save();
    render();
  });

  const clearAll = async () => {
    if ((!isEmpty() || !letterEmpty()) && !state.isSample
      && !(await ask(t('confirmClear'), t('reset')))) return;
    state = { ...emptyState(state.docLang), template: state.template, accent: state.accent, uiLang: state.uiLang };
    fillForm();
    save();
    render();
    $('#editor details.card').open = true;
    setView('edit');
  };
  $('#btn-reset').addEventListener('click', clearAll);
  $('#btn-start-empty').addEventListener('click', clearAll);

  $('#btn-export').addEventListener('click', () => {
    saveFile(`${fileBase()}.json`, JSON.stringify(state, null, 2));
  });

  $('#btn-import').addEventListener('change', async (ev) => {
    const file = ev.target.files[0];
    ev.target.value = '';
    closeMenu();
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('invalid');
      // The file's document language is kept; the interface stays in the viewer's language.
      state = { ...normalize(data), isSample: false, uiLang: state.uiLang };
      applyLanguage();
      fillForm();
      save();
      render();
      toast(t('importOk'));
    } catch (_) {
      toast(t('importBad'));
    }
  });

  $('#btn-pdf').addEventListener('click', exportPdf);
  $('#btn-docx').addEventListener('click', exportDocx);

  $('#ui-lang').addEventListener('change', (ev) => setUiLang(ev.target.value));
  $$('.doc-lang').forEach((sel) => sel.addEventListener('change', (ev) => {
    ev.stopPropagation();
    setDocLang(ev.target.value);
    applyLanguage();
  }));
  $$('.doc-lang').forEach((sel) => sel.addEventListener('input', (ev) => ev.stopPropagation()));

  $$('[data-view-btn]').forEach((b) => b.addEventListener('click', () => setView(b.dataset.viewBtn)));

  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(fitPreview);
    $$('.paper-wrap').forEach((w) => ro.observe(w));
  } else {
    window.addEventListener('resize', fitPreview);
  }
  document.fonts?.ready.then(fitPreview);
  window.addEventListener('beforeprint', () => { $$('.sheet').forEach((s) => { s.style.transform = ''; }); });
  window.addEventListener('afterprint', fitPreview);

  // ---------- Init ----------
  // First visit opens with clearly marked sample data, so the tool shows what it does.
  // The first visit picks the phone's or browser's language.
  state = load() || sampleState(detectLang());
  applyLanguage();
  fillForm();
  render();
  // Fixed title: document.title contains the user's name, which must not leave the device.
  track(location.pathname, 'CV builder');
})();
