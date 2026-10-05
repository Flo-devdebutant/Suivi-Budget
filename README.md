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

Seule exception : le lecteur de relevés PDF (pdf.js, de Mozilla) est
téléchargé depuis cdnjs à la première lecture d'un PDF. Son empreinte est
vérifiée, puis il est gardé sur l'appareil et sert ensuite hors ligne. Le
relevé lui-même ne quitte jamais l'appareil.

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
| `1` à `9`, `0`    | Changer de page, dans l'ordre de la barre latérale (à l'origine, `8` : Investissement, `0` : Réglages) |
| `Ctrl` + clic / `⌘` + clic | Dans l'Historique, commencer une sélection par cette opération |
| `Échap`           | Terminer la sélection |

Le **mode discret** (icône d'œil en haut de l'écran) masque les montants,
par exemple pour consulter l'application en public.

## Historique, analyse et statistiques

- **Historique** : les filtres passent à la ligne au lieu de défiler hors de
  l'écran. Les catégories les plus utilisées sont proposées d'office ;
  « + autres » ouvre une fiche avec toutes les catégories, leurs
  sous-catégories, le nombre d'opérations et le total de la période (et une
  recherche dès qu'il y a beaucoup de catégories).
- **Calendrier des dépenses** : chaque jour se touche. Un jour sans opération
  le dit et propose d'en ajouter une à cette date ; un jour à venir montre ce
  qui est programmé, ou propose d'en programmer une. Les jours à venir qui
  portent une opération programmée ou récurrente sont hachurés, avec leur
  montant, et le calendrier avance jusqu'à deux mois pour voir ce qui arrive.
- **Recherche avancée** : le bouton de filtres est dans le champ de recherche,
  avec le nombre de filtres actifs.
- **Principales dépenses** : « Les plus fréquentes » sont classées au nombre
  de fois, puis au montant.
