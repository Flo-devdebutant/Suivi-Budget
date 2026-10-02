// Mise à jour automatique des taux affichés dans l'onglet Investissement.
//
// Lit les pages officielles de service-public.gouv.fr (Livret A, LDDS, LEP et
// plafonds de revenus du LEP) et la série Insee de l'inflation, vérifie que
// chaque valeur est plausible, puis réécrit taux.json si quelque chose a
// changé. Une valeur introuvable ou incohérente arrête tout, sans rien écrire :
// l'application garde alors les derniers taux connus et le robot signale
// l'échec par courriel au propriétaire du dépôt.
//
// Usage : node scripts/maj-taux.mjs [--dry-run]
// Node 18 ou plus (fetch intégré), aucune dépendance.

import { readFile, writeFile } from "node:fs/promises";

const FICHIER = new URL("../taux.json", import.meta.url);
const SOURCES = {
  livretA: "https://www.service-public.gouv.fr/particuliers/vosdroits/F2365",
  ldds: "https://www.service-public.gouv.fr/particuliers/vosdroits/F2368",
  lep: "https://www.service-public.gouv.fr/particuliers/vosdroits/F2367",
  // IPC base 2025, glissement annuel, ensemble des ménages, France entière.
  inflation: "https://bdm.insee.fr/series/sdmx/data/SERIES_BDM/011814632?lastNObservations=1"
};
const MOIS = { janvier: 1, février: 2, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6, juillet: 7, août: 8, aout: 8, septembre: 9, octobre: 10, novembre: 11, décembre: 12, decembre: 12 };

async function lire(url){
  const rep = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (Suivi-Budget, mise a jour des taux)" } });
  if(!rep.ok) throw new Error(`${url} : HTTP ${rep.status}`);
  return rep.text();
}
// Texte brut d'une page : sans scripts, sans balises, espaces normalisés.
function texte(html){
  return html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ").replace(/&#39;|&rsquo;/g, "'").replace(/&amp;/g, "&").replace(/&eacute;/g, "é")
    .replace(/[  ]/g, " ").replace(/\s+/g, " ");
}
const nombre = s => Number(String(s).replace(/\s/g, "").replace(",", "."));
function borne(nom, v, min, max){
  if(!Number.isFinite(v) || v < min || v > max) throw new Error(`${nom} invraisemblable : ${v}`);
  return v;
}
function trouver(nom, t, re){
  const m = t.match(re);
  if(!m) throw new Error(`${nom} introuvable : la page a peut-être changé de forme`);
  return m;
}
// « Vérifié le 01 août 2026 » → "2026-08-01"
function dateVerif(nom, t){
  const m = trouver(nom + " (date de vérification)", t, /Vérifié le (\d{1,2})(?:er)? ([a-zéû]+) (\d{4})/i);
  const mois = MOIS[m[2].toLowerCase()];
  if(!mois) throw new Error(`${nom} : mois inconnu « ${m[2]} »`);
  return `${m[3]}-${String(mois).padStart(2, "0")}-${String(Number(m[1])).padStart(2, "0")}`;
}

async function main(){
  const dryRun = process.argv.includes("--dry-run");
  const ancien = JSON.parse(await readFile(FICHIER, "utf8"));

  const tA = texte(await lire(SOURCES.livretA));
  const tauxA = borne("Taux du Livret A", nombre(trouver("Taux du Livret A", tA, /taux d'intérêt annuel du livret A est de ([\d,]+) ?%/i)[1]), 0.1, 10);

  const tD = texte(await lire(SOURCES.ldds));
  const tauxD = borne("Taux du LDDS", nombre(trouver("Taux du LDDS", tD, /taux d'intérêt annuel est de ([\d,]+) ?%/i)[1]), 0.1, 10);

  const tL = texte(await lire(SOURCES.lep));
  const tauxL = borne("Taux du LEP", nombre(trouver("Taux du LEP", tL, /taux d'intérêt du LEP est de ([\d,]+) ?%/i)[1]), 0.1, 10);
  // Barème de métropole : « Nombre de parts … Plafond de RFR 1 23 028 € 1,25 26 103 € … Pour chaque demi-part supplémentaire 6 149 € »
  const bloc = trouver("Barème du LEP", tL, /LEP éligibilité (\d{4}) - Revenu fiscal de référence à ne pas dépasser selon la situation familiale - Métropole (.*?)Pour chaque demi-part supplémentaire ([\d ]+) €/i);
  const annee = borne("Année du barème du LEP", Number(bloc[1]), 2024, 2100);
  const parts = [...bloc[2].matchAll(/(\d+(?:[,.]\d+)?) (\d{1,3}(?: \d{3})+) €/g)].map(m => [nombre(m[1]), nombre(m[2])]);
  if(parts.length < 5 || parts[0][0] !== 1) throw new Error("Barème du LEP incomplet");
  borne("Plafond du LEP pour une part", parts[0][1], 15000, 40000);
  for(let i = 1; i < parts.length; i++) if(!(parts[i][0] > parts[i - 1][0] && parts[i][1] > parts[i - 1][1])) throw new Error("Barème du LEP non croissant");
  const demiPart = borne("Supplément par demi-part", nombre(bloc[3]), 2000, 15000);

  const xml = await lire(SOURCES.inflation);
  const obs = trouver("Inflation", xml, /<Obs TIME_PERIOD="(\d{4}-\d{2})" OBS_VALUE="(-?[\d.]+)"/);
  const inflation = { taux: borne("Inflation", Number(obs[2]), -5, 25), mois: obs[1] };

  const nouveau = {
    ...ancien,
    livretA: { ...ancien.livretA, taux: tauxA, verifie: dateVerif("Livret A", tA) },
    ldds: { ...ancien.ldds, taux: tauxD },
    lep: { ...ancien.lep, taux: tauxL, verifie: dateVerif("LEP", tL), rfr: { annee, parts, demiPart } },
    inflation
  };
  // On ne réécrit le fichier (donc on ne publie) que si une valeur a changé.
  const avant = JSON.stringify(ancien), apres = JSON.stringify(nouveau);
  console.log(JSON.stringify({ livretA: tauxA, ldds: tauxD, lep: tauxL, rfr1: parts[0][1], annee, inflation }, null, 1));
  if(avant === apres){ console.log("Aucun changement."); return; }
  nouveau.maj = new Date().toISOString().slice(0, 10);
  if(dryRun){ console.log("Changement détecté (essai : rien n'est écrit)."); return; }
  await writeFile(FICHIER, JSON.stringify(nouveau, null, 2) + "\n");
  console.log("taux.json mis à jour.");
}

main().catch(e => { console.error("Échec : " + e.message); process.exit(1); });
