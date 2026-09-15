# Audit des fonctions factices — phase A (§ 42 du prompt V6)

État au 15 septembre 2026, avant la refonte des écrans.

Une action factice est un bouton qui annonce un résultat que le logiciel n'a pas
produit. C'est le défaut le plus grave que puisse avoir ComplyEC : l'utilisateur
croit son obligation remplie, ferme l'écran, et découvre le contraire devant un
contrôleur. L'inventaire ci-dessous recense **61 emplacements** où un `onClick`
annonce un résultat sans écrire la moindre donnée, les **9 mentions** qui
décrivent honnêtement le jeu de démonstration et doivent être conservées, et les
**22 actions** qui, elles, écrivent déjà réellement.

Le § 42 demande de ne pas supprimer aveuglément toutes les mentions
« démonstration ». Quatre catégories les séparent :

| Catégorie | Ce que cela veut dire | Ce qu'il faut en faire |
|---|---|---|
| `internal_action_to_implement` | ComplyEC peut réellement exécuter l'action : elle ne dépend que de ses propres données | Brancher l'écriture sur la couche de données et retirer la mention |
| `external_capability` | L'action dépend d'un service extérieur absent (messagerie, INPI, Drive, archive ZIP) | Remplacer par la saisie du résultat constaté, ou ne rien afficher — jamais un faux succès |
| `demo_copy_only` | Le texte décrit honnêtement le jeu de démonstration | Conserver tel quel |
| `working_demo_seed` | L'action écrit déjà réellement dans le calque de démonstration | Retirer la mention « (démonstration) », devenue fausse |

---

## 1. `internal_action_to_implement` — 40 emplacements

L'action ne dépend que des données du cabinet. Depuis la phase A, la couche de
données sait les écrire et elles survivent au rechargement : il ne reste qu'à
relier le bouton.

| Emplacement | Action annoncée | Écriture réelle attendue |
|---|---|---|
| `collab.js:300` | Analyse de vigilance enregistrée | `dbEnregistrerAnalyse` |
| `collab.js:463` | Brouillon de note enregistré | calque local |
| `collab.js:464` | Note de synthèse transmise | calque local |
| `collab.js:491` | Statut d'anomalie mis à jour | calque local |
| `collab.js:254` | Avenant généré | hors périmètre (§ 38 : pas de module LDM hors Entrée en mission) — **retirer le bouton** |
| `documents.js:267` | Information corrigée | `dbMajInformation` |
| `documents.js:268` | Information marquée « non trouvée » | `dbMajInformation` |
| `documents.js:358` | Information canonique modifiée | `dbMajInformation` |
| `documents.js:408` | Informations complétées | `dbConfirmerInformations` |
| `documents.js:495` | Document régénéré | génération Word (capacité réelle) |
| `documents.js:543` | Document généré | génération Word (capacité réelle) |
| `ec.js:624` | Supervision validée et dossier archivé | calque local |
| `ec.js:928` | Anomalie marquée terminée | calque local |
| `ec.js:1324` | Parcours de refonte ouvert | simple navigation |
| `ec.js:2083` | Paramètres du cabinet enregistrés | `dbMajReglage` |
| `lbcft.js:361` | Vigilance mise à jour et historisée | `dbEnregistrerAnalyse` |
| `lbcft.js:392` | Cartographie arrêtée | `dbArreterCartographie` |
| `manuel.js:268` | Manuel publié | `dbPublierManuel` (la diffusion, elle, est externe — voir § 2) |
| `manuel.js:320` | Manuel téléchargé | génération Word (capacité réelle) |
| `organisation.js:47` | Responsables modifiés | `dbMajRole` |
| `organisation.js:223` | Fiche collaborateur modifiée | calque local |
| `organisation.js:302` | Formation ajoutée | `dbAjouterSessionFormation` |
| `organisation.js:367` | Attestation jointe | `dbEnregistrerAttestation` |
| `organisation.js:375` | Formation ajoutée | `dbAjouterSessionFormation` |
| `organisation.js:456` | Outil ou prestataire ajouté | calque `prestataires` |
| `organisation.js:533` | Traitement RGPD modifié | calque local |
| `organisation.js:541` | Traitement RGPD ajouté | calque local |
| `organisation.js:602` | Réclamation clôturée | `dbCloturerReclamation` |
| `organisation.js:621` | Réclamation ajoutée | `dbAjouterReclamation` |
| `qualite.js:30` | Revue de cartographie lancée | calque `risquesQualite` |
| `qualite.js:73` | Risque écarté | `dbValiderRisqueQualite` (motif obligatoire) |
| `qualite.js:193` | Non-conformité ajoutée | `dbCreerNonConformite` |
| `qualite.js:231` | Traitement de NC enregistré | `dbMajNonConformite` |
| `qualite.js:308` | Contrôle d'efficacité enregistré | `dbMajNonConformite` |
| `qualite.js:441` | NC créée depuis une réclamation | `dbCreerNonConformite` |
| `qualite.js:521` | Rapport de surveillance finalisé | calque local |
| `qualite.js:541` | Évaluation annuelle validée | calque local |
| `wizard.js:52` | Aperçu du courrier | génération Word (capacité réelle) |
| `wizard.js:1480` | Brouillon enregistré | calque local |
| `wizard.js:1573` | Dossier créé | écritures déjà disponibles |

