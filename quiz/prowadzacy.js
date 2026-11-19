(function () {
  'use strict';
  var D = window.DASIE, esc = D.esc, L = D.LITERY;
  var KLUCZ = 'dasie-quiz-prowadzacy';
  var $ = function (id) { return document.getElementById(id); };
  var widok = $('widok');

  var S = null;            // stan quizu (zapisywany w przeglądarce)
  var klient = null;       // połączenie MQTT
  var T = null;            // tematy
  var polaczony = false;
  var wybranyZestaw = 'w1';
  var wybranyCzas = 30;
  var potwierdzKoniec = false;

  function zestaw() { return window.ZESTAWY[S.zestaw]; }
  function pytanie() { return zestaw().pytania[S.nr]; }
  function ilePytan() { return zestaw().pytania.length; }
  function teraz() { return Date.now(); }
  function zapiszStan() { if (S) D.zapisz(KLUCZ, S); }

  // ---------------- połączenie ----------------
  function ustawStatus(tekst, klasa) {
    var s = $('status');
    s.textContent = tekst;
    s.className = 'status ' + (klasa || '');
  }

  function uruchomPolaczenie(start, gotowe) {
    ustawStatus('Łączenie…');
    D.polaczZZapasowymi(start, function (k, i) {
      klient = k;
      S.b = i;
      polaczony = true;
      ustawStatus('Połączono', 'ok');
      k.on('connect', function () {
        polaczony = true; ustawStatus('Połączono', 'ok');
        subskrybuj(); publikujStan();
      });
      k.on('offline', function () { polaczony = false; ustawStatus('Brak połączenia, ponawiam…', 'zle'); });
      k.on('reconnect', function () { ustawStatus('Ponowne łączenie…'); });
      k.on('message', odbierz);
      gotowe();
    }, function () {
      ustawStatus('Brak połączenia z serwerem', 'zle');
      widok.innerHTML = '<div class="start"><h1>Nie udało się połączyć</h1>' +
        '<p class="podtytul">Żaden z trzech darmowych serwerów nie odpowiada. Najczęstszy powód: sieć w budynku blokuje połączenia. ' +
        'Spróbuj na innej sieci, np. udostępnij internet z telefonu, i odśwież stronę.</p>' +
        '<button class="przycisk" onclick="location.reload()">Spróbuj ponownie</button></div>';
    });
  }

  function subskrybuj() {
    klient.subscribe([T.glos, T.wejscie], { qos: 1 });
  }

  function publikujStan() {
    if (!klient || !S) return;
    var p = S.faza === 'poczekalnia' ? null : pytanie();
    var odkryte = S.faza === 'odpowiedz' || S.faza === 'ranking' || S.faza === 'koniec';
    var msg = {
      sesja: S.sesja, faza: S.faza, nr: S.nr, liczba: ilePytan(), tytul: zestaw().tytul,
      otwarte: S.faza === 'pytanie' && S.otwarte
    };
    if (p && S.faza !== 'koniec') { msg.tekst = p.tekst; msg.odp = p.odp; }
    if (S.faza === 'pytanie' && S.otwarte && S.czas) msg.zostalo = Math.max(0, Math.round((S.koniecCzasu - teraz()) / 1000));
    if (odkryte && p) { msg.dobra = p.dobra; msg.wyjasnienie = p.wyjasnienie; }
    if (odkryte) msg.wyniki = tabelaWynikow();
    klient.publish(T.stan, JSON.stringify(msg), { qos: 1, retain: true });
  }

  function potwierdz(pid, dane) {
    if (!klient) return;
    klient.publish(T.potwierdzenie(pid), JSON.stringify(dane), { qos: 1 });
  }

  function odbierz(temat, bufor) {
    if (!S) return;
    var m;
    try { m = JSON.parse(bufor.toString()); } catch (e) { return; }
    if (!m || typeof m.pid !== 'string' || m.pid.length > 40) return;
    if (m.sesja && m.sesja !== S.sesja) {
      // uczestnik z poprzedniego quizu: przekaż mu aktualny stan
      potwierdz(m.pid, { typ: 'nowa-sesja', sesja: S.sesja });
      return;
    }
    var imie = String(m.imie || '').trim().slice(0, 24) || 'Uczestnik';
    var nowy = !S.uczestnicy[m.pid];
    S.uczestnicy[m.pid] = imie;
    if (temat === T.wejscie) {
      potwierdz(m.pid, { typ: 'wejscie', sesja: S.sesja });
      if (nowy) { zapiszStan(); if (S.faza === 'poczekalnia') rysujUczestnikow(); else odswiezNaglowek(); }
      return;
    }
    if (temat === T.glos) {
      var nr = m.nr, odp = m.odp;
      var glosy = S.glosy[nr] = S.glosy[nr] || {};
      var przyjety = false;
      if (S.faza === 'pytanie' && S.otwarte && nr === S.nr && odp >= 0 && odp <= 3 && (odp | 0) === odp) {
        if (!glosy[m.pid]) { glosy[m.pid] = [odp, teraz() - S.startPytania]; zapiszStan(); }
        przyjety = true;
      } else if (glosy[m.pid]) {
        przyjety = true; // głos był już wcześniej zapisany
      }
      potwierdz(m.pid, { typ: 'glos', nr: nr, przyjety: przyjety, odp: glosy[m.pid] ? glosy[m.pid][0] : null });
      if (S.faza === 'pytanie' && nr === S.nr) aktualizujWykres();
    }
  }

  // ---------------- punkty ----------------
  function policzPunkty() {
    var p = pytanie(), glosy = S.glosy[S.nr] || {}, limit = (S.czas || 30) * 1000;
    S.przyrost = {};
    Object.keys(glosy).forEach(function (pid) {
      var g = glosy[pid];
      var zysk = 0;
      if (g[0] === p.dobra) zysk = 500 + Math.round(500 * Math.max(0, 1 - g[1] / limit));
      S.przyrost[pid] = zysk;
      S.punkty[pid] = (S.punkty[pid] || 0) + zysk;
    });
    S.policzone[S.nr] = true;
  }

  function ranking() {
    return Object.keys(S.uczestnicy).map(function (pid) {
      return { pid: pid, imie: S.uczestnicy[pid], pkt: S.punkty[pid] || 0, zysk: (S.przyrost || {})[pid] || 0 };
    }).sort(function (a, b) { return b.pkt - a.pkt || a.imie.localeCompare(b.imie, 'pl'); });
  }

  function tabelaWynikow() {
    var r = ranking(), w = {}, miejsce = 0, poprz = null;
    r.forEach(function (x, i) {
      if (x.pkt !== poprz) { miejsce = i + 1; poprz = x.pkt; }
      w[x.pid] = [x.pkt, x.zysk, miejsce];
    });
    w._n = r.length;
    return w;
  }

  // ---------------- przejścia między etapami ----------------
  function nowyQuiz() {
    var cyfry = String(Math.floor(10000 + Math.random() * 90000));
    S = {
      sesja: D.losowyId(), kodBaza: cyfry, b: 0, zestaw: wybranyZestaw, czas: wybranyCzas,
      faza: 'poczekalnia', nr: 0, otwarte: false, startPytania: 0, koniecCzasu: 0,
      uczestnicy: {}, glosy: {}, punkty: {}, przyrost: {}, policzone: {}, pokazWykres: true
    };
    T = D.tematy(kod());
    uruchomPolaczenie(0, function () {
      // kod zawiera numer serwera, który odpowiedział
      T = D.tematy(kod());
      subskrybuj();
      zapiszStan();
      publikujStan();
      rysuj();
    });
  }

  function wznow() {
    T = D.tematy(kod());
    uruchomPolaczenie(S.b, function () {
      // jeśli zapasowy serwer zmienił się, kod też się zmienia (ostatnia cyfra)
      T = D.tematy(kod());
      subskrybuj();
      publikujStan();
      rysuj();
    });
  }

  function kod() { return S.kodBaza + String((S.b || 0) + 1); }

  function dalej() {
    if (!S || !polaczony && S.faza === 'poczekalnia') return;
    switch (S.faza) {
      case 'poczekalnia': pokazPytanie(0); break;
      case 'pytanie': odkryj(); break;
      case 'odpowiedz': S.faza = 'ranking'; zapiszStan(); publikujStan(); rysuj(); break;
      case 'ranking':
        if (S.nr + 1 < ilePytan()) pokazPytanie(S.nr + 1);
        else { S.faza = 'koniec'; zapiszStan(); publikujStan(); rysuj(); }
        break;
    }
  }

  function drugiPrzycisk() {
    if (S.faza === 'odpowiedz') {
      if (S.nr + 1 < ilePytan()) pokazPytanie(S.nr + 1);
      else { S.faza = 'koniec'; zapiszStan(); publikujStan(); rysuj(); }
    } else if (S.faza === 'koniec') {
      pobierzCSV();
    }
  }

  function pokazPytanie(nr) {
    S.faza = 'pytanie'; S.nr = nr; S.otwarte = true; S.przyrost = {};
    S.startPytania = teraz();
    S.koniecCzasu = S.czas ? S.startPytania + S.czas * 1000 : 0;
    S.glosy[nr] = S.glosy[nr] || {};
    zapiszStan(); publikujStan(); rysuj();
  }

  function zamknijGlosowanie() {
    if (S.faza !== 'pytanie' || !S.otwarte) return;
    S.otwarte = false;
    zapiszStan(); publikujStan(); rysuj();
  }

  function odkryj() {
    S.otwarte = false;
    if (!S.policzone[S.nr]) policzPunkty();
    S.faza = 'odpowiedz';
    zapiszStan(); publikujStan(); rysuj();
  }

  function zakoncz() {
    if (!potwierdzKoniec) {
      potwierdzKoniec = true;
      $('btn-koniec').textContent = 'Na pewno? Kliknij jeszcze raz';
      setTimeout(function () { potwierdzKoniec = false; $('btn-koniec').textContent = 'Zakończ quiz'; }, 4000);
      return;
    }
    potwierdzKoniec = false;
    if (klient && T) {
      klient.publish(T.stan, JSON.stringify({ sesja: S.sesja, faza: 'zamkniety' }), { qos: 1, retain: true });
      var k = klient;
      setTimeout(function () { try { k.end(); } catch (e) {} }, 800);
    }
    klient = null; S = null; D.usun(KLUCZ);
    $('btn-koniec').textContent = 'Zakończ quiz';
    rysujStart();
  }

  // ---------------- widoki ----------------
  function adresDolaczenia(pelny) {
    var u = location.origin + location.pathname.replace(/prowadzacy\.html$/, '');
    if (pelny) {
      u += '?k=' + kod();
      if (D.testowy) u += '&broker=' + encodeURIComponent(D.testowy);
    }
    return u;
  }

  function qrSvg(tekst) {
    var q = qrcode(0, 'M');
    q.addData(tekst);
    q.make();
    return q.createSvgTag({ cellSize: 8, margin: 2, scalable: true });
  }

  function rysuj() {
    potwierdzKoniec = false;
    $('stopka').classList.toggle('ukryte', !S);
    if (!S) return rysujStart();
    odswiezNaglowek();
    var glowny = $('btn-glowny'), drugi = $('btn-drugi');
    drugi.classList.add('ukryte');
    $('btn-wykres').classList.toggle('ukryte', S.faza !== 'pytanie');
    $('btn-wykres').textContent = 'Wykres na żywo: ' + (S.pokazWykres ? 'wł.' : 'wył.');
    glowny.classList.remove('ukryte');
    $('podpowiedz').classList.toggle('ukryte', S.faza === 'koniec');
    switch (S.faza) {
      case 'poczekalnia':
        glowny.textContent = 'Zacznij quiz ▶';
        rysujPoczekalnie(); break;
      case 'pytanie':
        glowny.textContent = 'Pokaż odpowiedź ▶';
        rysujPytanie(); break;
      case 'odpowiedz':
        glowny.textContent = 'Ranking ▶';
        drugi.textContent = S.nr + 1 < ilePytan() ? 'Pomiń ranking, następne pytanie' : 'Pomiń ranking, wyniki końcowe';
        drugi.classList.remove('ukryte');
        rysujPytanie(); break;
      case 'ranking':
        glowny.textContent = S.nr + 1 < ilePytan() ? 'Następne pytanie ▶' : 'Wyniki końcowe ▶';
        rysujRanking(); break;
      case 'koniec':
        glowny.classList.add('ukryte');
        drugi.textContent = 'Pobierz wyniki (CSV)';
        drugi.classList.remove('ukryte');
        rysujKoniec(); break;
    }
  }

  function odswiezNaglowek() {
    var info = $('dolacz-info');
    if (!S || S.faza === 'poczekalnia') { info.classList.add('ukryte'); return; }
    info.classList.remove('ukryte');
    info.innerHTML = 'Dołącz: ' + esc(adresDolaczenia(false).replace(/^https?:\/\//, '')) +
      ' · kod <span class="kod-maly">' + esc(kod()) + '</span> · uczestników: ' + Object.keys(S.uczestnicy).length;
  }

  function rysujStart() {
    $('stopka').classList.add('ukryte');
    $('dolacz-info').classList.add('ukryte');
    var zapisany = D.czytaj(KLUCZ);
    var z = window.ZESTAWY;
    var html = '<div class="start">' +
      '<h1>Quiz na żywo</h1>' +
      '<p class="podtytul">Uczestnicy głosują telefonem po zeskanowaniu kodu QR. Bez logowania i bez instalowania aplikacji.</p>';
    if (zapisany && zapisany.faza && zapisany.faza !== 'koniec') {
      html += '<div class="ramka-info" style="margin:0 0 22px">Ten komputer ma niedokończony quiz: <strong>' +
        esc(z[zapisany.zestaw] ? z[zapisany.zestaw].tytul : '') + '</strong>, kod ' + esc(zapisany.kodBaza + String((zapisany.b || 0) + 1)) +
        ', uczestników: ' + Object.keys(zapisany.uczestnicy || {}).length + '.<br><br>' +
        '<button class="przycisk granat" id="btn-wznow">Wznów ten quiz</button></div>';
    }
    html += '<div class="wybor">' + Object.keys(z).map(function (k) {
      return '<button data-z="' + k + '" class="' + (k === wybranyZestaw ? 'zaznaczony' : '') + '"><strong>' + esc(z[k].tytul) +
        '</strong><span>' + z[k].pytania.length + ' pytań, odpowiedzi A, B, C, D</span></button>';
    }).join('') + '</div>' +
      '<div class="opcje-start"><label>Czas na odpowiedź <select id="czas">' +
      [[20, '20 sekund'], [30, '30 sekund'], [45, '45 sekund'], [60, '60 sekund'], [0, 'bez limitu']].map(function (c) {
        return '<option value="' + c[0] + '"' + (c[0] === wybranyCzas ? ' selected' : '') + '>' + c[1] + '</option>';
      }).join('') + '</select></label></div>' +
      '<button class="przycisk" id="btn-start">Otwórz pokój quizu ▶</button>' +
      '<div class="ramka-info"><strong>Jak to działa:</strong> po kliknięciu pojawi się kod QR. Uczestnicy skanują go aparatem telefonu, wpisują pseudonim i czekają. ' +
      'Ty klikasz „Zacznij quiz”, a potem „Dalej” (albo spację). Za dobrą odpowiedź jest 500 punktów plus do 500 za szybkość.</div>' +
      '</div>';
    widok.innerHTML = html;
    widok.querySelectorAll('.wybor button').forEach(function (b) {
      b.onclick = function () {
        wybranyZestaw = b.getAttribute('data-z');
        widok.querySelectorAll('.wybor button').forEach(function (x) { x.classList.toggle('zaznaczony', x === b); });
      };
    });
    $('czas').onchange = function () { wybranyCzas = parseInt(this.value, 10); };
    $('btn-start').onclick = function () { this.disabled = true; this.textContent = 'Łączenie…'; nowyQuiz(); };
    if ($('btn-wznow')) $('btn-wznow').onclick = function () { this.disabled = true; S = zapisany; wznow(); };
    ustawStatus(klient ? 'Połączono' : 'Gotowy', klient ? 'ok' : '');
  }

  function rysujPoczekalnie() {
    var url = adresDolaczenia(true);
    widok.innerHTML = '<div class="poczekalnia">' +
      '<div class="qr">' + qrSvg(url) + '</div>' +
      '<div><h2>Zeskanuj kod aparatem telefonu</h2>' +
      '<div class="adres">albo wejdź na <strong>' + esc(adresDolaczenia(false).replace(/^https?:\/\//, '')) + '</strong> i wpisz kod:</div>' +
      '<div class="kod-duzy">' + esc(kod()) + '</div>' +
      '<div class="ludzie"><div class="ile" id="ile-osob"></div><div class="chipy" id="chipy"></div></div>' +
      '<p class="wskazowka" style="margin-top:18px">' + esc(zestaw().tytul) + ' · ' + ilePytan() + ' pytań · ' +
      (S.czas ? S.czas + ' s na odpowiedź' : 'bez limitu czasu') + '</p></div></div>';
    rysujUczestnikow();
  }

  function rysujUczestnikow() {
    var ile = $('ile-osob'), chipy = $('chipy');
    if (!ile) return;
    var imiona = Object.keys(S.uczestnicy).map(function (p) { return S.uczestnicy[p]; });
    ile.textContent = imiona.length ? 'Dołączyło: ' + imiona.length : 'Czekamy na pierwsze osoby…';
    // dopisujemy tylko nowe osoby, żeby wcześniejsze nie migały
    for (var i = chipy.children.length; i < imiona.length; i++) {
      var c = document.createElement('span');
      c.className = 'chip'; c.textContent = imiona[i];
      chipy.appendChild(c);
    }
  }

  function rysujPytanie() {
    var p = pytanie();
    var odkryte = S.faza === 'odpowiedz';
    widok.innerHTML =
      '<div class="naglowek-pyt"><div><div class="nr-pyt">Pytanie ' + (S.nr + 1) + ' z ' + ilePytan() + '</div>' +
      '<h1 class="tresc-pyt">' + esc(p.tekst) + '</h1></div>' +
      (S.czas && !odkryte ? '<div class="zegar" id="zegar"><span id="zegar-t"></span></div>' : '') + '</div>' +
      '<p class="glosy-info" id="glosy-info"></p>' +
      '<div class="wykres' + (!S.pokazWykres && !odkryte ? ' ukryj-wyniki' : '') + '" id="wykres">' +
      p.odp.map(function (o, i) {
        var kl = odkryte ? (i === p.dobra ? ' dobry' : ' zly') : '';
        return '<div class="slupek' + kl + '" data-i="' + i + '"><div class="wartosc">0</div>' +
          '<div class="pasek" style="background:var(--opcja-' + i + ');height:8px"></div>' +
          '<div class="podpis" style="background:var(--opcja-' + i + ')"><span class="lit">' + L[i] + '</span><span>' + esc(o) + '</span></div></div>';
      }).join('') + '</div>' +
      (odkryte ? '<div class="wyjasnienie"><strong>Poprawna odpowiedź: ' + L[p.dobra] + '.</strong> ' + esc(p.wyjasnienie) + '</div>' : '');
    aktualizujWykres();
    tik();
  }

  function aktualizujWykres() {
    var w = $('wykres');
    if (!w || !S || (S.faza !== 'pytanie' && S.faza !== 'odpowiedz')) return;
    var glosy = S.glosy[S.nr] || {};
    var liczby = [0, 0, 0, 0];
    Object.keys(glosy).forEach(function (pid) { liczby[glosy[pid][0]]++; });
    var suma = liczby[0] + liczby[1] + liczby[2] + liczby[3];
    var max = Math.max(1, Math.max.apply(null, liczby));
    var wys = Math.max(120, w.clientHeight - 150);
    w.querySelectorAll('.slupek').forEach(function (el) {
      var i = +el.getAttribute('data-i');
      var proc = suma ? Math.round(100 * liczby[i] / suma) : 0;
      el.querySelector('.wartosc').textContent = liczby[i] + (suma ? ' · ' + proc + '%' : '');
      el.querySelector('.pasek').style.height = Math.max(8, Math.round(wys * liczby[i] / max)) + 'px';
    });
    var ile = Object.keys(S.uczestnicy).length;
    var info = $('glosy-info');
    if (info) {
      var txt = 'Głosy: <strong>' + suma + '</strong>' + (ile ? ' z ' + ile : '');
      if (S.faza === 'pytanie' && !S.otwarte) txt += ' · głosowanie zamknięte';
      info.innerHTML = txt;
    }
  }

  function tik() {
    if (!S || S.faza !== 'pytanie') return;
    var z = $('zegar');
    if (S.otwarte && S.czas) {
      var zost = Math.max(0, S.koniecCzasu - teraz());
      if (z) { z.style.setProperty('--p', (zost / (S.czas * 1000)).toFixed(3)); $('zegar-t').textContent = Math.ceil(zost / 1000); }
      if (zost <= 0) zamknijGlosowanie();
    } else if (z && S.czas) {
      z.classList.add('koniec'); z.style.setProperty('--p', 0); $('zegar-t').textContent = 'Koniec';
    }
  }
  setInterval(tik, 200);

  function rysujRanking() {
    var r = ranking().slice(0, 8);
    var tw = tabelaWynikow();
    widok.innerHTML = '<div class="ranking"><h2>Ranking po pytaniu ' + (S.nr + 1) + '</h2>' +
      (r.length ? r.map(function (x, i) {
        return '<div class="rzad" style="animation-delay:' + (i * 0.07) + 's"><span class="miejsce">' + tw[x.pid][2] + '.</span>' +
          '<span class="imie">' + esc(x.imie) + '</span><span class="punkty">' + x.pkt +
          (x.zysk ? '<span class="przyrost">+' + x.zysk + '</span>' : '') + '</span></div>';
      }).join('') : '<p class="pusto">Nikt jeszcze nie dołączył.</p>') + '</div>';
  }

  function statystyki() {
    return zestaw().pytania.map(function (p, i) {
      var g = S.glosy[i] || {}, pids = Object.keys(g);
      var dobre = pids.filter(function (pid) { return g[pid][0] === p.dobra; }).length;
      return { p: p, ile: pids.length, dobre: dobre };
    });
  }

  function rysujKoniec() {
    var r = ranking();
    var podium = [r[1], r[0], r[2]];
    var klasy = ['m2', 'm1', 'm3'], miejsca = [2, 1, 3];
    widok.innerHTML = '<div class="ranking"><h2>Brawo! Oto zwycięzcy</h2></div>' +
      '<div class="podium">' + podium.map(function (x, i) {
        if (!x) return '<div></div>';
        return '<div class="stopien ' + klasy[i] + '"><div class="imie">' + esc(x.imie) + '</div>' +
          '<div class="blok">' + miejsca[i] + '</div><div class="pk">' + x.pkt + ' pkt</div></div>';
      }).join('') + '</div>' +
      '<div class="podsumowanie"><h3>Jak poszło w poszczególnych pytaniach</h3><table>' +
      statystyki().map(function (s, i) {
        return '<tr><td>' + (i + 1) + '. ' + esc(s.p.tekst) + '</td><td class="proc">' +
          (s.ile ? Math.round(100 * s.dobre / s.ile) + '% dobrych (' + s.dobre + '/' + s.ile + ')' : 'brak głosów') + '</td></tr>';
      }).join('') + '</table></div>';
  }

  function pobierzCSV() {
    var wiersze = [['Miejsce', 'Pseudonim', 'Punkty']];
    var tw = tabelaWynikow();
    ranking().forEach(function (x) { wiersze.push([tw[x.pid][2], x.imie, x.pkt]); });
    wiersze.push([]);
    wiersze.push(['Pytanie', 'Treść', 'Głosy', 'Dobre odpowiedzi', 'A', 'B', 'C', 'D']);
    zestaw().pytania.forEach(function (p, i) {
      var g = S.glosy[i] || {}, l = [0, 0, 0, 0];
      Object.keys(g).forEach(function (pid) { l[g[pid][0]]++; });
      wiersze.push([i + 1, p.tekst, l[0] + l[1] + l[2] + l[3], l[p.dobra]].concat(l));
    });
    var csv = '﻿' + wiersze.map(function (w) {
      return w.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(';');
    }).join('\r\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'quiz-dasie-wyniki.csv';
    document.body.appendChild(a); a.click(); a.remove();
  }

  // ---------------- przyciski i klawisze ----------------
  $('btn-glowny').onclick = dalej;
  $('btn-drugi').onclick = drugiPrzycisk;
  $('btn-koniec').onclick = zakoncz;
  $('btn-wykres').onclick = function () { S.pokazWykres = !S.pokazWykres; zapiszStan(); rysuj(); };
  function pelnyEkran() {
    if (!document.fullscreenElement) { if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen(); }
    else if (document.exitFullscreen) document.exitFullscreen();
  }
  $('btn-pelny').onclick = pelnyEkran;
  document.addEventListener('keydown', function (e) {
    if (!S || e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') return;
    if (e.key === ' ' || e.key === 'ArrowRight' || e.key === 'Enter' || e.key === 'PageDown') {
      e.preventDefault();
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      dalej();
    } else if (e.key === 'f' || e.key === 'F') pelnyEkran();
  });
  window.addEventListener('resize', aktualizujWykres);

  rysujStart();
})();
