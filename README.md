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

Les deux fichiers doivent rester **dans le même dossier**.

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

## Didacticiel

Une visite interactive en 8 chapitres est proposée à la première ouverture,
et reste accessible depuis le menu « Plus d'options › Didacticiel » ou les
Réglages, chapitre par chapitre. Sur un compte vide, elle utilise des données
d'exemple **en mémoire uniquement** : rien n'est enregistré, synchronisé ni
sauvegardé pendant la visite, et vos données sont rétablies à la sortie.
