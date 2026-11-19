(function () {
  'use strict';
  var D = window.DASIE, esc = D.esc, L = D.LITERY;
  var KLUCZ = 'dasie-quiz-uczestnik';
  var $ = function (id) { return document.getElementById(id); };
  var widok = $('widok');

  var params = new URLSearchParams(location.search);
  var U = D.czytaj(KLUCZ) || {};
  var kod = (params.get('k') || '').replace(/\D/g, '');
  var klient = null, T = null;
  var stan = null;           // ostatni stan od prowadzącego
  var dolaczony = false;     // prowadzący potwierdził wejście
  var wysylanie = null;      // timer ponawiania
  var oczekujacyGlos = null; // { nr, odp }

  function zapisz() { D.zapisz(KLUCZ, U); }

  function ustawStatus(tekst, klasa) {
    var s = $('status');
    s.classList.remove('ukryte');
    s.textContent = tekst;
    s.className = 'status ' + (klasa || '');
  }

  // ---------- ekran 1: kod ----------
  function ekranKodu(blad) {
    $('link-prow').classList.remove('ukryte');
    widok.innerHTML = '<div class="karta"><h1>Dołącz do quizu</h1>' +
      '<p>Wpisz kod z ekranu prowadzącego.</p>' +
      '<label for="kod">Kod quizu</label>' +
      '<input id="kod" inputmode="numeric" autocomplete="off" maxlength="6" placeholder="np. 482711">' +
      (blad ? '<p class="zle" style="margin-top:10px">' + esc(blad) + '</p>' : '') +
      '<button class="przycisk" id="dalej">Dalej</button></div>';
    var pole = $('kod');
    pole.focus();
    function ok() {
      var k = pole.value.replace(/\D/g, '');
      if (k.length !== 6) return ekranKodu('Kod ma 6 cyfr. Sprawdź na ekranie.');
      kod = k;
      ekranImienia();
    }
    $('dalej').onclick = ok;
    pole.onkeydown = function (e) { if (e.key === 'Enter') ok(); };
  }

  // ---------- ekran 2: pseudonim ----------
  function ekranImienia() {
    $('link-prow').classList.add('ukryte');
    widok.innerHTML = '<div class="karta"><h1>Jak Cię podpisać w rankingu?</h1>' +
      '<p>Może być imię albo pseudonim. Nie podawaj nazwiska.</p>' +
      '<label for="imie">Pseudonim</label>' +
      '<input id="imie" maxlength="24" autocomplete="nickname" placeholder="np. Ania z Krakowa" value="' + esc(U.imie || '') + '">' +
      '<button class="przycisk" id="wejdz">Dołączam</button></div>';
    var pole = $('imie');
    pole.focus();
    function ok() {
      var imie = pole.value.trim().slice(0, 24);
      if (!imie) imie = 'Gość ' + Math.floor(10 + Math.random() * 90);
      if (U.kod !== kod) U = { kod: kod, pid: D.losowyId(), odp: {}, sesja: null };
      if (!U.pid) U.pid = D.losowyId();
      U.imie = imie;
      zapisz();
      polacz();
    }
    $('wejdz').onclick = ok;
    pole.onkeydown = function (e) { if (e.key === 'Enter') ok(); };
  }

  // ---------- połączenie ----------
  function polacz() {
    var b = parseInt(kod.slice(-1), 10) - 1;
    if (!(b >= 0 && b < D.SERWERY.length)) b = 0;
    T = D.tematy(kod);
    widok.innerHTML = '<div class="srodek"><div class="duzy-symbol">⏳</div><h1>Łączę z quizem<span class="kropki"></span></h1></div>';
    ustawStatus('Łączenie…');
    klient = D.polacz(b);
    klient.on('connect', function () {
      ustawStatus('Połączono', 'ok');
      klient.subscribe([T.stan, T.potwierdzenie(U.pid)], { qos: 1 });
      dolaczony = false;
      wyslijPowitanie();
      if (oczekujacyGlos) wyslijGlos();
    });
    klient.on('offline', function () { ustawStatus('Brak sieci, ponawiam…', 'zle'); });
    klient.on('reconnect', function () { ustawStatus('Łączenie…'); });
    klient.on('message', odbierz);
    setTimeout(function () {
      if (!stan) {
        widok.innerHTML = '<div class="karta"><h1>Nie widzę tego quizu</h1>' +
          '<p>Sprawdź kod na ekranie prowadzącego (' + esc(kod) + ') albo połączenie z internetem. Jeśli Wi-Fi nie działa, spróbuj na danych komórkowych.</p>' +
          '<button class="przycisk" onclick="location.reload()">Spróbuj ponownie</button>' +
          '<button class="przycisk drugi" id="inny-kod">Wpisz inny kod</button></div>';
        $('inny-kod').onclick = function () { location.href = location.pathname; };
      }
    }, 12000);
  }

  function wiadomosc(dodatki) {
    var m = { pid: U.pid, imie: U.imie };
    if (U.sesja) m.sesja = U.sesja;
    for (var k in dodatki) m[k] = dodatki[k];
    return JSON.stringify(m);
  }

  function wyslijPowitanie() {
    if (!klient || !klient.connected || dolaczony) return;
    klient.publish(T.wejscie, wiadomosc({}), { qos: 1 });
    clearTimeout(wysylanie);
    wysylanie = setTimeout(function () { if (!dolaczony) wyslijPowitanie(); }, 3000);
  }

  var glosTimer = null;
  function wyslijGlos() {
    if (!oczekujacyGlos) return;
    if (klient && klient.connected) klient.publish(T.glos, wiadomosc(oczekujacyGlos), { qos: 1 });
    clearTimeout(glosTimer);
    glosTimer = setTimeout(wyslijGlos, 2500);
  }

  function odbierz(temat, bufor) {
    var m;
    try { m = JSON.parse(bufor.toString()); } catch (e) { return; }
    if (!m) return;
    if (temat === T.stan) {
      if (m.sesja && m.sesja !== U.sesja) {
        // nowy quiz (albo pierwsze połączenie): czyścimy stare odpowiedzi
        U.sesja = m.sesja; U.odp = {}; U.potw = {}; zapisz();
        oczekujacyGlos = null; dolaczony = false; wyslijPowitanie();
      }
      stan = m;
      rysuj();
      return;
    }
    // potwierdzenie od prowadzącego
    if (m.typ === 'nowa-sesja') {
      if (m.sesja !== U.sesja) { U.sesja = m.sesja; U.odp = {}; U.potw = {}; zapisz(); }
      dolaczony = false; wyslijPowitanie();
    } else if (m.typ === 'wejscie') {
      dolaczony = true;
      if (stan) rysuj();
    } else if (m.typ === 'glos') {
      dolaczony = true;
      if (oczekujacyGlos && oczekujacyGlos.nr === m.nr) { oczekujacyGlos = null; clearTimeout(glosTimer); }
      U.potw = U.potw || {};
      U.potw[m.nr] = m.przyjety ? 'ok' : 'za-pozno';
      if (m.przyjety && m.odp != null) U.odp[m.nr] = m.odp;
      if (!m.przyjety) delete U.odp[m.nr];
      zapisz();
      rysuj();
    }
  }

  // ---------- ekrany quizu ----------
  function rysuj() {
    if (!stan) return;
    var s = stan, nr = s.nr, moja = U.odp ? U.odp[nr] : undefined;
    var potw = (U.potw || {})[nr];
    switch (s.faza) {
      case 'zamkniety':
        widok.innerHTML = '<div class="srodek"><div class="duzy-symbol">👋</div><h1>Quiz zakończony</h1><p>Dziękujemy za udział!</p></div>';
        break;
      case 'poczekalnia':
        widok.innerHTML = '<div class="srodek"><div class="duzy-symbol">' + (dolaczony ? '✅' : '⏳') + '</div>' +
          '<h1>' + (dolaczony ? 'Jesteś w grze, ' + esc(U.imie) + '!' : 'Dołączam<span class="kropki"></span>') + '</h1>' +
          '<p>Patrz na ekran. Za chwilę pierwsze pytanie.</p>' +
          '<p class="pkt">' + esc(s.tytul || '') + '</p></div>';
        break;
      case 'pytanie':
        if (moja !== undefined && potw !== 'za-pozno') {
          widok.innerHTML = '<div class="srodek"><div class="duzy-symbol">' + (potw === 'ok' ? '👍' : '📨') + '</div>' +
            '<h1>Twoja odpowiedź: ' + L[moja] + '</h1>' +
            '<p>' + (potw === 'ok' ? 'Zapisana. Poczekaj na wynik na ekranie.' : 'Wysyłam<span class="kropki"></span>') + '</p></div>';
        } else if (!s.otwarte || potw === 'za-pozno') {
          widok.innerHTML = '<div class="srodek"><div class="duzy-symbol">⏱️</div><h1>Głosowanie zamknięte</h1><p>Poczekaj na następne pytanie.</p></div>';
        } else {
          widok.innerHTML = '<div class="licznik-tel">Pytanie ' + (nr + 1) + ' z ' + s.liczba + '</div>' +
            '<div class="pytanie-tel">' + esc(s.tekst) + '</div>' +
            '<div class="odpowiedzi-tel">' + s.odp.map(function (o, i) {
              return '<button class="odp-tel" data-i="' + i + '" style="background:var(--opcja-' + i + ')"><span class="lit">' + L[i] + '</span><span>' + esc(o) + '</span></button>';
            }).join('') + '</div>';
          widok.querySelectorAll('.odp-tel').forEach(function (b) {
            b.onclick = function () { glosuj(nr, +b.getAttribute('data-i')); };
          });
        }
        break;
      case 'odpowiedz':
      case 'ranking':
        widok.innerHTML = ekranWyniku(s, potw === 'ok' ? moja : undefined, moja !== undefined && potw !== 'ok');
        break;
      case 'koniec':
        var w = (s.wyniki || {})[U.pid];
        widok.innerHTML = '<div class="srodek"><div class="duzy-symbol">🏁</div><h1>Koniec quizu!</h1>' +
          (w ? '<div class="wynik-tel">' + w[2] + '. miejsce</div><p class="pkt">z ' + s.wyniki._n + ' osób · ' + w[0] + ' pkt</p>' : '') +
          '<p>Dziękujemy za udział. Spójrz na podium na ekranie.</p></div>';
        break;
    }
  }

  function ekranWyniku(s, moja, nieDotarl) {
    var w = (s.wyniki || {})[U.pid];
    var dobra = s.dobra;
    var html = '<div class="karta srodek" style="margin:0">';
    if (nieDotarl) {
      html += '<div class="duzy-symbol">📵</div><h1>Głos nie dotarł na czas</h1>';
    } else if (moja === undefined) {
      html += '<div class="duzy-symbol">🤷</div><h1>Bez odpowiedzi</h1>';
    } else if (moja === dobra) {
      html += '<div class="duzy-symbol">🎉</div><h1 class="dobrze">Dobrze!</h1>' + (w && w[1] ? '<div class="wynik-tel dobrze">+' + w[1] + '</div>' : '');
    } else {
      html += '<div class="duzy-symbol">🙈</div><h1 class="zle">Tym razem nie</h1>';
    }
    html += '<p>Poprawna odpowiedź: <strong>' + L[dobra] + '. ' + esc(s.odp ? s.odp[dobra] : '') + '</strong></p>';
    if (w) html += '<p class="pkt">Razem: ' + w[0] + ' pkt · ' + w[2] + '. miejsce z ' + s.wyniki._n + '</p>';
    html += '</div>';
    if (s.wyjasnienie) html += '<p style="margin-top:16px">' + esc(s.wyjasnienie) + '</p>';
    return html;
  }

  function glosuj(nr, i) {
    if (U.odp[nr] !== undefined) return;
    U.odp[nr] = i; zapisz();
    if (navigator.vibrate) { try { navigator.vibrate(30); } catch (e) {} }
    oczekujacyGlos = { nr: nr, odp: i };
    rysuj();
    wyslijGlos();
  }

  // ---------- start ----------
  if (!kod) ekranKodu();
  else if (U.kod === kod && U.imie) polacz(); // powrót po odświeżeniu strony
  else ekranImienia();
})();