- **Statistiques**, vue d'ensemble en anneaux, pour le mois ou l'année en
  cours :
  - la part des revenus dépensée ;
  - le taux d'épargne, face à un objectif réglable d'une touche (10 à 30 %) ;
  - les dépenses fixes et variables (opérations récurrentes et libellés
    payés chaque mois pour un montant quasi constant) ;
  - les jours sans dépense, les budgets respectés et l'avancée des objectifs.

  **Catégories sur 12 mois** : chaque catégorie sur douze emplacements fixes,
  le nom de chaque mois au-dessus de sa barre (son initiale quand l'écran est
  trop étroit ; les mois d'avant le début du suivi restent vides), des
  colonnes alignées d'une ligne à l'autre, sa part des dépenses,
  sa moyenne mensuelle, ce mois-ci face à son budget, et sa tendance (les
  trois derniers mois terminés face aux trois précédents, ou moins quand
  l'historique est court). Toucher une catégorie ouvre sa **fiche** :
  graphique des douze mois avec la moyenne et le budget de chaque mois
  (toucher un mois en donne le détail), chiffres clés, ce qu'il faut en
  retenir (tendance, mois le plus haut et le plus bas, budget tenu ou
  dépassé, part d'abonnements, nombre et montant moyen des opérations),
  sous-catégories, libellés les plus coûteux et plus grosses dépenses, avec
  « Voir les opérations » et le réglage du budget. La répartition par
  catégorie, déjà détaillée dans l'onglet Analyse, n'est plus répétée ici.

## Supprimer des opérations

- **Sur ordinateur**, survoler une opération fait apparaître une petite
  corbeille à droite de la ligne. Elle apparaît aussi sur un ordinateur à
  écran tactile : l'application suit le pointeur réellement utilisé (souris
  ou doigt) au lieu de se fier à ce qu'annonce le navigateur, qui privait
  ces ordinateurs de tout moyen de supprimer depuis la liste.
- **Sur téléphone**, glisser une opération vers la gauche (vers la droite en
  arabe) dévoile le bouton « Supprimer », qui répond aussitôt, même pendant
  que la ligne finit de glisser. Le toucher n'est plus perdu, et le clic
  tardif que le navigateur envoie parfois ensuite ne peut pas valider la
  confirmation à votre place.
- **Plusieurs à la fois**, dans l'Historique : « Sélectionner » (au-dessus
  de la liste), un appui long sur une opération ou `Ctrl` + clic fait des
  lignes des cases à cocher. La barre du bas indique le nombre d'opérations
  choisies et leur total, propose « Tout sélectionner » (toutes les
  opérations qui répondent aux filtres et à la recherche en cours, même
  celles qui ne sont pas encore affichées) et « Supprimer ». Une
  confirmation rappelle le nombre et le total, et un message permet
  d'annuler juste après. Supprimer un virement d'épargne libère aussi ce
  qu'il réservait dans l'objectif ; « Annuler » le rétablit. La croix,
  `Échap` ou le changement de page terminent la sélection.

## Saisie, partages et relevé bancaire

- **Catégorie devinée** : en tapant un libellé déjà utilisé (« Carrefour »),
  sa catégorie habituelle est choisie d'office, avec une mention qui le dit ;
  toucher une autre catégorie l'emporte. Les libellés déjà saisis sont aussi
  proposés sous le champ. Vaut pour la saisie et les opérations programmées.
- **Répartir un ticket** sur plusieurs catégories (courses + maison) : chaque
  part devient une opération, le reste allant à la catégorie choisie.
- **Partager une dépense** : on indique avec qui et sa part. La page À venir
  tient la liste **Qui doit quoi**, par personne, avec les dettes notées à
  part (« Paul a payé pour moi »). Une part remboursée ramène la dépense à
  votre part ; une dette réglée devient une dépense à la date du règlement.
  « Annuler » est proposé à chaque fois.
- **Importer un relevé bancaire** (Réglages ou bouton « + ») : le relevé
  téléchargé depuis la banque, en **PDF**, CSV, OFX ou QIF, est lu sur
  l'appareil.
  - **PDF** (LCL et la plupart des banques françaises) : colonnes Date,
    Libellé, Valeur, Débit et Crédit repérées d'après l'en-tête, opérations
    sur plusieurs pages, détails sur plusieurs lignes (motif du virement,
    créancier d'origine d'un prélèvement), mots coupés en fin de ligne
    recollés. Soldes, totaux, pieds de page et pages de conditions sont
    écartés. Un PDF scanné (sans texte) ou protégé par mot de passe est
    signalé.
  - **Option System'Épargne (LCL)** : les arrondis notés sous chaque achat
    ne sont pas des opérations ; les deux virements de quinzaine « TOTAL
    OPTION SYSTEM' EPARGNE » sont importés comme virements vers l'épargne.
    Un virement marqué « SAVG » ou vers un livret est aussi reconnu comme
    mouvement d'épargne. Chaque ligne peut être rangée dans une catégorie, ou
    dans l'épargne globale ou un objectif.
  - **Doublons** : chaque ligne est comparée à toutes les opérations déjà
    enregistrées, même saisies sous un autre nom (« Courses » pour
    « CB CARREFOUR ») : même montant, et le jour de l'achat (à un jour près)
    ou un débit dans les quatre jours qui suivent la saisie. Une opération
    enregistrée ne répond qu'à une seule ligne, et la ligne décochée dit à
    laquelle elle correspond.
  - **PayPal et autres intermédiaires** : un prélèvement du même montant
    qu'une opération programmée, dans les sept jours qui suivent son
    échéance (quatre pour un prélèvement), y est rapproché. Si l'opération
    est déjà enregistrée, la ligne est décochée (doublon) ; sinon, elle prend
    le nom et la catégorie de l'opération programmée (« PayPal Europe »
    devient « Spotify »).
  - **Paiements par carte** : la date de l'achat, lue dans le libellé
    (« CB CARREFOUR 26/09/26 »), est celle de l'opération ; la date de débit
    est indiquée à côté.
  - **Mois d'avant le début du suivi** (par exemple les relevés de janvier à
    juillet quand l'application sert depuis août) : ces opérations rejoignent
    l'historique, les statistiques et les bilans, sans changer les soldes
    d'aujourd'hui (compte et épargne). Le crédit de départ est ajusté
    d'autant, ce que l'écran de vérification annonce ; annuler l'import le
    rétablit.
  - **CSV** : séparateur, en-têtes, lignes d'introduction, débit et crédit,
    formats de date et encodage (UTF-8 ou Windows-1252) sont reconnus.

  Les libellés sont simplifiés (« CB CARREFOUR 03/10 » devient
  « Carrefour ») et les catégories devinées. Les doublons probables sont
  décochés d'office, chaque ligne reste modifiable, et l'import peut être
  annulé.

Les dettes sont enregistrées avec le reste des données : appareil,
synchronisation (un appareil pas encore mis à jour ne les efface pas),
sauvegardes et import. Les règles Firestore sont inchangées.

## Bilan, abonnements, rapport et « et si »

