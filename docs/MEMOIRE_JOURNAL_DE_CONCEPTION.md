# Journal de conception de ComplyEC — matière pour le mémoire

**Mémoire :** *Anticiper plutôt que subir le contrôle qualité dans les cabinets
d'expertise comptable de moins de 20 salariés — Méthode opérationnelle de
supervision documentaire permettant l'automatisation ciblée de certaines
diligences, l'assistance à leur réalisation et le suivi continu des anomalies*
**Candidat :** Paul LEGUAY — session de printemps, mai 2028
**Dépôt de la demande d'agrément :** septembre 2026

---

## À quoi sert ce fichier

Le plan détaillé demande, en trois endroits, de rendre compte de la conception
du prototype et de ce qu'elle a produit :

| Emplacement dans le plan | Ce qui est attendu | Ce que ce journal apporte |
|---|---|---|
| **P2 / Ch. 1 / S. 2 / §3** — OUTIL 1 | Traduire les exigences en règles de contrôle et en résultats exploitables | Le catalogue d'anomalies réellement implémenté, ses catégories, ses priorités, et les règles écartées |
| **P2 / Ch. 2 / S. 3 / §3** — OUTIL 2 | Consolider les résultats et formaliser le cahier des charges fonctionnel de ComplyEC | L'inventaire des écrans, des parcours et des fonctions, avec ce qui a été retenu et ce qui a été abandonné |
| **P3 / Ch. 1 / S. 3** — OUTIL 3 | Analyser les enseignements du pilote, en déduire les modifications nécessaires, arrêter une version stabilisée | Le registre des erreurs constatées, de leur origine et de la correction apportée |
| **P3 / Ch. 2 / S. 2** | Secret professionnel, responsabilités, journalisation | Les décisions d'architecture prises pour ces trois points |
| **P3 / Ch. 2 / S. 3** | Veille, circuit de modification, versionnage | Les règles de conservation et de datation des références retenues |
| **Annexe n° 1** | Déclaration d'usage de l'IA, à actualiser au dépôt | Le relevé des usages effectifs, alimenté au fil de l'eau |

Le journal est alimenté à chaque changement significatif. Il n'a pas vocation
à être recopié tel quel : c'est de la matière première, datée et vérifiable.

---

## 1. Le principe directeur, et ce qu'il a coûté

Une règle unique, écrite avant le premier écran, gouverne toutes les décisions
d'interface (fichier `CLAUDE.md` à la racine du dépôt) :

> La majorité des experts-comptables sont âgés et n'aiment pas le changement.
> L'interface doit être claire, leur faire gagner du temps, et ne contenir
> aucune erreur — ni sur le fond, ni sur la forme.

Cette règle a une conséquence méthodologique qui mérite d'être défendue dans le
mémoire : **elle rend certaines fonctionnalités interdites, même utiles.** Ont
été écartés pour cette seule raison :

- les gestes à deviner (glisser-déposer, menus contextuels, balayage) ;
- les raccourcis clavier comme *seul* accès à une fonction ;
- les icônes seules, sans intitulé, sur une action importante ;
- les animations qui retardent la lecture ;
- une navigation qui se déplace d'un écran à l'autre.

Elle impose aussi une méthode de vérification : **mesurer, pas raisonner.**
Toute affirmation sur la forme (« ça tient à l'écran », « le texte est
lisible ») est vérifiée par capture d'écran ou par mesure automatisée, jamais
par déduction. Ce point est développé au § 4.

---

## 2. Choix de conception structurants

### 2.1 Aucune chaîne de compilation

Le prototype est écrit en JavaScript exécuté tel quel par le navigateur
(`React.createElement`, aliasé `h`), sans JSX ni transpilation. Les
bibliothèques sont copiées dans le dépôt (`vendor/js/`), aucune n'est chargée
depuis un CDN.

**Motif** — un cabinet de moins de vingt salariés n'a pas d'informaticien. Un
dispositif qui exige `npm install`, une version de Node et une étape de
compilation pour changer une ligne est un dispositif qu'on n'ouvrira plus dans
deux ans. Ici, on ouvre le fichier, on modifie, on recharge la page.

