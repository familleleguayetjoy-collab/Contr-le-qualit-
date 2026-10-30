# Matière du mémoire — mode d'emploi

Ce dossier rassemble, au fil du projet, tout ce que le mémoire pourra
exploiter : des faits datés, des données, des décisions et leurs motifs,
classés selon le plan détaillé déposé. **Il ne contient aucun texte du
mémoire** : la rédaction relève du candidat (annexe n° 1 de la notice,
« Limites et engagements »).

| Fichier | Contenu | Tenue |
|---|---|---|
| `memoire.json` | Le plan détaillé, paragraphe par paragraphe : matière disponible, ce qui reste à produire, statut | À la main, à chaque session |
| `journal.json` | Journal de bord daté : faits, constats, mesures, renvois au plan | À la main, une entrée par jour de travail |
| `decisions.json` | Décisions de conception : choix, motif, alternatives écartées, limites | À la main, à chaque décision structurante |
| `pilote.json` | Protocole du pilote proposé : calendrier, périmètre, indicateurs, critères | À valider et dater par le candidat avant le pilote |
| `ia.json` | Usages réels de l'IA, pour l'annexe n° 1 au dépôt | À la main |
| `verifications.json` | Références réglementaires vérifiées par le candidat, avec date et source | Par le candidat |
| `referentiel.json` | Les règles de contrôle appliquées (OUTIL 1) | **Automatique** |
| `fonctionnalites.json` | Les écrans des deux espaces (matière de l'OUTIL 2) | **Automatique** |
| `recettes.json` | Les recettes automatiques et ce qu'elles vérifient (OUTIL 3) | **Automatique** |
| `historique.json` | Chaque version du logiciel, datée | **Automatique** |
| `sources.json` | Chaque référence réglementaire citée par le logiciel, et où | **Automatique** |

Les fichiers automatiques se régénèrent par :

    node outils/memoire.js

Les résultats chiffrés du pilote ne sont pas ici : ils s'exportent depuis
ComplyEC (Paramètres › Mise en service et pilote › Exporter), anonymisés, au
moment voulu. Les ranger dans `docs/memoire/pilote/` avec leur date.
