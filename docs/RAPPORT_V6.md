# Refonte V6 — rapport de fin de mission (§ 50)

Neuf phases, dans l'ordre imposé par le § 46. Tout est sur la branche
`claude/complyec-react-app-0g1alg`, en neuf commits, un par phase.

---

## 1. Ce qui a changé, en une phrase par phase

| Phase | Ce qu'elle a apporté |
|---|---|
| **A** | Le mode démonstration conserve ses données ; une donnée n'existe qu'une fois ; registre des capacités externes ; audit des 61 actions factices |
| **B** | Barre latérale de onze entrées ramenée à sept en deux groupes ; parcours de préparation en sept étapes ; retours contextuels |
| **C** | Accueil qui oriente au lieu d'afficher des chiffres ; `computeControlJourneyState()` déduit l'avancement des faits |
| **D** | Chaque étape liste ses travaux avec leur état ; les valeurs clés du cabinet deviennent modifiables pour de bon |
| **E** | Dispositif LBC-FT en cinq étapes ; analyse de vigilance en six écrans ; plus aucun contrôle externe inventé |
| **F** | Documents du cabinet en quatre étapes ; dépôt et confirmation écrivent |
| **G** | Manuel en quatre étapes ; relecture et publication persistent |
| **H** | Contrôle demain, simulation, pack figé, journal des validations |
| **I** | Zéro bouton qui ment ; tout tient à 390 px avec des cibles de 44 px |

---

## 2. Fichiers modifiés

