// Translations for the CV builder: UI strings (by interface language), document
// strings and letter drafts (by document language), and sample data.
window.CVI18N = (() => {
  'use strict';

  const LANGS = ['pl', 'uk', 'en'];

  // ---------- Interface ----------

  const UI = {
    pl: {
      appName: 'Kreator CV',
      uiLang: 'Język interfejsu',
      docPicker: 'Dokument',
      docLetterLong: 'List motywacyjny',
      docLetterShort: 'List',
      file: 'Plik ▾',
      sample: 'Wczytaj przykład',
      import: 'Import JSON',
      export: 'Eksport JSON',
      reset: 'Wyczyść',
      pdfVerb: 'Pobierz',
      banner: 'CV i list wypełniono przykładowymi danymi. Zastąp je swoimi albo zacznij od zera.',
      startEmpty: 'Zacznij od zera',
      docLang: 'Język dokumentu',
      docLangHint: 'Może być inny niż język interfejsu, np. CV po polsku dla polskiego pracodawcy.',

      secPersonal: 'Dane osobowe',
      addPhoto: 'Dodaj zdjęcie',
      removePhoto: 'Usuń zdjęcie',
      fFullName: 'Imię i nazwisko',
      fTitle: 'Stanowisko',
      phTitle: 'np. Księgowa, Frontend Developer',
      fEmail: 'E-mail',
      fPhone: 'Telefon',
      fLocation: 'Miejscowość',
      fWebsite: 'Strona / LinkedIn',
      secSummary: 'Podsumowanie zawodowe',
      summaryHint: '2–4 zdania o tym, kim jesteś i w czym jesteś dobry',
      secExperience: 'Doświadczenie',
      addExperience: '+ Dodaj stanowisko',
      secEducation: 'Wykształcenie',
      addEducation: '+ Dodaj szkołę',
      secSkills: 'Umiejętności',
      skillBars: 'Pokazuj poziom (słupki)',
      addSkill: '+ Dodaj umiejętność',
      secLanguages: 'Języki',
      addLanguage: '+ Dodaj język',
      secInterests: 'Zainteresowania',
      interestsHint: 'Oddziel przecinkami',
      phInterests: 'np. bieganie, fotografia',
      secConsent: 'Klauzula RODO',
      consentInclude: 'Dołącz klauzulę na dole CV',
      consentText: 'Treść klauzuli',

      template: 'Szablon',
      tplModern: 'Nowoczesny',
      tplClassic: 'Klasyczny',
      tplMinimal: 'Minimalny',
      color: 'Kolor',
      cBlue: 'Niebieski',
      cTeal: 'Morski',
      cViolet: 'Fioletowy',
      cMaroon: 'Bordowy',
      cOrange: 'Pomarańczowy',
      cGraphite: 'Grafitowy',
      cCustom: 'Własny kolor',
      previewCv: 'Podgląd CV',
      previewLetter: 'Podgląd listu motywacyjnego',

      letterHint: 'Imię, dane kontaktowe, kolor i szablon list bierze z Twojego CV.',
      secJob: 'Oferta pracy',
      lPosition: 'Stanowisko',
      phPosition: 'np. Senior Frontend Developer',
      lCompany: 'Firma',
      phCompany: 'np. Nowa Firma S.A.',
      lJobAd: 'Treść ogłoszenia (opcjonalnie, pomaga dopasować list)',
      phJobAd: 'Wklej tutaj ogłoszenie o pracę',
      secRecipient: 'Adresat i data',
      lRecipient: 'Osoba lub dział',
      phRecipient: 'np. Dział HR',
      lAddress: 'Adres firmy',
      phAddress: 'ul. Przykładowa 1\n00-001 Warszawa',
      lDate: 'Miejscowość i data (puste = dzisiejsza)',
      secBody: 'Treść listu',
      lTone: 'Ton',
      toneFormal: 'Formalny',
      toneWarm: 'Ciepły, osobisty',
      toneConcise: 'Zwięzły',
      lGender: 'Forma gramatyczna',
      gNeutral: 'Neutralna',
      gF: 'Żeńska („pracowałam”)',
      gM: 'Męska („pracowałem”)',
      lExtra: 'Na co położyć nacisk? (opcjonalnie)',
      phExtra: 'np. praca z klientem, zarządzanie zespołem',
      aiWrite: 'Napisz z AI',
      aiStop: 'Zatrzymaj',
      draft: 'Wstaw szkic z CV',
      lGreeting: 'Zwrot grzecznościowy',
      lBody: 'Treść (akapity oddziel pustą linią)',
      lClosing: 'Zakończenie',
      lConsent: 'Dołącz klauzulę RODO (treść z CV)',

      viewNav: 'Widok',
      tabEdit: 'Edycja',
      tabPreview: 'Podgląd',
      cancel: 'Anuluj',
      ok: 'OK',

      newJob: 'Nowe stanowisko',
      newSchool: 'Nowa szkoła',
      moveUp: 'Przesuń w górę',
      moveDown: 'Przesuń w dół',
      remove: 'Usuń',
      iRole: 'Stanowisko',
      iCompany: 'Firma',
      iFrom: 'Od',
      iTo: 'Do',
      phFrom: 'np. 03.2021',
      phTo: 'np. obecnie',
      iDesc: 'Obowiązki i osiągnięcia (każda linia to osobny punkt)',
      iSchool: 'Uczelnia / szkoła',
      iDegree: 'Kierunek / stopień',
      iSkill: 'Umiejętność',
      iLevel: 'Poziom:',
      iLanguage: 'Język',
      iLangLevel: 'Poziom',
      native: 'ojczysty',

      toastSaveFail: 'Nie udało się zapisać w przeglądarce. Użyj „Eksport JSON”, żeby nie stracić danych.',
      toastSaved: 'Zapisano plik.',
      toastSaveError: 'Nie udało się zapisać pliku w tym widoku.',
      toastNoSave: 'Zapisywanie plików nie jest dostępne w tym widoku.',
      needCv: 'Najpierw uzupełnij CV.',
      needLetter: 'Najpierw napisz treść listu.',
      pdfBusy: 'Tworzę PDF…',
      pdfFail: 'Nie udało się utworzyć PDF. Sprawdź połączenie z internetem i spróbuj ponownie.',
      photoFail: 'Nie udało się wczytać zdjęcia. Wybierz plik JPG lub PNG.',
      confirmRemoveItem: 'Usunąć tę pozycję?',
      confirmSample: 'Zastąpić Twoje CV i list przykładowymi danymi?',
      replace: 'Zastąp',
      confirmClear: 'Usunąć wszystkie dane z CV i listu motywacyjnego? Tej operacji nie można cofnąć.',
      importOk: 'Wczytano dane z pliku.',
      importBad: 'To nie jest plik zapisany w tej aplikacji (JSON).',
      confirmDraft: 'Zastąpić obecną treść listu szkicem z CV?',
      draftDone: 'Wstawiono szkic. Przeczytaj go i dopasuj do siebie.',
      aiNeedCv: 'Najpierw uzupełnij CV — list powstaje na jego podstawie.',
      confirmAi: 'Zastąpić obecną treść listu nową wersją od AI?',
      aiThinking: 'Claude pisze list… To może potrwać do minuty.',
      aiWriting: 'Claude pisze list…',
      aiDone: 'Gotowe. Przeczytaj list i popraw to, co nie brzmi jak Ty.',
      aiCancelledKept: 'Zatrzymano. Zostawiono napisaną część.',
      aiCancelled: 'Zatrzymano.',
      aiNotGranted: 'Bez zgody na użycie Claude możesz napisać list sam albo wstawić szkic z CV.',
      aiRateLimited: 'Za dużo zapytań naraz. Spróbuj ponownie za chwilę.',
      aiTooLarge: 'Ogłoszenie jest za długie. Skróć je do najważniejszych wymagań.',
      aiFailed: 'Nie udało się napisać listu. Spróbuj ponownie albo wstaw szkic z CV.',
      emptyCv: 'Zacznij wypełniać formularz, a tutaj pojawi się Twoje CV.',
      emptyLetter: 'Napisz treść listu albo wstaw szkic z CV, a tutaj pojawi się podgląd.',
    },

    uk: {
      appName: 'Конструктор CV',
      uiLang: 'Мова інтерфейсу',
      docPicker: 'Документ',
      docLetterLong: 'Мотиваційний лист',
      docLetterShort: 'Лист',
      file: 'Файл ▾',
      sample: 'Завантажити приклад',
      import: 'Імпорт JSON',
      export: 'Експорт JSON',
      reset: 'Очистити',
      pdfVerb: 'Завантажити',
      banner: 'CV і лист заповнено прикладом. Замініть дані своїми або почніть з нуля.',
      startEmpty: 'Почати з нуля',
      docLang: 'Мова документа',
      docLangHint: 'Може відрізнятися від мови інтерфейсу, напр. CV польською для польського роботодавця.',

      secPersonal: 'Особисті дані',
      addPhoto: 'Додати фото',
      removePhoto: 'Видалити фото',
      fFullName: 'Ім’я та прізвище',
      fTitle: 'Посада',
      phTitle: 'напр. бухгалтерка, Frontend Developer',
      fEmail: 'Ел. пошта',
      fPhone: 'Телефон',
      fLocation: 'Місто',
      fWebsite: 'Сайт / LinkedIn',
      secSummary: 'Коротко про себе',
      summaryHint: '2–4 речення про те, хто ви і в чому ви сильні',
      secExperience: 'Досвід роботи',
      addExperience: '+ Додати посаду',
      secEducation: 'Освіта',
      addEducation: '+ Додати навчальний заклад',
      secSkills: 'Навички',
      skillBars: 'Показувати рівень (смужки)',
      addSkill: '+ Додати навичку',
      secLanguages: 'Мови',
      addLanguage: '+ Додати мову',
      secInterests: 'Інтереси',
      interestsHint: 'Розділяйте комами',
      phInterests: 'напр. біг, фотографія',
      secConsent: 'Згода на обробку даних (RODO)',
      consentInclude: 'Додати згоду внизу CV',
      consentText: 'Текст згоди',

      template: 'Шаблон',
      tplModern: 'Сучасний',
      tplClassic: 'Класичний',
      tplMinimal: 'Мінімальний',
      color: 'Колір',
      cBlue: 'Синій',
      cTeal: 'Бірюзовий',
      cViolet: 'Фіолетовий',
      cMaroon: 'Бордовий',
      cOrange: 'Помаранчевий',
      cGraphite: 'Графітовий',
      cCustom: 'Власний колір',
      previewCv: 'Перегляд CV',
      previewLetter: 'Перегляд мотиваційного листа',

      letterHint: 'Ім’я, контакти, колір і шаблон лист бере з вашого CV.',
      secJob: 'Вакансія',
      lPosition: 'Посада',
      phPosition: 'напр. Senior Frontend Developer',
      lCompany: 'Компанія',
      phCompany: 'напр. Nowa Firma S.A.',
      lJobAd: 'Текст оголошення (необов’язково, допомагає підлаштувати лист)',
      phJobAd: 'Вставте сюди оголошення про роботу',
      secRecipient: 'Адресат і дата',
      lRecipient: 'Особа або відділ',
      phRecipient: 'напр. Відділ кадрів',
      lAddress: 'Адреса компанії',
      phAddress: 'ul. Przykładowa 1\n00-001 Warszawa',
      lDate: 'Місто і дата (порожньо = сьогодні)',
      secBody: 'Текст листа',
      lTone: 'Тон',
      toneFormal: 'Офіційний',
      toneWarm: 'Теплий, особистий',
      toneConcise: 'Стислий',
      lGender: 'Граматичний рід',
      gNeutral: 'Нейтральний',
      gF: 'Жіночий («працювала»)',
      gM: 'Чоловічий («працював»)',
      lExtra: 'На чому зробити акцент? (необов’язково)',
      phExtra: 'напр. робота з клієнтами, управління командою',
      aiWrite: 'Написати з AI',
      aiStop: 'Зупинити',
      draft: 'Вставити чернетку з CV',
      lGreeting: 'Звертання',
      lBody: 'Текст (абзаци розділяйте порожнім рядком)',
      lClosing: 'Завершення',
      lConsent: 'Додати згоду на обробку даних (текст з CV)',

      viewNav: 'Вигляд',
      tabEdit: 'Редагування',
      tabPreview: 'Перегляд',
      cancel: 'Скасувати',
      ok: 'OK',

      newJob: 'Нова посада',
      newSchool: 'Новий навчальний заклад',
      moveUp: 'Перемістити вгору',
      moveDown: 'Перемістити вниз',
      remove: 'Видалити',
      iRole: 'Посада',
      iCompany: 'Компанія',
      iFrom: 'Від',
      iTo: 'До',
      phFrom: 'напр. 03.2021',
      phTo: 'напр. досі',
      iDesc: 'Обов’язки та досягнення (кожен рядок — окремий пункт)',
      iSchool: 'Навчальний заклад',
      iDegree: 'Спеціальність / ступінь',
      iSkill: 'Навичка',
      iLevel: 'Рівень:',
      iLanguage: 'Мова',
      iLangLevel: 'Рівень',
      native: 'рідна',

      toastSaveFail: 'Не вдалося зберегти в браузері. Скористайтеся «Експорт JSON», щоб не втратити дані.',
      toastSaved: 'Файл збережено.',
      toastSaveError: 'Не вдалося зберегти файл у цьому вікні.',
      toastNoSave: 'Збереження файлів недоступне в цьому вікні.',
      needCv: 'Спочатку заповніть CV.',
      needLetter: 'Спочатку напишіть текст листа.',
      pdfBusy: 'Створюю PDF…',
      pdfFail: 'Не вдалося створити PDF. Перевірте підключення до інтернету й спробуйте ще раз.',
      photoFail: 'Не вдалося завантажити фото. Виберіть файл JPG або PNG.',
      confirmRemoveItem: 'Видалити цей пункт?',
      confirmSample: 'Замінити ваше CV і лист прикладом?',
      replace: 'Замінити',
      confirmClear: 'Видалити всі дані CV і мотиваційного листа? Цю дію не можна скасувати.',
      importOk: 'Дані з файлу завантажено.',
      importBad: 'Це не файл, збережений у цьому застосунку (JSON).',
      confirmDraft: 'Замінити поточний текст листа чернеткою з CV?',
      draftDone: 'Чернетку вставлено. Прочитайте її та підлаштуйте під себе.',
      aiNeedCv: 'Спочатку заповніть CV — лист створюється на його основі.',
      confirmAi: 'Замінити поточний текст листа новою версією від AI?',
      aiThinking: 'Claude пише лист… Це може тривати до хвилини.',
      aiWriting: 'Claude пише лист…',
      aiDone: 'Готово. Прочитайте лист і виправте те, що звучить не як ви.',
      aiCancelledKept: 'Зупинено. Написану частину залишено.',
      aiCancelled: 'Зупинено.',
      aiNotGranted: 'Без дозволу на використання Claude ви можете написати лист самостійно або вставити чернетку з CV.',
      aiRateLimited: 'Забагато запитів одночасно. Спробуйте ще раз за хвилину.',
      aiTooLarge: 'Оголошення задовге. Скоротіть його до найважливіших вимог.',
      aiFailed: 'Не вдалося написати лист. Спробуйте ще раз або вставте чернетку з CV.',
      emptyCv: 'Почніть заповнювати форму — тут з’явиться ваше CV.',
      emptyLetter: 'Напишіть текст листа або вставте чернетку з CV — тут з’явиться попередній перегляд.',
    },

    en: {
      appName: 'CV Builder',
      uiLang: 'Interface language',
      docPicker: 'Document',
      docLetterLong: 'Cover letter',
      docLetterShort: 'Letter',
      file: 'File ▾',
      sample: 'Load example',
      import: 'Import JSON',
      export: 'Export JSON',
      reset: 'Clear',
      pdfVerb: 'Download',
      banner: 'The CV and letter contain example data. Replace it with your own or start from scratch.',
      startEmpty: 'Start from scratch',
      docLang: 'Document language',
      docLangHint: 'Can differ from the interface language, e.g. a Polish CV for a Polish employer.',

      secPersonal: 'Personal details',
      addPhoto: 'Add photo',
      removePhoto: 'Remove photo',
      fFullName: 'Full name',
      fTitle: 'Job title',
      phTitle: 'e.g. Accountant, Frontend Developer',
      fEmail: 'Email',
      fPhone: 'Phone',
      fLocation: 'City',
      fWebsite: 'Website / LinkedIn',
      secSummary: 'Professional summary',
      summaryHint: '2–4 sentences about who you are and what you are good at',
      secExperience: 'Experience',
      addExperience: '+ Add job',
      secEducation: 'Education',
      addEducation: '+ Add school',
      secSkills: 'Skills',
      skillBars: 'Show level (bars)',
      addSkill: '+ Add skill',
      secLanguages: 'Languages',
      addLanguage: '+ Add language',
      secInterests: 'Interests',
      interestsHint: 'Separate with commas',
      phInterests: 'e.g. running, photography',
      secConsent: 'Data processing consent (GDPR)',
      consentInclude: 'Add the consent clause at the bottom of the CV',
      consentText: 'Clause text',

      template: 'Template',
      tplModern: 'Modern',
      tplClassic: 'Classic',
      tplMinimal: 'Minimal',
      color: 'Colour',
      cBlue: 'Blue',
      cTeal: 'Teal',
      cViolet: 'Violet',
      cMaroon: 'Maroon',
      cOrange: 'Orange',
      cGraphite: 'Graphite',
      cCustom: 'Custom colour',
      previewCv: 'CV preview',
      previewLetter: 'Cover letter preview',

      letterHint: 'The letter uses the name, contact details, colour and template from your CV.',
      secJob: 'Job offer',
      lPosition: 'Position',
      phPosition: 'e.g. Senior Frontend Developer',
      lCompany: 'Company',
      phCompany: 'e.g. Northwind Ltd',
      lJobAd: 'Job ad text (optional, helps tailor the letter)',
      phJobAd: 'Paste the job ad here',
      secRecipient: 'Recipient and date',
      lRecipient: 'Person or department',
      phRecipient: 'e.g. Hiring Team',
      lAddress: 'Company address',
      phAddress: '1 Example Street\nLondon SW1A 1AA',
      lDate: 'Place and date (empty = today)',
      secBody: 'Letter text',
      lTone: 'Tone',
      toneFormal: 'Formal',
      toneWarm: 'Warm, personal',
      toneConcise: 'Concise',
      lGender: 'Grammatical gender (Polish/Ukrainian)',
      gNeutral: 'Neutral',
      gF: 'Feminine',
      gM: 'Masculine',
      lExtra: 'What should it emphasise? (optional)',
      phExtra: 'e.g. customer work, team management',
      aiWrite: 'Write with AI',
      aiStop: 'Stop',
      draft: 'Insert draft from CV',
      lGreeting: 'Greeting',
      lBody: 'Text (separate paragraphs with a blank line)',
      lClosing: 'Closing',
      lConsent: 'Add the consent clause (text from the CV)',

      viewNav: 'View',
      tabEdit: 'Edit',
      tabPreview: 'Preview',
      cancel: 'Cancel',
      ok: 'OK',

      newJob: 'New job',
      newSchool: 'New school',
      moveUp: 'Move up',
      moveDown: 'Move down',
      remove: 'Remove',
      iRole: 'Job title',
      iCompany: 'Company',
      iFrom: 'From',
      iTo: 'To',
      phFrom: 'e.g. 03/2021',
      phTo: 'e.g. present',
      iDesc: 'Responsibilities and achievements (one bullet per line)',
      iSchool: 'University / school',
      iDegree: 'Field / degree',
      iSkill: 'Skill',
      iLevel: 'Level:',
      iLanguage: 'Language',
      iLangLevel: 'Level',
      native: 'native',

      toastSaveFail: 'Could not save in the browser. Use “Export JSON” so you do not lose your data.',
      toastSaved: 'File saved.',
      toastSaveError: 'Could not save the file in this view.',
      toastNoSave: 'Saving files is not available in this view.',
      needCv: 'Fill in your CV first.',
      needLetter: 'Write the letter text first.',
      pdfBusy: 'Creating PDF…',
      pdfFail: 'Could not create the PDF. Check your internet connection and try again.',
      photoFail: 'Could not load the photo. Choose a JPG or PNG file.',
      confirmRemoveItem: 'Remove this entry?',
      confirmSample: 'Replace your CV and letter with example data?',
      replace: 'Replace',
      confirmClear: 'Delete all CV and cover letter data? This cannot be undone.',
      importOk: 'Data loaded from the file.',
      importBad: 'This is not a file saved by this app (JSON).',
      confirmDraft: 'Replace the current letter text with a draft from your CV?',
      draftDone: 'Draft inserted. Read it and make it your own.',
      aiNeedCv: 'Fill in your CV first — the letter is based on it.',
      confirmAi: 'Replace the current letter text with a new AI version?',
      aiThinking: 'Claude is writing your letter… This can take up to a minute.',
      aiWriting: 'Claude is writing your letter…',
      aiDone: 'Done. Read the letter and fix anything that does not sound like you.',
      aiCancelledKept: 'Stopped. The written part was kept.',
      aiCancelled: 'Stopped.',
      aiNotGranted: 'Without permission to use Claude you can write the letter yourself or insert a draft from your CV.',
      aiRateLimited: 'Too many requests at once. Try again in a moment.',
      aiTooLarge: 'The job ad is too long. Shorten it to the key requirements.',
      aiFailed: 'Could not write the letter. Try again or insert a draft from your CV.',
      emptyCv: 'Start filling in the form and your CV will appear here.',
      emptyLetter: 'Write the letter text or insert a draft from your CV and the preview will appear here.',
    },
  };

  // ---------- Document (what is printed on the CV and the letter) ----------

  const DOC = {
    pl: {
      name: 'polski',
      promptName: 'Polish',
      profile: 'Profil',
      experience: 'Doświadczenie',
      education: 'Wykształcenie',
      skills: 'Umiejętności',
      languages: 'Języki',
      interests: 'Zainteresowania',
      contact: 'Kontakt',
      kEmail: 'E-mail',
      kPhone: 'Telefon',
      kLocation: 'Miejscowość',
      kWww: 'WWW',
      native: 'ojczysty',
      fileLetter: 'list-motywacyjny',
      subject: (pos) => `Dotyczy: rekrutacji na stanowisko ${pos}`,
      greeting: 'Szanowni Państwo,',
      closing: 'Z poważaniem',
      dateLocale: 'pl-PL',
      dateSuffix: ' r.',
      consent:
        'Wyrażam zgodę na przetwarzanie moich danych osobowych dla potrzeb niezbędnych ' +
        'do realizacji procesu rekrutacji zgodnie z Rozporządzeniem Parlamentu Europejskiego ' +
        'i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. (RODO).',
    },
    uk: {
      name: 'українська',
      promptName: 'Ukrainian',
      profile: 'Про себе',
      experience: 'Досвід роботи',
      education: 'Освіта',
      skills: 'Навички',
      languages: 'Мови',
      interests: 'Інтереси',
      contact: 'Контакти',
      kEmail: 'Ел. пошта',
      kPhone: 'Телефон',
      kLocation: 'Місто',
      kWww: 'Сайт',
      native: 'рідна',
      fileLetter: 'мотиваційний-лист',
      subject: (pos) => `Щодо: вакансії на посаду ${pos}`,
      greeting: 'Шановні пані та панове,',
      closing: 'З повагою,',
      dateLocale: 'uk-UA',
      dateSuffix: '',
      consent:
        'Я даю згоду на обробку моїх персональних даних для цілей, необхідних для проведення ' +
        'процесу рекрутингу, відповідно до Регламенту Європейського Парламенту і Ради (ЄС) 2016/679 ' +
        'від 27 квітня 2016 р. (GDPR).',
    },
    en: {
      name: 'English',
      promptName: 'English',
      profile: 'Profile',
      experience: 'Experience',
      education: 'Education',
      skills: 'Skills',
      languages: 'Languages',
      interests: 'Interests',
      contact: 'Contact',
      kEmail: 'Email',
      kPhone: 'Phone',
      kLocation: 'Location',
      kWww: 'Website',
      native: 'native',
      fileLetter: 'cover-letter',
      subject: (pos) => `Re: Application for the position of ${pos}`,
      greeting: 'Dear Hiring Manager,',
      closing: 'Yours sincerely,',
      dateLocale: 'en-GB',
      dateSuffix: '',
      consent:
        'I hereby consent to the processing of my personal data for the purposes of the recruitment ' +
        'process in accordance with Regulation (EU) 2016/679 of the European Parliament and of the ' +
        'Council of 27 April 2016 (GDPR).',
    },
  };

  // ---------- Letter drafts built from the CV (no AI) ----------

  // Ends a sentence without doubling the dot after names like "S.A." or "sp. z o.o.".
  const dot = (s) => (s.endsWith('.') ? s : `${s}.`);
  const lowerFirst = (s) => (/^\p{Lu}\p{Ll}/u.test(s) ? s[0].toLowerCase() + s.slice(1) : s);
  const joinWith = (word) => (items) => (items.length > 1
    ? `${items.slice(0, -1).join(', ')} ${word} ${items[items.length - 1]}` : items[0] || '');

  // Each draft takes: { gender: 'f'|'m'|'neutral', tone, position, company,
  // jobs: [{ role, company, current, bullets }], skills: [names],
  // langs: [{ name, level }] (native ones removed), summary } and returns text.
  const DRAFT = {
    pl(c) {
      const g = (f, m, n) => (c.gender === 'f' ? f : c.gender === 'm' ? m : n);
      const join = joinWith('oraz');
      const position = c.position || '[stanowisko]';
      const company = c.company || '[nazwa firmy]';
      const concise = c.tone === 'concise';
      const target = `stanowisko ${position} w firmie ${company}`;
      const paras = [];
      const opening = c.tone === 'warm'
        ? g(
          dot(`Z ogromną radością przeczytałam ofertę pracy na ${target}`),
          dot(`Z ogromną radością przeczytałem ofertę pracy na ${target}`),
          dot(`Z dużym zainteresowaniem zgłaszam swoją kandydaturę na ${target}`),
        )
        : dot(`Zwracam się z prośbą o rozpatrzenie mojej kandydatury na ${target}`);
      paras.push(`${opening} ${g('Jestem przekonana', 'Jestem przekonany', 'Uważam')}, że moje doświadczenie `
        + 'i umiejętności pozwolą mi szybko wnieść realną wartość do Państwa zespołu.');

      if (c.jobs.length) {
        const [cur, ...rest] = c.jobs;
        const at = cur.company ? ` w firmie ${cur.company}` : '';
        let p = cur.current
          ? dot(`Obecnie pracuję${cur.role ? ` na stanowisku ${cur.role}` : ''}${at}`)
          : dot(`Moje ostatnie stanowisko to ${cur.role || 'praca'}${at}`);
        if (cur.bullets.length) p += ` Do moich zadań i osiągnięć należą m.in.: ${join(cur.bullets.map(lowerFirst))}.`;
        if (rest.length && !concise) {
          const earlier = rest.slice(0, 2).map((j) => [j.role, j.company && `w ${j.company}`].filter(Boolean).join(' '));
          p += ` ${dot(`Wcześniejsze doświadczenie obejmuje pracę jako ${join(earlier)}`)}`;
        }
        paras.push(p);
      } else if (c.summary) {
        paras.push(c.summary);
      }

      const strengths = [];
      if (c.skills.length) strengths.push(`Moje najmocniejsze strony to ${join(c.skills)}.`);
      if (c.langs.length && !concise) {
        strengths.push(`Znam języki: ${c.langs.map((l) => `${l.name.toLowerCase()} (${l.level})`).join(', ')}.`);
      }
      if (strengths.length) paras.push(strengths.join(' '));

      paras.push('Chętnie opowiem więcej o swoim doświadczeniu podczas rozmowy. '
        + 'Dziękuję za poświęcony czas i rozważenie mojej kandydatury.');
      return paras.join('\n\n');
    },

    uk(c) {
      const g = (f, m, n) => (c.gender === 'f' ? f : c.gender === 'm' ? m : n);
      const join = joinWith('та');
      const position = c.position || '[посада]';
      const company = c.company || '[назва компанії]';
      const concise = c.tone === 'concise';
      const target = `посаду ${position} у компанії ${company}`;
      const paras = [];
      const opening = c.tone === 'warm'
        ? g(
          dot(`З великою радістю прочитала оголошення про вакансію на ${target}`),
          dot(`З великою радістю прочитав оголошення про вакансію на ${target}`),
          dot(`З великим інтересом подаю свою кандидатуру на ${target}`),
        )
        : dot(`Прошу розглянути мою кандидатуру на ${target}`);
      paras.push(`${opening} ${g('Я переконана', 'Я переконаний', 'Вважаю')}, що мій досвід і навички `
        + 'дозволять мені швидко принести реальну користь вашій команді.');

      if (c.jobs.length) {
        const [cur, ...rest] = c.jobs;
        const at = cur.company ? ` у компанії ${cur.company}` : '';
        let p = cur.current
          ? dot(`Зараз я працюю${cur.role ? ` на посаді ${cur.role}` : ''}${at}`)
          : dot(`Моя остання посада — ${cur.role || 'робота'}${at}`);
        if (cur.bullets.length) p += ` Серед моїх обов’язків і досягнень, зокрема: ${join(cur.bullets.map(lowerFirst))}.`;
        if (rest.length && !concise) {
          const earlier = rest.slice(0, 2).map((j) => [j.role, j.company && `у ${j.company}`].filter(Boolean).join(' '));
          p += ` ${dot(`Попередній досвід: ${join(earlier)}`)}`;
        }
        paras.push(p);
      } else if (c.summary) {
        paras.push(c.summary);
      }

      const strengths = [];
      if (c.skills.length) strengths.push(`Мої найсильніші сторони — ${join(c.skills)}.`);
      if (c.langs.length && !concise) {
        strengths.push(`Володію мовами: ${c.langs.map((l) => `${l.name.toLowerCase()} (${l.level})`).join(', ')}.`);
      }
      if (strengths.length) paras.push(strengths.join(' '));

      paras.push('Із задоволенням розповім більше про свій досвід під час співбесіди. '
        + 'Дякую за ваш час і розгляд моєї кандидатури.');
      return paras.join('\n\n');
    },

    en(c) {
      const join = joinWith('and');
      const position = c.position || '[position]';
      const company = c.company || '[company name]';
      const concise = c.tone === 'concise';
      const paras = [];
      const opening = c.tone === 'warm'
        ? dot(`I was delighted to come across the ${position} opening at ${company}`)
        : dot(`I am writing to apply for the position of ${position} at ${company}`);
      paras.push(`${opening} I am confident that my experience and skills will allow me to quickly add real value to your team.`);

      if (c.jobs.length) {
        const [cur, ...rest] = c.jobs;
        const at = cur.company ? ` at ${cur.company}` : '';
        let p = cur.current
          ? dot(`I currently work${cur.role ? ` as ${cur.role}` : ''}${at}`)
          : dot(`Most recently, I worked${cur.role ? ` as ${cur.role}` : ''}${at}`);
        if (cur.bullets.length) p += ` My responsibilities and achievements include ${join(cur.bullets.map(lowerFirst))}.`;
        if (rest.length && !concise) {
          const earlier = rest.slice(0, 2).map((j) => [j.role, j.company && `at ${j.company}`].filter(Boolean).join(' '));
          p += ` ${dot(`My earlier experience includes working as ${join(earlier)}`)}`;
        }
        paras.push(p);
      } else if (c.summary) {
        paras.push(c.summary);
      }

      const strengths = [];
      if (c.skills.length) strengths.push(`My key strengths are ${join(c.skills)}.`);
      if (c.langs.length && !concise) {
        strengths.push(`I speak ${join(c.langs.map((l) => `${l.name} (${l.level})`))}.`);
      }
      if (strengths.length) paras.push(strengths.join(' '));

      paras.push('I would welcome the opportunity to discuss my experience in an interview. '
        + 'Thank you for your time and consideration.');
      return paras.join('\n\n');
    },
  };

  // Words that mark a job as current, in any supported language.
  const CURRENT_JOB = /obecn|teraz|nadal|present|now|current|зараз|досі|дотепер|теперішн/i;

  // ---------- Sample data ----------

  const SAMPLES = {
    pl: {
      cv: {
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
            role: 'Senior Frontend Developer', company: 'TechSoft sp. z o.o.', start: '03.2022', end: 'obecnie',
            description: 'Prowadzenie zespołu 4 programistów\nMigracja aplikacji do React 18 i TypeScript\nSkrócenie czasu ładowania strony o 40%',
          },
          {
            role: 'Frontend Developer', company: 'WebStudio', start: '06.2019', end: '02.2022',
            description: 'Tworzenie sklepów internetowych dla klientów z branży e-commerce\nWdrożenie biblioteki komponentów UI',
          },
        ],
        education: [{ school: 'Politechnika Warszawska', degree: 'Informatyka, inżynier', start: '2015', end: '2019' }],
        skills: [
          { name: 'JavaScript / TypeScript', level: '5' }, { name: 'React', level: '5' },
          { name: 'HTML i CSS', level: '4' }, { name: 'Node.js', level: '3' },
        ],
        languages: [{ name: 'Polski', level: 'ojczysty' }, { name: 'Angielski', level: 'C1' }, { name: 'Niemiecki', level: 'A2' }],
        interests: 'fotografia, wspinaczka, gry planszowe',
      },
      letter: {
        position: 'Senior Frontend Developer',
        company: 'Nowa Firma S.A.',
        recipient: 'Dział HR',
        address: 'ul. Prosta 20\n00-850 Warszawa',
        gender: 'f',
        body:
          'Z dużym zainteresowaniem przeczytałam ogłoszenie o pracy na stanowisku Senior Frontend Developer ' +
          'w Nowej Firmie S.A. i chciałabym zgłosić swoją kandydaturę. Od pięciu lat tworzę aplikacje webowe ' +
          'w React i TypeScript, dbając o dostępność i wydajność interfejsów.\n\n' +
          'Obecnie w TechSoft prowadzę zespół czterech programistów. Przeprowadziłam migrację dużej aplikacji ' +
          'do React 18 i TypeScript oraz skróciłam czas ładowania strony o 40%. Wcześniej w WebStudio ' +
          'współtworzyłam bibliotekę komponentów UI.\n\n' +
          'Chętnie opowiem więcej o swoim doświadczeniu podczas rozmowy. Dziękuję za poświęcony czas ' +
          'i rozważenie mojej kandydatury.',
      },
    },
    uk: {
      cv: {
        fullName: 'Олена Коваленко',
        title: 'Frontend-розробниця',
        email: 'olena.kovalenko@example.com',
        phone: '+48 600 123 456',
        location: 'Варшава',
        website: 'linkedin.com/in/olenakovalenko',
        summary:
          'Frontend-розробниця з 5-річним досвідом створення вебзастосунків. ' +
          'Спеціалізуюся на React і TypeScript, дбаю про доступність і швидкодію інтерфейсів.',
        experience: [
          {
            role: 'Senior Frontend Developer', company: 'TechSoft sp. z o.o.', start: '03.2022', end: 'досі',
            description: 'Керівництво командою з 4 розробників\nМіграція застосунку на React 18 і TypeScript\nСкорочення часу завантаження сторінки на 40%',
          },
          {
            role: 'Frontend Developer', company: 'WebStudio', start: '06.2019', end: '02.2022',
            description: 'Створення інтернет-магазинів для клієнтів з e-commerce\nВпровадження бібліотеки UI-компонентів',
          },
        ],
        education: [{ school: 'Київський політехнічний інститут', degree: 'Комп’ютерні науки, бакалавр', start: '2015', end: '2019' }],
        skills: [
          { name: 'JavaScript / TypeScript', level: '5' }, { name: 'React', level: '5' },
          { name: 'HTML і CSS', level: '4' }, { name: 'Node.js', level: '3' },
        ],
        languages: [{ name: 'Українська', level: 'ojczysty' }, { name: 'Польська', level: 'C1' }, { name: 'Англійська', level: 'B2' }],
        interests: 'фотографія, скелелазіння, настільні ігри',
      },
      letter: {
        position: 'Senior Frontend Developer',
        company: 'Nowa Firma S.A.',
        recipient: 'Відділ кадрів',
        address: 'ul. Prosta 20\n00-850 Warszawa',
        gender: 'f',
        body:
          'З великою зацікавленістю прочитала оголошення про вакансію Senior Frontend Developer у компанії ' +
          'Nowa Firma S.A. і хотіла б подати свою кандидатуру. Уже п’ять років я створюю вебзастосунки ' +
          'на React і TypeScript, дбаючи про доступність і швидкодію інтерфейсів.\n\n' +
          'Зараз у TechSoft я керую командою з чотирьох розробників. Я провела міграцію великого застосунку ' +
          'на React 18 і TypeScript та скоротила час завантаження сторінки на 40%. Раніше у WebStudio ' +
          'я брала участь у створенні бібліотеки UI-компонентів.\n\n' +
          'Із задоволенням розповім більше про свій досвід під час співбесіди. Дякую за ваш час і розгляд ' +
          'моєї кандидатури.',
      },
    },
    en: {
      cv: {
        fullName: 'Emma Wilson',
        title: 'Frontend Developer',
        email: 'emma.wilson@example.com',
        phone: '+44 7700 900123',
        location: 'Manchester',
        website: 'linkedin.com/in/emmawilson',
        summary:
          'Frontend developer with 5 years of experience building web applications. ' +
          'I specialise in React and TypeScript and care about accessible, fast interfaces.',
        experience: [
          {
            role: 'Senior Frontend Developer', company: 'TechSoft Ltd', start: '03/2022', end: 'present',
            description: 'Leading a team of 4 developers\nMigrating the application to React 18 and TypeScript\nCutting page load time by 40%',
          },
          {
            role: 'Frontend Developer', company: 'WebStudio', start: '06/2019', end: '02/2022',
            description: 'Building online shops for e-commerce clients\nIntroducing a UI component library',
          },
        ],
        education: [{ school: 'University of Manchester', degree: 'BSc Computer Science', start: '2015', end: '2019' }],
        skills: [
          { name: 'JavaScript / TypeScript', level: '5' }, { name: 'React', level: '5' },
          { name: 'HTML and CSS', level: '4' }, { name: 'Node.js', level: '3' },
        ],
        languages: [{ name: 'English', level: 'ojczysty' }, { name: 'Polish', level: 'B1' }, { name: 'German', level: 'A2' }],
        interests: 'photography, climbing, board games',
      },
      letter: {
        position: 'Senior Frontend Developer',
        company: 'Northwind Ltd',
        recipient: 'Hiring Team',
        address: '20 King Street\nManchester M2 4LQ',
        gender: 'f',
        body:
          'I am writing to apply for the Senior Frontend Developer position at Northwind Ltd. For the past ' +
          'five years I have been building web applications with React and TypeScript, with a strong focus ' +
          'on accessibility and performance.\n\n' +
          'At TechSoft I currently lead a team of four developers. I led the migration of a large application ' +
          'to React 18 and TypeScript and cut page load time by 40%. Before that, at WebStudio, I helped ' +
          'introduce a UI component library.\n\n' +
          'I would welcome the opportunity to discuss my experience in an interview. Thank you for your ' +
          'time and consideration.',
      },
    },
  };

  function detectLang() {
    const prefs = navigator.languages?.length ? navigator.languages : [navigator.language || 'pl'];
    for (const p of prefs) {
      const code = String(p).toLowerCase().slice(0, 2);
      if (LANGS.includes(code)) return code;
    }
    return 'pl';
  }

  return { LANGS, UI, DOC, DRAFT, SAMPLES, CURRENT_JOB, detectLang };
})();