**Contrepartie assumée** — le code est plus verbeux que du JSX, et l'absence
d'outillage de compilation prive d'un filet de sécurité (pas de vérification de
types). Elle est compensée par `node --check` sur chaque fichier modifié et par
un jeu de vérifications automatisées en navigateur (§ 4).

**Conséquence favorable non anticipée** — le prototype se distribue en un seul
fichier `.html` autonome (CSS et JS incorporés) qui s'ouvre sans installation,
sans serveur et sans réseau. C'est devenu le mode de démonstration principal.

### 2.2 Un point d'accès unique aux données (`db.js`)

Tous les écrans lisent et écrivent par un seul module, qui expose une vingtaine
de fonctions (`dbDossiers`, `dbAnomalies`, `dbLettresMission`, `dbVigilance`,
`dbEquipe`, `dbImporterDossiers`…). Un commutateur `DB_MODE` vaut `'demo'` ou
`'supabase'` :

- en `demo`, les fonctions renvoient le jeu d'essai ;
- en `supabase`, elles interrogent la base réelle.

**Motif** — permettre de concevoir, montrer et éprouver la méthode avant que la
base ne soit branchée, sans écrire deux fois les écrans.

**Ce que ça a coûté** — un test de parité, exécuté à chaque modification, vérifie
que le mode démonstration renvoie *exactement* ce que les écrans lisaient
auparavant en dur. Sans ce test, la bascule aurait introduit des écarts
silencieux.

**Erreur corrigée en cours de route** — trois écrans continuaient d'appeler
directement le client Supabase sans passer par `db.js` (« Mon équipe », l'import
de dossiers, la liste des collaborateurs pour le rapprochement). Hors base, ils
restaient bloqués sur « Chargement… » indéfiniment. Ils passent désormais par
`db.js` et **disent explicitement ce qui est simulé** plutôt que d'afficher une
liste vide sans explication.

### 2.3 Dire ce qui est simulé

Le prototype affiche, à chaque endroit concerné, la mention de ce qui n'est pas
réel : « Résultats de démonstration : client fictif », « Base non branchée :
cette liste vient du jeu de démonstration », « (démonstration) » dans les
messages de confirmation.

**Motif** — c'est une exigence de la règle directrice, mais c'est aussi une
exigence de la démonstration elle-même : un prototype qui laisse croire qu'il
interroge un registre alors qu'il rend une réponse figée ne prouve rien.

### 2.4 Trois décisions de sécurité prises et tenues

Ces trois points alimentent directement **P3 / Ch. 2 / S. 2** (sécurisation et
gouvernance) :

1. **Aucune clé d'API dans le navigateur.** La rédaction assistée de la synthèse
   de vigilance devait initialement appeler un service d'IA depuis la page. Une
   clé placée dans le fichier livré est lisible par tout utilisateur du cabinet
   et par toute personne à qui le fichier est transmis. La fonction est donc
   soit rendue localement à partir des seules saisies (état actuel), soit
   déportée vers une fonction serveur détenant seule le secret.
2. **Le stockage des documents n'est pas public.** Le compartiment de stockage
   est explicitement privé, avec des règles d'accès par cabinet : le secret
   professionnel ne s'accommode pas d'une URL devinable.
3. **Cloisonnement par cabinet vérifié, pas supposé.** Les règles de sécurité au
   niveau des lignes (RLS) reposent sur deux fonctions `user_cabinet_id()` et
   `is_ec_of_cabinet()`. Les migrations ont été **effectivement exécutées sur une
   base PostgreSQL 16 locale**, et l'isolation testée en créant deux cabinets et
   en vérifiant que l'un ne voit rien de l'autre. Une règle RLS non testée est
   une règle qu'on croit avoir écrite.

### 2.5 Ce qui a été volontairement laissé hors du prototype