**Créés** — `parcours.js` (parcours de préparation et moteur d'état),
`controle.js` (contrôle demain, simulation, pack, journal),
`docs/AUDIT_ACTIONS_FACTICES_V6.md`, `docs/RAPPORT_V6.md`, et sept recettes :
`tests/{persistance,retours,collaborateur,accueil,valeurs,lbcft_parcours,controle}.js`
plus `tests/aller.js` (helper de navigation partagé).

**Modifiés en profondeur** — `db.js` (+618 lignes : persistance, capacités,
packs, journal), `data.js` (+390 : vérifications de vigilance, dossiers
sensibles, lectures routées), `styles.css` (+777), `lbcft.js` (+561),
`documents.js` (+445), `manuel.js` (+369), `ec.js` (+310), `utils.js` (+206),
`organisation.js` (+241), `qualite.js` (+187), `wizard.js` (+163),
`patrons.js` (+105), `app.js`, `index.html`, `build_standalone.py`.

Au total **36 fichiers**, environ **12 200 lignes ajoutées** et 1 100 retirées.

---

## 3. Ce qui est devenu réellement persistant

Tout ce qui suit passe par la couche de données et survit à un rafraîchissement.

**Cabinet et documents** — dépôt d'un fichier (nom et catégorie), confirmation
d'une information, correction d'une valeur, marquage « non trouvée »,
complétion des informations manquantes, régénération d'un document.

**Gouvernance** — désignation d'un titulaire de rôle, seuil de dépendance et
tous les réglages du cabinet, campagne d'indépendance.

**Ressources** — sessions de formation, attestations reçues, confirmation d'un
prestataire, revue d'un traitement RGPD.

**Missions** — création et clôture d'une réclamation, création d'une
non-conformité depuis une réclamation.

**LBC-FT** — analyse de vigilance complète (bénéficiaires, PPE, vérifications
consignées, cotation, niveau retenu, mesures), consultation du registre des
bénéficiaires effectifs, contrôles ciblés, signalement d'une divergence, arrêté
de la cartographie avec la revue de l'expert-comptable.

**Qualité** — validation ou mise à l'écart d'un risque, création et traitement
d'une non-conformité, contrôle d'efficacité, rapport de surveillance,
évaluation annuelle.

**Manuel** — relecture partie par partie, publication d'une version avec sa
diffusion, historique.

**Contrôle** — pack figé, journal des validations.

Trois états sont désormais **déduits des faits** au lieu d'être conservés, ce
qui les empêche de mentir : l'état d'une non-conformité, la version du manuel en
vigueur, et la marque « à régénérer » d'un document produit.

---

## 4. Capacités externes toujours indisponibles

Le registre vit dans `db.js` (`CAPACITES`). Chaque écran s'y réfère : aucun ne
propose une action que la capacité ne permet pas.

| Capacité | Mode | Ce qui se passe aujourd'hui |
|---|---|---|
| Génération de documents Word | **réelle** | Le fichier est produit et téléchargé |
| Conservation locale | **réelle** | Les données survivent au rafraîchissement |
| Registre du commerce (INPI) | manuel | La consultation se fait sur data.inpi.fr ; ComplyEC enregistre date, personne et résultat constaté |
| Bénéficiaires effectifs | manuel | Idem ; le signalement d'une divergence est noté comme fait |
| Gel des avoirs et sanctions | manuel | Le résultat constaté se saisit avec sa date et sa source |
| Envoi d'e-mails | manuel | La relance est notée comme due ; l'envoi se fait depuis la messagerie du cabinet |
| Lecture automatique des documents | indisponible | Demande une fonction serveur : une clé Anthropic dans le navigateur serait lisible par tous les utilisateurs |
| Espace Drive | indisponible | ComplyEC donne la liste des emplacements à créer |
| Archive ZIP | indisponible | L'index du pack se télécharge au format Word |
| Base Supabase | indisponible | Les migrations n'ont pas été exécutées (voir § 5) |

---

## 5. Ce qui reste à faire côté serveur

Ces quatre points ne sont pas du code : ils demandent un accès au projet
Supabase et ne peuvent pas être faits depuis ici.

1. **Exécuter les trois migrations** dans l'éditeur SQL du projet, dans
   l'ordre : `supabase/schema.sql`, `schema_002_donnees_metier.sql`,
   `schema_003_lettres_et_vigilance.sql`.
2. **Créer le bucket de stockage `documents`** et le laisser **privé**. Un
   bucket public exposerait des pièces couvertes par le secret professionnel.
3. **Déployer la fonction `invite-collaborateur`** (`supabase/functions/`).
4. **Renseigner les paramètres du cabinet**, puis basculer `DB_MODE` de
   `'demo'` à `'supabase'` dans `db.js`.

Tant que ces quatre points ne sont pas faits, la capacité
`supabasePersistence` reste à `unavailable` et les données vivent dans le
navigateur. C'est écrit dans le registre, et l'application ne prétend pas le
contraire.

**La clé Anthropic n'a pas été placée dans le bundle**, et ne doit pas l'être :
elle serait lisible par tout utilisateur. La lecture automatique des documents
suppose une fonction serveur, qui reste à écrire.

---

## 6. Recettes exécutées

Seize recettes, toutes vertes au moment d'écrire ces lignes.

| Recette | Ce qu'elle vérifie |
|---|---|
| `patrons` | Les six patrons d'écran tiennent aux trois largeurs |
| `navigation` | Sept entrées, sept étapes, douze anciennes adresses, aucun élément rogné |
| `retours` | Le bouton Retour ramène d'où l'on vient, selon l'entrée |
| `collaborateur` | Espace collaborateur intact, tiroirs mobiles, parcours à 390 px |
| `accueil` | La carte héro, les quatre actions, et l'avancement déduit des faits |
| `valeurs` | Une valeur modifiée change partout, et Annuler n'écrit rien |
| `persistance` | Les six scénarios croisés du § 43, plus la saisie à l'écran |
| `controle` | Trois indicateurs sans score, simulation, pack immuable, journal |
| `lbcft_parcours` | Cinq étapes, six écrans de vigilance, aucun contrôle inventé |
| `documents` | Le pipeline documentaire de bout en bout |
| `organisation` | Gouvernance, ressources et registres |
| `lbcft` | La vigilance LBC-FT écran par écran |
| `qualite` | Le système de management de la qualité |
| `manuel` | Préparation, relecture, publication, historique |
| `parcours_entree_en_mission` | Le parcours gelé, inchangé |
| `recette_v3` | Balayage de tous les écrans aux deux résolutions |

**Défauts trouvés par la mesure, invisibles à la lecture du code** — quatorze au
total, dont : le fil des étapes qui rognait le bas du contenu de sept pixels
sans qu'aucune barre de défilement ne le signale ; une pagination qui oscillait
entre cinq et deux lignes d'un rendu à l'autre, rendant une ligne introuvable ;
l'accueil qui saluait quelqu'un par le nom d'un autre ; deux versions du manuel
simultanément « en vigueur » ; l'historique qui plantait sur une version tout
juste publiée ; le dossier de contrôle qui lisait un second plan de manuel et
ignorait donc la publication ; et « Contractualisation » qui sortait de 23 px
hors d'un écran de téléphone.

---

## 7. Ce que je n'ai pas fait, et pourquoi

- **Aucune règle légale, aucun modèle de document, aucun texte métier validé
  n'a été modifié.** Le § 0 l'interdit, et les références citées à l'écran
  restent celles qui étaient déjà vérifiées.
- **Contractualisation et Reprise déontologique restent gelées** visuellement
  (§ 30, § 39). Seules leurs actions factices ont été corrigées.
- **Aucune pull request n'a été ouverte** : elle n'a pas été demandée.
- Les écrans d'un module non repris peuvent encore afficher des données de
  démonstration. Neuf mentions le disent explicitement et ont été conservées :
  les effacer ferait passer des données fictives pour des données réelles.

---

## 8. Où regarder en premier

1. **Accueil** — la question « qu'est-ce que je dois faire maintenant ? » a sa
   réponse avant le premier clic.
2. **Préparer mon contrôle**, étape 2 — cliquez « Modifier » sur le déclarant
   Tracfin, changez le nom, puis allez voir le manuel : il imprime la nouvelle
   valeur, et les documents concernés passent en « à régénérer ».
3. **LBC-FT**, étape 2 puis un dossier — l'écran « Vérifications » ne consulte
   rien et ne prétend rien : il enregistre ce que vous avez constaté.
4. **Contrôle demain** — trois nombres, et le troisième dit ce qui ne sort pas
   de ComplyEC.
5. **Rafraîchissez la page** à n'importe quel moment : ce que vous avez fait
   est encore là.
