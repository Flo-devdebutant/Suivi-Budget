// Mise à jour automatique des taux affichés dans l'onglet Investissement.
//
// Lit les pages officielles de service-public.gouv.fr (Livret A, LDDS, LEP et
// plafonds de revenus du LEP) et la série Insee de l'inflation, vérifie que
// chaque valeur est plausible, puis réécrit taux.json si quelque chose a
// changé. Une valeur introuvable ou incohérente arrête tout, sans rien écrire :
// l'application garde alors les derniers taux connus et le robot signale
// l'échec par courriel au propriétaire du dépôt.
//
// Usage : node scripts/maj-taux.mjs [--dry-run] [--date=AAAA-MM-JJ]
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

// Date du jour (AAAA-MM-JJ) ; --date=AAAA-MM-JJ la remplace pour les essais.
function aujourdhui(){
  const opt = process.argv.find(a => a.startsWith("--date="));
  return opt ? opt.slice(7) : new Date().toISOString().slice(0, 10);
}
// Début de la période de taux contenant une date : 1er février ou 1er août.
function debutPeriode(ymd){
  const [a, m] = ymd.split("-").map(Number);
  return m >= 8 ? `${a}-08-01` : m >= 2 ? `${a}-02-01` : `${a - 1}-08-01`;
}
function decaler(ymd, jours){
  const d = new Date(ymd + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + jours);
  return d.toISOString().slice(0, 10);
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
  const bloc = trouver("Barème du LEP", tL, /LEP éligibilité (\d{4}) - Revenu fiscal de référence à ne pas dépasser selon la situation familiale - Métropole (.*?)Pour chaque demi-part supplémentaire ([\d ]+) €(?: Pour quart de part ([\d ]+) €)?/i);
  const annee = borne("Année du barème du LEP", Number(bloc[1]), 2024, 2100);
  const parts = [...bloc[2].matchAll(/(\d+(?:[,.]\d+)?) (\d{1,3}(?: \d{3})+) €/g)].map(m => [nombre(m[1]), nombre(m[2])]);
  if(parts.length < 5 || parts[0][0] !== 1) throw new Error("Barème du LEP incomplet");
  borne("Plafond du LEP pour une part", parts[0][1], 15000, 40000);
  for(let i = 1; i < parts.length; i++) if(!(parts[i][0] > parts[i - 1][0] && parts[i][1] > parts[i - 1][1])) throw new Error("Barème du LEP non croissant");
  const demiPart = borne("Supplément par demi-part", nombre(bloc[3]), 2000, 15000);
  const quartPart = bloc[4] ? borne("Supplément par quart de part", nombre(bloc[4]), 1000, 8000) : Math.round(demiPart / 2);

  const xml = await lire(SOURCES.inflation);
  const obs = trouver("Inflation", xml, /<Obs TIME_PERIOD="(\d{4}-\d{2})" OBS_VALUE="(-?[\d.]+)"/);
  const inflation = { taux: borne("Inflation", Number(obs[2]), -5, 25), mois: obs[1] };

  // Période de validité des taux : les livrets réglementés sont révisés le
  // 1er février et le 1er août. Les taux lus ne valent pour la période en
  // cours que si la page officielle a été revue pour elle (au plus tôt
  // 20 jours avant la révision, quand le nouveau taux est annoncé) ; sinon
  // on garde l'ancienne période, et l'application invite à vérifier.
  const verifA = dateVerif("Livret A", tA);
  const debut = debutPeriode(aujourdhui());
  const periode = verifA >= decaler(debut, -20) ? debut : (ancien.periode || debutPeriode(verifA));

  const nouveau = {
    ...ancien,
    periode,
    livretA: { ...ancien.livretA, taux: tauxA, verifie: verifA },
    ldds: { ...ancien.ldds, taux: tauxD, verifie: dateVerif("LDDS", tD) },
    lep: { ...ancien.lep, taux: tauxL, verifie: dateVerif("LEP", tL), rfr: { annee, parts, demiPart, quartPart } },
    inflation
  };
  // On ne réécrit le fichier (donc on ne publie) que si une valeur a changé.
  const avant = JSON.stringify(ancien), apres = JSON.stringify(nouveau);
  console.log(JSON.stringify({ periode, livretA: tauxA, ldds: tauxD, lep: tauxL, rfr1: parts[0][1], annee, quartPart, inflation }, null, 1));
  if(avant === apres){ console.log("Aucun changement."); return; }
  nouveau.maj = aujourdhui();
  if(dryRun){ console.log("Changement détecté (essai : rien n'est écrit)."); return; }
  // Une ligne par tranche du barème, pour des différences lisibles.
  const json = JSON.stringify(nouveau, null, 2).replace(/\[\s+([\d.]+),\s+(\d+)\s+\]/g, "[$1, $2]");
  await writeFile(FICHIER, json + "\n");
  console.log("taux.json mis à jour.");
}

main().catch(e => { console.error("Échec : " + e.message); process.exit(1); });
