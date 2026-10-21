(() => {
  'use strict';

  const STORAGE_KEY = 'cv-builder:v1';
  const LISTS = ['experience', 'education', 'skills', 'languages'];
  const SIMPLE_FIELDS = [
    'fullName', 'title', 'email', 'phone', 'location', 'website',
    'summary', 'interests', 'consent',
  ];
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
  });

  const sampleState = () => ({
    ...emptyState(),
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
  const templateSelect = $('#template');
  const accentInput = $('#accent');

  let state = load();

  // ---------- Persistence ----------

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...emptyState(), ...JSON.parse(raw) };
    } catch (_) { /* storage unavailable or corrupt */ }
    return emptyState();
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) { /* e.g. quota exceeded by a large photo */ }
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
    return node;
  }

  function fillForm() {
    SIMPLE_FIELDS.forEach((name) => { form.elements[name].value = state[name] || ''; });
    form.elements.consentEnabled.checked = !!state.consentEnabled;
    LISTS.forEach((list) => {
      $(`[data-list="${list}"] .list`).innerHTML = '';
      state[list].forEach((item) => addItem(list, item));
    });
    templateSelect.value = state.template;
    accentInput.value = state.accent;
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
    state.template = templateSelect.value;
    state.accent = accentInput.value;
  }

  function update() {
    readForm();
    save();
    render();
  }

  // ---------- Rendering ----------

  const esc = (str) => String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));

  const filled = (list, keys) => list.filter((item) => keys.some((k) => (item[k] || '').trim()));

  const dateRange = (item) => [item.start, item.end].filter(Boolean).map(esc).join(' – ');

  const section = (title, body) => (body ? `
    <section class="section">
      <h2 class="section-title">${esc(title)}</h2>
      ${body}
    </section>` : '');

  function contactList() {
    const items = [
      state.email && `<li>✉ <a href="mailto:${esc(state.email)}">${esc(state.email)}</a></li>`,
      state.phone && `<li>☎ ${esc(state.phone)}</li>`,
      state.location && `<li>⌂ ${esc(state.location)}</li>`,
      state.website && `<li>🔗 ${esc(state.website)}</li>`,
    ].filter(Boolean);
    return items.length ? `<ul class="contact">${items.join('')}</ul>` : '';
  }

  function experienceHtml() {
    return filled(state.experience, ['role', 'company']).map((e) => {
      const bullets = (e.description || '').split('\n').map((l) => l.trim()).filter(Boolean);
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
    return filled(state.skills, ['name']).map((s) => `
      <div class="skill">
        ${esc(s.name)}
        <div class="bar"><span style="width:${(Number(s.level) || 0) * 20}%"></span></div>
      </div>`).join('');
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

    classic: () => `
      <header>
        ${photoHtml()}
        <h1 class="name">${esc(state.fullName)}</h1>
        <div class="role">${esc(state.title)}</div>
        ${contactList()}
      </header>
      ${section('Profil', summaryHtml())}
      ${section('Doświadczenie', experienceHtml())}
      ${section('Wykształcenie', educationHtml())}
      <div class="two-col">
        <div>${section('Umiejętności', skillsHtml())}</div>
        <div>
          ${section('Języki', languagesHtml())}
          ${section('Zainteresowania', interestsHtml())}
        </div>
      </div>
      ${consentHtml()}`,

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
    const hasText = (obj) => Object.values(obj).some((v) => String(v).trim());
    return SIMPLE_FIELDS.filter((f) => f !== 'consent').every((f) => !state[f].trim())
      && !state.photo
      && LISTS.every((l) => !state[l].some(hasText));
  }

  function render() {
    const tpl = templates[state.template] ? state.template : 'modern';
    cv.className = `cv tpl-${tpl}`;
    cv.style.setProperty('--accent', state.accent);
    cv.innerHTML = isEmpty()
      ? '<p class="empty">Zacznij wypełniać formularz lub kliknij „Przykład”, aby zobaczyć podgląd CV.</p>'
      : templates[tpl]();
    document.title = state.fullName ? `CV – ${state.fullName}` : 'Kreator CV';
  }

  // ---------- Photo ----------

  function resizeImage(file, maxSize = 400) {
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

  // ---------- Events ----------

  form.addEventListener('input', update);
  form.addEventListener('change', update);
  templateSelect.addEventListener('change', update);
  accentInput.addEventListener('input', update);

  form.addEventListener('click', (ev) => {
    const btn = ev.target.closest('button');
    if (!btn) return;
    if (btn.dataset.add) {
      const node = addItem(btn.dataset.add);
      $('input, textarea', node)?.focus();
    } else if (btn.hasAttribute('data-remove')) {
      btn.closest('.item').remove();
    } else if (btn.dataset.move) {
      const item = btn.closest('.item');
      if (btn.dataset.move === '-1' && item.previousElementSibling) {
        item.parentNode.insertBefore(item, item.previousElementSibling);
      } else if (btn.dataset.move === '1' && item.nextElementSibling) {
        item.parentNode.insertBefore(item.nextElementSibling, item);
      }
    } else {
      return;
    }
    update();
  });

  $('#photo-input').addEventListener('change', async (ev) => {
    ev.stopPropagation();
    const file = ev.target.files[0];
    if (!file) return;
    try {
      state.photo = await resizeImage(file);
      save();
      render();
    } catch (_) {
      alert('Nie udało się wczytać zdjęcia.');
    }
    ev.target.value = '';
  });

  $('#photo-remove').addEventListener('click', () => {
    state.photo = '';
    save();
    render();
  });

  $('#btn-sample').addEventListener('click', () => {
    if (!isEmpty() && !confirm('Zastąpić obecne dane przykładowym CV?')) return;
    state = { ...sampleState(), template: state.template, accent: state.accent };
    fillForm();
    save();
    render();
  });

  $('#btn-reset').addEventListener('click', () => {
    if (!confirm('Na pewno wyczyścić wszystkie dane?')) return;
    state = emptyState();
    fillForm();
    save();
    render();
  });

  $('#btn-export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    const slug = (state.fullName || 'cv').toLowerCase().replace(/[^a-z0-9ąćęłńóśźż]+/gi, '-');
    a.href = URL.createObjectURL(blob);
    a.download = `${slug}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  $('#btn-import').addEventListener('change', async (ev) => {
    const file = ev.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (typeof data !== 'object' || data === null) throw new Error('invalid');
      const base = emptyState();
      SIMPLE_FIELDS.concat('photo', 'template', 'accent').forEach((f) => {
        data[f] = typeof data[f] === 'string' ? data[f] : base[f];
      });
      LISTS.forEach((l) => {
        data[l] = Array.isArray(data[l]) ? data[l].filter((i) => i && typeof i === 'object') : base[l];
      });
      if (!/^data:image\//.test(data.photo)) data.photo = '';
      state = { ...base, ...data, consentEnabled: data.consentEnabled !== false };
      fillForm();
      save();
      render();
    } catch (_) {
      alert('Nieprawidłowy plik JSON.');
    }
    ev.target.value = '';
  });

  $('#btn-print').addEventListener('click', () => window.print());

  // ---------- Init ----------
  fillForm();
  render();
})();
