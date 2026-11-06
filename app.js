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

  const emptyState = () => ({
    fullName: '', title: '', email: '', phone: '', location: '', website: '',
    photo: '', summary: '', interests: '',
    consentEnabled: true, consent: DEFAULT_CONSENT,
    experience: [], education: [], skills: [], languages: [],
    template: 'modern', accent: '#2563eb',
    isSample: false,
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
  });

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const form = $('#editor');
  const cv = $('#cv');
  const paperWrap = $('#paper-wrap');
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

  function render() {
    cv.className = `cv tpl-${state.template}`;
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

  // Scales the fixed-width A4 sheet down to the width available on screen.
  function fitPreview() {
    const available = paperWrap.clientWidth;
    if (!available) return;
    const scale = Math.min(1, available / cv.offsetWidth);
    cv.style.transform = scale < 1 ? `scale(${scale})` : '';
    paperWrap.style.height = `${Math.ceil(cv.offsetHeight * scale)}px`;
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

  const fileBase = () => {
    const slug = state.fullName.trim().toLowerCase()
      .replace(/[^a-z0-9ąćęłńóśźż]+/gi, '-').replace(/^-+|-+$/g, '');
    return slug ? `cv-${slug}` : 'cv';
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
    if (isEmpty()) {
      toast('Najpierw uzupełnij CV.');
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
      const copy = cv.cloneNode(true);
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
          pagebreak: { mode: ['css', 'legacy'], avoid: ['.entry', '.skill'] },
        }).from(copy).outputPdf('blob');
        await saveFile(`${fileBase()}.pdf`, blob);
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
    if (!isEmpty() && !state.isSample && !(await ask('Zastąpić Twoje dane przykładowym CV?', 'Zastąp'))) return;
    state = { ...sampleState(), template: state.template, accent: state.accent };
    fillForm();
    save();
    render();
  });

  const clearAll = async () => {
    if (!isEmpty() && !state.isSample && !(await ask('Usunąć wszystkie dane z CV? Tej operacji nie można cofnąć.', 'Wyczyść'))) return;
    state = { ...emptyState(), template: state.template, accent: state.accent };
    fillForm();
    save();
    render();
    $('details.card').open = true;
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
      toast('Wczytano CV z pliku.');
    } catch (_) {
      toast('To nie jest plik CV zapisany w tej aplikacji (JSON).');
    }
  });

  $('#btn-pdf').addEventListener('click', exportPdf);

  $$('[data-view-btn]').forEach((b) => b.addEventListener('click', () => setView(b.dataset.viewBtn)));

  if ('ResizeObserver' in window) new ResizeObserver(fitPreview).observe(paperWrap);
  else window.addEventListener('resize', fitPreview);
  document.fonts?.ready.then(fitPreview);
  window.addEventListener('beforeprint', () => { cv.style.transform = ''; });
  window.addEventListener('afterprint', fitPreview);

  // ---------- Init ----------
  // First visit opens with clearly marked sample data, so the tool shows what it does.
  state = load() || sampleState();
  fillForm();
  render();
})();
