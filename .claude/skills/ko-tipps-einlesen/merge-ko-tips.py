#!/usr/bin/env python3
"""Mergt AUSSCHLIESSLICH eine KO-Runden-Kategorie (z. B. fromQF) in den WM26-Store.
Chirurgisch: nur die Ziel-Kategorie je Profil, alle anderen Kategorien byte-genau
unveraendert (per SHA256 vorher/nachher bewiesen). Dry-run per Default; erst mit
--apply wird geschrieben (Backup + lsof-Guard).

Warum so streng: PWA-Exporte koennen Kategorien VERLIEREN (schon passiert: ein Export
hatte ploetzlich kein fromR32 mehr). Ein Voll-Import wuerde die dann loeschen. Darum
NIE die ganze Datei importieren — nur die neue Runde einsetzen.

Beispiele:
  # 1. Dry-run: was wuerde aus den Downloads fuer fromQF gemergt?
  python3 merge-ko-tips.py --kind fromQF
  # 2. Mit Claude-Tipps (JSON {"97":{"h":1,"a":2},...}) und schreiben:
  python3 merge-ko-tips.py --kind fromQF --claude /pfad/claude-qf.json --apply
"""
import argparse, glob, json, os, hashlib, copy, sys

HOME = os.path.expanduser("~")
STORE = f"{HOME}/Library/Application Support/WM26 Tipp/wm26-store.json"

VALID_KINDS = {"fromR32", "fromR16", "fromQF", "fromSF"}


def load_json(path):
    try:
        return json.load(open(path, encoding="utf-8"))
    except Exception:
        return None


def cat_sig(entries):
    """Signatur aller Kategorien AUSSER der Ziel-Kategorie -> Beweis, dass sie unberuehrt bleiben."""
    return {pid: {c: hashlib.sha256(json.dumps(v, sort_keys=True).encode()).hexdigest()[:12]
                  for c, v in cats.items() if c != KIND}
            for pid, cats in entries.items()}


def clean_tip(t):
    """Nur h/a/adv behalten (Exporte/Agenten schleppen manchmal Fremdfelder wie 'favorit').
    adv ("wer kommt weiter?") NUR bei einem Remis-Tipp (h==a) — bei einem Sieg-Tipp ist es ein
    Artefakt (die PWA laesst adv stehen, wenn man vom Remis weg auf ein Ergebnis wechselt); die
    Wertung ignoriert es ohnehin (lateEntry.ts), aber es verwirrt die Anzeige."""
    h, a = int(t["h"]), int(t["a"])
    out = {"h": h, "a": a}
    if h == a and t.get("adv") in ("home", "away"):
        out["adv"] = t["adv"]
    return out


def find_exports(downloads):
    """profile.id -> (mtime, name, entries-der-Ziel-Kategorie). Pro ID die NEUESTE Datei,
    die die Ziel-Kategorie mit Tipps enthaelt. Aeltere/leere Exporte werden ignoriert."""
    best = {}
    patterns = ["*-WM-Tipps*.txt", "*.wm26tipp", "*.wm26tipp.json", "*-WM-Tipps*.json"]
    files = set()
    for p in patterns:
        files.update(glob.glob(os.path.join(downloads, p)))
    for f in sorted(files):
        d = load_json(f)
        if not d or "profile" not in d:
            continue
        pid = d["profile"].get("id")
        tips = (d.get("entries", {}).get(KIND) or {}).get("tips")
        if not pid or not tips:
            continue
        mt = os.path.getmtime(f)
        if pid not in best or mt > best[pid][0]:
            best[pid] = (mt, os.path.basename(f), d["profile"].get("name"), tips)
    return best


ap = argparse.ArgumentParser()
ap.add_argument("--kind", required=True, choices=sorted(VALID_KINDS), help="Ziel-Kategorie, z. B. fromQF")
ap.add_argument("--downloads", default=f"{HOME}/Downloads", help="Verzeichnis der Export-Dateien")
ap.add_argument("--claude", help="JSON mit Claude-Tipps {\"97\":{\"h\":1,\"a\":2,\"adv\":\"home\"?},...}")
ap.add_argument("--claude-id", default="claude-fable")
ap.add_argument("--apply", action="store_true", help="wirklich schreiben (sonst Dry-run)")
args = ap.parse_args()
KIND = args.kind

# --- App-Guard: der Store darf von keinem Prozess offen sein ---
if args.apply and os.system(f'lsof "{STORE}" >/dev/null 2>&1') == 0:
    sys.exit("ABBRUCH: Store ist offen (App/Dev laeuft). Erst App beenden.")

raw = open(STORE, encoding="utf-8").read()
store = json.loads(raw)
indented = raw.lstrip().startswith("{\n")
names = {p["id"]: p["name"] for p in store["profiles"]}
before = cat_sig(store["entries"])

plan = []  # (name, pid, quelle, tips-dict)

# --- Menschen aus den Exporten ---
for pid, (mt, fname, pname, tips) in find_exports(args.downloads).items():
    if pid not in store["entries"]:
        print(f"  · uebersprungen: {pname} ({pid}) nicht im Store")
        continue
    plan.append((names.get(pid, pname), pid, fname, {k: clean_tip(v) for k, v in tips.items()}))

# --- Claude aus JSON ---
if args.claude:
    cd = load_json(args.claude)
    if not cd:
        sys.exit(f"Claude-JSON nicht lesbar: {args.claude}")
    cid = args.claude_id
    if cid not in store["entries"]:
        sys.exit(f"Claude-Profil {cid} nicht im Store")
    plan.append((names.get(cid, "Claude"), cid, os.path.basename(args.claude),
                 {str(k): clean_tip(v) for k, v in cd.items()}))

if not plan:
    sys.exit(f"Nichts gefunden fuer {KIND} in {args.downloads} (und kein --claude).")

print(f"=== Merge-Plan fuer {KIND} ({'SCHREIBEN' if args.apply else 'DRY-RUN'}) ===")
for name, pid, src, tips in plan:
    games = sorted(int(k) for k in tips)
    had = KIND in store["entries"][pid]
    print(f"  {name:12} <- {src}")
    print(f"      {len(tips)} Tipps, Spiele {games[0]}-{games[-1]}  [{'ueberschreibt' if had else 'neu'}]")

if not args.apply:
    print("\nDry-run — nichts geschrieben. Mit --apply ausfuehren.")
    sys.exit(0)

# --- Schreiben ---
backup = f"{STORE[:-5]}.backup-pre-{KIND}.json"
open(backup, "w").write(raw)
for name, pid, src, tips in plan:
    store["entries"][pid][KIND] = {"tips": tips}

after = cat_sig(store["entries"])
if before != after:
    sys.exit("FEHLER: eine Nicht-Ziel-Kategorie haette sich geaendert — NICHT geschrieben.")

tmp = STORE + ".tmp"
with open(tmp, "w", encoding="utf-8") as f:
    json.dump(store, f, ensure_ascii=False, **({"indent": 2} if indented else {"separators": (",", ":")}))
os.replace(tmp, STORE)
print(f"\nGeschrieben. Backup: {backup}")
print("Alle Nicht-Ziel-Kategorien per Hash als unveraendert bewiesen.")
