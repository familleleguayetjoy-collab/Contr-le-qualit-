# Raccordements extérieurs de ComplyEC

Ce fichier tient l'état de ce qui est branché, de ce qui ne l'est pas, et de ce
qu'il faut faire pour que ça le soit. Il existe parce qu'une promesse orale se
perd : le jour où l'écran affichera « classé dans le Drive », il faudra pouvoir
montrer quand et comment le connecteur a été posé.

Règle de fond, valable pour tous : **aucun secret ne descend dans le
navigateur.** Une clé, un jeton, un mot de passe placés dans la page sont
lisibles par tout utilisateur du logiciel, et tout appel fait avec eux est
imputé au cabinet. Chaque raccordement passe donc par une fonction serveur.

---

## 1. Registre national des entreprises (INPI) — écrit, à déployer

**Ce que ça fait.** Récupère au registre, pour un SIREN, les statuts déposés
(constitutifs et mis à jour). C'est le bouton « Récupérer les statuts » de
l'étape « Documents » de la contractualisation. Depuis le 18 octobre 2026, seuls
les statuts sont retenus ; l'extrait d'immatriculation s'obtient par le second
bouton, « Extrait du RNE », qui ouvre data.inpi.fr dans un nouvel onglet avec le
SIREN copié, et le PDF se dépose depuis le poste.

**État au 18 octobre 2026.** La fonction n'est **pas déployée** : un clic sur
« Récupérer les statuts » renvoyait « Failed to send a request to the Edge
Function ». L'écran dit maintenant en français que la récupération automatique
n'est pas encore branchée, et propose le dépôt manuel.

**Où c'est écrit.**

| Pièce | Fichier |
|---|---|
| Fonction serveur | `supabase/functions/inpi-actes/index.ts` |
| Appel depuis la page | `db.js`, `inpiListerPieces` et `inpiTelechargerPiece` |
| Écran | `wizard.js`, `DocumentsJuridiques` |

**Ce qu'il reste à faire.**

1. Créer un compte sur `data.inpi.fr`, puis demander dans l'espace personnel
   (« Mes accès API / SFTP ») l'accès aux API « Actes » et « Comptes annuels ».
2. `supabase functions deploy inpi-actes`
3. `supabase secrets set INPI_USERNAME=… INPI_PASSWORD=…`

**Ce qu'il faudra vérifier au premier appel réel.** Les routes ont été relevées
sur la documentation publique et sur des intégrations existantes ; la
documentation technique de l'INPI n'a pas pu être ouverte depuis
l'environnement de développement, dont la sortie réseau est filtrée. À
confirmer : `POST /api/sso/login` avec `{username, password}`,
`GET /api/companies/{siren}/attachments`, et
`GET /api/{actes|bilans|bilansSaisis}/{id}/download`. Si l'une d'elles a changé,
l'écran affiche ce que l'INPI a répondu — l'erreur est lisible, pas muette.

**Quota.** 10 000 appels par jour. Un dossier consomme un appel de liste plus un
appel par acte téléchargé.

**Ce qui n'est pas couvert.** Le registre des bénéficiaires effectifs. Depuis le
31 juillet 2024, son accès suppose une demande préalable au titre de la qualité
d'assujetti, avec le compte professionnel de l'expert-comptable. Il reste donc
une consultation manuelle, et ComplyEC enregistre ce qui y a été constaté.

---

## 2. Drive du cabinet — à faire

**Décision prise le 22 septembre 2026 : le connecteur Drive sera raccordé.**
C'est le dernier maillon manquant de la chaîne documentaire : sans lui,
ComplyEC sait où doit aller chaque pièce et ne l'y met pas.

**Ce qui attend ce connecteur**, écran par écran :