Décisions prises avec le candidat, à documenter comme telles — elles délimitent
le périmètre annoncé en **P2 / Ch. 1 / S. 1 / §3** (justifier les exclusions) :

| Écarté | Motif retenu |
|---|---|
| Surveillance du système de management de la qualité | Complexifie sans répondre au besoin d'un cabinet de cette taille |
| Revue indépendante | Idem |
| Déclaration de soupçon | Se fait directement sur le site de Tracfin ; la dupliquer créerait un doublon de saisie et un risque d'écart |
| Acceptation et maintien de la relation | Déjà traités dans le logiciel comptable au moment du bilan |
| Interface tablette | Le poste de travail visé est un ordinateur ; concevoir pour un support non utilisé disperse l'effort |

Ces exclusions ne sont pas des renoncements techniques : ce sont des décisions
de périmètre motivées par l'organisation réelle du cabinet. Le mémoire gagnera à
les présenter ainsi.

---

## 3. Registre des erreurs — matière pour P3 / Ch. 1 / S. 3

C'est la section la plus utile au mémoire : elle documente **la nature réelle
des difficultés rencontrées**, pas celles qu'on imagine avant de commencer.
Trois familles distinctes se dégagent, et elles n'ont pas les mêmes remèdes.

### 3.1 Erreurs de fond : références réglementaires

**L'incident fondateur.** Un livrable a cité le **décret n° 2007-1387**, abrogé
et remplacé par le **décret n° 2012-432 du 30 mars 2012**. Un texte abrogé dans
un document remis à un client ou à un contrôleur est une faute grave. Règle
adoptée depuis : *ne jamais citer de mémoire ; toute référence est vérifiée et
datée avant d'être écrite.*

**Trois erreurs supplémentaires trouvées lors d'un audit systématique** de toutes
les références affichées :

| Erreur | Nature | Correction |
|---|---|---|
| « Limites des travaux » attribuée à la NP 2300 | Attribution à une norme qui ne l'impose pas | Requalifiée en pratique de cabinet |
| « La classification des risques doit être révisée annuellement » | L'art. L. 561-4-1 CMF ne fixe aucune périodicité chiffrée | Mention supprimée ; le libellé indique désormais ce que fait l'écran, pas une obligation inventée |
| Déclaration annuelle d'indépendance présentée comme une obligation de forme | Confusion entre l'obligation d'indépendance et une modalité choisie par le cabinet | Présentée comme une règle interne du cabinet |

**Enseignement pour le mémoire** — le risque n'est pas seulement d'oublier une
obligation : c'est d'en **inventer une**, ou d'attribuer à une norme une exigence
qu'elle ne pose pas. Un dispositif de supervision documentaire qui affiche une
obligation inexacte fait perdre du temps au cabinet et le décrédibilise devant
le contrôleur. D'où la règle de conception retenue : **chaque exigence affichée
porte sa source, et la source porte sa date.**

Références actuellement citées dans le prototype, toutes vérifiées :
décret n° 2012-432 (art. 141 à 169 du code de déontologie, dont 145 mise à jour
des connaissances, 146 indépendance, 151 lettre de mission) ; NPMQ (arrêté du
30 mai 2024, applicable depuis le 1er janvier 2025, huit composantes) ; NP 2300
(arrêté du 1er septembre 2016) ; CMF art. L. 561-2-2, L. 561-4-1, L. 561-5,
L. 561-5-1, L. 561-15, L. 561-32, L. 561-33, R. 561-18, R. 561-20-2, R. 561-23
et **D. 561-38-1-1**, créé par le décret n° 2026-310 du 24 avril 2026, en vigueur
depuis le 26 avril 2026.

### 3.2 Erreurs de fond : la donnée qui se contredit elle-même

Deux occurrences, de même nature, à documenter ensemble.