## 2. `external_capability` — 22 emplacements

Aucune de ces actions ne peut aboutir ici. Le registre des capacités (`db.js`,
`CAPACITES`) en porte la raison ; l'écran doit proposer la saisie du résultat
constaté, ou ne rien proposer du tout.

| Emplacement | Action annoncée | Capacité manquante |
|---|---|---|
| `collab.js:253` | Téléchargement du PDF signé | stockage de fichiers |
| `collab.js:279` | Demande de mise à jour envoyée au client | `sendEmail` |
| `collab.js:616` | Attestation transmise à l'expert-comptable | stockage de fichiers |
| `documents.js:159` | Ouverture du fichier déposé | stockage de fichiers |
| `ec.js:25` | Rapport exporté | `zipExport` |
| `ec.js:491` | Export généré | `zipExport` |
| `ec.js:680` | Relance envoyée aux collaborateurs | `sendEmail` |
| `ec.js:839` | Demande de régularisation envoyée | `sendEmail` |
| `ec.js:927` | Relance du collaborateur | `sendEmail` |
| `ec.js:954` | Relance du collaborateur | `sendEmail` |
| `ec.js:1368` | Export du portefeuille | `zipExport` |
| `ec.js:1651` | Rappel aux non-signataires | `sendEmail` |
| `ec.js:1653` | Nouvelle version diffusée | `sendEmail` |
| `ec.js:1686` | Rappel aux collaborateurs concernés | `sendEmail` |
| `lbcft.js:391` | Cartographie exportée | `zipExport` |
| `lbcft.js:523` | Divergence signalée à l'INPI | `registreLegal` |
| `manuel.js:268` | Diffusion du manuel aux collaborateurs | `sendEmail` |
| `utils.js:883` | Fichiers déposés | stockage de fichiers |
| `wizard.js:345` | Courrier et e-mail envoyés | `sendEmail` |
| `wizard.js:1388` | Statuts récupérés du registre | `registreLegal` |
| `wizard.js:1439` | E-mail de demande envoyé au client | `sendEmail` |
| `wizard.js:1567` | Documents classés dans le Drive | `drive` |

Deux de ces capacités ont un substitut honnête déjà prévu par le registre :
`registreLegal` et `rbe` sont en mode `manual`, c'est-à-dire que la consultation
se fait sur data.inpi.fr et que ComplyEC enregistre la date, la personne et le
résultat constaté. C'est ce que fait déjà `lbcft.js:519` — et c'est opposable à
un contrôleur, contrairement à une interrogation inventée.

## 3. `demo_copy_only` — 9 emplacements, à conserver

Ces textes ne prétendent rien : ils disent que la donnée affichée est fictive.
Les supprimer reviendrait à faire passer le jeu de démonstration pour des
données réelles, ce qui serait le défaut inverse et plus grave.

| Emplacement | Ce qu'il dit |
|---|---|
| `data.js:1` | En-tête : données de démonstration, fictives |
| `data.js:37` | Absence de table Supabase dédiée |
| `data.js:1057` | « Aucune société ne porte ce numéro dans le jeu de démonstration » |
| `data.js:2038` | La fiche légale renvoyée est fictive |
| `data.js:2048` | Rien n'est interrogé pour de bon |
| `data.js:2212` | `EXTRACTION_MENTION` : extraction simulée, fonction serveur non déployée |
| `ec.js:103` | « Rien n'est simulé ici : tant que l'écran n'existe pas, ComplyEC ne fait pas croire qu'il fonctionne » |
| `ec.js:1020` | Base non branchée, origine des e-mails et de la colonne « Depuis » |
| `collab.js:367` | Pré-remplissage issu d'une retranscription simulée, à vérifier avant d'enregistrer |

## 4. `working_demo_seed` — 22 actions qui écrivent, mais pas toutes où il faut

Ces actions ne portent pas la mention « (démonstration) », et pour cause : elles
font réellement quelque chose. En les vérifiant une à une, il est apparu qu'elles
se répartissent en trois sous-cas, et que le deuxième est le plus trompeur du
dépôt — parce que rien à l'écran ne le signale.

**4a. Réellement produit (5).** La génération Word est une capacité réelle : le
fichier est téléchargé et s'ouvre.
`ec.js:1124` (dossier de contrôle) · `ec.js:1524` (registre de formation) ·
`ec.js:2017` (document Word) · `documents.js:495` et `documents.js:543` une fois
branchés.

