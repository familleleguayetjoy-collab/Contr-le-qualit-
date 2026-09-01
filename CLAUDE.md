# ComplyEC — règle n° 1

**La majorité des experts-comptables sont âgés et n'aiment pas le changement.
L'interface doit être claire, leur faire gagner du temps, et ne contenir aucune
erreur — ni sur le fond, ni sur la forme.**

À relire avant chaque modification. En cas de doute entre deux options, choisir
celle qui demande le moins d'apprentissage à quelqu'un qui n'a jamais utilisé le
logiciel.

## Ce que cette règle implique concrètement

**Clarté avant originalité.** Le style peut être moderne — dégradés, cartes,
typographie affirmée. L'*interaction*, elle, reste conventionnelle : un bouton
ressemble à un bouton, un tableau se trie en cliquant son en-tête, la
navigation ne se déplace jamais. Aucun geste à deviner, aucun menu caché,
aucune icône seule sans intitulé sur une action importante.

**Gain de temps mesurable.** Chaque écran doit répondre à « qu'est-ce que je
dois faire maintenant ? » sans lecture préalable. Préremplir dès qu'une donnée
est déjà connue. Une action fréquente ne doit jamais coûter plus de deux clics
depuis l'accueil.

**Zéro erreur sur le fond.** Toute référence réglementaire est vérifiée et
datée avant d'être écrite dans un document remis à un client ou à un
contrôleur. Un texte abrogé dans un livrable est une faute grave — c'est déjà
arrivé une fois (décret 2007-1387, remplacé par le décret 2012-432). Ne jamais
citer de mémoire.

**Zéro erreur sur la forme.** Rien de rogné, rien qui déborde, rien de coupé,
aucune donnée fausse à l'écran. Vérifier par capture ou par mesure, pas par
raisonnement. Les régressions visuelles se voient : elles décrédibilisent tout
le reste.

**Dire la vérité sur l'état du produit.** Ce qui est simulé est signalé comme
tel. Ne jamais afficher « à jour » ce qui ne l'est pas.

## Conséquences sur les priorités

À privilégier : états vides explicites, libellés en français courant,
confirmations avant action irréversible, retour en arrière toujours possible,
messages d'erreur qui disent quoi faire.

À traiter avec prudence : animations qui retardent la lecture, raccourcis
clavier comme seul accès à une fonction, densité d'information élevée, tout ce
qui suppose une habitude d'usage de logiciels récents.

## Vérification avant de livrer

- `node --check` sur chaque fichier modifié
- Balayage des écrans : aucun défilement de fenêtre, aucun contenu rogné
- Revue mobile
- Suppression du harnais de test avant commit
- Régénération du bundle autonome