**Cas 1 — deux écrans, deux vérités.** L'écran de synthèse annonçait « 6 lettres
de mission manquantes, 0 non actualisée » tandis que l'écran de suivi affichait
« 0 absente, 10 à traiter ». Origine : deux jeux de données décrivant la même
réalité (le catalogue d'anomalies et le registre des lettres de mission) sans
lien entre eux. Correction : les anomalies pointent désormais vers des dossiers
qui existent réellement dans le registre, et un test automatisé vérifie à chaque
modification qu'aucune anomalie ne contredit le registre.

**Cas 2 — le reproche adressé avant l'événement.** Une session de formation
LBC-FT **programmée dans huit jours** était comptée « attestation en attente »
pour ses cinq participants, proposait un bouton de relance, et figurait au
**registre remis au contrôleur** comme « attestation non reçue ». Le compteur
affichait 8 manques là où il n'y en avait que 3. Correction : la séance à venir
est signalée comme telle à l'écran et « séance non encore tenue » au registre.

**Enseignement pour le mémoire** — c'est exactement le faux positif que la
Partie 3 se propose de mesurer, et il est instructif : il ne vient pas d'une
règle de contrôle mal écrite, mais de **l'absence de prise en compte du temps**.
Une règle de supervision documentaire doit savoir distinguer « la preuve manque »
de « la preuve n'est pas encore due ». À généraliser à toutes les diligences
périodiques.

### 3.3 Erreurs de forme : ce que le raisonnement ne voit pas

Elles sont nombreuses, elles se ressemblent, et elles ont toutes la même
origine : **une conviction sur le rendu, non vérifiée par la mesure.**

| Symptôme | Origine réelle |
|---|---|
| Icônes numérotées invisibles | Texte blanc sur pastille blanche |
| Une liste lue de travers (l'élément 1 à côté de l'élément 5) | Mise en colonnes CSS, qui remplit colonne par colonne et non ligne par ligne |
| Deux colonnes décalées de 22 px | Marge appliquée à une rubrique suivant une autre, sans effet visible ailleurs |
| Barres de répartition invisibles | Un dégradé passé à une propriété qui n'accepte qu'une couleur unie : la déclaration est ignorée en silence |
| Bouton « Continuer » hors de l'écran | Contenu plus haut que la zone visible, sans cadre de défilement dédié |
| Sixième ligne d'un tableau de bord rognée de 7 px | Hauteur plancher des lignes plus grande que la place disponible |
| Badge étiré sur 1 025 px | Élément placé dans une colonne flexible qui étire ses enfants par défaut |
| Libellés coupés par des points de suspension | Colonnes trop étroites pour le texte réel |

**Enseignement pour le mémoire** — aucune de ces erreurs n'aurait été trouvée par
relecture du code. Toutes ont été trouvées par mesure automatisée ou par capture
d'écran. C'est l'argument central de la méthode de vérification décrite au § 4,
et c'est transposable au dispositif lui-même : *une règle de contrôle qui n'a
jamais été confrontée à une donnée réelle n'est pas une règle éprouvée.*

### 3.4 Erreurs de méthode dans la vérification elle-même

À documenter, car c'est un piège que le pilote de la Partie 3 rencontrera.

**La sonde de contraste, trois versions.** Pour vérifier que chaque texte est
lisible sur son fond, une première sonde a été écrite : elle traitait tout fond
en dégradé comme du blanc, et signalait des dizaines de faux problèmes. La
deuxième analysait les étapes du dégradé — meilleure, encore fausse dans les
cas superposés. Seule la troisième, qui **échantillonne le pixel réellement
affiché derrière chaque texte**, donne un résultat exploitable.

**Un échec de test qui n'était pas un défaut.** La génération de la lettre de
mission au format Word semblait échouer. Mesure faite : le fichier était bien
produit et le téléchargement bien déclenché ; c'est le harnais de test qui
visait un point de l'écran occupé par un champ de sélection de fichier
transparent recouvrant le bouton. **Le défaut était dans l'instrument de
mesure, pas dans le produit.**

**Enseignement pour le mémoire** — dans l'évaluation du pilote (P3 / Ch. 1 /
S. 2, « mesurer la justesse des résultats produits par la méthode »), il faudra
distinguer trois catégories et non deux : anomalie réelle, faux positif de la
règle, et **artefact de l'instrument de mesure**. Confondre les deux dernières
conduit à modifier une règle qui fonctionnait.

