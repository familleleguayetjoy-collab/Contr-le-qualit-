# Refonte V3 — audit de l'existant et plan d'exécution

Document de travail établi le 13 septembre 2026, en réponse au *Cahier des
charges de refonte V3*. Le cahier V3 demande explicitement (§ 13) de commencer
par auditer le code existant et produire un plan classé par phases 0 à 8, sans
coder. C'est l'objet de ce document. Aucune ligne de code applicatif n'a été
modifiée pour l'écrire.

---

## 1. Comment je lis la commande

Le cahier V3 se déclare source de vérité et remplace les versions antérieures
(« En cas d'écart avec une proposition antérieure, appliquer la présente V3 »).
Il est daté du 13 septembre 2026, donc postérieur à toutes les demandes reçues
jusqu'ici. **Là où il contredit une consigne plus ancienne, j'applique le V3**,
et je signale la contradiction au § 6 plutôt que de la régler en silence.

### Un point d'interprétation, réglé et pas mis en attente

Le cahier vise « le fichier actuel ComplyEC (8).html » et interdit de migrer de
framework ou de réécrire l'application. Le dépôt n'est pas organisé ainsi : le
code vit dans huit fichiers sources (`data.js`, `utils.js`, `wizard.js`,
`ec.js`, `collab.js`, `db.js`, `auth.js`, `app.js` — 8 536 lignes) et
`ComplyEC.html` est le **fichier autonome produit** à partir d'eux par
`build_standalone.py`.

C'est la même pile technique — React appelé par `h`, sans JSX ni étape de
compilation — et ce sont exactement les mêmes composants et les mêmes classes
CSS que ceux nommés par le cahier. Travailler dans les sources puis régénérer
le fichier autonome respecte donc la consigne au fond : aucune migration,
aucune réécriture, aucun branchement cassé. Je continue ainsi.

---

## 2. Audit — ce qui a été mesuré, pas supposé

Toutes les valeurs ci-dessous sortent d'une mesure dans le navigateur
(Chromium piloté), pas d'une lecture du code.

### 2.1 La contrainte de viewport est déjà tenue sur les pages

Le cahier impose qu'à 1366 × 768 aucune page cible n'exige de défilement
vertical global. Les 18 écrans de l'espace expert-comptable ont été parcourus
aux deux résolutions de recette :

| Résolution | Écrans mesurés | Défilement global | Erreurs JS |
|---|---|---|---|
| 1440 × 900 | 18 | **0 px partout** | aucune |
| 1366 × 768 | 18 | **0 px partout** | aucune |

C'est le principal acquis de l'existant : la recette § 11 « Viewport » passe
déjà sur les pages. Elle ne passe pas sur les assistants — voir ci-dessous.

### 2.2 Trois étapes de Contractualisation perdent leur footer à 1366 × 768

Le parcours gelé a été rejoué de bout en bout aux deux résolutions. À
1440 × 900 les dix étapes sont saines. À 1366 × 768, trois d'entre elles
poussent le `wizard-footer` sous la ligne de flottaison :

| Étape | Dépassement du footer | Conséquence à l'écran |
|---|---|---|
| 4 — Modèle de LDM | 69 px | Boutons Retour / Continuer hors champ |
| 6 — Documents | 106 px | Case « KBIS » coupée en deux, footer invisible |
| 10 — Validation | 46 px | « Terminer » et « Créer l'arborescence » hors champ |

Le conteneur `.page` défile en interne, donc le bouton reste atteignable en
faisant défiler la zone — mais le cahier exige un footer « visible en
permanence » (§ 9.1), et un utilisateur qui ne voit pas le bouton considère
que l'écran est fini. **C'est le défaut le plus grave trouvé, et il touche la
référence gelée.** Il est corrigeable sans redessiner le parcours : la
correction porte sur les hauteurs et l'`overflow`, pas sur la maquette.

Défaut secondaire visible sur les mêmes captures : à 1366 px les dix libellés
du stepper se touchent sans espace (« SociétéDossier DriveContractant… »).

### 2.3 Vingt-quatre sous-titres de page à retirer

Le cahier interdit tout sous-titre sous le H1 (§ 3, § 11 « Titres », § 12).
Le code en compte 24 : `ec.js` 12, `collab.js` 7, `wizard.js` 4, `utils.js` 1.
Dix écrans de l'espace expert-comptable en affichent un aujourd'hui.

### 2.4 Les briques réclamées par le cahier existent toutes

Le § 9.1 liste les briques à réutiliser. Toutes sont présentes :

| Brique du cahier | État dans le dépôt |
|---|---|
| `FormSection` | `wizard.js:694`, utilisé 65 fois |
| `Stepper` | `utils.js`, utilisé par les deux assistants |
| `wizard-footer` | 22 usages, CSS en place |
| `radio-card` / `.large` | 12 usages dans `wizard.js` |
| `split-layout.with-detail` | 8 usages (`ec.js`, `collab.js`) |
| `two-col-preview` | présent |
| `BadgeAuto` / badges | présent (`wizard.js`) |
| `Card` / `table-wrap` / `usePagination` | présents (`utils.js`) |

Rien n'est à inventer côté briques de base. Les six composants demandés au
§ 9.2 (`ThemeHub`, `ActionListDetail`, `CampaignView`, `SourceInfoRow`,
`DocumentPreviewShell`, `FinalValidation`) n'existent pas encore, mais chacun
est un emballage de briques déjà là — c'est de la factorisation, pas de la
création.

### 2.5 Aucun score de conformité affiché

Le § 5.2 interdit tout score global. Un champ `score` est calculé dans
`data.js:323` pour l'analyse des anciennes lettres de mission (part des
rubriques présentes), mais **il n'est affiché nulle part**. À supprimer en
phase 8 pour qu'il ne ressorte pas par inadvertance.

