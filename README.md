# Suivi de Budget

Application web de suivi de budget personnel : opérations, prévisions de fin de
mois, épargne et objectifs, budgets par catégorie, analyses et statistiques.
Elle s'installe sur l'écran d'accueil comme une application, fonctionne hors
ligne et se met à jour toute seule.

## Fichiers

| Fichier      | Rôle |
|--------------|------|
| `index.html` | L'application complète (interface, styles, polices, traductions). |
| `sw.js`      | Le *service worker* : fonctionnement hors ligne et mises à jour automatiques. |
| `taux.json`  | Les taux de l'onglet Investissement, tenus à jour par un robot (voir plus bas). |
| `scripts/maj-taux.mjs`, `.github/workflows/maj-taux.yml` | Le robot de mise à jour des taux. |

`index.html`, `sw.js` et `taux.json` doivent rester **dans le même dossier**.

## Publier une nouvelle version

Il suffit de remplacer `index.html` (par exemple via « Add files via upload »
sur GitHub). Rien d'autre à faire : aucun numéro de version à modifier, aucun
cache à vider.

Sur chaque appareil où l'application est ouverte :

1. elle vérifie s'il existe une version plus récente à l'ouverture, au retour
   au premier plan, au retour du réseau, puis toutes les deux minutes ;
2. la nouvelle version est téléchargée en arrière-plan ;
3. l'application se recharge d'elle-même **au premier moment sans risque** :
   jamais pendant une saisie, une fiche ouverte ou la visite guidée, ni
   pendant que vous touchez l'écran. Si l'attente se prolonge, une pastille
   « Nouvelle version prête · Mettre à jour » apparaît en haut ;
4. la page affichée et la position de lecture sont retrouvées, et un message
   confirme la mise à jour.

Les données ne sont jamais concernées : elles sont enregistrées sur l'appareil
à chaque modification.

La version est reconnue à l'empreinte du contenu placé entre les repères
`<!--@app-->` et `<!--/@app-->`, collés aux balises `<head>` et `<body>` :
**conservez-les** si vous modifiez `index.html`. Ce qu'un antivirus, un proxy
ou un CDN ajoute à la page à chaque requête n'est ainsi pas pris pour une
nouvelle version. Par précaution, une nouvelle version n'est retenue que si
deux lectures successives la confirment. Et si les rechargements
s'enchaînent anormalement (plus de trois en un quart d'heure), ils sont
suspendus : la nouvelle version s'affichera simplement à la prochaine
ouverture.

> GitHub Pages met environ une minute à publier un changement ; comptez donc
> jusqu'à trois minutes avant que les appareils ouverts se mettent à jour.

`sw.js` n'a besoin d'être modifié que pour changer le fonctionnement hors
ligne lui-même. S'il l'est, le navigateur installe le nouveau service worker
et l'application se recharge de la même manière.

## Hors ligne

Après une première ouverture avec du réseau, l'application s'ouvre et
fonctionne entièrement sans connexion. Quand le réseau répond, c'est toujours
la version en ligne qui est servie ; s'il est trop lent, la copie locale est
affichée immédiatement et la version en ligne récupérée en arrière-plan.

Le numéro de version affiché en bas des **Réglages** indique aussi si
l'application est disponible hors ligne.

## Synchronisation entre appareils

La synchronisation passe par **votre propre projet Firebase** (gratuit, sans
carte bancaire). Le guide pas à pas s'ouvre depuis **Réglages ›
Synchronisation › Configurer la synchronisation** : il faut le suivre une
seule fois, sur un premier appareil (environ 5 minutes).

