// Wspólne funkcje: połączenie na żywo przez publiczny serwer MQTT (bez kont i logowania).
(function () {
  'use strict';
  // Kolejność ma znaczenie: numer serwera jest ostatnią cyfrą kodu quizu.
  var SERWERY = [
    'wss://broker.emqx.io:8084/mqtt',
    'wss://broker.hivemq.com:8884/mqtt',
    'wss://test.mosquitto.org:8081/mqtt'
  ];
  var params = new URLSearchParams(location.search);
  var testowy = params.get('broker'); // tylko do testów lokalnych

  function serwer(i) { return testowy || SERWERY[i]; }

  function losowyId() {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  }

  // Łączy z serwerem nr i; opcja proba=true: bez ponawiania, z krótkim limitem czasu.
  function polacz(i, opcje) {
    opcje = opcje || {};
    var klient = mqtt.connect(serwer(i), {
      clientId: 'dasie_' + losowyId(),
      clean: true,
      keepalive: 30,
      connectTimeout: opcje.proba ? 7000 : 10000,
      reconnectPeriod: opcje.proba ? 0 : 2000,
      protocolVersion: 4,
      will: opcje.will
    });
    return klient;
  }

  // Prowadzący: próbuje kolejnych serwerów, aż któryś odpowie.
  function polaczZZapasowymi(start, gotowe, blad) {
    var liczba = testowy ? 1 : SERWERY.length;
    var proba = 0;
    function nastepny() {
      if (proba >= liczba) { blad(); return; }
      var i = (start + proba) % liczba;
      proba++;
      var k = polacz(i, { proba: true });
      var zakonczone = false;
      function porazka() {
        if (zakonczone) return;
        zakonczone = true;
        try { k.end(true); } catch (e) {}
        nastepny();
      }
      k.once('connect', function () {
        if (zakonczone) return;
        zakonczone = true;
        k.options.reconnectPeriod = 2000; // od teraz wznawiaj połączenie
        gotowe(k, i);
      });
      k.once('error', porazka);
      k.once('close', porazka);
      setTimeout(porazka, 8000);
    }
    nastepny();
  }

  function tematy(kod) {
    var baza = 'dasie-pck-quiz/v1/' + kod + '/';
    return {
      stan: baza + 'stan',
      glos: baza + 'glos',
      wejscie: baza + 'wejscie',
      potwierdzenie: function (pid) { return baza + 'ok/' + pid; }
    };
  }

  function czytaj(klucz) {
    try { var v = localStorage.getItem(klucz); return v ? JSON.parse(v) : null; } catch (e) { return null; }
  }
  function zapisz(klucz, wartosc) {
    try { localStorage.setItem(klucz, JSON.stringify(wartosc)); } catch (e) {}
  }
  function usun(klucz) {
    try { localStorage.removeItem(klucz); } catch (e) {}
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  window.DASIE = {
    SERWERY: SERWERY, testowy: testowy, polacz: polacz, polaczZZapasowymi: polaczZZapasowymi,
    tematy: tematy, losowyId: losowyId, czytaj: czytaj, zapisz: zapisz, usun: usun, esc: esc,
    LITERY: ['A', 'B', 'C', 'D']
  };
})();