---

## 4. La méthode de vérification retenue

Elle est reproductible et vaut d'être décrite dans le mémoire, car elle répond
à l'exigence de « vérifier les corrections sensibles » (P3 / Ch. 1 / S. 3 / §3).

À chaque modification, dans cet ordre :

1. **Contrôle syntaxique** de chaque fichier modifié (`node --check`).
2. **Balayage automatisé de tous les écrans** en 1440×900 : détection de tout
   élément qui déborde de la fenêtre, de tout contenu rogné sans possibilité de
   défiler, de toute erreur JavaScript. Actuellement 24 écrans expert-comptable,
   12 écrans collaborateur, 10 étapes de l'assistant de contractualisation,
   3 étapes de la reprise déontologique, 5 étapes de la cartographie.
3. **Sonde d'alignement** : vérification que les colonnes des grilles sont
   effectivement alignées, au pixel.
4. **Sonde de contraste** par échantillonnage du pixel réel.
5. **Contrôle des documents produits** (Word, PDF) : ouverture du fichier généré
   et vérification de la présence effective de chaque mention attendue.
6. **Test de parité de la couche de données** (§ 2.2).
7. **Tests de calcul et d'écran des anomalies** : références valides, unicité des
   identifiants, cohérence des totaux par catégorie, par collaborateur et par
   dossier, exactitude des filtres et des tris.
8. **Revue mobile** sur un appareil simulé.
9. **Suppression du harnais de test avant enregistrement** dans le dépôt.
10. **Régénération et vérification du fichier autonome.**

Aucune de ces étapes n'est facultative : chacune a déjà attrapé au moins un
défaut réel.

---

## 5. Journal chronologique des modifications

> Format retenu : ce qui a changé, pourquoi, et ce que ça enseigne. À compléter
> à chaque livraison significative.

### 2026-09-02 — Espace collaborateur mis au niveau de l'espace expert-comptable

