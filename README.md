# Kreator CV

Prosta aplikacja w przeglądarce do tworzenia CV — bez instalacji, bez serwera.

## Uruchomienie

Otwórz `index.html` w przeglądarce (albo uruchom np. `python3 -m http.server` i wejdź na http://localhost:8000).

## Funkcje

- Formularz z podglądem CV na żywo (format A4)
- Sekcje: dane osobowe, zdjęcie, podsumowanie, doświadczenie, wykształcenie, umiejętności (z poziomem), języki, zainteresowania, klauzula RODO
- 3 szablony: Nowoczesny, Klasyczny, Minimalistyczny + wybór koloru akcentu
- Dodawanie, usuwanie i zmiana kolejności pozycji
- Automatyczny zapis w przeglądarce (localStorage)
- Eksport/import danych do pliku JSON
- „Pobierz PDF” — drukowanie do PDF (w oknie drukowania wybierz „Zapisz jako PDF”; włącz „Grafika tła”, jeśli kolory nie są widoczne)
- Przycisk „Przykład” wypełnia formularz przykładowymi danymi

## Struktura

- `index.html` — układ strony i szablony formularza
- `styles.css` — style edytora, szablonów CV i wydruku
- `app.js` — logika: stan, renderowanie podglądu, zapis, import/eksport
