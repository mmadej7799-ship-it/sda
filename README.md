# Kreator CV

Aplikacja w przeglądarce do tworzenia CV — bez instalacji i bez serwera. Działa na komputerze i na telefonie.

## Uruchomienie

Otwórz `index.html` w przeglądarce (albo uruchom `python3 -m http.server` i wejdź na http://localhost:8000).

## Funkcje

- Formularz z podglądem CV na żywo (format A4, skalowany do szerokości ekranu)
- Na telefonie: zakładki **Edycja / Podgląd** na dole ekranu, zwijane sekcje formularza, duże pola dotykowe
- Sekcje: dane osobowe, zdjęcie, podsumowanie, doświadczenie, wykształcenie, umiejętności (z poziomem), języki, zainteresowania, klauzula RODO
- 3 szablony (Nowoczesny, Klasyczny, Minimalny) i wybór koloru akcentu
- Dodawanie, usuwanie i zmiana kolejności pozycji
- Automatyczny zapis w przeglądarce (localStorage)
- Eksport/import danych do pliku JSON — tak przeniesiesz CV między urządzeniami
- **Pobierz PDF**: w wersji lokalnej otwiera okno drukowania (wybierz „Zapisz jako PDF”; tekst w PDF da się zaznaczać). W wersji opublikowanej na claude.ai PDF jest generowany w przeglądarce (html2pdf.js) i zapisywany jako plik
- **List motywacyjny** (przełącznik „CV / List” w nagłówku):
  - dane nadawcy, kolor i szablon pobierane z CV
  - oferta pracy (stanowisko, firma, treść ogłoszenia), adresat, miejscowość i data (domyślnie dzisiejsza)
  - układ polskiego listu: data w prawym górnym rogu, adresat, „Dotyczy:”, zwrot grzecznościowy, podpis, opcjonalna klauzula RODO
  - **Wstaw szkic z CV** — gotowy tekst zbudowany z doświadczenia i umiejętności, z wyborem tonu i formy gramatycznej (żeńska / męska / neutralna)
  - **Napisz z AI** (tylko w wersji na claude.ai) — Claude pisze list na podstawie CV i ogłoszenia, bez dopisywania faktów spoza CV
- Tryb jasny i ciemny interfejsu
- Przy pierwszym uruchomieniu formularz jest wypełniony przykładem; „Zacznij od zera” go czyści

## Wersja jednoplikowa

`python3 scripts/build-artifact.py` łączy `index.html`, `styles.css` i `app.js` w jeden plik `dist/kreator-cv.html` (do publikacji jako Artifact na claude.ai).

## Struktura

- `index.html` — układ strony i szablony pozycji formularza
- `styles.css` — style edytora, szablonów CV, widoku mobilnego i wydruku
- `app.js` — logika: stan, renderowanie podglądu, zapis, import/eksport, PDF
- `scripts/build-artifact.py` — budowanie wersji jednoplikowej
