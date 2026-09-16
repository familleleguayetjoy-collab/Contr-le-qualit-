# Refonte de l'interface expert-comptable — rapport

Tout est sur la branche `claude/complyec-react-app-0g1alg`.

---

## 1. Ce qui a été fait

L'arborescence demandée est en place, écran par écran.

La navigation reste la barre de gauche bleue, à sa place et dans sa couleur.
Elle est simplement passée de onze entrées à cinq, l'accueil en premier.

| Entrée | Ce qu'elle contient |
|---|---|
| **Accueil** | Quatre carrés, quatre titres. Rien d'autre. |
| **Entrée en mission** | Deux carrés verticaux reliés par une flèche courbée sur le côté droit. Le fond des deux processus n'a pas été touché. |
| **Anomalies** | Six onglets en segmented control, jamais mélangés, sans vue générale. |
| **Préparer le contrôle** | Huit rubriques derrière un menu latéral léger. |
| **Paramètres** | Cinq rubriques, dont l'attribution des dossiers. |

**Vos arbitrages ont été suivis.** L'accueil est la première entrée de la barre
de gauche. « Relancer » enregistre la date de génération de chaque
relance et ouvre le message dans votre messagerie, en attendant l'envoi direct.
Le connecteur Drive est prévu partout où la détection et la clôture automatique
en dépendent : le jour où vous le paramétrerez, une seule fonction change de
source.

**Ce qui a été supprimé**, parce qu'il ne figure pas dans votre arborescence :
le parcours de préparation en sept étapes, le « contrôle demain », la
simulation de contrôle, le pack de contrôle et le journal des validations.

---

## 2. Les anomalies, reconstruites

Le modèle précédent comptait six catégories qui ne correspondaient pas aux
vôtres : lettres non actualisées, pièces expirées, classement non conforme.
ComplyEC ne sait pas juger de tout cela — il sait dire si un fichier est là.

Le nouveau modèle ne constate donc que sept absences, réparties en six onglets :

| Onglet | Anomalie constatée |
|---|---|
| Lettres de mission | Lettre de mission absente |
| Documents d'identité | Pièce d'identité absente |
| RBE | Justificatif de consultation RBE absent |
| Notes de synthèse | Note de synthèse absente **et** note de synthèse non supervisée |
| Relances | *(pas une famille — la vue de ce qui a été demandé)* |
| Autres documents | Déclaration d'indépendance manquante, attestation de formation manquante |

**La relance regroupe par personne.** Cochez cinq justificatifs RBE répartis sur
trois collaborateurs : ComplyEC prépare trois messages, un par personne, chacun
listant seulement ce qui le concerne. C'est vérifié par recette.

**« RBE consulté » et « justificatif RBE » restent deux choses distinctes.** Le
premier est une donnée métier LCB-FT, dans la rubrique du même nom ; le second
est une anomalie documentaire, dans l'onglet Anomalies. Le jeu de démonstration
contient volontairement des dossiers consultés sans justificatif classé : c'est
exactement ce qu'un contrôleur relève, et les confondre rendrait les deux
inutiles.

---

## 3. Réutilisation des données (§ 16)

Aucune donnée ne se saisit deux fois. Les chaînes suivantes sont en place et
vérifiées :

- **Chiffre d'affaires du cabinet** → saisi à l'étape 1 du manuel → calcule la
  part de chaque client dans la dépendance économique. Changez-le, la part
  change.
- **Attribution d'un dossier** → réglée dans Paramètres > Utilisateurs →
  décide à qui part la relance de toutes ses anomalies.
- **Analyse LCB-FT de Contractualisation** → alimente l'analyse dossier par
  dossier et la cartographie, sans second formulaire.
- **RBE consulté à la contractualisation** → préremplit le suivi RBE, qui
  indique d'où vient la ligne.
- **Formation créée** → registre unique, vue LCB-FT si marquée, attestation
  manquante dans Anomalies.
- **Prestataires** → repris de leur fiche existante, jamais ressaisis.
- **Liste des clients importée** → donne le nombre de dossiers, qui n'est
  jamais demandé.

Ni le nombre total de dossiers, ni la date de clôture majoritaire des clients
ne sont demandés. Le 31 décembre est retenu et écrit comme tel.