- **Bilan du mois** (onglet Analyse) : le dernier mois terminé en bref, et une
  fiche détaillée pour chaque mois : excédent ou déficit, chiffres clés
  comparés au mois précédent, écart à la moyenne des mois d'avant, ce qui a
  changé par catégorie, budgets tenus ou dépassés, jours sans dépense,
  objectifs alimentés, plus grosse dépense ponctuelle et conseils tirés des
  chiffres. Au début de chaque mois, un message propose d'ouvrir le bilan du
  mois écoulé (une seule fois, propre à l'appareil).
- **Budgets de chaque mois** : les budgets peuvent changer d'un mois à
  l'autre, et au cours d'un même mois. Chaque mois passé est jugé avec les
  budgets en vigueur à son **dernier jour** : bilan, rapport, anneau
  « budgets respectés », badge « budgets tenus ». Les budgets du mois en
  cours suivent chaque modification, puis sont figés dès que le mois est
  passé ; un changement fait le 1er du mois suivant ne réécrit pas le mois
  écoulé. Entre deux appareils synchronisés, ils se fusionnent mois par
  mois : la valeur suivie la plus récente l'emporte, et un appareil pas
  encore à jour n'efface rien.
- **Budgets des mois passés** (onglet Budgets › « Mois passés ») : pour
  chaque mois terminé, les budgets retenus à côté des dépenses du mois, et
  la possibilité de les corriger. Les budgets relevés après la fin d'un mois
  (au premier lancement de la version qui les garde, ou pour les mois
  d'avant) sont marqués **estimés** : on les vérifie et on les corrige ici.
  Une correction ne touche que ce mois-là.
- **Abonnements et prélèvements** (onglet Analyse) : les opérations
  récurrentes enregistrées, et les paiements réguliers repérés dans
  l'historique (même libellé chaque mois, le plus souvent au même montant,
  depuis au moins trois mois). Total par mois et par an, prochaine échéance,
  hausses de prix signalées. Le coût se lit mois par mois : tous les
  paiements d'un même abonnement dans le mois s'additionnent (crédits
  achetés en plus, changement de formule payé au prorata), par exemple
  « 22,00 € en août → 53,71 € en septembre → 109,06 € en octobre », et ce
  qui a été payé le dernier mois s'affiche quand il diffère du prix prévu. Toucher un nom montre ses paiements dans
  l'historique ; « ? » simule l'économie d'une résiliation.
- **Rapport PDF** (onglet Statistiques, ou depuis la fiche du bilan) : un
  récapitulatif d'un mois ou d'une année (chiffres clés, mois par mois,
  dépenses par catégorie avec les budgets, abonnements, plus grosses
  dépenses ponctuelles, et au choix la liste de toutes les opérations).
  Tous les mois renseignés sont proposés : le mois en cours, le mois
  dernier et l'année en raccourcis, les autres mois et années dans « Un
  autre mois ». Pour un mois passé, la colonne « Budget au 30/09/2026 »
  reprend les budgets du dernier jour du mois ; s'ils sont estimés, la fiche
  le signale (« Vérifier les budgets ») et le rapport le mentionne. Il
  s'ouvre dans la fenêtre d'impression du navigateur, où « Enregistrer au
  format PDF » le conserve, y compris depuis la fiche du bilan et sur
  téléphone. Tout est préparé sur l'appareil.
- **Et si…** (onglet Épargne) : une économie mensuelle dans une catégorie, ou
  la résiliation d'un abonnement, et ce qu'elle change : gain sur un an, taux
  d'épargne, et date à laquelle chaque objectif serait atteint. Le calcul part
  du plan d'épargne s'il est renseigné, sinon de ce qui a été épargné en
  moyenne ces derniers mois ; il ne modifie rien. Seuls les abonnements que
  l'on peut résilier sont proposés, les loisirs d'abord (streaming, jeux,
  sport…) : les charges essentielles (logement, énergie, eau, assurances,
  internet, téléphone, crédits) sont laissées de côté, et « + autres » affiche
  toute la liste.

Le didacticiel présente ces nouveautés, et chaque section peut être déplacée
ou masquée depuis la personnalisation. Les budgets de chaque mois sont
enregistrés avec le reste des données (synchronisation, sauvegardes, import) ;
les règles Firestore sont inchangées.

## Gains et dépenses exceptionnels

Un cadeau, une prime, le 13e mois, une régularisation d'impôts, une taxe
payée en une fois, un revenu d'appoint (garde d'animaux…) ou un gros achat ne
se répètent pas d'un mois à l'autre. Classée **exceptionnelle**, une
opération compte toujours dans les soldes, les totaux, les budgets et les
rapports, qui restent la réalité du compte. En revanche, elle sort de ce qui
juge un mois « normal » :

