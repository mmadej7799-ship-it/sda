# Kreator CV

Aplikacja w przeglądarce do tworzenia CV — bez instalacji i bez serwera. Działa na komputerze i na telefonie.

## Uruchomienie

Otwórz `index.html` w przeglądarce (albo uruchom `python3 -m http.server` i wejdź na http://localhost:8000).

## Funkcje

- Formularz z podglądem CV na żywo (format A4, skalowany do szerokości ekranu)
- Na telefonie: zakładki **Edycja / Podgląd** na dole ekranu, zwijane sekcje formularza, duże pola dotykowe
- Sekcje: dane osobowe, zdjęcie, podsumowanie, doświadczenie, wykształcenie, umiejętności (z poziomem), języki, zainteresowania, klauzula RODO
- 4 szablony (Nowoczesny, Klasyczny, Minimalny, Wyrazisty) i wybór koloru akcentu
- Dodawanie, usuwanie i zmiana kolejności pozycji
- Automatyczny zapis w przeglądarce (localStorage)
- **Pobierz Word (DOCX)** (menu „Plik”) — edytowalny dokument Word dla CV i listu: prawdziwe nagłówki i punktory, kolor akcentu, zdjęcie; generowany w przeglądarce bez bibliotek (`docx.js`)
- Eksport/import danych do pliku JSON — tak przeniesiesz CV między urządzeniami
- **Pobierz PDF**: w wersji lokalnej otwiera okno drukowania (wybierz „Zapisz jako PDF”; tekst w PDF da się zaznaczać). W wersji opublikowanej na claude.ai PDF jest generowany w przeglądarce (html2pdf.js) i zapisywany jako plik
- **List motywacyjny** (przełącznik „CV / List” w nagłówku):
  - dane nadawcy, kolor i szablon pobierane z CV
  - oferta pracy (stanowisko, firma, treść ogłoszenia), adresat, miejscowość i data (domyślnie dzisiejsza)
  - układ polskiego listu: data w prawym górnym rogu, adresat, „Dotyczy:”, zwrot grzecznościowy, podpis, opcjonalna klauzula RODO
  - **Wstaw szkic z CV** — gotowy tekst zbudowany z doświadczenia i umiejętności, z wyborem tonu i formy gramatycznej (żeńska / męska / neutralna)
  - **Napisz z AI** (tylko w wersji na claude.ai) — Claude pisze list na podstawie CV i ogłoszenia, bez dopisywania faktów spoza CV
- **Języki: polski, ukraiński, angielski** — osobno język interfejsu (PL / UA / EN w nagłówku) i język dokumentu (CV i list); przy pierwszym wejściu wybierany według języka telefonu. Tłumaczenia są w `i18n.js`
- Umiejętności ze słupkami poziomu albo bez (przełącznik „Pokazuj poziom”) — wtedy jako etykiety
- Tryb jasny i ciemny interfejsu

## Licznik (GoatCounter)

W `app.js` ustaw `GOATCOUNTER = 'nazwa'` (nazwa konta z `nazwa.goatcounter.com`). Liczone są wejścia na stronę oraz kliknięcia „Pobierz PDF” (zdarzenia `pdf-cv` i `pdf-list`). Bez ciasteczek; dane z formularza nigdy nie są wysyłane. Pusta nazwa = licznik wyłączony.
- Przy pierwszym uruchomieniu formularz jest wypełniony przykładem; „Zacznij od zera” go czyści

## Publikacja w internecie (GitHub Pages)

1. `python3 scripts/build-artifact.py --standalone dist/strona/index.html` — jeden plik ze wszystkim w środku (albo wgraj `index.html`, `styles.css` i `app.js`).
2. W repozytorium na GitHubie: **Add file → Upload files**, wgraj plik do gałęzi `main`.
3. **Settings → Pages → Build and deployment**: Source „Deploy from a branch”, Branch `main`, folder `/ (root)`, **Save**.
4. Po 1–2 minutach strona działa pod `https://<użytkownik>.github.io/<repozytorium>/`.

Darmowe GitHub Pages wymaga publicznego repozytorium. Na zwykłej stronie nie ma przycisku „Napisz z AI” (działa tylko na claude.ai); „Pobierz PDF” otwiera okno drukowania przeglądarki.

## Wersja jednoplikowa

`python3 scripts/build-artifact.py` łączy `index.html`, `styles.css` i wszystkie skrypty w jeden plik `dist/kreator-cv.html` (do publikacji jako Artifact na claude.ai).

## Struktura

- `index.html` — układ strony i szablony pozycji formularza
- `styles.css` — style edytora, szablonów CV, widoku mobilnego i wydruku
- `docx.js` — budowanie plików Word (DOCX)
- `i18n.js` — tłumaczenia (interfejs, teksty dokumentów, szkice listu, przykłady)
- `app.js` — logika: stan, renderowanie podglądu, zapis, import/eksport, PDF
- `scripts/build-artifact.py` — budowanie wersji jednoplikowej