---

## 4. Ce que j'ai ajouté sans que vous le demandiez, et pourquoi

Deux points, tous deux à votre arbitrage.

**Le déclarant Tracfin figure dans Paramètres > Responsables**, à côté des sept
rôles de votre § 14. L'article R. 561-23 du code monétaire et financier impose
de désigner *deux* personnes : un déclarant, habilité à signer les déclarations
de soupçon, et un correspondant, chargé de répondre aux demandes de Tracfin.
Votre liste ne mentionne que le correspondant et le suppléant. Retirer le
déclarant aurait fait disparaître une désignation exigée, déjà utilisée par le
manuel et par les écrans LCB-FT. Il y a donc huit lignes et non sept. Dites-moi
si vous préférez l'inverse.

**Le responsable IA** a été créé comme vous le demandiez. Aucun texte ne
l'impose : l'écran l'indique comme une règle interne du cabinet, pas comme une
obligation.

---

## 5. Ce qui reste simulé, et le dit

| Capacité | État | Ce qui se passe aujourd'hui |
|---|---|---|
| Génération de documents Word | **réelle** | Attestations d'indépendance, registre RGPD, charte IA et manuel sont produits et téléchargés |
| Conservation locale | **réelle** | Tout survit au rafraîchissement |
| Import d'un tableur | **réelle** | La liste clients est lue, mise en correspondance, validée |
| Espace documentaire (Drive) | **à paramétrer** | Les anomalies affichées viennent du jeu de démonstration ; une régularisation se pointe à la main, datée et signée |
| Envoi d'e-mails | manuel | La relance est rédigée, enregistrée à sa date, et s'ouvre dans votre messagerie |
| Registre du commerce, RBE, gel des avoirs | manuel | ComplyEC enregistre ce que vous avez constaté, avec sa date. Il ne consulte rien et ne prétend rien |
| Lecture automatique des documents | indisponible | Demande une fonction serveur : une clé Anthropic placée dans le navigateur serait lisible par tous les utilisateurs |
| Base Supabase | indisponible | Les migrations n'ont pas été exécutées |

L'écran Anomalies porte cette phrase, en une ligne sous son titre :
« Détection de démonstration — le connecteur Drive n'est pas encore paramétré. »
Elle disparaîtra d'elle-même le jour où le connecteur sera en place.

---

## 6. Recettes

Dix recettes, toutes vertes. `python3 -m http.server 8811 &` puis
`node tests/tout.js`.

| Recette | Ce qu'elle vérifie |
|---|---|
| `patrons` | Les six patrons d'écran tiennent aux trois largeurs |
| `navigation` | Cinq entrées, treize rubriques, douze anciennes adresses, aucun contenu rogné |
| `anomalies` | Six familles jamais mélangées, une relance par personne, la régularisation |
| `controle` | Les huit rubriques et leurs règles propres (trois étapes, deux blocs, six étapes…) |
| `parametres` | Cinq rubriques, l'effectif compté, l'attribution qui commande les relances |
| `ecritures` | Quinze gestes faits à l'écran, la page rechargée, l'état relu |
| `vigilance` | Les écrans LCB-FT du cabinet, intacts et atteignables |
| `mobile` | Tout tient à 390 px, aucune cible sous 40 px |
| `collaborateur` | L'espace collaborateur, inchangé, bureau et téléphone |
| `parcours_entree_en_mission` | Le parcours gelé, inchangé, aux deux résolutions |

**Onze recettes ont été supprimées** : elles vérifiaient des écrans que la
refonte a retirés (parcours en sept étapes, hubs de gouvernance et de
ressources, documents du cabinet, manuel en quatre étapes). Les garder en les
réparant aurait donné l'illusion d'une couverture sur du code qui n'existe plus.

**Défauts trouvés par la mesure, invisibles à la lecture du code :**

- les quatre carrés de l'accueil gardaient la hauteur de leur texte : une règle
  plus haut dans la feuille posait `align-items: start` sur toutes les grilles ;
- le titre d'un écran repris s'affichait en blanc sur fond clair — une règle
  plus spécifique fixait aussi `-webkit-text-fill-color`, qu'il fallait
  reprendre ;