Les règles Firestore à publier dans le projet sont affichées dans le guide,
avec un bouton pour les copier. Elles ne changent pas d'une version à
l'autre : un projet déjà configuré n'a jamais à être retouché lors d'une
mise à jour.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /syncRooms/{code} {
      allow get, write: if request.auth != null;
      allow list: if false;
    }
  }
}
```

Pour relier les appareils suivants, inutile de repasser par la console
Firebase : sur un appareil déjà synchronisé, **Ajouter un appareil** affiche
une *clé d'appareil* (commençant par `SB1.`) qui réunit le projet et le code.
Collez-la sur le nouvel appareil, dans le champ en bas du guide. Ne la
partagez qu'avec vos propres appareils.

Le projet commun que proposaient les premières versions n'existe plus. Un
appareil qui s'en servait l'indique dans les Réglages : ses données sont
intactes, son code est conservé, et il suffit de le relier à votre projet.

## Raccourcis (ordinateur)

| Touche            | Action |
|-------------------|--------|
| `Ctrl K` / `⌘ K`, `/` | Rechercher une opération, une page ou une action |
| `N`               | Nouvelle opération |
| `1` à `9`, `0`    | Changer de page (`8` : Investissement, `0` : Réglages) |

Le **mode discret** (icône d'œil en haut de l'écran) masque les montants,
par exemple pour consulter l'application en public.

## Investissement

L'onglet **Investissement** aide à faire fructifier son épargne en privilégiant
la sécurité. Il part des chiffres de l'utilisateur (épargne, dépenses
habituelles, effort d'épargne, objectifs d'épargne) et propose une méthode en
trois étapes : épargne de précaution, projets à 2–8 ans, puis long terme. On y
trouve :

- **les taux du moment** (Livret A et LDDS, LEP, fonds en euros, inflation),
  leur période de validité et le rendement du Livret A après inflation ;
- un **test de profil** simplifié ;
- un **simulateur** à deux questions : « ce que j'aurai » et « ce qu'il faut
  verser » pour réunir une somme, sur dix placements : Livret A et LDDS, LEP,
  PEL, compte à terme, assurance vie (fonds en euros, actions ou selon le
  profil), PEA, compte-titres et PER. Tous les montants sont **nets** : après
  frais, prélèvements sociaux et impôt sur le revenu, selon les règles propres
  à chaque enveloppe (flat tax ou barème, abattement de l'assurance vie après
  8 ans, PEA après 5 ans, déduction des versements sur un PER et imposition à
  la sortie, intérêts du PEL et du compte à terme imposés chaque année…). Un
  bilan détaille d'où vient le résultat (versé, gains, frais, prélèvements
  sociaux, impôt), avec le rendement net annuel. Le simulateur suit aussi les
  règles des livrets (intérêts par quinzaine, ajoutés chaque 31 décembre,
  plafonds de versement), compare les placements sur un même graphique,
  détaille chaque année au survol, au doigt ou au clavier, et peut tout
  exprimer en euros d'aujourd'hui ;
- un panneau facultatif **Impôts et frais** pour préciser la simulation : foyer
  fiscal, tranche d'imposition (ou revenu et nombre de parts pour la calculer
  avec le barème), tranche prévue à la retraite, plafond de déduction du PER,
  frais des contrats, taux du compte à terme et rendement supposé des actions.
  Sans réponse, des valeurs prudentes s'appliquent ;
- **vos projets** : chaque objectif d'épargne reçoit une échéance, qui donne le
  placement adapté et le versement mensuel nécessaire. L'argent réservé à un
  projet n'est pas compté dans l'épargne de précaution ;
- un **test d'éligibilité au LEP**, d'après le revenu fiscal de référence et
  le nombre de parts, avec le barème officiel ;
- un **test de krach** : ce qu'une baisse des marchés représenterait en euros,
  avec les grandes baisses passées ;
- le comparatif des placements, les risques (arnaques comprises), les règles
  d'or et un lexique.

Ce sont des informations générales, pas un conseil en investissement
personnalisé. Les réponses au test, le revenu saisi pour le LEP, la situation
fiscale du simulateur et les échéances des projets restent sur l'appareil : ils
ne sont pas synchronisés (la synchronisation et ses règles Firestore sont
inchangées).

### Mise à jour automatique des taux

Les taux affichés viennent de `taux.json`, publié avec l'application. Le robot
`.github/workflows/maj-taux.yml` le tient à jour chaque matin : il lit les
pages officielles de service-public.gouv.fr (Livret A, LDDS, LEP et barème de
revenus du LEP, PEL, et les règles fiscales : prélèvements sociaux, flat tax,
assurance vie, plafond du PER, barème de l'impôt) et la série de l'inflation de
l'Insee, contrôle chaque valeur, puis publie le fichier s'il a changé
(`scripts/maj-taux.mjs`, Node 18 ou plus, sans dépendance ; `--dry-run` pour un
essai). Chaque rubrique est lue séparément : si une page officielle change de
forme ou donne une valeur incohérente, cette rubrique garde ses valeurs, les
autres sont tout de même mises à jour, et le robot se termine en erreur pour
que GitHub prévienne le propriétaire du dépôt par courriel.

Côté application, `taux.json` est lu sur le même site (aucun service tiers),
au plus toutes les six heures quand l'onglet est ouvert, et gardé sur
l'appareil pour fonctionner hors ligne. Chaque valeur est de nouveau
contrôlée ; à défaut, ce sont les valeurs intégrées à `index.html` (objet
`INV`) qui s'affichent. Si une révision du 1er février ou du 1er août passe
sans que les nouveaux taux aient été confirmés, la page invite à les vérifier.

À savoir :

- le rendement moyen des **fonds en euros** n'est publié qu'une fois par an
  (ACPR) : il se met à jour à la main dans `taux.json` (`fondsEuros`) ;
- les frais des contrats et le rendement des actions sont des hypothèses,
  réglables dans le panneau « Impôts et frais », pas des données officielles ;
- GitHub suspend les tâches planifiées d'un dépôt public après **60 jours sans
  activité** sur le dépôt : il suffit alors de les réactiver dans l'onglet
  *Actions*. Le bouton *Run workflow* du robot lance aussi une mise à jour à la
  demande.

## Didacticiel

Une visite interactive en 8 chapitres est proposée à la première ouverture,
et reste accessible depuis le menu « Plus d'options › Didacticiel » ou les
Réglages, chapitre par chapitre. Sur un compte vide, elle utilise des données
d'exemple **en mémoire uniquement** : rien n'est enregistré, synchronisé ni
sauvegardé pendant la visite, et vos données sont rétablies à la sortie.