**4b. Écrit seulement dans l'état React (14).** L'action se voit à l'écran,
paraît donc avoir fonctionné, et disparaît au premier rafraîchissement. C'est
plus trompeur qu'un « (démonstration) » assumé : l'utilisateur voit la date de
confirmation s'afficher et n'a aucune raison de douter.
`documents.js:123` (dépôt de fichiers) · `documents.js:165` (retrait) ·
`documents.js:227` (confirmation d'informations) · `ec.js:1239` (lettres
analysées) · `ec.js:1443` (session de formation ajoutée) · `ec.js:1771`
(chapitre rédigé) · `lbcft.js:519` (registre consulté) · `lbcft.js:601`
(contrôle enregistré) · `manuel.js:121` et `manuel.js:123` (parties validées) ·
`organisation.js:444` (prestataire confirmé) · `organisation.js:611` (NC créée
depuis une réclamation) · `qualite.js:74` (risque validé) · `qualite.js:339`
(dossier remplacé dans l'échantillon).

La couche de données sait écrire chacune d'elles depuis la phase A
(`dbDeposerFichiers`, `dbRetirerFichier`, `dbConfirmerInformations`,
`dbAjouterSessionFormation`, `dbEnregistrerRbe`, `dbEnregistrerControle`,
`dbValiderPartieManuel`, `dbConfirmerPrestataire`, `dbCreerNonConformite`,
`dbValiderRisqueQualite`) : il ne reste qu'à relier les écrans, ce que font les
phases B à I.

**4c. Annonce un envoi qui n'a pas lieu (3).** Ces trois-là appartiennent en
réalité à la catégorie `external_capability`, mais leur libellé ne le dit pas —
ils affirment qu'un e-mail est parti.
`ec.js:1449` « Rappel envoyé à … » · `ec.js:1458` « Rappel envoyé pour N
attestations » · `organisation.js:292` « Attestation demandée à … ».
À corriger en priorité : ils sont plus dangereux que les 22 de la catégorie 2,
qui au moins ne prétendent rien.

---

## Ce que la phase A a déjà réglé

L'audit n'était pas séparable de la correction : tant que la couche de données
ne savait rien écrire, aucun des 34 emplacements de la première catégorie
n'était corrigeable. La phase A a donc livré le socle.

**Le calque de démonstration persiste** (`db.js`). Les données de démonstration
vivaient en mémoire : une valeur modifiée disparaissait au premier
rafraîchissement. Un calque versionné, conservé dans le navigateur, se
superpose désormais aux semences. Les semences restent intactes, ce qui permet
la remise à zéro.

**Une donnée n'existe qu'une fois.** Vingt-trois fonctions dérivées lisaient
directement les constantes de `data.js` : modifier le déclarant Tracfin depuis
Gouvernance ne changeait rien au manuel, qui continuait d'imprimer l'ancien nom.
Elles passent maintenant par la couche de données. Deux cas méritent d'être
signalés parce qu'ils ne se voyaient pas en lisant le code :

- `dbManuelVersions()` déduit le statut « en vigueur » de la date d'effet au
  lieu de le conserver. La version conservée obligeait à retoucher les lignes
  antérieures à chaque publication ; un oubli produisait **deux** versions en
  vigueur simultanément. La recette le vérifie explicitement.
- `CONFORMITE_CABINET` calculait trois listes au chargement du fichier
  (accusés manquants, formations non à jour, déclarations manquantes). Elles
  donnaient l'état du cabinet au démarrage de la page : une attestation reçue
  pendant la séance ne changeait rien à l'écran. Elles sont devenues des
  accesseurs évalués à l'affichage.

**Le registre des capacités** (`CAPACITES`, `capacite()`, `CapabilityGate`,
`MentionCapacite`) donne pour chacune des dix capacités externes son mode réel :
deux sont réelles (génération Word, conservation locale), quatre se traitent
manuellement (registre légal, RBE, gel des avoirs, envoi d'e-mails), quatre sont
indisponibles (lecture automatique des documents, Drive, archive ZIP,
enregistrement Supabase).

**Le journal des validations** (§ 34) trace vigilance validée, manuel publié,
cartographie arrêtée, risque qualité validé, rôle modifié, réclamation et
non-conformité créées.

**Le premier écran est branché.** Les réglages du cabinet — seuil de dépendance,
périodicité de révision des lettres, nombre de sessions de formation annuelles —
ne sont plus tenus dans l'état React de `App` mais lus à chaque rendu depuis
`dbReglages()`. C'est le seul écran raccordé à ce stade ; il sert de modèle aux
suivants et permet à la recette de vérifier la chaîne complète, de la saisie
jusqu'au rechargement.

## Vérification

`node tests/persistance.js` exécute les six scénarios croisés du § 43 au niveau
de la couche de données, plus la saisie du seuil à l'écran : **26 contrôles,
tous verts**. Les neuf recettes d'écran du dépôt restent vertes.

## Ce qui reste à faire

Les 40 emplacements de la catégorie 1, les 14 de la catégorie 4b et les 3 de la
catégorie 4c se corrigent écran par écran, dans l'ordre imposé par le § 46. Les
22 de la catégorie 2 ne se corrigent pas : ils se remplacent par la saisie du
résultat constaté, ou disparaissent. Tant qu'un écran n'est pas repris, sa
mention « (démonstration) » reste en place — elle est trompeuse sur ce qui s'est
passé, mais elle est moins trompeuse que son absence.
