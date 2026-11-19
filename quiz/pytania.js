// Pytania do quizu DASIE. Każde pytanie: tekst, 4 odpowiedzi (A, B, C, D),
// numer poprawnej (0 = A, 1 = B, 2 = C, 3 = D) i krótkie wyjaśnienie na ekran.
// Aby zmienić pytanie, popraw tekst między cudzysłowami i zapisz plik.
window.ZESTAWY = {
  w1: {
    tytul: 'Warsztat 1 · Microsoft Copilot Chat',
    pytania: [
      {
        tekst: 'Ile osób z naszej ankiety (14 odpowiedzi) używa już Copilota w pracy?',
        odp: ['0 osób', '3 osoby', '9 osób', 'Wszystkie 14'],
        dobra: 1,
        wyjasnienie: '3 z 14, choć konto służbowe z Copilot Chat ma każdy. Prywatnego ChatGPT używa 9 osób, a nad prywatnym kontem PCK nie ma kontroli.'
      },
      {
        tekst: 'Czy AI może się mylić i brzmieć przy tym bardzo pewnie?',
        odp: ['Tak, to tzw. halucynacje', 'Nie, AI zawsze sprawdza fakty', 'Tylko darmowe wersje', 'Tylko gdy pytamy po polsku'],
        dobra: 0,
        wyjasnienie: 'Tak. Model składa wiarygodnie brzmiący tekst i nie sprawdza faktów. W ankiecie 7 osób wskazało nieprawdziwe informacje jako największy problem.'
      },
      {
        tekst: 'Co poradziła funkcja Google AI Overviews (maj 2024) na ser, który zsuwa się z pizzy?',
        odp: ['Więcej oregano', 'Piec pizzę dwa razy dłużej', 'Dodać do sosu nietoksyczny klej', 'Zamówić pizzę w innym miejscu'],
        dobra: 2,
        wyjasnienie: 'Klej. Źródłem był żartobliwy wpis z Reddita sprzed ponad dekady. AI nie odróżnia żartu od faktu, więc sprawdzaj, skąd pochodzi informacja.'
      },
      {
        tekst: 'Gdzie sprawdzisz, że pracujesz na koncie służbowym?',
        odp: ['Na pasku adresu przeglądarki', 'W ustawieniach Windows', 'W stopce każdej odpowiedzi', 'Napis „Praca” przy profilu i zielona tarcza'],
        dobra: 3,
        wyjasnienie: 'Napis „Praca” i „M365 Copilot” przy profilu oraz zielona tarcza u góry czatu. Sprawdzaj przed każdym wklejeniem treści służbowej.'
      },
      {
        tekst: 'Co wolno wkleić do Copilota bez anonimizacji?',
        odp: ['PESEL beneficjenta', 'Treść publicznego regulaminu konkursu', 'Diagnozę klienta', 'Adres i telefon podopiecznej'],
        dobra: 1,
        wyjasnienie: 'Publiczny regulamin nie zawiera danych osobowych. PESEL, diagnoza i adres to czerwona lista: najpierw zamieniamy je na [OSOBA A].'
      },
      {
        tekst: 'Zaczynasz zupełnie nowy temat. Co klikasz?',
        odp: ['Nowy czat', 'Biblioteka', 'Notesy', 'Agenci'],
        dobra: 0,
        wyjasnienie: 'Nowy czat. Stary kontekst potrafi „przeciekać” do odpowiedzi na nowy temat.'
      },
      {
        tekst: 'Gdzie znajdziesz asystenta, który odpowiada na pytania o regulamin?',
        odp: ['Wyszukaj', 'Ustawienia', 'Agenci', 'Biblioteka'],
        dobra: 2,
        wyjasnienie: 'W sekcji Agenci. Ulubionego agenta możesz przypiąć, a pojawi się w „Przypięte”.'
      },
      {
        tekst: 'Czy Copilot Chat na naszym koncie sam przeszukuje Twoją pocztę, gdy zadajesz pytanie?',
        odp: ['Tak, zawsze', 'Tylko w Outlooku', 'Tylko gdy grzecznie poprosisz', 'Nie, pracuje na tym, co mu dasz, i na sieci'],
        dobra: 3,
        wyjasnienie: 'Nie. Bez płatnej licencji Microsoft 365 Copilot odpowiada z wiedzy modelu, z sieci i z tego, co wkleisz lub wgrasz.'
      },
      {
        tekst: 'Kto odpowiada za mail napisany z pomocą Copilota?',
        odp: ['Microsoft', 'Ja i moja organizacja', 'Copilot', 'Nikt, skoro napisało go AI'],
        dobra: 1,
        wyjasnienie: 'Ja i PCK. Air Canada próbowała zrzucić winę na swojego czatbota i przegrała przed trybunałem.'
      },
      {
        tekst: 'Copilot podał źródło swojej odpowiedzi. Co robisz?',
        odp: ['Ufam, skoro jest źródło', 'Usuwam przypis z tekstu', 'Otwieram źródło i sprawdzam fragment', 'Pytam Copilota, czy jest pewien'],
        dobra: 2,
        wyjasnienie: 'Otwieram i sprawdzam. Prawnicy w sprawie Avianca też mieli „źródła”, tyle że wymyślone przez czatbota.'
      }
    ]
  },
  w2: {
    tytul: 'Warsztat 2 · Claude i Claude Code',
    pytania: [
      {
        tekst: 'Kto stworzył Claude?',
        odp: ['OpenAI, twórcy ChatGPT', 'Anthropic', 'Microsoft, twórcy Copilota', 'Google'],
        dobra: 1,
        wyjasnienie: 'Anthropic, amerykańska firma założona w 2021 r. Copilot to Microsoft, ChatGPT to OpenAI.'
      },
      {
        tekst: 'Ile osób z naszej ankiety (14 odpowiedzi) używało już Claude?',
        odp: ['0', '9', '2', '14'],
        dobra: 2,
        wyjasnienie: '2 z 14. Dla porównania: ChatGPT 9 osób, Gemini 5, Copilot 3. Dziś wszyscy pracujemy na firmowym planie Claude Team.'
      },
      {
        tekst: 'Chcesz rozmowę, która nie trafi do historii ani pamięci. Co klikasz?',
        odp: ['Ikonę ducha (czat incognito)', 'Nowy czat', 'Projekty', 'Artefakty'],
        dobra: 0,
        wyjasnienie: 'Ikona ducha. Uwaga: na planie Team incognito nadal jest widoczne w eksporcie danych organizacji. To nie jest sposób na dane beneficjentów.'
      },
      {
        tekst: 'Czy na planie Team PCK nasze rozmowy domyślnie trenują modele Claude?',
        odp: ['Tak', 'Tylko w czacie incognito', 'Tylko w projektach', 'Nie'],
        dobra: 3,
        wyjasnienie: 'Nie. Plan Team: „No model training on your content by default”. Na prywatnych kontach każdy ustawia to sam.'
      },
      {
        tekst: 'Skoro rozmowy nie trenują modeli, czy mogę wpisać PESEL beneficjenta?',
        odp: ['Tak, plan Team to zabezpiecza', 'Tak, jeśli użyję incognito', 'Nie, obowiązują zasady PCK i RODO', 'Tak, jeśli potem usunę rozmowę'],
        dobra: 2,
        wyjasnienie: 'Nie. Brak treningu nie zmienia zasad ochrony danych. Dane beneficjentów anonimizujemy, a wątpliwości kierujemy do IOD.'
      },
      {
        tekst: 'Gdzie ustawisz stałą prośbę, np. „pisz po polsku, w tonie urzędowym”?',
        odp: ['W każdym czacie od nowa', 'Ustawienia › Instrukcje dla Claude', 'W selektorze modeli', 'W czacie incognito'],
        dobra: 1,
        wyjasnienie: 'Ustawienia › Instrukcje dla Claude. Instrukcje projektu działają tylko w danym projekcie.'
      },
      {
        tekst: 'Dwie osoby wpisały to samo polecenie i dostały różne odpowiedzi. Dlaczego?',
        odp: ['Claude się zepsuł', 'Jedna z osób ma gorsze konto', 'Odpowiedź zależy od pory dnia', 'Model wybiera słowa z pewną dozą losowości'],
        dobra: 3,
        wyjasnienie: 'Losowość jest wbudowana. To zaleta przy pisaniu, ale ostrzeżenie przy faktach: zadaj pytanie 2–3 razy i porównaj.'
      },
      {
        tekst: 'Wklejasz długi raport. Gdzie najlepiej postawić pytanie?',
        odp: ['Na końcu, po materiale', 'Na początku, przed raportem', 'W środku raportu', 'To nie ma znaczenia'],
        dobra: 0,
        wyjasnienie: 'Na końcu. W testach Anthropic pytanie po długim materiale dawało nawet do 30% lepsze odpowiedzi.'
      },
      {
        tekst: 'Agent prosi o zgodę na usunięcie 40 plików z folderu. Co robisz?',
        odp: ['Zgadzam się, wie, co robi', 'Przełączam na Skip, żeby nie pytał', 'Zamykam laptopa i uciekam', 'Sprawdzam, które pliki i dlaczego'],
        dobra: 3,
        wyjasnienie: 'Sprawdzam. Claude prosi o wyraźną zgodę przed trwałym usunięciem plików właśnie po to, żeby człowiek to sprawdził.'
      },
      {
        tekst: 'Claude podał przypis do artykułu. Co robisz, zanim go użyjesz?',
        odp: ['Kopiuję, Claude zna źródła', 'Otwieram źródło i sprawdzam tytuł i autorów', 'Proszę Claude, by potwierdził', 'Usuwam przypis, będzie krócej'],
        dobra: 1,
        wyjasnienie: 'Otwieram i sprawdzam. Prośba do Claude o potwierdzenie nie wystarczy, bo model może potwierdzić własny błąd.'
      }
    ]
  }
};