- le bouton « Importer un fichier Excel » était une étiquette autour d'un champ
  masqué : inatteignable au clavier. Le dépôt d'un contrat prestataire avait le
  même défaut. Les deux sont devenus de vrais boutons ;
- un bouton désactivé avait exactement l'allure d'un bouton disponible ;
- la colonne « Collaborateur » répétait mot pour mot la colonne « Personne »
  dans l'onglet Autres documents ;
- le hamburger du tiroir mobile faisait 38 px et sa croix de fermeture 27 px,
  sous les 44 px demandés — ce sont les deux boutons dont dépend toute la
  navigation sur téléphone ;
- avec cinq entrées au lieu de onze, la barre de gauche les centrait
  verticalement au milieu d'un grand vide bleu.

---

## 7. Ce que je n'ai pas fait

- **Lettre de reprise et Contractualisation n'ont pas été touchées** : ni le
  contenu, ni les champs, ni la logique, ni les contrôles, ni le workflow, ni
  les règles métier. Seul l'écran d'entrée a été refait. La recette
  `parcours_entree_en_mission` le vérifie à chaque exécution.
- **Les modèles LCB-FT du cabinet n'ont pas été réinventés** : le portefeuille,
  la cotation par critères et la cartographie sont repris tels quels. Seule la
  teinte de leur bandeau s'aligne sur la couleur de la rubrique, pour ne pas
  avoir trois couleurs sur la même page.
- **Aucune référence réglementaire n'a été modifiée.** Celles qui apparaissent
  à l'écran sont celles qui étaient déjà vérifiées.
- **Aucune pull request** n'a été ouverte : elle n'a pas été demandée.
- **Du code devenu inatteignable subsiste** dans `ec.js`, `organisation.js`,
  `qualite.js` et `documents.js` — les anciens hubs et leurs écrans. Une passe
  de suppression automatique s'est révélée dangereuse (elle emportait des
  écrans encore utilisés et des constantes voisines) ; elle a été annulée et
  n'a pas été retentée. Ce code ne s'exécute jamais ; il alourdit le bundle
  d'environ 15 %.

---

## 8. Ce qui reste à faire de votre côté

1. **Paramétrer le connecteur Drive.** C'est lui qui fera passer les anomalies
   du jeu de démonstration au portefeuille réel, et qui clôturera
   automatiquement une anomalie quand la pièce réapparaît.
2. **Exécuter les trois migrations** dans l'éditeur SQL du projet Supabase, dans
   l'ordre : `supabase/schema.sql`, `schema_002_donnees_metier.sql`,
   `schema_003_lettres_et_vigilance.sql`.
3. **Créer le bucket de stockage `documents`** et le laisser **privé**. Un
   bucket public exposerait des pièces couvertes par le secret professionnel.
4. **Déployer la fonction `invite-collaborateur`**.
5. **Renseigner les paramètres du cabinet**, puis basculer `DB_MODE` de
   `'demo'` à `'supabase'` dans `db.js`.

La clé Anthropic n'a pas été placée dans le bundle et ne doit pas l'être : elle
serait lisible par tout utilisateur. La lecture automatique des documents
suppose une fonction serveur, qui reste à écrire.

---

## 9. Où regarder en premier

1. **Anomalies > RBE** — cochez tout, cliquez « Relancer ». Trois messages, un
   par collaborateur, chacun ne listant que ses dossiers.
2. **Anomalies > Relances** — ouvrez une personne : ce que vous lui avez
   demandé, quand, et ce qui est réglé.
3. **Préparer le contrôle > Manuel**, étape 1 — saisissez un chiffre
   d'affaires, validez, puis allez voir **Indépendance** : la part de chaque
   client dans la dépendance économique a changé.
4. **Paramètres > Utilisateurs** — attribuez un dossier à Thomas, puis
   retournez dans Anomalies : c'est lui qui sera relancé.
5. **Préparer le contrôle > Synthèse** — un pourcentage, quatre urgences au
   plus, chacune cliquable. S'il n'en reste que deux, il n'y en a que deux.
6. **Rafraîchissez la page** à n'importe quel moment : ce que vous avez fait
   est encore là.