---

## 3. Correspondance des 66 écrans du cahier avec le code actuel

| Situation | Nombre | Détail |
|---|---|---|
| **Gelés, à ne pas toucher** | 13 | S03–S15 (Reprise + Contractualisation) |
| **Existants à réutiliser / relocaliser** | 14 | S00, S01, S16, S17, S20, S21, S23, S24, S25, S29, S31, S39, S51, S62 |
| **À construire** | 39 | dont S52–S58 (pipeline documentaire) et S42–S50 (qualité) |

Correspondances précises pour les 14 écrans réutilisables :

| Écran V3 | Code actuel | Nature du travail |
|---|---|---|
| S00 Shell | `utils.js` `Sidebar` | Remplacer `NAV_EC` |
| S01 Accueil | `ec.js` `ECOverview` | Refonte en P1 + 5 actions + 4 campagnes |
| S16 Dossiers & anomalies | `ECAnomalies` + `AnomaliesPar*` | Retirer le sous-titre, sinon conserver |
| S17 Vue dossier | `ECDossiers` | Ajouter la fiche à 4 blocs |
| S20 Indépendance | `DeclarationIndependanceManager` | Passer en P4 (campagne) |
| S21 Dépendance économique | `DependanceEconomiqueForm` | Passer en P3 (liste + fiche) |
| S23 Équipe | `ECEquipe` | Passer en P3 |
| S24/S25 Formation | `FormationsLBCFTManager` | Scinder pilotage / fiche |
| S29 Supervision | `ECBilan` | Relocaliser sous Cycle client |
| S31 LBC-FT | `ECVigilance` | Devient un hub P1 |
| S34–S38 Mise à jour vigilance | `AnalyseVigilanceWizard` | 4 étapes → 5, briques déjà partagées |
| S39 Cartographie LBC-FT | `CartographieRisques` | **Voir § 6.1 — contradiction** |
| S51 Dossier de contrôle | `PreparationControleQualite` | Devient une sortie, plus un silo |
| S62 Paramètres | `ParametresCabinet` | Réduire à identité + intégrations |