L'espace collaborateur n'avait jamais fait l'objet d'une revue de forme
systématique. Le balayage a révélé quatre défauts (ligne rognée de 7 px, carte
étirant une ligne unique sur 248 px, badge basculant sous son libellé, badge
étiré sur toute la largeur d'une carte) et deux erreurs de fond (§ 3.2, cas 2).
Trois écrans court-circuitaient la couche de données (§ 2.2).

*Enseignement* — une partie du produit qui n'a pas subi la même vérification que
le reste accumule silencieusement des défauts de même nature. Pour le pilote de
la Partie 3 : appliquer le protocole d'évaluation à **tout** le périmètre, pas
seulement aux parcours mis en avant.

*Piste écartée, documentée* — forcer les noms de dossier sur une seule ligne
faisait apparaître un défilement horizontal sur trois tableaux, plus gênant
qu'un nom replié. Le renoncement est consigné en commentaire dans la feuille de
style pour qu'il ne soit pas retenté.

### 2026-09-02 — Reprise du courrier, de l'arborescence et des étapes de vigilance

Onze demandes de correction formulées après usage. Elles se répartissent en
trois catégories qui recoupent la typologie du § 3 :

**Documents produits (fond).** L'aperçu du courrier de reprise déontologique
n'était qu'un bloc de texte : il devient un courrier professionnel complet
(en-tête du cabinet, bloc destinataire, lieu et date, objet, signature). Décision
de conception : **un seul gabarit HTML sert à l'aperçu, au document Word et à
l'impression PDF**, pour garantir que ce qui est relu est exactement ce qui part.
Au passage, un défaut réel : le courrier ignorait le nom et l'adresse
électronique du confrère saisis à l'étape précédente et reprenait ceux du
scénario de démonstration.

**Densité et hiérarchie de l'information (forme).** L'étape « Qui est derrière le
client » mélangeait trois sujets dans une seule colonne (bénéficiaires effectifs,
personne politiquement exposée, origine des fonds) et affichait la description
de cinq bases de données avant même de les avoir interrogées. Restructurée : les
bénéficiaires se lisent comme un tableau, l'origine des fonds a sa rubrique, et
le détail d'une vérification n'apparaît qu'une fois le résultat connu.

**Retour d'information manquant.** À l'étape de cotation du risque, l'utilisateur
notait quatre critères sans voir ce qu'ils déclenchaient : le niveau de vigilance
n'apparaissait qu'à l'étape suivante. Il s'affiche désormais sous les critères.

*Enseignement pour le mémoire* — ces demandes ne portent presque jamais sur
« que fait le logiciel » mais sur « comment il me le montre ». Dans un dispositif
destiné à des professionnels expérimentés mais peu familiers des logiciels
récents, **la charge de conception se déplace du calcul vers la présentation du
résultat**. C'est un constat à confronter aux entretiens semi-directifs prévus en
P1 / Ch. 2 / S. 1 / §3.

---

## 6. Relevé d'usage de l'intelligence artificielle

À reporter dans l'annexe n° 1 lors du dépôt du mémoire, qui prévoit
expressément son actualisation. Les usages ci-dessous s'ajoutent à ceux déjà
déclarés dans la notice d'agrément.

| Outil | Usage précis | Vérification et apport personnel du candidat |
|---|---|---|
| Claude (Anthropic) | Assistance au développement informatique du prototype ComplyEC : rédaction, correction et explication de code ; écriture des sondes de vérification automatisée | Le périmètre fonctionnel, les règles de contrôle, les exigences retenues et les résultats attendus sont définis par le candidat. Chaque écran produit est relu, essayé et corrigé sur demande du candidat ; les onze corrections du 2 septembre 2026 en sont un exemple documenté |
| Claude (Anthropic) | Audit des références réglementaires affichées par le prototype | Les trois erreurs relevées (§ 3.1) ont été **vérifiées par le candidat sur les textes eux-mêmes** avant correction. L'IA n'est pas utilisée comme source réglementaire autonome : elle signale, le candidat tranche |
| Claude (Anthropic) | Rédaction du schéma de base de données et des règles de cloisonnement | Les migrations ont été exécutées et l'isolation entre cabinets testée sur une base locale par le candidat avant toute mise en service |

**Point à mentionner dans l'annexe actualisée** — la synthèse de vigilance
proposée par le prototype est, en l'état, **rédigée localement à partir des
seules saisies de l'utilisateur, sans appel à un service extérieur**. Si un
appel à un service d'IA était introduit, il devrait l'être côté serveur (§ 2.4)
et être déclaré comme un usage de l'IA *par le dispositif*, distinct de l'usage
de l'IA *par le candidat pour produire le mémoire*. Cette distinction mérite
d'être posée explicitement.

---

## 7. Questions ouvertes à trancher

À reprendre lors des prochaines séances de travail.

1. **Périodicité des diligences.** Le § 3.2 montre qu'une règle doit savoir si
   une preuve est due. Faut-il ajouter au référentiel (OUTIL 1) une colonne
   « échéance de la diligence » distincte de « date du dernier justificatif » ?
2. **Traitement des faux positifs.** Le plan prévoit de les mesurer (P3 / Ch. 1 /
   S. 2 / §1). Faut-il prévoir dans le prototype un moyen de marquer une anomalie
   comme faux positif, avec motif, pour alimenter la révision des règles ?
3. **Journalisation.** P3 / Ch. 2 / S. 2 / §3 demande de conserver les traces
   permettant de reconstituer les décisions prises. Rien n'est encore fait sur ce
   point : à concevoir avant le pilote, pas après.
4. **Versionnage des règles.** P3 / Ch. 2 / S. 3 / §2 demande le rattachement de
   chaque résultat à la version de règle applicable. À prévoir dans le schéma de
   base avant que des résultats ne s'accumulent.
