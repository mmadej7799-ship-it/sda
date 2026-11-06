(() => {
  'use strict';

  const STORAGE_KEY = 'cv-builder:v1';
  const LISTS = ['experience', 'education', 'skills', 'languages'];
  const SIMPLE_FIELDS = [
    'fullName', 'title', 'email', 'phone', 'location', 'website',
    'summary', 'interests', 'consent',
  ];
  const TEMPLATES = ['modern', 'classic', 'minimal'];
  const HTML2PDF_URL = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
  const DEFAULT_CONSENT =
    'Wyrażam zgodę na przetwarzanie moich danych osobowych dla potrzeb niezbędnych ' +
    'do realizacji procesu rekrutacji zgodnie z Rozporządzeniem Parlamentu Europejskiego ' +
    'i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. (RODO).';

  const LETTER_FIELDS = [
    'position', 'company', 'jobAd', 'recipient', 'address', 'date',
    'tone', 'gender', 'extra', 'greeting', 'body', 'closing',
  ];
  const LETTER_CHOICES = { tone: ['formal', 'warm', 'concise'], gender: ['neutral', 'f', 'm'] };

  const emptyLetter = () => ({
    position: '', company: '', jobAd: '', recipient: '', address: '', date: '',
    tone: 'formal', gender: 'neutral', extra: '',
    greeting: 'Szanowni Państwo,', body: '', closing: 'Z poważaniem',
    consentEnabled: true,
  });

  const emptyState = () => ({
    fullName: '', title: '', email: '', phone: '', location: '', website: '',
    photo: '', summary: '', interests: '',
    consentEnabled: true, consent: DEFAULT_CONSENT,
    experience: [], education: [], skills: [], languages: [],
    template: 'modern', accent: '#2563eb',
    letter: emptyLetter(),
    doc: 'cv',
    isSample: false,
  });

  const sampleLetter = () => ({
    ...emptyLetter(),
    position: 'Senior Frontend Developer',
    company: 'Nowa Firma S.A.',
    recipient: 'Dział HR',
    address: 'ul. Prosta 20\n00-850 Warszawa',
    gender: 'f',
    body:
      'Z dużym zainteresowaniem przeczytałam ogłoszenie o pracy na stanowisku Senior Frontend Developer ' +
      'w Nowej Firmie S.A. i chciałabym zgłosić swoją kandydaturę. Od pięciu lat tworzę aplikacje webowe ' +
      'w React i TypeScript, a Państwa produkt od dawna śledzę jako użytkowniczka.\n\n' +
      'Obecnie w TechSoft prowadzę zespół czterech programistów. Przeprowadziłam migrację dużej aplikacji ' +
      'do React 18 i TypeScript oraz skróciłam czas ładowania strony o 40%. Dbam o dostępność i wydajność ' +
      'interfejsów, a wcześniej w WebStudio współtworzyłam bibliotekę komponentów UI używaną w kilkunastu projektach.\n\n' +
      'Chętnie opowiem więcej o swoim doświadczeniu podczas rozmowy. Dziękuję za poświęcony czas ' +
      'i rozważenie mojej kandydatury.',
  });

  const sampleState = () => ({
    ...emptyState(),
    isSample: true,
    fullName: 'Anna Kowalska',
    title: 'Frontend Developer',
    email: 'anna.kowalska@example.com',
    phone: '+48 600 123 456',
    location: 'Warszawa',
    website: 'linkedin.com/in/annakowalska',
    summary:
      'Programistka frontend z 5-letnim doświadczeniem w budowie aplikacji webowych. ' +
      'Specjalizuję się w React i TypeScript, dbam o dostępność i wydajność interfejsów.',
    experience: [
      {
        role: 'Senior Frontend Developer', company: 'TechSoft sp. z o.o.',
        start: '03.2022', end: 'obecnie',
        description: 'Prowadzenie zespołu 4 programistów\nMigracja aplikacji do React 18 i TypeScript\nSkrócenie czasu ładowania strony o 40%',
      },
      {
        role: 'Frontend Developer', company: 'WebStudio',
        start: '06.2019', end: '02.2022',
        description: 'Tworzenie sklepów internetowych dla klientów z branży e-commerce\nWdrożenie biblioteki komponentów UI',
      },
    ],
    education: [
      { school: 'Politechnika Warszawska', degree: 'Informatyka, inżynier', start: '2015', end: '2019' },
    ],
    skills: [
      { name: 'JavaScript / TypeScript', level: '5' },
      { name: 'React', level: '5' },
      { name: 'HTML i CSS', level: '4' },
      { name: 'Node.js', level: '3' },
    ],
    languages: [
      { name: 'Polski', level: 'ojczysty' },
      { name: 'Angielski', level: 'C1' },
      { name: 'Niemiecki', level: 'A2' },
    ],
    interests: 'fotografia, wspinaczka, gry planszowe',
    letter: sampleLetter(),
  });

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
    const base = emptyState();
    if (!data || typeof data !== 'object') return base;
    const out = { ...base };
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
    const letter = data.letter && typeof data.letter === 'object' ? data.letter : {};
    out.letter = emptyLetter();
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
        toast('Nie udało się zapisać w przeglądarce. Użyj „Eksport JSON”, żeby nie stracić danych.');
      }
    }
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
  function ask(message, okLabel = 'OK') {
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

  function addItem(list, data = {}) {
    const tpl = $(`#tpl-${list}`);
    const node = tpl.content.firstElementChild.cloneNode(true);
    $$('[data-field]', node).forEach((el) => {
      const value = data[el.dataset.field];
      if (value !== undefined) el.value = value;
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
    LISTS.forEach((list) => {
      state[list] = $$(`[data-list="${list}"] .item`).map((item) => {
        const obj = {};
        $$('[data-field]', item).forEach((el) => { obj[el.dataset.field] = el.value; });
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
      state.email.trim() && row('E-mail', esc(state.email)),
      state.phone.trim() && row('Telefon', esc(state.phone)),
      state.location.trim() && row('Miejscowość', esc(state.location)),
      state.website.trim() && row('WWW', esc(state.website)),
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
    return filled(state.skills, ['name']).map((s) => {
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
      <div class="entry-head"><span>${esc(l.name)}</span><span class="entry-date">${esc(l.level)}</span></div>`).join('');
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
        ${section('Kontakt', contactList())}
        ${section('Umiejętności', skillsHtml())}
        ${section('Języki', languagesHtml())}
        ${section('Zainteresowania', interestsHtml())}
      </aside>
      <div class="main">
        <h1 class="name">${esc(state.fullName)}</h1>
        <div class="role">${esc(state.title)}</div>
        ${section('Profil', summaryHtml())}
        ${section('Doświadczenie', experienceHtml())}
        ${section('Wykształcenie', educationHtml())}
        ${consentHtml()}
      </div>`,

    classic: () => {
      const skills = section('Umiejętności', skillsHtml());
      const side = section('Języki', languagesHtml()) + section('Zainteresowania', interestsHtml());
      return `
        <header>
          ${photoHtml()}
          <h1 class="name">${esc(state.fullName)}</h1>
          <div class="role">${esc(state.title)}</div>
          ${contactList()}
        </header>
        ${section('Profil', summaryHtml())}
        ${section('Doświadczenie', experienceHtml())}
        ${section('Wykształcenie', educationHtml())}
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
        ${row('Profil', summaryHtml())}
        ${row('Doświadczenie', experienceHtml())}
        ${row('Wykształcenie', educationHtml())}
        ${row('Umiejętności', skillsHtml())}
        ${row('Języki', languagesHtml())}
        ${row('Zainteresowania', interestsHtml())}
        ${consentHtml()}`;
    },
  };

  function isEmpty() {
    return SIMPLE_FIELDS.filter((f) => f !== 'consent').every((f) => !state[f].trim())
      && !state.photo
      && LISTS.every((l) => !state[l].some(hasText));
  }

  const letterEmpty = () => !state.letter.body.trim();
  const docEmpty = () => (state.doc === 'letter' ? letterEmpty() : isEmpty());

  function todayLine() {
    const date = new Date().toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
    return `${state.location.trim() ? `${state.location.trim()}, ` : ''}${date} r.`;
  }

  function renderLetter() {
    const L = state.letter;
    letterSheet.className = `sheet letter tpl-${state.template}`;
    letterSheet.style.setProperty('--accent', state.accent);
    letterForm.elements.date.placeholder = todayLine();
    if (letterEmpty()) {
      letterSheet.innerHTML = '<p class="empty">Napisz treść listu albo wstaw szkic z CV, a tutaj pojawi się podgląd.</p>';
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
      ${L.position.trim() ? `<p class="subject">Dotyczy: rekrutacji na stanowisko ${esc(L.position.trim())}</p>` : ''}
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
      ? '<p class="empty">Zacznij wypełniać formularz, a tutaj pojawi się Twoje CV.</p>'
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
    document.title = state.fullName.trim() ? `CV – ${state.fullName.trim()}` : 'Kreator CV';
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

  const fileBase = (prefix = 'cv') => {
    const slug = state.fullName.trim().toLowerCase()
      .replace(/[^a-z0-9ąćęłńóśźż]+/gi, '-').replace(/^-+|-+$/g, '');
    return slug ? `${prefix}-${slug}` : prefix;
  };

  async function saveFile(filename, data) {
    const downloads = await downloadsPromise;
    if (downloads) {
      try {
        await downloads.save({ filename, data });
        toast('Zapisano plik.');
      } catch (err) {
        if (err?.code !== 'declined') toast('Nie udało się zapisać pliku w tym widoku.');
      }
      return;
    }
    if (inSandbox) {
      toast('Zapisywanie plików nie jest dostępne w tym widoku.');
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

  async function exportPdf() {
    const isLetter = state.doc === 'letter';
    if (docEmpty()) {
      toast(isLetter ? 'Najpierw napisz treść listu.' : 'Najpierw uzupełnij CV.');
      return;
    }
    // Standalone: the browser's print dialog gives a crisp PDF with selectable text.
    if (!inSandbox) {
      window.print();
      return;
    }
    const btn = $('#btn-pdf');
    btn.disabled = true;
    btn.textContent = 'Tworzę PDF…';
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
        await saveFile(`${fileBase(isLetter ? 'list-motywacyjny' : 'cv')}.pdf`, blob);
      } finally {
        holder.remove();
      }
    } catch (_) {
      toast('Nie udało się utworzyć PDF. Sprawdź połączenie z internetem i spróbuj ponownie.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Pobierz PDF';
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
      const typed = $$('input:not([type=range]), textarea', item).some((el) => el.value.trim());
      if (typed && !(await ask('Usunąć tę pozycję?', 'Usuń'))) return;
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
      toast('Nie udało się wczytać zdjęcia. Wybierz plik JPG lub PNG.');
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

  const lowerFirst = (s) => (/^\p{Lu}\p{Ll}/u.test(s) ? s[0].toLowerCase() + s.slice(1) : s);
  // Ends a sentence without doubling the dot after names like "S.A." or "sp. z o.o.".
  const dot = (s) => (s.endsWith('.') ? s : `${s}.`);
  const joinPl = (items) => (items.length > 1
    ? `${items.slice(0, -1).join(', ')} oraz ${items[items.length - 1]}` : items[0] || '');

  // Builds a letter from the CV without AI. Sentences avoid gendered verb
  // forms unless the user picked one, since Polish past tense is gendered.
  function draftFromCv() {
    const L = state.letter;
    const g = (f, m, n) => (L.gender === 'f' ? f : L.gender === 'm' ? m : n);
    const position = L.position.trim() || state.title.trim() || '[stanowisko]';
    const company = L.company.trim() || '[nazwa firmy]';
    const jobs = filled(state.experience, ['role', 'company']);
    const skills = filled(state.skills, ['name']).map((s) => s.name.trim()).slice(0, 5);
    const langs = filled(state.languages, ['name'])
      .filter((l) => l.level !== 'ojczysty')
      .map((l) => `${l.name.trim().toLowerCase()} (${l.level})`);
    const concise = L.tone === 'concise';
    const paras = [];

    const target = `stanowisko ${position} w firmie ${company}`;
    const opening = L.tone === 'warm'
      ? g(
        dot(`Z ogromną radością przeczytałam ofertę pracy na ${target}`),
        dot(`Z ogromną radością przeczytałem ofertę pracy na ${target}`),
        dot(`Z dużym zainteresowaniem zgłaszam swoją kandydaturę na ${target}`),
      )
      : dot(`Zwracam się z prośbą o rozpatrzenie mojej kandydatury na ${target}`);
    paras.push(
      `${opening} ${g('Jestem przekonana', 'Jestem przekonany', 'Uważam')}, że moje doświadczenie `
      + 'i umiejętności pozwolą mi szybko wnieść realną wartość do Państwa zespołu.',
    );

    if (jobs.length) {
      const [cur, ...rest] = jobs;
      const role = cur.role.trim();
      const at = cur.company.trim() ? ` w firmie ${cur.company.trim()}` : '';
      const current = /obecn|teraz|nadal|present/i.test(cur.end || '');
      let p = current
        ? dot(`Obecnie pracuję${role ? ` na stanowisku ${role}` : ''}${at}`)
        : dot(`Moje ostatnie stanowisko to ${role || 'praca'}${at}`);
      const bullets = (cur.description || '').split('\n')
        .map((l) => l.replace(/^[-•*]\s*/, '').trim().replace(/\.$/, '')).filter(Boolean).slice(0, 3);
      if (bullets.length) p += ` Do moich zadań i osiągnięć należą m.in.: ${joinPl(bullets.map(lowerFirst))}.`;
      if (rest.length && !concise) {
        const earlier = rest.slice(0, 2).map((j) => [j.role.trim(), j.company.trim() && `w ${j.company.trim()}`].filter(Boolean).join(' '));
        p += ` ${dot(`Wcześniejsze doświadczenie obejmuje pracę jako ${joinPl(earlier)}`)}`;
      }
      paras.push(p);
    } else if (state.summary.trim()) {
      paras.push(state.summary.trim());
    }

    const strengths = [];
    if (skills.length) strengths.push(`Moje najmocniejsze strony to ${joinPl(skills)}.`);
    if (langs.length && !concise) strengths.push(`Znam języki: ${langs.join(', ')}.`);
    if (strengths.length) paras.push(strengths.join(' '));

    paras.push(
      'Chętnie opowiem więcej o swoim doświadczeniu podczas rozmowy. '
      + 'Dziękuję za poświęcony czas i rozważenie mojej kandydatury.',
    );
    return paras.join('\n\n');
  }

  $('#btn-draft').addEventListener('click', async () => {
    if (state.letter.body.trim() && !(await ask('Zastąpić obecną treść listu szkicem z CV?', 'Zastąp'))) return;
    setBody(draftFromCv());
    toast('Wstawiono szkic. Przeczytaj go i dopasuj do siebie.');
  });

  // Plain-text CV for the AI prompt.
  function cvAsText() {
    const lines = [];
    const push = (label, value) => { if (value && value.trim()) lines.push(`${label}: ${value.trim()}`); };
    push('Imię i nazwisko', state.fullName);
    push('Obecne stanowisko', state.title);
    push('Podsumowanie', state.summary);
    filled(state.experience, ['role', 'company']).forEach((e) => {
      lines.push(`Doświadczenie: ${[e.role, e.company].map((s) => s.trim()).filter(Boolean).join(', ')} (${[e.start, e.end].filter(Boolean).join(' – ')})`);
      (e.description || '').split('\n').map((l) => l.trim()).filter(Boolean).forEach((l) => lines.push(`  - ${l}`));
    });
    filled(state.education, ['school', 'degree']).forEach((e) => {
      lines.push(`Wykształcenie: ${[e.school, e.degree].map((s) => s.trim()).filter(Boolean).join(', ')} (${[e.start, e.end].filter(Boolean).join(' – ')})`);
    });
    const skills = filled(state.skills, ['name']).map((s) => `${s.name.trim()} (${s.level}/5)`);
    if (skills.length) lines.push(`Umiejętności: ${skills.join(', ')}`);
    const langs = filled(state.languages, ['name']).map((l) => `${l.name.trim()} (${l.level})`);
    if (langs.length) lines.push(`Języki: ${langs.join(', ')}`);
    push('Zainteresowania', state.interests);
    return lines.join('\n');
  }

  function aiPrompt() {
    const L = state.letter;
    const tone = { formal: 'formalny, profesjonalny', warm: 'ciepły i osobisty, ale profesjonalny', concise: 'zwięzły i rzeczowy (ok. 150 słów)' }[L.tone];
    const gender = {
      f: 'pisz w formie żeńskiej (np. „pracowałam”, „jestem gotowa”)',
      m: 'pisz w formie męskiej (np. „pracowałem”, „jestem gotowy”)',
      neutral: 'unikaj form zależnych od płci (np. zamiast „pracowałem” pisz „pracuję”, „moje doświadczenie obejmuje”)',
    }[L.gender];
    return [
      'Napisz treść listu motywacyjnego po polsku.',
      '',
      'Zasady:',
      '- Zwróć WYŁĄCZNIE akapity treści listu (3–4 akapity, łącznie 180–280 słów), oddzielone pustą linią.',
      '- Bez zwrotu grzecznościowego na początku, bez zakończenia typu „Z poważaniem”, bez podpisu, bez daty, bez nagłówków i bez formatowania Markdown.',
      `- Pierwsza osoba liczby pojedynczej; ${gender}.`,
      `- Ton: ${tone}.`,
      '- Opieraj się wyłącznie na faktach z CV. Nie wymyślaj doświadczenia, liczb, firm ani certyfikatów. Jeśli ogłoszenie wymaga czegoś, czego nie ma w CV, nie twierdź, że kandydat to ma.',
      '- Jeśli podano ogłoszenie, nawiąż konkretnie do 2–3 najważniejszych wymagań i pokaż, jak doświadczenie kandydata im odpowiada.',
      '- Unikaj pustych frazesów („jestem osobą kreatywną i komunikatywną”); używaj konkretów z CV.',
      '',
      `Stanowisko: ${L.position.trim() || state.title.trim() || '(nie podano)'}`,
      `Firma: ${L.company.trim() || '(nie podano)'}`,
      L.extra.trim() ? `Na co położyć nacisk: ${L.extra.trim()}` : '',
      '',
      'Ogłoszenie:',
      `"""${L.jobAd.trim() || '(nie podano)'}"""`,
      '',
      'CV kandydata:',
      `"""${cvAsText() || '(puste)'}"""`,
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
      toast('Najpierw uzupełnij CV — list powstaje na jego podstawie.');
      return;
    }
    if (state.letter.body.trim() && !(await ask('Zastąpić obecną treść listu nową wersją od AI?', 'Zastąp'))) return;
    const previous = state.letter.body;
    const body = letterForm.elements.body;
    const aiBtn = $('#btn-ai');
    const stopBtn = $('#btn-ai-stop');
    aiAbort = new AbortController();
    aiBtn.disabled = true;
    stopBtn.hidden = false;
    body.readOnly = true;
    setAiStatus('Claude pisze list… To może potrwać do minuty.');
    let got = false;
    try {
      const { text } = await sampleFn(aiPrompt(), {
        signal: aiAbort.signal,
        cache: false,
        onText: ({ text: t }) => {
          got = true;
          setAiStatus('Claude pisze list…');
          body.value = t;
          state.letter.body = t;
          renderLetter();
          fitPreview();
        },
      });
      setBody(text.trim());
      setAiStatus('Gotowe. Przeczytaj list i popraw to, co nie brzmi jak Ty.');
    } catch (err) {
      const kept = (err?.text || '').trim();
      setBody(kept || (got ? body.value : previous));
      const messages = {
        cancelled: kept ? 'Zatrzymano. Zostawiono napisaną część.' : 'Zatrzymano.',
        not_granted: 'Bez zgody na użycie Claude możesz napisać list sam albo wstawić szkic z CV.',
        rate_limited: 'Za dużo zapytań naraz. Spróbuj ponownie za chwilę.',
        prompt_too_large: 'Ogłoszenie jest za długie. Skróć je do najważniejszych wymagań.',
      };
      setAiStatus(messages[err?.code] || 'Nie udało się napisać listu. Spróbuj ponownie albo wstaw szkic z CV.');
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
      && !(await ask('Zastąpić Twoje CV i list przykładowymi danymi?', 'Zastąp'))) return;
    state = { ...sampleState(), template: state.template, accent: state.accent, doc: state.doc };
    fillForm();
    save();
    render();
  });

  const clearAll = async () => {
    if ((!isEmpty() || !letterEmpty()) && !state.isSample
      && !(await ask('Usunąć wszystkie dane z CV i listu motywacyjnego? Tej operacji nie można cofnąć.', 'Wyczyść'))) return;
    state = { ...emptyState(), template: state.template, accent: state.accent };
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
      state = { ...normalize(data), isSample: false };
      fillForm();
      save();
      render();
      toast('Wczytano dane z pliku.');
    } catch (_) {
      toast('To nie jest plik zapisany w tej aplikacji (JSON).');
    }
  });

  $('#btn-pdf').addEventListener('click', exportPdf);

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
  state = load() || sampleState();
  fillForm();
  render();
})();