Le travail neuf se concentre sur trois massifs : **les documents du cabinet**
(S52–S58, le plus lourd), **la qualité** (S42–S50), et **le RGPD / les outils**
(S26–S27B).

---

## 4. Plan par phases

Le cahier impose l'ordre des phases (§ 10). Je le suis sans le réarranger.
L'unité d'estimation est le **lot** : un incrément livré, vérifié par mesure et
commité. Un lot correspond à peu près à une séance de travail.

### Phase 0 — sécuriser (2 lots)

Le cahier demande « aucun changement visible ». Je m'en tiens là, à une
exception près qu'il autorise lui-même (§ 0.2 : « corriger un bug »).

1. Cartographier les routes et composants — **fait, § 2 et § 3 ci-dessus**.
2. Corriger le footer hors champ des étapes 4, 6 et 10 à 1366 × 768, et
   l'espacement du stepper. Correction de hauteurs uniquement : aucune
   modification de maquette, aucun changement de parcours.
3. Figer la référence : un test rejoue les deux assistants aux deux
   résolutions et échoue si un footer repasse sous la ligne de flottaison.

**Critère de sortie** : zéro régression, et les deux parcours d'entrée en
mission saines aux deux résolutions, footer visible aux 16 étapes.

### Phase 1 — design system (3 lots)

Écrire les six composants du § 9.2 en emballant les briques existantes, puis
les six patrons P1 à P6 comme usages canoniques. Aucun écran métier n'est
touché : on livre une bibliothèque et une page de démonstration interne qui
sert de référence visuelle.

**Critère de sortie** : les six patrons existent, chacun mesuré à 1366 × 768
sans défilement global.

### Phase 2 — navigation (2 lots)

Remplacer `NAV_EC` par les huit entrées du § 2, relocaliser Supervision bilan
sous Cycle client, construire les hubs S02, S18, S22, S31, S42, S52 comme
coquilles pointant vers les écrans existants. Les anciennes routes sont
redirigées, pas supprimées. Retirer les 24 sous-titres.

**Critère de sortie** : sidebar finale, aucune route morte, aucun sous-titre.

### Phase 3 — Documents du cabinet (6 lots)

S52 à S58 : catégories de dépôt, dépôt, extraction, confirmation, référentiel,
informations manquantes, documents générés. C'est le massif le plus lourd et
celui qui conditionne tout le reste, puisque le manuel et les modules vivants
consomment les données confirmées.

**Dépendance externe** : l'extraction réelle suppose la fonction Edge
côté serveur (la clé Anthropic ne peut pas vivre dans le navigateur). Tant
qu'elle n'est pas déployée, l'extraction est simulée — et **affichée comme
simulée**, conformément à la règle n° 1.

**Critère de sortie** : une source déposée produit une donnée confirmée,
réutilisée ailleurs sans ressaisie.

### Phase 4 — Gouvernance & Ressources (5 lots)

S18 à S27B. Rebrancher indépendance, dépendance et formation sur les modules
existants plutôt que les dupliquer. Construire Organisation & responsabilités,
Outils & prestataires, RGPD.

### Phase 5 — LBC-FT (4 lots)

S31 à S40B. Le wizard de mise à jour de vigilance part des composants déjà
partagés avec Contractualisation — ce travail est fait et testé, il reste à
passer de 4 à 5 étapes. Campagnes RBE et contrôles PPE/gel sur le patron P4.

### Phase 6 — Qualité (6 lots)

S42 à S51. Cartographie qualité, non-conformités, surveillance annuelle,
évaluation annuelle du SMQ, dossier de contrôle en sortie.

### Phase 7 — Manuel (4 lots)

S59 à S61A et le moteur de clauses et variables. Les annexes viennent des
modules vivants et des snapshots. Le manuel ne possède aucune copie privée
d'une variable (§ 1.3).

### Phase 8 — nettoyage (2 lots)

Suppression des routes mortes, du champ `score` inutilisé, vérification des
doublons de variables, responsive, et la recette complète du § 11.