- les moyennes et les repères « d'habitude » des observations ;
- la capacité d'épargne de l'onglet Investissement (« Mis de côté, par mois,
  d'habitude » et le montant mensuel proposé au simulateur) ;
- la base du simulateur « Et si… » ;
- la moyenne et la tendance de « Catégories sur 12 mois » (la fiche indique
  « dont … exceptionnels ») ;
- les comparaisons du bilan du mois.

Un mois qui a reçu un cadeau versé sur le livret ne gonfle donc plus la
capacité d'épargne : ce qu'il a mis de côté au-delà des autres mois est
attribué à ses rentrées exceptionnelles, dans leur limite.

- **À la saisie** : l'interrupteur « Opération exceptionnelle » de la fiche
  d'une opération, et de celle d'une opération programmée (le 13e mois en
  décembre, une taxe annuelle) : l'opération réelle hérite du statut le jour
  où elle est appliquée. Un libellé déjà classé exceptionnel (« Garde de
  chats ») fait cocher l'interrupteur d'office la fois suivante.
- **Repérage** (Analyse › Bilan › « Gains et dépenses exceptionnels ») :
  l'application propose les opérations des six derniers mois qui sortent de
  l'ordinaire, sans jamais les écarter d'elle-même. Elle retient :
  - les rentrées qui ne reviennent pas ;
  - les grosses dépenses rares (au moins 12 % du revenu habituel et deux fois
    et demie le coût habituel de leur catégorie) ;
  - les libellés déjà classés exceptionnels.

  Un geste suffit, « Exceptionnelle » ou « Habituelle » (la suggestion ne
  revient pas), avec un message pour annuler. Le salaire et les
  prélèvements réguliers ne sont jamais proposés. La section affiche
  l'excédent d'un mois habituel et la liste des opérations classées, que
  l'on peut retirer d'un geste. Une pastille sur le sous-onglet « Bilan » et
  une observation signalent les suggestions en attente.
- **Bilan, observations et rapport** : la part exceptionnelle du mois
  apparaît à part (« Exceptionnel ce mois-ci : 2 600,00 € reçus, 1 038,00 €
  dépensés ») avec l'excédent hors exceptionnel. L'observation du mois
  écoulé le juge sur sa part habituelle (« dont 2 600,00 € venus de rentrées
  exceptionnelles : un mois habituel, environ 300,00 € »). Le rapport PDF
  liste les opérations exceptionnelles de la période.
- Le statut est enregistré sur l'opération : il suit la synchronisation, les
  sauvegardes et l'import, sans modifier les règles Firestore.

## Devises, recherche avancée, défis et verrouillage

- **Plusieurs devises** (fiche de saisie) : toucher « € » à côté du montant
  pour saisir une dépense ou un gain en dollars, livres, francs suisses… (plus
  de 40 devises). Le **cours est récupéré automatiquement**, celui du jour ou
  celui de la date de l'opération pour une dépense passée. L'opération est
  convertie en euros, et son montant d'origine reste affiché dans
  l'historique. Les cours sont gardés sur l'appareil : hors ligne, le dernier
  cours connu sert (et c'est signalé). Ils sont rafraîchis au lancement et au
  retour du réseau. Le cours peut aussi être corrigé à la main, pour reprendre
  celui du relevé bancaire. Répartition et partage se saisissent dans la même
  devise, et la devise d'un voyage est reprise pour les saisies suivantes
  pendant douze heures.
- **Recherche avancée** (Historique) :
  - filtres par montant (au moins, au plus, raccourcis « ≥ 100 € »…), par type
    et par plusieurs catégories à la fois (une catégorie mère couvre ses
    sous-catégories) ;
  - opérations partagées ou en devise étrangère ;
  - les filtres actifs s'affichent en étiquettes que l'on retire d'un geste ;
  - une recherche peut être enregistrée sous un nom, avec la période et le
    texte cherché, et rappelée d'un geste en haut de l'historique. Les
    recherches enregistrées sont propres à l'appareil.
- **Défis et badges** (Épargne) : trois défis, une série et neuf badges,
  détaillés plus bas (« Défis d'épargne »).
- **Code de verrouillage** (Réglages), facultatif :
  - code à 4 ou 6 chiffres demandé à l'ouverture, et au retour dans
    l'application après le délai choisi (dès la sortie, 1, 5 ou 15 minutes) ;
  - déverrouillage par l'empreinte ou le visage quand l'appareil le permet ;
  - le code n'est jamais conservé, seulement son empreinte. Il est propre à
    l'appareil : ni synchronisé, ni sauvegardé, ni exporté ;
  - après cinq essais, une attente croissante est imposée ;
  - code oublié : il ne peut pas être récupéré. La seule issue est d'effacer
    les données de l'appareil (synchronisation comprise), puis de les
    retrouver par la synchronisation ou une sauvegarde.

Les défis sont enregistrés avec le reste des données (synchronisation,
sauvegardes, import). Les règles Firestore sont inchangées.

## Défis d'épargne

La fiche « Nouveau défi » présente trois défis, un par ligne. Chacun montre
ses réglages, puis un récapitulatif et le **tableau des versements prévus**
avant le lancement.

- **Jours sans superflu** (7, 14 ou 30 jours) : aucune dépense dans les
  catégories jugées superflues (devinées au départ : loisirs, restaurants…).
  Elles comptent aussi la **série** de jours tenus et son record.
- **Défi des 52 semaines** : un peu plus chaque semaine.
  - Le montant de base se choisit (1, 2, 5, 10 € ou un montant libre).
  - L'ordre est expliqué avec les vrais montants. En croissant : 5 €,
    10 €, 15 €… jusqu'à 260 €. En décroissant, les 260 € d'abord.
  - Le récapitulatif donne la 1re et la 52e semaine, le total et la moyenne
    par mois. Le tableau liste les 52 semaines (date, montant, cumul).
- **Épargne régulière** : le même montant à intervalle fixe.
  - Fréquence : chaque jour, chaque semaine, toutes les 2 semaines ou
    chaque mois.
  - Durée selon la fréquence : de 7 à 100 jours, de 4 à 52 semaines, 3 mois,
    6 mois ou 1 an, de 3 mois à 2 ans.
  - Montant proposé ou libre ; premier versement aujourd'hui, demain, lundi
    prochain ou le 1er du mois suivant.
  - L'option **Programmer les virements** (cochée d'office) enregistre
    chaque versement à son échéance vers l'objectif du défi, comme les
    autres opérations programmées. Le virement s'arrête de lui-même après la
    dernière échéance : une opération récurrente peut désormais avoir une
    date de fin, affichée dans « À venir » (« jusqu'au … »). Arrêter le défi
    retire son virement programmé.

Chaque défi d'épargne a son objectif d'épargne. Les virements vers cet
objectif depuis le début du défi comptent en cumul : ce qui est versé couvre
d'abord les échéances les plus anciennes, et un versement en avance compte
aussi.

- **La carte d'un défi s'ouvre** : sa fiche montre ce qui est versé, ce qui
  reste, le prochain versement et le tableau complet.
  - Chaque ligne a son état : ✓ versé, ● à verser, ! en retard. La ligne en
    cours est mise en évidence.
  - Pour des jours sans superflu, la fiche montre le calendrier des jours,
    datés, avec une légende.
  - Boutons : virer ce qui est dû, programmer les virements, arrêter le
    défi.
- **Rappels d'épargne** (en tête de l'Accueil, seulement quand il y en a),
  pour un défi des 52 semaines ou d'épargne régulière en cours :
  - un rappel tant que le versement de la période en cours n'est pas viré,
    par exemple « 4,00 € à virer cette semaine (semaine 4 sur 52) » ou
    « 50,00 € à virer ce mois-ci » ;
  - un rappel de plus quand des versements des périodes précédentes ont été
    oubliés, par exemple « 2 versements oubliés depuis le 21/09 : 5,00 € à
    rattraper ».

  Chaque rappel ouvre le virement déjà rempli (montant et libellé). Un
  versement programmé, enregistré à son échéance, ne laisse aucun rappel. Si
  l'application s'ouvre sur une autre page, un message le signale une fois
  par jour. Le sous-onglet « Défis » porte une pastille quand une nouvelle
  période commence.
- **Badges** : chacun s'ouvre d'un geste.
  - La fiche dit ce que le badge récompense et comment l'obtenir.
  - Elle montre où l'on en est : le record de jours tenus face aux 7 ou 30
    demandés, le meilleur mois de budgets tenus, les mois d'épargne
    consécutifs, l'objectif le plus avancé, un défi en cours…
  - Pour un badge obtenu, elle dit quand (« Obtenu le 12 juin 2026 »,
    « en août 2026 ») et grâce à quoi.
  - Elle propose l'action utile : faire un virement, choisir ses dépenses
    superflues, lancer un défi, voir ses budgets ou ses objectifs.

Les défis d'épargne régulière sont rangés à part dans les données : un
appareil pas encore mis à jour ne peut pas les effacer en synchronisant. Les
règles Firestore sont inchangées.

## Pages en sous-onglets

Comme l'onglet Investissement, les pages chargées se découpent en
sous-onglets, dans une barre qui reste collée sous l'en-tête :

| Page | Sous-onglets |
|---|---|
| À venir | Ponctuelles · Régulières · Partages |
| Épargne | Mon épargne · Simuler · Défis |
| Analyse | Ce mois · Dépenses · Bilan |
| Statistiques | Ce mois · Tendances |
| Réglages | Général · Données et sécurité |

- Chaque page rouvre le dernier sous-onglet consulté (propre à l'appareil).
- Un **point** signale un sous-onglet qui contient du nouveau : bilan du mois
  prêt, hausse d'un abonnement, badge gagné ou défi réussi. Il s'efface quand
  on ouvre ce sous-onglet ; ce qui existait avant cette version n'est pas
  signalé.
- Dans Personnaliser, chaque section peut **changer de sous-onglet** (menu
  « Sous-onglet » de sa barre). Un sous-onglet vidé disparaît de la barre.
- Les liens et le didacticiel ouvrent d'eux-mêmes le bon sous-onglet.

Pour alléger encore les pages :

- **Accueil épuré** : par défaut, l'Accueil montre le solde, les raccourcis,
  le solde prévu, le reste à dépenser et les dernières opérations. Le
  graphique, l'analyse, les budgets du mois, les objectifs et les prochaines
  opérations s'ajoutent depuis Personnaliser. Une disposition déjà
  personnalisée est gardée ; « Remettre comme à l'origine » donne la
  nouvelle.
- **Sections repliées** : une section repliée garde une ligne de résumé
  (« Abonnements · 788 € par mois », « 12 jours sans dépense ce mois-ci »…).
- **Listes courtes** : les longues listes (opérations programmées, paiements
  réguliers, objectifs, abonnements, partages…) s'arrêtent à cinq lignes,
  avec « Voir tout ».
- **Mode compact** (Personnaliser) : espacements resserrés et graphiques
  moins hauts sur téléphone, sans que le bouton « Supprimer » rangé derrière
  chaque opération ne dépasse de la ligne.
- **Aperçu des sections** : en mode Personnaliser, chaque section montre une
  miniature de son contenu sous son nom.
- **Recherche avancée** : la liste des catégories n'a plus de défilement
  propre ; toutes sont accessibles en faisant défiler la fiche.

## Personnaliser l'application

Chacun peut ranger l'application à sa façon, depuis **Réglages ›
Personnalisation** ou le menu « Plus d'options » › **Personnaliser** :

- **les onglets** : on choisit ceux de la barre du bas (de 2 à 5) et leur
  ordre, les autres passant dans le menu « Plus d'options ». Un aperçu de la
  barre suit chaque changement. Sur grand écran, la barre latérale suit le
  même ordre, tout comme les raccourcis clavier `1` à `9` et `0` ;
- **la page d'ouverture** : l'Accueil, une autre page, ou la dernière page
  consultée ;
- **les raccourcis de l'Accueil** : quatre boutons choisis parmi Dépense,
  Gain, Virement, Programmer, Paiement régulier, Utiliser l'épargne,
  Nouvel objectif et Rechercher ;
- **les sections des pages** (Accueil, À venir, Épargne, Analyse,
  Statistiques, Investissement) : le bouton **Personnaliser cette page**, en
  bas de chaque page, transforme les sections en cartes que l'on déplace
  (glisser la poignée ⠿ ou flèches) et que l'on masque d'un geste (l'œil).
  Sur grand écran, une section peut aussi passer en pleine largeur. Sur
  l'onglet Investissement, chaque vue se range séparément ; sur les pages en
  sous-onglets, chaque section peut changer de sous-onglet, et une
  miniature de son contenu aide à la reconnaître. Ouverte depuis
  Personnaliser (« Sections des pages »), une page y ramène avec
  « Terminé » : on retrouve la fiche au même endroit, la page modifiée mise
  en évidence, pour passer directement à la suivante ;
- **des modules en plus sur l'Accueil**, masqués à l'origine : le graphique
  du solde, l'analyse, les budgets du mois, les objectifs et « Prochaines
  opérations » (les 30 prochains jours, chaque ligne s'ouvre d'un toucher) ;
- **le mode compact**, qui resserre les espacements sur téléphone.

Hors du mode Personnaliser, chaque section se **replie** d'un toucher sur
la flèche de son titre, pour raccourcir les pages longues ; le repli est
retenu. Sur grand écran, une section qui se retrouve seule sur sa ligne
s'élargit pour ne pas laisser de vide. Tout se remet comme à l'origine, page
par page ou d'un coup, et le message qui suit propose **Annuler**. La
disposition est propre à chaque appareil (un téléphone et un ordinateur
n'ont pas les mêmes besoins) : elle est gardée dans le navigateur, hors des
données, des sauvegardes et de la synchronisation, dont les règles Firestore
sont inchangées. Une disposition enregistrée par une version précédente est
reprise telle quelle. Le didacticiel montre toujours la disposition
d'origine, puis rend la vôtre ; son chapitre « Personnaliser » permet de tout
essayer sans rien enregistrer.

La suppression d'une opération, d'un virement ou d'une opération programmée
demande toujours confirmation, puis le message propose **Annuler** pendant
quelques secondes : l'élément revient à l'identique, avec l'argent qu'il
réservait dans un objectif.

## Investissement

L'onglet **Investissement** aide à faire fructifier son épargne en privilégiant
la sécurité. Il part des chiffres de l'utilisateur (épargne, dépenses
habituelles, effort d'épargne, objectifs d'épargne) et propose une méthode en
trois étapes : épargne de précaution, projets à 2–8 ans, puis long terme.

Pour ne pas avoir à faire défiler une longue page sur téléphone, l'onglet est
découpé en **quatre vues**, accessibles depuis une barre qui reste collée sous
l'en-tête : **Mon plan** (situation, prochaine étape, méthode, profil,
projets), **Simuler** (simulateur, test de krach), **Placements** (taux du
moment, liste des placements, droit au LEP) et **Comprendre** (règles d'or,
risques, lexique). La vue choisie est retenue sur l'appareil ; la barre se
pilote aussi au clavier (flèches, Début, Fin). La prochaine étape conseillée
propose des boutons qui mènent directement à la bonne vue. Les étapes de la
méthode et les questions du test se replient, l'étape en cours restant
ouverte. Sur un écran étroit, le placement simulé se choisit dans une liste
qui s'ouvre d'un geste, au lieu d'une série de puces.

On y trouve :

- **les taux du moment** (Livret A et LDDS, LEP, fonds en euros, inflation),
  leur période de validité et le rendement du Livret A après inflation ;
- une **fiche détaillée pour chaque placement**, ouverte par le petit « i »
  placé à côté de son nom partout dans l'onglet (simulateur, comparaison,
  taux, étapes, projets, lexique) ou d'un geste sur sa ligne dans la liste
  des placements. Écrite pour qui n'y connaît rien,
  elle explique en mots simples ce que c'est, comment ça marche, ce que ça
  rapporte, le risque, l'accès à l'argent, les impôts, pour qui, les pièges à
  éviter et comment l'ouvrir. Elle donne aussi un exemple chiffré calculé
  d'après la situation fiscale de l'utilisateur, le lien vers la fiche
  officielle, des placements voisins et un bouton pour le simuler. Ses
  chiffres viennent de `taux.json` ;
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
  règles des livrets (intérêts par quinzaine, ajoutés chaque 31 décembre ;
  plus de dépôt possible une fois le solde au plafond, intérêts compris ; le
  Livret A se remplit d'abord, puis le LDDS, et le simulateur indique quand
  chacun serait plein et ce qui revient à chacun) et
  celles du PEL et du PEA (plafond des versements, durées), compare les
  placements sur un même graphique,
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
- la **liste des placements**, classés par niveau de risque, avec pour chacun
  sa disponibilité et son rendement ; une ligne ouvre la fiche complète ;
- les risques (arnaques comprises), les règles d'or et un lexique.

Ce sont des informations générales, pas un conseil en investissement
personnalisé. Les réponses au test, le revenu saisi pour le LEP, la situation
fiscale du simulateur et les échéances des projets restent sur l'appareil : ils
ne sont pas synchronisés (la synchronisation et ses règles Firestore sont
inchangées).

### Mise à jour automatique des taux et des règles

Tous les chiffres réglementaires de l'onglet viennent de `taux.json`, publié
avec l'application : taux, plafonds, durées légales, règles fiscales et
garanties, jusque dans les textes. Le robot `.github/workflows/maj-taux.yml`
le tient à jour chaque matin à partir des sources officielles
(`scripts/maj-taux.mjs`, Node 18 ou plus, sans dépendance ; `--dry-run` pour
un essai) :

| Rubrique | Source |
|---|---|
| Livret A, LDDS : taux, plafonds, période de validité | service-public.gouv.fr |
| LEP : taux, plafond, barème de revenus | service-public.gouv.fr |
| PEL : taux, plafond, versement minimum, durées (4, 10 et 15 ans) | service-public.gouv.fr |
| PEA : plafond, durée avant laquelle un retrait clôture le plan | service-public.gouv.fr |
| Prélèvements sociaux, flat tax, assurance vie (durée, abattements, taux), plafond du PER, barème de l'impôt | service-public.gouv.fr |
| Garantie des dépôts bancaires | FGDR |
| Inflation | Insee |
| Taux moyen des nouveaux comptes à terme (valeur par défaut du simulateur) | Banque de France, diffusé par la BCE |

Chaque valeur est contrôlée, puis le fichier n'est publié que s'il a changé.
Chaque rubrique est lue séparément : si une page officielle change de forme ou
donne une valeur incohérente, cette rubrique garde ses valeurs, les autres
sont tout de même mises à jour, et le robot se termine en erreur pour que
GitHub prévienne le propriétaire du dépôt par courriel. Une erreur passagère
d'un site est retentée avant d'abandonner.

Deux valeurs ne sont publiées dans aucune source lisible par un robot : le
rendement moyen des **fonds en euros** (ACPR, une fois par an, sur un site
fermé aux robots) et la garantie des contrats d'assurance vie (FGAP). Chaque
année, à partir du 1er septembre, si le rendement de l'année écoulée manque,
le robot ouvre un **rappel** (une *issue* GitHub) qui explique quoi faire :
dans l'onglet *Actions*, « Mise à jour des taux », *Run workflow*, saisir le
taux et l'année, puis valider. Aucune modification du code n'est nécessaire,
et le rappel se ferme tout seul une fois le chiffre saisi.

GitHub suspend les tâches planifiées d'un dépôt resté 60 jours sans activité :
le robot se réactive lui-même à chaque passage pour l'éviter. Le bouton *Run
workflow* lance aussi une mise à jour à la demande.

Côté application, `taux.json` est lu sur le même site (aucun service tiers),
au plus toutes les six heures quand l'onglet est ouvert ou quand l'application
revient au premier plan, et gardé sur l'appareil pour fonctionner hors ligne.
Chaque valeur est de nouveau contrôlée ; à défaut, ce sont les valeurs
intégrées à `index.html` (objet `INV`) qui s'affichent. Si une révision du
1er février ou du 1er août passe sans que les nouveaux taux aient été
confirmés, la page invite à les vérifier.

Les frais des contrats, le rendement des actions et l'inflation de long terme
(2 %, cible de la BCE) sont des hypothèses, réglables dans le panneau « Impôts
et frais » pour les deux premiers, pas des données officielles.

## Fiabilité : corrections de l'audit

Un audit complet (chaque page, chaque sous-onglet et chaque fenêtre, dans les
7 langues, du téléphone de 320 px à l'écran de 1920 px, en clair, en sombre,
en mode compact, avec un compte vide ou de très gros montants ; chaque bouton
touché un par un ; calculs de dates, de récurrences et de soldes vérifiés) a
conduit aux corrections suivantes.

- **Opérations récurrentes en fin de mois** : une opération du 31 passait au
  28 février, puis restait au 28 tous les mois suivants. Le jour choisi est
  désormais conservé : le 31 tombe le 28 (ou le 29) en février, le 30 en
  avril, et revient au 31 en mars. Une opération annuelle du 29 février
  revient le 29 les années bissextiles. Les récurrences déjà enregistrées
  retrouvent leur jour d'origine d'après les opérations qu'elles ont
  produites, sans toucher à une date déplacée à la main.
- **Montants avec séparateur de milliers** : « 1.234,56 » (allemand, espagnol,
  italien, portugais), « 1,234.56 » (anglais), « 1 234,56 », « ,5 » ou « 12. »
  sont acceptés ; une seule virgule ou un seul point reste la décimale.
- **Opérations programmées lues d'une sauvegarde ou du nuage** : une
  fréquence inconnue ou un intervalle nul faisait enregistrer la même
  opération 400 fois au lancement, et une date illisible bloquait le
  démarrage. La fréquence est réparée (tous les mois par défaut), une date
  comme « 2027-3-2 » est remise au bon format, une date impossible est
  écartée.
- **Montants coupés** (« 10 550,0… ») : les totaux de l'Historique, les cartes
  des Statistiques, les cases de l'accueil, d'À venir, des abonnements et du
  bilan resserrent leur police juste assez pour afficher le montant entier ;
  la date de l'accueil prend sa forme courte (« lun. 5 oct. ») sur un écran
  étroit.
- **Lignes d'opération** : quand la date passe à la ligne, le point « · » qui
  la sépare de la catégorie ne reste plus seul en début de ligne.
- **Badges des défis** : la description s'affiche en entier, et un mot long
  ne déborde plus de la case.
- **Plus grosses dépenses** (Analyse) : sur un écran étroit, la catégorie et
  la date passent à la ligne au lieu de perdre l'heure.
- **Mode compact** : les cartes de la page Budgets se resserrent comme le
  reste de l'application.
- **Très petits écrans (320 px)** : le résumé des budgets et les anneaux des
  Statistiques placent leurs chiffres sous l'anneau quand la place manque ;
  les noms et pastilles des catégories, les réponses du test de profil et le
  solde affiché sous chaque opération reviennent à la ligne au lieu de
  sortir de l'écran.
- **Calendrier des dépenses** : les montants courts restent lisibles dans
  leur case (« 181 k », « 1,2 M »).
- **Nombres dans les phrases** : « En moyenne 0,3 opérations par mois » (et
  non « 0.3 ») ; en arabe, les chiffres restent ceux du reste de
  l'application.

Les règles Firestore ne changent pas : le jour d'origine d'une récurrence
est un simple champ de plus, qui suit la synchronisation et les sauvegardes.

## Didacticiel

Une visite interactive en 10 chapitres est proposée à la première ouverture,
et reste accessible depuis le menu « Plus d'options › Didacticiel » ou les
Réglages, chapitre par chapitre. Le chapitre « Investissement » présente les
quatre vues de l'onglet, la prochaine étape conseillée, la méthode, le test
de profil, le simulateur (choix du placement, impôts et frais) et la liste
des placements, dont on ouvre une fiche d'un geste. Le chapitre
« Personnaliser » fait essayer le mode Personnaliser d'une page (déplacer,
masquer, afficher un module, replier une section) puis la fiche
« Personnaliser l'application » (onglets, page d'ouverture, raccourcis) : les
essais faits pendant la visite ne sont pas enregistrés, et chacun retrouve sa
disposition à la fin. Les chapitres présentent aussi les nouveautés : la
devise d'une saisie, la recherche avancée, les défis et badges, le
simulateur « Et si… », le bilan du mois, les abonnements, le rapport PDF et
le code de verrouillage. Le chapitre « Historique » montre comment
supprimer une opération (glissement sur téléphone, corbeille au survol à la
souris, avec le texte adapté au pointeur utilisé ; en arabe, le doigt animé
glisse vers la droite, comme la ligne) puis comment en supprimer plusieurs
avec « Sélectionner ». Sur un compte vide, elle utilise des données
d'exemple **en mémoire uniquement** : rien n'est enregistré, synchronisé ni
sauvegardé pendant la visite, et vos données sont rétablies à la sortie.
