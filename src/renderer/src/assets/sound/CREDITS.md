# Soundeffekte — Herkunft & Lizenz

| Datei | Quelle | Lizenz |
|---|---|---|
| `intro.mp3` | Eigens für die App mit **ElevenLabs** erzeugt (Adrian, 14.06.2026) — Geige → Torjubel, ~20,9 s, mit eigenem Ausklang | Eigenes Werk |
| `cheer.mp3` | Eigens für die App mit **ElevenLabs** erzeugt (Adrian, 15.06.2026) — Stadion-Torjubel/Roar, ~10 s (Peak ~1–2 s) | Eigenes Werk |

Hinweise:
- `intro.mp3` wird 1:1 verwendet (Adrians Mix); Fade-in + sanftes Stoppen macht `lib/sound.ts` per
  volume-Rampe (kein Transcode, kein doppelter Fade-out — der Ausklang steckt schon im File).
- `cheer.mp3` ist der Volltreffer-Jubel; `lib/sound.ts → playCheer()` spielt ihn auf 55 % und blendet
  nach 3 s sanft aus (der laute Roar sitzt in den ersten ~3 s, der lange Ausklang wird abgeschnitten).
- Tauschen = Datei in diesem Ordner ersetzen, sonst nichts. Nur frei lizenzierte/eigene Quellen (die App wird verteilt).