**Total : environ 34 lots.** C'est un chantier de plusieurs semaines, pas
d'une séance. Chaque phase se termine par la discipline du § 10 : relancer
l'application, mesurer à 1440 × 900 puis 1366 × 768, rejouer les deux parcours
d'entrée en mission de bout en bout.

---

## 5. Ce que je ne ferai pas

Rappel du § 12, retenu tel quel : pas de dashboard à graphiques, pas de
sous-titres sous les H1, pas de sidebar à trois niveaux, pas de nouvelle
palette, pas d'éditeur de documents, pas de règle métier reléguée dans
Paramètres, pas de donnée redemandée alors qu'un autre module la détient, pas
de score de conformité, pas de septième patron d'écran, et surtout aucune
retouche « de modernisation » sur Entrée en mission.

---

## 6. Points qui appellent votre arbitrage

### 6.1 La cartographie des risques LBC-FT

Il y a une contradiction franche entre deux consignes, et elle porte sur du
travail livré il y a deux jours.

- Votre demande du 11 septembre : « cartographie des risques, reprends le
  formalisme comme lors de la contractualisation […] tout doit rentrer dans un
  écran, si c'est pas le cas on rajoute une étape ». Elle a été exécutée : la
  cartographie est aujourd'hui un assistant à cinq étapes.
- Le cahier V3, écran S39 : patron « P1 + synthèse », une seule page,
  recette obligatoire « la cartographie n'est **pas** un questionnaire
  indépendant », données agrégées depuis les analyses individuelles.

Le V3 étant postérieur et se déclarant prioritaire, **j'appliquerai le V3** en
phase 5 : la cartographie redevient un écran unique qui agrège les analyses,
avec « Arrêter la cartographie » pour seule action primaire. Dites-moi si vous
préférez conserver l'assistant — c'est le seul endroit où le V3 défait
explicitement quelque chose que vous aviez demandé.

### 6.2 L'espace collaborateur n'est pas couvert

Le § 2 ne décrit que la barre latérale de l'expert-comptable. L'application a
deux espaces, et `NAV_COLLAB` compte sept entrées (654 lignes dans
`collab.js`). Le cahier n'en dit rien : ni pour le conserver, ni pour
l'aligner, ni pour le supprimer.

Par défaut je le laisse **inchangé et fonctionnel** pendant les phases 0 à 7,
et je l'aligne sur le design system en phase 8. Si l'espace collaborateur doit
disparaître ou suivre la même refonte, il faut le dire : cela change
l'estimation d'environ six lots.

### 6.3 Deux dépendances qui ne sont pas de mon ressort

- La phase 3 ne peut pas brancher d'extraction réelle tant que la fonction Edge
  n'est pas déployée dans Supabase avec la clé Anthropic en secret serveur.
- Le projet Supabase est très probablement en pause pour inactivité. Tant
  qu'il ne l'est pas, l'application reste en mode démonstration et `DB_MODE`
  ne peut pas être basculé.

Aucune de ces deux dépendances ne bloque les phases 0, 1 et 2, qui peuvent
commencer immédiatement.

---

## 7. Journal d'exécution

Les huit phases sont livrées. Ce qui suit dit ce qui a été fait et, surtout, ce
qui a été trouvé en chemin : les défauts qu'une recette mesurée révèle et
qu'une relecture n'aurait pas vus.

| Phase | Livré | Recette |
|---|---|---|
| 0 — sécuriser | Pied d'étape rendu visible à 1366 × 768 | `tests/parcours_entree_en_mission.js` |
| 1 — design system | Les six patrons, `patrons.js` et `patrons.html` | `tests/patrons.js` |
| 2 — navigation | Onze entrées, quatre groupes, hubs, redirections | `tests/navigation.js` |
| 3 — documents | S52–S58, pipeline source → donnée confirmée | `tests/documents.js` |
| 4 — gouvernance & ressources | S19–S30 | `tests/organisation.js` |
| 5 — LBC-FT | S32–S40B | `tests/lbcft.js` |
| 6 — qualité | S43–S50 | `tests/qualite.js` |
| 7 — manuel | S59–S61A | `tests/manuel.js` |
| 8 — nettoyage | Paramètres vidés, recette générale | `tests/recette_v3.js` |