| Écran | Ce qui se débloque |
|---|---|
| Contractualisation, étape « Dossier Drive » | Créer réellement l'arborescence du client au lieu de lister les dossiers à créer |
| Contractualisation, étape « Documents juridiques » | Déposer les actes récupérés à l'INPI à leur emplacement, au lieu de les garder en mémoire de page |
| Note de synthèse (espace collaborateur) | Classer la note au dossier de l'exercice quand le collaborateur la valide |
| Attestations d'indépendance | Classer l'attestation signée au dossier du cabinet |
| Attestation PPE | Classer l'attestation retournée par le client au dossier permanent |
| État de dépendance économique | Classer le document horodaté produit à l'arrêté |
| Contrats des prestataires | Déposer le contrat au dossier « Prestataires » |
| Anomalies | Détecter qu'une pièce manquante est arrivée, au lieu de la pointer à la main |
| Paramètres du collaborateur, « Créer un dossier » | Créer l'arborescence `DRIVE_TREE` du nouveau dossier |
| Paramètres du collaborateur, « Actualiser mes dossiers » | Lister les dossiers du Drive absents de ComplyEC et les y créer (bouton désactivé d'ici là) |
| Paramètres du collaborateur, « Ranger un dossier avec Claude » | Voir la section 4 (bouton désactivé d'ici là) |

**Ce qu'il faudra trancher avant d'écrire la fonction.**

1. **Quel Drive.** Google Workspace, Microsoft 365, ou un espace documentaire
   métier. Le cabinet utilise Google Workspace d'après le registre des
   prestataires : à confirmer.
2. **Quel compte porte les fichiers.** Un compte de service au nom du cabinet,
   ou le compte de l'utilisateur connecté. Le second trace mieux qui a déposé
   quoi ; le premier survit au départ d'un collaborateur.
3. **Où est la racine.** Le chemin type est déjà décidé côté ComplyEC
   (`destinationJuridique` dans `data.js`) ; il faut l'ancrer sous un dossier
   réel.
4. **Le secret professionnel.** Les documents sont couverts par l'article 21 de
   l'ordonnance du 19 septembre 1945 et l'article 226-13 du code pénal. Le
   partage du dossier d'un client ne doit jamais être ouvert au-delà des
   personnes qui en ont la charge — c'est un point à vérifier à la mise en
   service, pas une fois le premier dossier déposé.

**Forme attendue.** Une fonction serveur `drive-deposer`, sur le modèle de
`inpi-actes` : elle reçoit le chemin et le contenu, elle détient seule les
identifiants, et elle rend l'identifiant du fichier déposé. Côté page, une
seule fonction `driveDeposer(chemin, nom, contenu)` dans `db.js`, et la
capacité `drive` bascule en `mode: 'real'` — ce qui fait tomber d'un coup
toutes les mentions « le connecteur n'est pas paramétré » disséminées dans les
écrans, puisqu'elles sont toutes conditionnées à cette capacité.

---

## 3. Envoi des courriels — à faire

Aucun service d'envoi n'est raccordé. ComplyEC rédige la relance consolidée,
l'enregistre à sa date, et l'ouvre dans la messagerie du cabinet : c'est
l'utilisateur qui envoie. Le jour où un service sera posé, c'est la capacité
`sendEmail` qui bascule.

Trois écrans ouvrent aujourd'hui la messagerie par un lien `mailto:` :
la relance consolidée des anomalies, la demande de pièces au client à l'étape
« Documents » de la contractualisation, et — depuis le 23 septembre — la
campagne d'attestations d'indépendance.

Ce qui manque pour que les destinataires soient préremplis : les cinq
collaborateurs du jeu de démonstration n'ont pas d'adresse. Un collaborateur
créé dans Paramètres › Utilisateurs en a une, et elle est reprise. Le jour où
l'équipe réelle sera saisie, le champ existe déjà.

Ce qui ne se fera jamais tout seul tant qu'il n'y a pas de serveur : rien ne
part à une date. Au 1er janvier, la nouvelle année apparaît d'elle-même dans
la campagne d'indépendance et la synthèse du contrôle la compte comme à faire,
mais les attestations se génèrent d'un clic. L'écran le dit en toutes lettres.

---

## 3 bis. Paramétrage d'un dossier client — à décider

Question posée le 24 septembre, et elle est juste : un dossier créé dans le
Drive sans rien dedans et sans réglage dans ComplyEC déclenche des alertes sur
tous les points, alors que le logiciel ne sait même pas combien de pièces
d'identité ou d'attestations PPE ce dossier appelle.

Ce que ComplyEC sait aujourd'hui d'un dossier : si une pièce est présente dans
l'espace documentaire, ou si elle n'y est pas. Rien d'autre. Il ne sait pas
combien de bénéficiaires effectifs compte la société, donc pas combien
d'attestations PPE sont attendues, donc pas si le compte est bon.

La piste retenue, à instruire : le collaborateur paramètre le dossier à sa
création, depuis les statuts. Les statuts donnent la forme juridique, les
associés et leurs parts — de quoi dire combien de personnes sont concernées.
Le registre des bénéficiaires effectifs, lui, n'est consultable que par
l'expert-comptable inscrit, donc il ne peut pas servir de source au
collaborateur.

Quatre points à trancher avant de coder quoi que ce soit :

- qui paramètre : le collaborateur à la création, ou l'expert-comptable à la
  première revue ;
- ce qui est demandé au minimum : nombre de bénéficiaires effectifs, présence
  d'une mission sociale, niveau de vigilance initial ;
- ce qui se passe tant que le dossier n'est pas paramétré : une seule alerte
  « dossier non paramétré », et non une alerte par pièce manquante ;
- si les statuts déposés peuvent être lus automatiquement, ce qui suppose la
  fonction serveur du point 4.

Tant que ce n'est pas tranché, ComplyEC ne compte pas les pièces attendues :
il dit seulement ce qui est là et ce qui n'y est pas.

---

## 3 ter. Cartographie des risques LBC-FT — ce qui reste à collecter

Le cabinet a remis sa propre cartographie le 25 septembre. La comparaison avec
ce que ComplyEC conservait a montré quatre manques, tous du même genre : le
logiciel cotait le risque sans garder le fait qui le fonde.

Les quatre sont comblés depuis : la division NAF, le pays du siège, le pays de
résidence des bénéficiaires effectifs et la nature de l'exposition
internationale se saisissent à la première étape du parcours d'analyse.

Ce qui reste à décider :

- **La liste des pays tiers à haut risque n'est pas interrogée.** Elle évolue
  par règlement délégué de la Commission européenne. La case « ce pays figure
  sur la liste » se coche à la main, après consultation, et l'écran donne le
  lien. L'automatiser suppose une source ouverte et versionnée, à trouver.
- **Le code NAF n'est pas récupéré à l'entrée en relation.** Il figure dans la
  fiche INPI du dossier. Le connecteur du point 1 le rendrait disponible sans
  saisie ; d'ici là, il se choisit dans une liste de divisions.
- **Les dossiers écartés du périmètre** sont conservés avec leur motif et leur
  date, et le document les liste. Aucune expiration n'est posée : un dossier
  écarté le reste jusqu'à ce que le cabinet le réintègre. À revoir si
  l'expérience montre que des dossiers y restent oubliés.

---

## 4. Lecture automatique des documents — à faire

Demande une fonction serveur tenant une clé Anthropic. Même règle que le reste :
jamais dans le navigateur.

**Usage visé (22 octobre, précisé le 28).** Le périmètre est le Drive entier
ou un dossier choisi. Claude en lit les pièces, propose un nom
(`AAAA-MM_TYPE_Dossier_Personne`) et un emplacement dans l'arborescence du
cabinet ; l'écran présente la liste des propositions et le collaborateur
valide (en bloc ou ligne par ligne) avant tout renommage ou déplacement.

**Ce qu'il faut pour l'activer.** 1. le connecteur Drive (compte de service ou
OAuth du cabinet, droits limités au Drive du cabinet) ; 2. une fonction
serveur qui tient la clé API Anthropic du cabinet ; 3. une table qui mémorise
chaque fichier traité (identifiant Drive, date de modification, nom proposé,
décision, auteur). Le bouton « Lancer le rangement » des Paramètres
collaborateur reste grisé tant que 1 et 2 ne sont pas posés.

**Maîtrise du coût.** Le traitement est déclenché par un bouton, jamais en
continu. Chaque fichier traité est mémorisé avec son empreinte (identifiant
Drive et date de modification) : un nouveau passage ne lit que les fichiers
nouveaux ou modifiés. La lecture se fait d'abord sur le nom et la première
page ; le document entier n'est lu que si cela ne suffit pas. L'appel passe
par l'API Anthropic avec la clé du cabinet, côté serveur — un abonnement
individuel aux applications Claude ne s'utilise pas depuis un logiciel tiers.

## 4 bis. Annuaire des entreprises — écrit, à vérifier

`rechercherEntreprise()` (`data.js`) interroge l'API publique « Recherche
d'entreprises » (recherche-entreprises.api.gouv.fr), sans clé. Elle sert à la
division d'activité de l'analyse de vigilance et à la création d'un dossier.
L'appel n'a pas pu être vérifié depuis l'environnement de développement, dont
la sortie réseau est filtrée : en cas d'échec, l'écran le dit et retombe sur
le jeu de démonstration.

---

## 5. Base de données Supabase — écrite, à exécuter

Les trois migrations (`supabase/schema.sql`, `schema_002_donnees_metier.sql`,
`schema_003_lettres_et_vigilance.sql`) n'ont pas encore été exécutées. Tant
qu'elles ne le sont pas, `DB_MODE` vaut `'demo'` dans `db.js` et les données
vivent dans le navigateur. Le passage en base suppose aussi :

- la création du bucket de stockage `documents`, **non public** (secret
  professionnel) ;
- le déploiement de `invite-collaborateur` ;
- le renseignement des paramètres du cabinet.
