# Quiz na żywo DASIE (jak Mentimeter)

Prosty quiz A/B/C/D dla sali szkoleniowej. Prowadzący pokazuje pytania na rzutniku, uczestnicy głosują telefonem po zeskanowaniu kodu QR. Bez kont, bez logowania, bez instalowania aplikacji.

- Ekran prowadzącego: `https://mmadej7799-ship-it.github.io/sda/quiz/prowadzacy.html`
- Strona uczestnika: `https://mmadej7799-ship-it.github.io/sda/quiz/` (QR prowadzi tu sam, z kodem)

## Na sali

1. Otwórz ekran prowadzącego na komputerze podłączonym do rzutnika.
2. Wybierz zestaw (Warsztat 1 Copilot albo Warsztat 2 Claude) i czas na odpowiedź, kliknij „Otwórz pokój quizu”.
3. Uczestnicy skanują kod QR, wpisują pseudonim. Na ekranie widać, kto dołączył.
4. „Zacznij quiz”, a potem klawisz spacji: pytanie z wykresem na żywo → poprawna odpowiedź z wyjaśnieniem → ranking → następne pytanie.
5. Na końcu podium i tabela „jak poszło w pytaniach”. Przycisk „Pobierz wyniki (CSV)” zapisuje wyniki do Excela.

Odświeżenie strony nie kasuje quizu: na ekranie startowym pojawi się „Wznów ten quiz”. Telefon uczestnika po odświeżeniu też wraca do gry.

Punkty: 500 za dobrą odpowiedź plus do 500 za szybkość.

## Zmiana pytań

Pytania są w pliku `pytania.js`. Każde ma treść, cztery odpowiedzi, numer poprawnej (0 = A, 1 = B, 2 = C, 3 = D) i wyjaśnienie wyświetlane po odsłonięciu.

## Jak to działa technicznie

Strony są statyczne (GitHub Pages). Głosy i stan quizu płyną na żywo przez darmowy, publiczny serwer MQTT (EMQX, a gdy nie odpowiada: HiveMQ, potem Mosquitto). Ostatnia cyfra kodu quizu mówi telefonom, którego serwera użył prowadzący. Wysyłane są tylko pseudonimy i litery odpowiedzi; nie wpisuj tam danych osobowych.

Jeśli sieć w budynku blokuje połączenie, uczestnicy mogą przełączyć telefon na dane komórkowe, a prowadzący udostępnić internet z telefonu.

Biblioteki w `lib/`: mqtt.js 5.10.1 (MIT), qrcode-generator 1.4.4 (MIT).
