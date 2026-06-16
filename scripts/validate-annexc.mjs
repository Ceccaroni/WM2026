#!/usr/bin/env node
// Validiert resources/data/annexc.json (FIFA WC26 Annexe C, 495 Kombinationen).
// Prüfungen:
//  (a) exakt 495 Kombinationen
//  (b) jeder Schlüssel = 8 verschiedene, alphabetisch sortierte Buchstaben aus A–L
//  (c) die 8 zugeordneten Gruppen jeder Kombination sind eine Bijektion auf die Schlüssel-Gruppen
//  (d) jede Zuordnung respektiert die Kandidatenmengen pro Spiel
// Zusätzlich: Schlüssel sind eindeutig und decken alle C(12,8)=495 Teilmengen ab.

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, "..", "resources", "data", "annexc.json");

const CANDIDATES = {
  74: new Set(["A", "B", "C", "D", "F"]), // vs Sieger E
  77: new Set(["C", "D", "F", "G", "H"]), // vs Sieger I
  79: new Set(["C", "E", "F", "H", "I"]), // vs Sieger A
  80: new Set(["E", "H", "I", "J", "K"]), // vs Sieger L
  81: new Set(["B", "E", "F", "I", "J"]), // vs Sieger D
  82: new Set(["A", "E", "H", "I", "J"]), // vs Sieger G
  85: new Set(["E", "F", "G", "I", "J"]), // vs Sieger B
  87: new Set(["D", "E", "I", "J", "L"]), // vs Sieger K
};
const MATCHES = Object.keys(CANDIDATES).map(String).sort((a, b) => a - b);

const errors = [];
const data = JSON.parse(await readFile(FILE, "utf8"));

if (data._meta?.status !== "ok") errors.push(`_meta.status ist "${data._meta?.status}", erwartet "ok"`);

const combos = data.combos ?? {};
const keys = Object.keys(combos);

// (a) exakt 495 Kombinationen
if (keys.length !== 495) errors.push(`Anzahl Kombinationen: ${keys.length}, erwartet 495`);

const keyRe = /^[A-L]{8}$/;
for (const key of keys) {
  // (b) Schlüsselformat: 8 verschiedene, sortierte Buchstaben A–L
  if (!keyRe.test(key)) { errors.push(`Schlüssel "${key}": ungültige Zeichen/Länge`); continue; }
  const letters = key.split("");
  if (new Set(letters).size !== 8) errors.push(`Schlüssel "${key}": Buchstaben nicht eindeutig`);
  if (letters.join("") !== [...letters].sort().join("")) errors.push(`Schlüssel "${key}": nicht alphabetisch sortiert`);

  const assign = combos[key];
  const assignKeys = Object.keys(assign).sort((a, b) => a - b);
  if (assignKeys.join(",") !== MATCHES.join(",")) {
    errors.push(`"${key}": Spiele [${assignKeys}] statt [${MATCHES}]`);
    continue;
  }

  // (c) Bijektion: zugeordnete Gruppen == Schlüssel-Gruppen (je genau einmal)
  const assigned = MATCHES.map((m) => assign[m]);
  if ([...assigned].sort().join("") !== key) {
    errors.push(`"${key}": Zuordnung [${assigned}] ist keine Bijektion auf die Schlüssel-Gruppen`);
  }

  // (d) Kandidatenmengen
  for (const m of MATCHES) {
    if (!CANDIDATES[m].has(assign[m])) {
      errors.push(`"${key}": Spiel ${m} -> Gruppe ${assign[m]} nicht in Kandidatenmenge {${[...CANDIDATES[m]]}}`);
    }
  }
}

// Vollständigkeit: alle C(12,8) Teilmengen genau einmal
const groups = "ABCDEFGHIJKL".split("");
const allSubsets = [];
(function rec(start, acc) {
  if (acc.length === 8) { allSubsets.push(acc.join("")); return; }
  for (let i = start; i < groups.length; i++) rec(i + 1, [...acc, groups[i]]);
})(0, []);
const keySet = new Set(keys);
for (const s of allSubsets) if (!keySet.has(s)) errors.push(`Fehlende Kombination: ${s}`);

if (errors.length) {
  console.error(`FEHLER (${errors.length}):`);
  for (const e of errors.slice(0, 50)) console.error("  - " + e);
  if (errors.length > 50) console.error(`  ... und ${errors.length - 50} weitere`);
  process.exit(1);
}
console.log(`OK: ${keys.length} Kombinationen validiert (Schlüssel, Bijektion, Kandidatenmengen, Vollständigkeit aller 495 Teilmengen).`);