### Les défauts trouvés en route

Aucun de ces sept défauts n'était visible à la lecture du code. Tous ont été
trouvés en mesurant, et chacun a laissé derrière lui un test qui échoue s'il
revient.

1. **Six étapes de Contractualisation perdaient leur pied à 1366 × 768**, de 46
   à 106 px sous la ligne de flottaison. Sur l'étape de validation, « Terminer »
   était hors champ. Le défaut se masquait lui-même : le défilement résiduel de
   l'étape précédente faussait la mesure de la suivante.
2. **`SESSIONS_ATTENDUES_PAR_AN` n'existait nulle part** alors que le code s'en
   servait comme valeur de repli. Vider le champ « Sessions LBC-FT / an » — ce
   que l'écran autorisait — faisait disparaître l'écran Formations.
3. **La barre latérale dépassait de 64 px à 1366 × 768** une fois passée à onze
   entrées : la première sortait du champ.
4. **La campagne affichait six lignes** là où la barre de progression et les
   tuiles n'en laissaient tenir que cinq : la sixième était coupée en deux.
5. **Une réclamation pointait un dossier inexistant** (`sarl-dupont` au lieu de
   `sarl-dupont-immo`) : l'onglet Réclamations serait resté blanc.
6. **Une non-conformité « en attente d'efficacité » avait une échéance à
   venir.** L'état était stocké à côté des faits au lieu d'en être déduit ; il
   est désormais calculé.
7. **La supervision affichait vingt lignes par page**, forçant son tableau à
   défiler en plus d'être paginé — exactement le défaut que la pagination
   devait supprimer.

### Ce que la phase 8 a nettoyé

Les règles que le cabinet se donne — seuil de dépendance, nombre de sessions de
formation — ont quitté l'écran Paramètres pour le module qui les applique, comme
le § 62 l'exige. Elles restent stockées une seule fois : modifier le seuil
depuis l'écran Dépendance économique met à jour la liste, le compteur du hub et
le manuel. Les rôles Tracfin ont rejoint Organisation & responsabilités.
Paramètres ne garde que l'identité graphique, la signature et les connexions.

Le champ `score` des analyses de lettres a été renommé
`rubriques_presentes_pct`, des deux côtés. Il n'était affiché nulle part, mais
son nom invitait à le prendre pour un score de conformité — que le cahier
interdit. La migration `schema_003` porte le nouveau nom ; elle n'a pas encore
été appliquée.

Cinq écrans devenus inatteignables ont été retirés : l'ancienne conformité
cabinet, la liste des analyses de vigilance, l'assistant de vigilance à quatre
étapes, l'assistant de cartographie à cinq étapes et le gestionnaire de
déclarations d'indépendance.

### La recette finale

`tests/recette_v3.js` parcourt les onze entrées et toutes leurs cartes aux deux
résolutions — **quatre-vingts écrans** — et vérifie sur chacun les règles du
§ 11 : pas de défilement de page, pas de sous-titre, pas plus de six lignes
visibles, pas de liste paginée qui défile, une seule action primaire, aucun
bouton réduit à une icône seule, aucun score, et aucune valeur `undefined`,
`NaN` ou `[object` à l'écran.

### Ce qui reste

Les deux arbitrages du § 6 ont été tranchés en appliquant le cahier, qui est
postérieur : la cartographie LBC-FT est redevenue une photographie du
portefeuille, et l'espace collaborateur est resté intact, aligné seulement sur
la règle des sous-titres.

Restent hors de portée sans action de votre part : le déploiement de la
fonction Edge qui rendra l'extraction réelle, et la bascule de `DB_MODE` de
`demo` vers `supabase` une fois les migrations passées. Chaque écran concerné
affiche aujourd'hui en clair que l'extraction est simulée.
