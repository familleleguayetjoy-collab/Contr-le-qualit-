// ComplyEC — LBC-FT (S32 à S40B) — phase 5 de la refonte V3
'use strict';

/* =====================================================================
   La vigilance, de bout en bout
   =====================================================================

   Quatre écrans de pilotage — ce qui est à traiter, l'état du portefeuille,
   la cartographie, les campagnes ciblées — et un assistant de mise à jour en
   cinq étapes.

   L'assistant ne réinvente rien : ses étapes « Connaissance de la relation »
   et « Cotation » sont littéralement les composants de la contractualisation,
   pas des copies. Le cahier demande de reproduire S12 et S13 « presque pixel
   pour pixel » ; le plus sûr moyen d'y arriver est que ce soit le même code.

   Deux étapes leur sont propres, parce qu'une mise à jour n'est pas une
   première analyse : on commence par ce qui a changé, et on finit par les
   mesures que le niveau retenu appelle.
   ===================================================================== */

// ================================================= S32 — LBC-FT — À traiter

function PastillesCriteres({ classification }) {
  if (!classification) return h('span', { className: 'conf-note' }, '—');
  return h('span', { className: 'pastilles-criteres' },
    NPLAB_CRITERES.map(c => h('span', {
      key: c.code,
      className: cx('pastille-critere', 'niv-' + niveauCritereCouleur(classification[c.code])),
      title: `${c.label} : ${classification[c.code]}`,
    }, c.label[0]))
  );
}

function LbcftPortefeuille({ onBack, showToast, onMettreAJour, integre }) {
  const [filtre, setFiltre] = useState('tous');
  const [choisi, setChoisi] = useState(null);
  const aTraiter = vigilanceATraiter();

  const filtres = [
    { code: 'tous', label: 'Tous', test: () => true },
    { code: 'renforcee', label: 'Renforcée', test: d => d.niveauRetenu === 'Renforcée' },
    { code: 'a-jour', label: 'À mettre à jour', test: d => aTraiter.some(t => t.dossier === d.dossier) },
    { code: 'ppe', label: 'PPE', test: d => (d.operationsParticulieres || []).some(o => /politiquement exposée|PPE/i.test(o)) },
    { code: 'rbe', label: 'RBE incomplet', test: d => CAMPAGNE_RBE.some(r => r.dossier === d.dossier && !r.consulteLe) },
  ];
  const actif = filtres.find(f => f.code === filtre);
  const lignes = dbVigilanceDossiers().filter(actif.test);

  const colonnes = [
    { code: 'dossier', titre: 'Dossier', classe: 'table-name', valeur: d => client(d.dossier).nom, rendu: d => client(d.dossier).nom },
    { code: 'niveau', titre: 'Niveau retenu', valeur: d => d.niveauRetenu || '',
      rendu: d => (d.niveauRetenu
        ? h(Badge, { color: niveauVigilanceCouleur(d.niveauRetenu) }, d.niveauRetenu)
        : h(Badge, { color: 'gris' }, 'à analyser')) },
    { code: 'criteres', titre: 'Critères', rendu: d => h(PastillesCriteres, { classification: d.classification }) },
    { code: 'date', titre: 'Analysé le', valeur: d => d.derniereAnalyse || '',
      rendu: d => (d.derniereAnalyse ? formatDate(d.derniereAnalyse) : '—') },
  ];

  const courant = choisi ? dbVigilanceDossiers().find(d => d.dossier === choisi) : null;
  const detail = courant
    ? h(Card, {
      title: client(courant.dossier).nom,
      subtitle: courant.adresse || client(courant.dossier).activite,
      icon: '🔍', iconBg: '#F1EAFE', iconColor: '#7C3AED',
      tone: courant.niveauRetenu === 'Renforcée' ? 'orange' : 'bleu',
    },
      courant.classification
        ? NPLAB_CRITERES.map(c => h('div', { className: 'list-row', key: c.code },
          h('span', { className: 'list-row-label' }, c.label),
          h(Badge, { color: niveauCritereCouleur(courant.classification[c.code]) }, courant.classification[c.code])))
        : h('p', { className: 'conf-detail', style: { marginTop: 0 } }, 'Ce dossier n’a pas encore été analysé.'),
      (courant.operationsParticulieres || []).length
        ? h('div', { className: 'detail-field', style: { marginTop: 12 } },
          h('div', { className: 'detail-field-label' }, 'Opérations particulières'),
          h('div', { className: 'detail-field-value' }, courant.operationsParticulieres.join(' ')))
        : null,
      courant.justification
        ? h('div', { className: 'detail-field' },
          h('div', { className: 'detail-field-label' }, 'Justification retenue'),
          h('div', { className: 'detail-field-value' }, courant.justification.slice(0, 240), courant.justification.length > 240 ? '…' : ''))
        : null,
      h('button', {
        className: 'btn btn-primary btn-block', style: { marginTop: 12 },
        onClick: () => onMettreAJour(courant.dossier),
      }, 'Mettre à jour la vigilance →')
    )
    : null;

  /* Le même écran sert de rubrique du contrôle et d'écran autonome. Intégré,
     il perd son en-tête et son cadre de page : c'est la rubrique qui les
     porte. Le contenu, lui, ne change pas d'un iota — c'est le modèle validé
     par le cabinet. */
  const corps = h(React.Fragment, null,
    h('div', { className: 'tabs', style: { marginBottom: 14 } },
      filtres.map(f => h('button', {
        key: f.code, className: cx('tab', filtre === f.code && 'active'),
        onClick: () => { setFiltre(f.code); setChoisi(null); },
      }, f.label, ' ', h('span', { className: 'tab-compte' }, dbVigilanceDossiers().filter(f.test).length)))
    ),
    h(ActionListDetail, {
      titreListe: actif.label === 'Tous' ? 'Tous les dossiers' : actif.label, iconeListe: '🔍',
      sousTitreListe: String(lignes.length),
      colonnes, lignes, cle: d => d.dossier, parPage: 5,
      vide: 'Aucun dossier dans cette vue.',
      selection: choisi, onSelect: d => setChoisi(d.dossier),
      detail, detailIcone: '🔍',
      detailVide: 'Choisissez un dossier pour voir sa cotation',
    })
  );

  if (integre) return corps;
  return h('div', { className: 'page' },
    h(EnteteHub, { titre: 'Portefeuille LBC-FT', onRetour: onBack }),
    corps
  );
}

// ======================================= S34 à S38 — Mise à jour de la vigilance

/* Six écrans (§ 22 du prompt V6), dans l'ordre où l'on raisonne : ce qui a
   bougé, qui est derrière, ce qu'on a vérifié, comment on cote, ce qu'on
   retient, et ce qu'on enregistre. La version précédente en comptait cinq et
   n'avait pas d'écran de vérifications : celles-ci étaient mélangées à la
   connaissance du client, et leurs résultats étaient fabriqués. */
const MAJ_VIGILANCE_ETAPES = ['Ce qui a changé', 'Qui est derrière', 'Attestation PPE', 'Vérifications', 'Cotation', 'Niveau & mesures', 'Validation'];

function MiseAJourVigilance({ dossierId, onBack, showToast, cabinetSettings }) {
  const c = client(dossierId);
  const record = dbVigilanceDossiers().find(d => d.dossier === dossierId) || { dossier: dossierId, statut: 'a_lancer' };
  const evenements = evenementsDepuisDerniereAnalyse(dossierId);

  const [etape, setEtape] = useState(1);
  const [confirmes, setConfirmes] = useState(() =>
    Object.fromEntries(evenements.filter(e => e.propose).map(e => [e.code, true])));
  const [mesures, setMesures] = useState({});
  const [commentaire, setCommentaire] = useState('');

  /* Les trois étapes du milieu sont les composants de la contractualisation,
     pris tels quels. Rien n'est recopié : c'est le même état et le même
     rendu, donc les deux parcours ne peuvent pas diverger. */
  const vig = useEtatVigilance({
    classification: record.classification,
    niveauRetenu: record.niveauRetenu,
    justification: record.justification,
    operations: record.operationsParticulieres,
    beneficiaires: record.beneficiaires,
    ppeStatut: record.ppe ? record.ppe.statut : undefined,
    ppeDetail: record.ppe ? record.ppe.detail : undefined,
    verifications: record.verifications,
  });

  const niveau = vig.niveauRetenu || vig.niveauPropose;
  const proposees = mesuresProposees(niveau);
  const retenues = proposees.filter(m => mesures[m.code]);

  function suivant() { setEtape(e => Math.min(e + 1, MAJ_VIGILANCE_ETAPES.length)); }
  function precedent() { if (etape === 1) onBack(); else setEtape(e => e - 1); }

  const pied = (libelle, actif = true) => h('div', { className: 'wizard-footer' },
    h('button', { className: 'btn btn-secondary', onClick: precedent }, '← Retour'),
    h('button', { className: 'btn btn-primary', onClick: suivant, disabled: !actif }, libelle)
  );

  return h('div', { className: 'page' },
    h(EnteteHub, { titre: `Mise à jour de la vigilance — ${c.nom}` }),
    h(Stepper, { steps: MAJ_VIGILANCE_ETAPES, current: etape }),

    // ---- S34 : ce qui a changé depuis la dernière analyse ----
    etape === 1 && h('div', { className: 'step-body' },
      h('div', { className: 'step-scroll' },
        h('div', { className: 'grid-2 colonnes-egales' },
          h(FormSection, { icon: '🏢', title: 'Informations du dossier', ton: 'bleu' },
            h('div', { className: 'list-row' },
              h('span', { className: 'list-row-label' }, 'Dénomination'),
              h('span', { className: 'conf-note' }, c.nom)),
            h('div', { className: 'list-row' },
              h('span', { className: 'list-row-label' }, 'Forme'),
              h('span', { className: 'conf-note' }, c.forme)),
            h('div', { className: 'list-row' },
              h('span', { className: 'list-row-label' }, 'Activité'),
              h('span', { className: 'conf-note', style: { textAlign: 'right', maxWidth: '60%' } }, c.activite)),
            h('div', { className: 'list-row' },
              h('span', { className: 'list-row-label' }, 'Dirigeant'),
              h('span', { className: 'conf-note' }, c.dirigeant)),
            h('div', { className: 'list-row' },
              h('span', { className: 'list-row-label' }, 'Dernière analyse'),
              h('span', { className: 'conf-note' },
                record.derniereAnalyse ? formatDate(record.derniereAnalyse) : 'Aucune')),
            h('div', { className: 'form-help' }, h(BadgeAuto), ' Reprises du dossier — rien à ressaisir.')
          ),
          h(FormSection, { icon: '🔔', title: 'Depuis la dernière analyse', ton: 'bleu',
            subtitle: String(evenements.filter(e => e.code !== 'aucun').length) },
            evenements.map(e => (e.code === 'aucun'
              ? h('p', { className: 'conf-detail', style: { margin: 0 }, key: e.code }, e.libelle)
              : h('label', { className: 'checkbox-row', key: e.code, style: { alignItems: 'flex-start' } },
                h('input', {
                  type: 'checkbox', checked: !!confirmes[e.code],
                  onChange: () => setConfirmes(p => Object.assign({}, p, { [e.code]: !p[e.code] })),
                }),
                h('span', null,
                  h('span', { style: { display: 'block', fontWeight: 600 } }, e.libelle),
                  h('span', { className: 'conf-note' }, e.source))
              ))),
            h('div', { className: 'form-help' }, 'Décochez ce qui ne s’est pas produit : rien n’est retenu sans votre accord.')
          )
        )
      ),
      pied('Confirmer et continuer →')
    ),

    // ---- S35 : connaissance de la relation — composant partagé S12 ----
    etape === 2 && h('div', { className: 'step-body' },
      h(VigilanceEtapePersonnes, { v: vig }),
      pied('Continuer →')
    ),

    // ---- Attestation PPE : la vérification, et le document à faire signer ----
    etape === 3 && h('div', { className: 'step-body' },
      h(VigilanceEtapePpe, {
        v: vig,
        dirigeant: c ? c.dirigeant : null,
        cabinetSettings,
      }),
      pied('Continuer →')
    ),

    // ---- Vérifications : ce qui a été consulté, et ce qu'on y a vu ----
    etape === 4 && h('div', { className: 'step-body' },
      h(VigilanceEtapeVerifications, { v: vig }),
      pied('Continuer →')
    ),

    // ---- Cotation — composant partagé avec la contractualisation ----
    etape === 5 && h('div', { className: 'step-body' },
      h(VigilanceEtapeCotation, {
        v: vig,
        /* Mêmes cinq lignes que la contractualisation, dans le même ordre :
           le cahier veut cet écran « presque pixel pour pixel » identique à
           S13, et deux blocs d'identité de longueurs différentes se verraient. */
        identite: [
          ['Client', c.nom],
          ['Forme', c.forme],
          ['Activité', c.activite],
          ['Siège', record.adresse || '—'],
          ['Dirigeant', c.dirigeant],
        ],
        mission: [
          ['Collaborateur', collaborateur(c.collaborateur).nom],
          ['Dernière analyse', record.derniereAnalyse ? formatDate(record.derniereAnalyse) : 'aucune'],
          ['Niveau précédent', record.niveauRetenu || 'non coté'],
        ],
      }),
      pied('Continuer →')
    ),

    // ---- Niveau retenu et mesures qu'il appelle ----
    etape === 6 && h('div', { className: 'step-body' },
      h('div', { className: 'step-scroll' },
        h(FormSection, { icon: '🎚️', title: 'Niveau retenu', ton: 'dore' },
          h('div', { className: 'list-row' },
            h('span', { className: 'list-row-label' }, 'Niveau de vigilance'),
            h(Badge, { color: niveauVigilanceCouleur(niveau) }, niveau)),
          h('p', { className: 'conf-detail', style: { marginBottom: 0 } },
            resumeCotation(vig.classification))
        ),
        h(FormSection, { icon: '🛡️', title: 'Mesures retenues', ton: 'dore',
          subtitle: `${retenues.length} sur ${proposees.length}`, style: { marginTop: 16 } },
          /* Des cartes à cocher, pas quinze champs : chaque mesure dit ce
             qu'elle engage, et l'expert-comptable retient celles qu'il applique. */
          h('div', { className: 'mesures-grille' },
            proposees.map(m => h('button', {
              key: m.code,
              className: cx('mesure-carte', mesures[m.code] && 'selected'),
              onClick: () => setMesures(p => Object.assign({}, p, { [m.code]: !p[m.code] })),
            },
              h('span', { className: 'mesure-coche' }, mesures[m.code] ? '✓' : ''),
              h('span', { className: 'mesure-corps' },
                h('span', { className: 'mesure-titre' }, m.libelle),
                h('span', { className: 'mesure-detail' }, m.detail))
            ))
          ),
          h('div', { className: 'form-group', style: { marginTop: 16, marginBottom: 0 } },
            h('label', { className: 'form-label' }, 'Mesure particulière, si aucune carte ne convient'),
            h('input', {
              className: 'form-input', value: commentaire,
              placeholder: 'Facultatif',
              onChange: e => setCommentaire(e.target.value),
            })
          )
        )
      ),
      pied('Continuer →')
    ),

    // ---- Validation ----
    etape === 7 && h('div', { className: 'step-body' },
      h('div', { className: 'step-scroll' },
        h('div', { className: 'grid-2-uneven', style: { alignItems: 'stretch' } },
          h('div', { className: 'recap-grid' },
            h('div', { className: 'recap-tile' },
              h('div', { className: 'recap-tile-head' }, h('span', { className: 'recap-tile-icon' }, '🏢'), 'Dossier'),
              h('div', { className: 'recap-tile-main' }, c.nom),
              h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Dirigeant'), h('span', { className: 'v' }, c.dirigeant)),
              h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Analysé le'), h('span', { className: 'v' }, formatDate(new Date().toISOString().slice(0, 10))))
            ),
            h('div', { className: 'recap-tile' },
              h('div', { className: 'recap-tile-head' }, h('span', { className: 'recap-tile-icon' }, '👤'), 'Connaissance'),
              h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Bénéficiaires'), h('span', { className: 'v' }, String(vig.beneficiaires.filter(b => (b.nom || '').trim()).length))),
              h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'PPE'), h('span', { className: 'v' }, vig.ppeStatut || 'Non renseigné')),
              h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Vérifications'), h('span', { className: 'v' }, `${Object.keys(vig.verifications).length} sur ${VIGILANCE_VERIFICATIONS.length}`))
            ),
            h('div', { className: 'recap-tile' },
              h('div', { className: 'recap-tile-head' }, h('span', { className: 'recap-tile-icon' }, '🎚️'), 'Cotation'),
              NPLAB_CRITERES.map(cr => h('div', { className: 'kv-line', key: cr.code },
                h('span', { className: 'k' }, cr.label),
                h('span', { className: 'v' }, vig.classification[cr.code])))
            ),
            h('div', { className: 'recap-tile' },
              h('div', { className: 'recap-tile-head' }, h('span', { className: 'recap-tile-icon' }, '🛡️'), 'Mesures'),
              retenues.length
                ? retenues.map(m => h('div', { className: 'action-row', key: m.code }, '• ', m.libelle))
                : h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Aucune mesure retenue')),
              commentaire ? h('div', { className: 'action-row' }, '• ', commentaire) : null
            )
          ),
          h(FinalValidation, {
            titre: 'À l’enregistrement',
            sorties: [
              { icone: '📄', libelle: 'Fiche de vigilance mise à jour', detail: formatDate(new Date().toISOString().slice(0, 10)) },
              { icone: '🎚️', libelle: 'Niveau retenu', detail: niveau },
              { icone: '📝', libelle: 'Justification consignée', detail: vig.justification ? 'renseignée' : 'à compléter' },
              { icone: '🗂️', libelle: 'Version précédente historisée', detail: record.derniereAnalyse ? formatDate(record.derniereAnalyse) : 'aucune' },
            ],
            rappel: 'L’ancienne version n’est pas écrasée : elle est conservée et datée, pour qu’un contrôleur puisse suivre l’évolution du dossier.',
          })
        )
      ),
      h('div', { className: 'wizard-footer' },
        h('button', { className: 'btn btn-secondary', onClick: precedent }, '← Retour'),
        h('button', {
          className: 'btn btn-primary',
          /* L'enregistrement écrit réellement : l'analyse part dans la couche
             de données, le dossier quitte la liste à traiter si plus aucun
             motif ne subsiste, la cartographie et les statistiques se
             recalculent, et le tout survit au rechargement (§ 22.6). */
          onClick: async () => {
            const analyse = Object.assign(vig.aEnregistrer(), {
              operationsParticulieres: record.operationsParticulieres || [],
              mesures: retenues.map(m => m.code),
              mesureParticuliere: commentaire.trim() || null,
              evenements: Object.keys(confirmes).filter(k => confirmes[k]),
            });
            await dbEnregistrerAnalyse(dossierId, analyse);
            showToast(`Vigilance de ${c.nom} enregistrée — niveau ${analyse.niveauRetenu}.`);
            onBack();
          },
        }, '✅ Enregistrer la vigilance')
      )
    )
  );
}

// ================================================= S39 — LBC-FT — Cartographie

/* Le cahier V3 fait de la cartographie une photographie, pas un questionnaire :
   « la cartographie n'est pas un questionnaire indépendant », et tout est
   agrégé depuis les analyses individuelles. Elle remplace donc l'assistant en
   cinq étapes de la version précédente. Aucun nombre ne se saisit ici. */
/* Les trois questions que l'expert-comptable tranche avant d'arrêter sa
   cartographie (§ 25). Elles ne se déduisent d'aucune donnée : ce sont des
   appréciations, et c'est justement pour cela qu'on les lui demande. Sans
   elles, l'arrêté ne serait qu'une photographie ; avec elles, c'est une
   décision, et c'est ce qu'un contrôleur attend. */
/* Le document de cartographie, en neuf sections.

   Le gabarit est celui que le cabinet a remis le 25 septembre. Chaque section
   est alimentée par ce que ComplyEC conserve ; aucune n'est inventée. Là où
   l'information manque, le document le dit plutôt que de combler.

   Les références de la méthodologie sont vérifiées : articles L. 561-4-1,
   L. 561-10, L. 561-10-1 et L. 561-9-1 du code monétaire et financier ;
   règlement délégué (UE) 2016/1675 pour la liste des pays tiers à haut risque ;
   directive (UE) 2015/849 pour les facteurs de risque annexés. */
function cartoTableau(entetes, lignes) {
  if (!lignes.length) return '<p style="margin:0 0 8pt;">Aucun dossier dans ce cas.</p>';
  return `<table style="width:100%; border-collapse:collapse; font-size:9pt; margin:0 0 10pt;">
    <tr>${entetes.map(t => `<th style="background:#1F3864; color:#fff; text-align:left; padding:5pt 6pt;">${docxEchapper(t)}</th>`).join('')}</tr>
    ${lignes.map((l, i) => `<tr style="background:${i % 2 ? '#F4F6FA' : '#FFFFFF'};">${l.map(c => `<td style="padding:5pt 6pt; border-bottom:1px solid #E4E7EE; vertical-align:top;">${c}</td>`).join('')}</tr>`).join('')}
  </table>`;
}

function cartoSection(numero, titre, contenu) {
  return `<h2 style="background:#1F3864; color:#fff; font-size:10.5pt; padding:5pt 8pt; margin:16pt 0 8pt;">${numero}. ${docxEchapper(titre)}</h2>${contenu}`;
}

function telechargerCartographie({ retenus, ignores, synthese, settings, reponses, note }) {
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const p = t => `<p style="text-align:justify; margin:0 0 6pt;">${t}</p>`;
  const cab = dbCartographieCabinet();
  const referent = (dbRoles().find(r => r.code === 'lbcft') || {}).titulaireEffectif || EXPERT_COMPTABLE.nom;
  const remplacer = t => String(t || '').replace('{{referent}}', referent);

  const methodologie = p(
    'La présente cartographie constitue la classification des risques de blanchiment de capitaux '
    + 'et de financement du terrorisme du cabinet, établie en application des articles L. 561-4-1 '
    + 'et suivants du code monétaire et financier et de la norme professionnelle anti-blanchiment '
    + 'applicable à la profession. Les données sont issues du registre de vigilance LBC-FT tenu par '
    + 'le cabinet au moyen de son outil interne d’analyse de vigilance.')
    + p('Le risque de chaque dossier est apprécié selon les quatre critères retenus par le manuel '
      + 'd’organisation du cabinet : <b>Client</b>, <b>Activité</b>, <b>Localisation</b> et '
      + '<b>Nature de la mission</b>. Chacun de ces critères est coté faible, moyen ou élevé au '
      + 'regard des facteurs de risque énumérés aux annexes de la directive (UE) 2015/849 et des '
      + 'typologies publiées par TRACFIN et par l’analyse nationale des risques du COLB.')
    + '<p style="margin:0 0 4pt;"><b>Règle de combinaison.</b> Le niveau de vigilance du dossier '
      + 'résulte de la cotation la plus élevée obtenue sur l’un quelconque des quatre critères :</p>'
    + '<ul style="margin:0 0 6pt 16pt;">'
      + '<li>un critère coté <b>élevé</b>, ou l’un des cas énumérés aux articles L. 561-10 et '
      + 'L. 561-10-1 du code monétaire et financier, entraîne une <b>vigilance renforcée</b> ;</li>'
      + '<li>une cotation <b>moyenne</b> sur un ou plusieurs critères, sans cas légal de vigilance '
      + 'renforcée, correspond à une <b>vigilance normale</b> ;</li>'
      + '<li>la <b>vigilance allégée</b> n’est appliquée qu’aux situations de risque faible avéré '
      + 'au sens de l’article L. 561-9-1, sur décision expresse et documentée du référent LBC-FT.</li>'
    + '</ul>'
    + p('La cartographie est revue au moins annuellement et, en dehors de cette périodicité, à '
      + 'chaque entrée en relation d’affaires, à chaque modification substantielle d’un dossier et '
      + 'à chaque mise à jour des listes de pays tiers à haut risque.');

  const motivees = retenus.filter(d => String(d.justification || '').trim());
  const renforcees = retenus.filter(d => d.niveauRetenu === 'Renforcée');
  const normalesMotivees = motivees.filter(d => d.niveauRetenu === 'Normale');

  const vue = `<table style="width:100%; border-collapse:collapse; font-size:10pt; margin:0 0 8pt;">
    <tr><td style="padding:4pt 6pt; border-bottom:1px solid #E4E7EE;"><b>Dossiers analysés :</b></td><td style="padding:4pt 6pt; border-bottom:1px solid #E4E7EE;">${synthese.analyses}</td>
        <td style="padding:4pt 6pt; border-bottom:1px solid #E4E7EE;"><b>Date d’arrêté des données :</b></td><td style="padding:4pt 6pt; border-bottom:1px solid #E4E7EE;">${formatDate(aujourdhui)}</td></tr>
    <tr><td style="padding:4pt 6pt; border-bottom:1px solid #E4E7EE;"><b>Vigilance allégée :</b></td><td style="padding:4pt 6pt; border-bottom:1px solid #E4E7EE;">${synthese.allegees}</td>
        <td style="padding:4pt 6pt; border-bottom:1px solid #E4E7EE;"><b>Date d’édition :</b></td><td style="padding:4pt 6pt; border-bottom:1px solid #E4E7EE;">${formatDate(aujourdhui)}</td></tr>
    <tr><td style="padding:4pt 6pt; border-bottom:1px solid #E4E7EE;"><b>Vigilance normale :</b></td><td style="padding:4pt 6pt; border-bottom:1px solid #E4E7EE;">${synthese.normales}</td>
        <td style="padding:4pt 6pt; border-bottom:1px solid #E4E7EE;"><b>Dossiers en analyse motivée :</b></td><td style="padding:4pt 6pt; border-bottom:1px solid #E4E7EE;">${motivees.length}</td></tr>
    <tr><td style="padding:4pt 6pt;"><b>Vigilance renforcée :</b></td><td style="padding:4pt 6pt;">${synthese.renforcees}</td>
        <td style="padding:4pt 6pt;"><b>Dont art. L. 561-10-1 CMF :</b></td><td style="padding:4pt 6pt;">${synthese.deplein}</td></tr>
  </table>`
    + (synthese.ecartes
      ? p(`<b>Périmètre.</b> ${synthese.ecartes} ${pluriel(synthese.ecartes, 'dossier a été écarté', 'dossiers ont été écartés')} `
        + 'volontairement de la présente cartographie. Le motif de chaque exclusion figure ci-après.')
      : p('<b>Périmètre.</b> Aucun dossier du portefeuille n’a été écarté de la présente cartographie.'))
    + (synthese.ecartes
      ? cartoTableau(['Dossier', 'Motif de l’exclusion', 'Le'],
        Object.keys(ignores).map(id => [
          docxEchapper(client(id) ? client(id).nom : id),
          docxEchapper(ignores[id].motif),
          formatDate(ignores[id].le),
        ]))
      : '');

  const internationaux = retenus.filter(d =>
    (d.paysSiege && d.paysSiege !== 'France') || (d.paysBeneficiaires && d.paysBeneficiaires !== 'France'));
  const paysDe = d => [...new Set([d.paysSiege, d.paysBeneficiaires].filter(x => x && x !== 'France'))].join(', ');
  const ligneExpo = d => [
    docxEchapper(client(d.dossier) ? client(d.dossier).nom : d.dossier),
    docxEchapper(paysDe(d)),
    docxEchapper(d.natureExposition || 'À préciser'),
    docxEchapper(d.niveauRetenu || '—'),
  ];

  const geographie = p(
    'Le critère Localisation est apprécié au regard du pays du siège social ou du domicile du '
    + 'client, du pays de résidence des bénéficiaires effectifs et de l’existence d’établissements '
    + 'hors de France. Les pays concernés sont rapprochés de la liste des pays tiers à haut risque '
    + 'établie par la Commission européenne (règlement délégué (UE) 2016/1675) ainsi que des listes '
    + 'du GAFI.')
    + `<h3 style="font-size:10pt; margin:10pt 0 5pt;">2.1 — Dossiers relevant de l’article L. 561-10-1 du code monétaire et financier</h3>`
    + p('Les dossiers ci-après relèvent de plein droit des mesures de vigilance renforcée prévues à '
      + 'l’article L. 561-10-1, et non d’une appréciation discrétionnaire du cabinet.')
    + cartoTableau(['Dossier', 'Pays listé', 'Nature de l’exposition', 'Vigilance'],
      internationaux.filter(d => d.paysListe).map(ligneExpo))
    + `<h3 style="font-size:10pt; margin:10pt 0 5pt;">2.2 — Autres dossiers présentant une dimension internationale</h3>`
    + p('Les dossiers ci-après comportent une dimension internationale identifiée et examinée, sans '
      + 'qu’aucun pays tiers à haut risque ne soit concerné. Le facteur a été retenu et documenté, '
      + 'mais n’entraîne pas de classement en vigilance renforcée.')
    + cartoTableau(['Dossier', 'Pays ou zone', 'Nature de l’exposition', 'Vigilance'],
      internationaux.filter(d => !d.paysListe).map(ligneExpo));

  const parSecteur = {};
  retenus.forEach(d => {
    const cle = String(d.secteurNaf || '').trim() || 'nr';
    parSecteur[cle] = (parSecteur[cle] || 0) + 1;
  });
  const secteurs = Object.keys(parSecteur).map(cle => ({
    cle,
    label: cle === 'nr' ? 'Code NAF non renseigné'
      : (NAF_DIVISIONS.find(n => n.code === cle) || {}).label || cle,
    n: parSecteur[cle],
  })).sort((a, b) => b.n - a.n);
  const totalR = retenus.length || 1;
  const concentrations = secteurs.filter(x => x.n / totalR >= 0.1);

  const secteur = p(
    'La répartition par secteur constitue le support du critère Activité.')
    + (concentrations.length
      ? '<ul style="margin:0 0 6pt 16pt;">' + concentrations.map(c =>
        `<li><b>${docxEchapper(c.label)}</b> : ${c.n} ${pluriel(c.n, 'dossier', 'dossiers')}, soit `
        + `${Math.round((c.n / totalR) * 100)} % du portefeuille.`
        + (NAF_DIVISIONS_SENSIBLES[c.cle]
          ? ` Ce secteur figure parmi ceux que citent les typologies TRACFIN : ${docxEchapper(NAF_DIVISIONS_SENSIBLES[c.cle])}`
          : '') + '</li>').join('') + '</ul>'
      : p('Le portefeuille ne présente aucune concentration sectorielle supérieure à 10 %.'))
    + p('Ces concentrations ne déclenchent pas mécaniquement une vigilance renforcée : conformément '
      + 'à la règle de combinaison exposée en méthodologie, elles constituent un facteur parmi quatre.')
    + cartoTableau(['Secteur', 'Nb clients', '%'],
      secteurs.map(x => [docxEchapper(x.label), String(x.n), Math.round((x.n / totalR) * 100) + ' %'])
        .concat([[`<b>Total</b>`, `<b>${retenus.length}</b>`, '<b>100 %</b>']]));

  const ligneMotivee = d => [
    `<b>${docxEchapper(client(d.dossier) ? client(d.dossier).nom : d.dossier)}</b>`,
    docxEchapper(d.secteurNaf || 'n.r.'),
    docxEchapper(d.justification || ''),
  ];
  const motivation = p(
    'La présente section recense les dossiers pour lesquels au moins un facteur de risque a été '
    + 'identifié et a fait l’objet d’un examen documenté.')
    + `<h3 style="font-size:10pt; margin:10pt 0 5pt;">A. Vigilance normale avec justification motivée — ${normalesMotivees.length} ${pluriel(normalesMotivees.length, 'dossier', 'dossiers')}</h3>`
    + cartoTableau(['Dossier', 'Secteur', 'Justification'], normalesMotivees.map(ligneMotivee))
    + `<h3 style="font-size:10pt; margin:10pt 0 5pt;">B. Vigilance renforcée — ${renforcees.length} ${pluriel(renforcees.length, 'dossier', 'dossiers')}</h3>`
    + cartoTableau(['Dossier', 'Secteur', 'Justification'], renforcees.map(ligneMotivee));

  const canaux = (cab.canaux || []).filter(c => String(c || '').trim());
  const entree = canaux.length
    ? p('Les nouveaux clients entrent en relation avec le cabinet principalement par : '
      + docxEchapper(canaux.join(' ; ')) + '.')
      + p('Toute acceptation de mission fait l’objet d’une lettre de mission et d’une vérification '
        + 'préalable de l’identité du client, de son représentant légal et, le cas échéant, de son '
        + 'ou ses bénéficiaires effectifs.')
    : p('<b>Les canaux d’entrée en relation n’ont pas été renseignés.</b> Ils se déclarent dans '
      + 'ComplyEC, onglet « Ce que le cabinet déclare » de la cartographie.');

  const mesures = CARTO_MESURES.map(m =>
    `<p style="text-align:justify; margin:0 0 6pt;"><b>${docxEchapper(m.titre)}.</b> ${docxEchapper(remplacer(cab['mesure_' + m.cle]))}</p>`).join('');

  const gouvernance = CARTO_GOUVERNANCE.map(g =>
    `<p style="text-align:justify; margin:0 0 6pt;"><b>${docxEchapper(g.titre)}.</b> ${docxEchapper(cab['gouv_' + g.cle])}</p>`).join('');

  const ouiNon = code => (reponses[code] === 'Oui' ? 'oui' : 'non');
  const conclusion = p(
    `Au vu des éléments qui précèdent, le profil de risque LBC-FT du cabinet est apprécié au regard `
    + `de la nature de sa clientèle et de son activité. Sur ${retenus.length} `
    + `${pluriel(retenus.length, 'dossier analysé', 'dossiers analysés')}, ${motivees.length} `
    + `${pluriel(motivees.length, 'a fait', 'ont fait')} l’objet d’une analyse motivée : `
    + `${normalesMotivees.length} ${pluriel(normalesMotivees.length, 'classé', 'classés')} en vigilance normale après examen `
    + `d’un facteur de risque identifié, et ${renforcees.length} en vigilance renforcée, dont `
    + `${synthese.deplein} au titre de l’article L. 561-10-1 du code monétaire et financier.`)
    + p(`La revue conduite avant arrêté conclut qu’une concentration inhabituelle est relevée : `
      + `<b>${ouiNon('concentration')}</b> ; que le portefeuille a connu une évolution importante `
      + `depuis la dernière revue : <b>${ouiNon('evolution')}</b> ; qu’un dossier appelle une mesure `
      + `particulière non encore prise : <b>${ouiNon('mesure')}</b>.`)
    + (note ? p(`<b>Note de revue.</b> ${docxEchapper(note)}`) : '');

  const validation = `<table style="width:100%; border-collapse:collapse; font-size:10pt;">
    <tr><td style="padding:6pt;">Expert-comptable et référent LBC-FT : <b>${docxEchapper(referent)}</b></td>
        <td style="padding:6pt; text-align:right;">Date : ${formatDate(aujourdhui)}</td></tr></table>`;

  const annexe = `<h2 style="background:#1F3864; color:#fff; font-size:10.5pt; padding:5pt 8pt; margin:16pt 0 8pt;">Annexes</h2>`
    + p(`<b>Annexe 1</b> — Fiches de vigilance individuelles des ${renforcees.length} `
      + `${pluriel(renforcees.length, 'dossier classé', 'dossiers classés')} en vigilance renforcée : `
      + (renforcees.length
        ? docxEchapper(renforcees.map(d => (client(d.dossier) ? client(d.dossier).nom : d.dossier)).join(', ')) + '.'
        : 'aucun dossier concerné à la date d’arrêté.'));

  const corps = `<h1 style="text-align:center; font-size:15pt; margin:0 0 4pt;">CARTOGRAPHIE DES RISQUES LBC-FT</h1>
    <p style="text-align:center; font-size:10pt; color:#555; margin:0 0 16pt;">${docxEchapper(settings.nom || '')}</p>
    <h2 style="font-size:9.5pt; letter-spacing:0.06em; color:#1F3864; margin:0 0 6pt;">MÉTHODOLOGIE</h2>
    ${methodologie}
    ${cartoSection(1, 'Vue d’ensemble du portefeuille', vue)}
    ${cartoSection(2, 'Exposition géographique (critère Localisation)', geographie)}
    ${cartoSection(3, 'Répartition par secteur d’activité', secteur)}
    ${cartoSection(4, 'Dossiers faisant l’objet d’une analyse motivée', motivation)}
    ${cartoSection(5, 'Canaux d’entrée en relation', entree)}
    ${cartoSection(6, 'Contrôles et mesures d’atténuation en place', mesures)}
    ${cartoSection(7, 'Narratif de gouvernance validé par l’organe exécutif', gouvernance)}
    ${cartoSection(8, 'Conclusion générale', conclusion)}
    ${cartoSection(9, 'Validation', validation)}
    ${annexe}`;

  downloadWordDoc(
    `Cartographie_risques_LBCFT_${aujourdhui}.doc`,
    'Cartographie des risques LBC-FT',
    corps
  );
}

const CARTO_QUESTIONS = [
  { code: 'concentration', libelle: 'Une concentration inhabituelle apparaît-elle dans le portefeuille ?' },
  { code: 'evolution', libelle: 'Le portefeuille a-t-il connu une évolution importante depuis la dernière revue ?' },
  { code: 'mesure', libelle: 'Un dossier appelle-t-il une mesure particulière non encore prise ?' },
];

/* Les trois volets de la cartographie.

   Repris le 25 septembre, après que le cabinet a remis la cartographie qu'il
   établit lui-même. Le logiciel affichait quatre tuiles et trois questions :
   de quoi dire combien de dossiers sont en vigilance renforcée, pas de quoi
   écrire le document. Celui-ci compte neuf sections, dont trois décrivent le
   cabinet et non ses dossiers.

   D'où les trois volets : ce qui entre dans le périmètre, ce que le
   portefeuille montre, et ce que le cabinet déclare de son dispositif. */
const CARTO_VOLETS = [
  { code: 'perimetre', label: 'Le périmètre', teinte: 'ambre' },
  { code: 'portefeuille', label: 'Le portefeuille', teinte: 'bleu' },
  { code: 'cabinet', label: 'Ce que le cabinet déclare', teinte: 'menthe' },
];

/* Les motifs pour lesquels un dossier est volontairement écarté. Ils sont
   proposés parce qu'ils reviennent, et libres parce qu'aucune liste ne couvre
   tous les cas. Le motif part dans le document : un contrôleur doit pouvoir
   lire pourquoi un dossier ne figure pas dans une cartographie. */
const CARTO_MOTIFS_IGNORE = [
  'Mission terminée, dossier en cours de clôture',
  'Relation non encore nouée : lettre de mission non signée',
  'Dossier repris d’un confrère, analyse en cours de reconstitution',
  'Mission ponctuelle hors champ de la vigilance LBC-FT',
];

/* Le périmètre : ce qui entre dans la cartographie, et ce qui n'y entre pas.

   Un dossier sans analyse ne peut pas être classé — on ne cote pas ce qu'on
   n'a pas examiné. Deux issues, et deux seulement : on l'analyse, ou on
   l'écarte en disant pourquoi. Le second cas n'est pas une échappatoire :
   le motif est conservé, daté, et le document le mentionne. */
function CartoPerimetre({ onAnalyser, showToast }) {
  useDonnees();
  const tous = dbVigilanceDossiers();
  const ignores = dbDossiersIgnores();
  const sansAnalyse = tous.filter(d => d.statut !== 'complete' && !ignores[d.dossier]);
  const ecartes = tous.filter(d => ignores[d.dossier]);
  const retenus = tous.filter(d => d.statut === 'complete' && !ignores[d.dossier]);

  const [aEcarter, setAEcarter] = useState(null);
  const [motif, setMotif] = useState('');

  async function ecarter() {
    if (!String(motif).trim()) { showToast('Indiquez pourquoi ce dossier est écarté.'); return; }
    await dbIgnorerDossier(aEcarter, motif.trim());
    showToast('Dossier écarté du périmètre, avec son motif.');
    setAEcarter(null); setMotif('');
  }

  return h('div', { className: 'carto-perimetre' },
    h('div', { className: 'carto-tuiles' },
      h('div', { className: 'carto-tuile ton-vert' },
        h('span', { className: 'carto-tuile-valeur' }, retenus.length),
        h('span', { className: 'carto-tuile-libelle' }, 'Dossiers analysés, dans le périmètre')),
      h('div', { className: cx('carto-tuile', sansAnalyse.length && 'ton-rouge') },
        h('span', { className: 'carto-tuile-valeur' }, sansAnalyse.length),
        h('span', { className: 'carto-tuile-libelle' }, 'Sans analyse, à traiter')),
      h('div', { className: cx('carto-tuile', ecartes.length && 'ton-gris') },
        h('span', { className: 'carto-tuile-valeur' }, ecartes.length),
        h('span', { className: 'carto-tuile-libelle' }, 'Écartés volontairement'))
    ),

    sansAnalyse.length
      ? h('section', { className: 'carto-bloc carto-bloc-alerte' },
        h('header', { className: 'carto-bloc-entete' },
          h('h3', null, 'Dossiers sans analyse de vigilance'),
          h('span', { className: 'carto-bloc-compte' }, sansAnalyse.length)
        ),
        h('p', { className: 'carto-bloc-note' },
          'Ils ne peuvent pas être classés : on ne cote pas un dossier qu’on n’a '
          + 'pas examiné. Analysez-les, ou écartez-les du périmètre en disant '
          + 'pourquoi — le motif figurera dans le document.'),
        h('div', { className: 'tableau-moderne-enveloppe' },
          h('table', { className: 'tableau-moderne' },
            h('thead', null, h('tr', null,
              h('th', null, 'Dossier'), h('th', null, 'Activité'),
              h('th', { className: 'col-action' }, ''))),
            h('tbody', null, sansAnalyse.map(d => {
              const c = client(d.dossier);
              return h('tr', { key: d.dossier },
                h('td', { className: 'col-principale' }, c ? c.nom : d.dossier),
                h('td', null, c ? c.activite : '—'),
                h('td', { className: 'col-action carto-actions' },
                  h('button', {
                    className: 'btn btn-secondary btn-ligne', onClick: () => onAnalyser(),
                  }, 'Régulariser'),
                  h('button', {
                    className: 'lien-discret', onClick: () => { setAEcarter(d.dossier); setMotif(''); },
                  }, 'Écarter'))
              );
            }))
          )
        )
      )
      : h('div', { className: 'carto-bloc carto-bloc-ok' },
        h('span', { className: 'carto-bloc-marque' }, '✓'),
        h('p', null, 'Tous les dossiers du portefeuille sont analysés ou volontairement écartés.')
      ),

    ecartes.length
      ? h('section', { className: 'carto-bloc' },
        h('header', { className: 'carto-bloc-entete' },
          h('h3', null, 'Écartés volontairement du périmètre'),
          h('span', { className: 'carto-bloc-compte' }, ecartes.length)
        ),
        h('div', { className: 'tableau-moderne-enveloppe' },
          h('table', { className: 'tableau-moderne' },
            h('thead', null, h('tr', null,
              h('th', null, 'Dossier'), h('th', null, 'Motif retenu'),
              h('th', null, 'Le'), h('th', { className: 'col-action' }, ''))),
            h('tbody', null, ecartes.map(d => {
              const c = client(d.dossier);
              const i = ignores[d.dossier];
              return h('tr', { key: d.dossier },
                h('td', { className: 'col-principale' }, c ? c.nom : d.dossier),
                h('td', null, i.motif),
                h('td', { className: 'col-date' }, formatDate(i.le)),
                h('td', { className: 'col-action' },
                  h('button', {
                    className: 'lien-discret',
                    onClick: async () => {
                      await dbReintegrerDossier(d.dossier);
                      showToast('Dossier réintégré au périmètre.');
                    },
                  }, 'Réintégrer'))
              );
            }))
          )
        )
      )
      : null,

    aEcarter
      ? h(PanneauLateral, {
        ouvert: true,
        titre: 'Écarter ce dossier du périmètre',
        sousTitre: client(aEcarter) ? client(aEcarter).nom : aEcarter,
        onFermer: () => setAEcarter(null),
        pied: h(React.Fragment, null,
          h('button', { className: 'btn btn-secondary', onClick: () => setAEcarter(null) }, 'Annuler'),
          h('button', { className: 'btn btn-primary', onClick: ecarter }, 'Écarter du périmètre')),
      },
        h('p', { className: 'bloc-carte-note' },
          'Le dossier ne comptera pas dans la cartographie. Le motif est conservé, '
          + 'daté, et il figure dans le document : un contrôleur doit pouvoir lire '
          + 'pourquoi un dossier n’y est pas.'),
        h(ListePanneau, {
          label: 'Motif', libre: true,
          options: CARTO_MOTIFS_IGNORE.map(m => ({ code: m, label: m })),
          valeur: motif, onChange: setMotif,
        })
      )
      : null
  );
}

/* Le portefeuille : ce que les analyses montrent une fois agrégées.

   Aucun chiffre n'est saisi ici. Trois lectures, celles des sections 1 à 3 du
   document : la répartition par niveau, l'exposition géographique, la
   répartition par secteur. */
function CartoPortefeuille({ retenus }) {
  const total = retenus.length;
  const parNiveau = ['Allégée', 'Normale', 'Renforcée'].map(n => ({
    niveau: n, dossiers: retenus.filter(d => d.niveauRetenu === n),
  }));

  /* Exposition géographique : les dossiers dont un pays n'est pas la France.
     Ceux qui relèvent de l'article L. 561-10-1 sont séparés — la vigilance
     renforcée y est de plein droit, et non une appréciation du cabinet. */
  const internationaux = retenus.filter(d =>
    (d.paysSiege && d.paysSiege !== 'France')
    || (d.paysBeneficiaires && d.paysBeneficiaires !== 'France'));
  const deplein = internationaux.filter(d => d.paysListe);
  const autres = internationaux.filter(d => !d.paysListe);

  /* Répartition par secteur, dans l'ordre décroissant. */
  const parSecteur = {};
  retenus.forEach(d => {
    const cle = String(d.secteurNaf || '').trim() || 'nr';
    parSecteur[cle] = (parSecteur[cle] || 0) + 1;
  });
  const secteurs = Object.keys(parSecteur)
    .map(cle => ({
      cle,
      label: cle === 'nr' ? 'Code NAF non renseigné'
        : (NAF_DIVISIONS.find(n => n.code === cle) || {}).label || cle,
      n: parSecteur[cle],
      pct: total ? Math.round((parSecteur[cle] / total) * 100) : 0,
    }))
    .sort((a, b) => b.n - a.n);

  const tableauPays = (lignes, titre, note) => h('section', { className: 'carto-bloc' },
    h('header', { className: 'carto-bloc-entete' },
      h('h3', null, titre),
      h('span', { className: 'carto-bloc-compte' }, lignes.length)
    ),
    note ? h('p', { className: 'carto-bloc-note' }, note) : null,
    lignes.length
      ? h('div', { className: 'tableau-moderne-enveloppe' },
        h('table', { className: 'tableau-moderne' },
          h('thead', null, h('tr', null,
            h('th', null, 'Dossier'), h('th', null, 'Pays'),
            h('th', null, 'Nature de l’exposition'), h('th', null, 'Vigilance'))),
          h('tbody', null, lignes.map(d => {
            const c = client(d.dossier);
            const pays = [d.paysSiege, d.paysBeneficiaires]
              .filter(p => p && p !== 'France');
            return h('tr', { key: d.dossier },
              h('td', { className: 'col-principale' }, c ? c.nom : d.dossier),
              h('td', null, [...new Set(pays)].join(', ') || '—'),
              h('td', null, d.natureExposition || h('span', { className: 'cellule-vide' }, 'À préciser')),
              h('td', null, h(Badge, { color: niveauVigilanceCouleur(d.niveauRetenu) }, d.niveauRetenu || '—')));
          }))
        )
      )
      : h('p', { className: 'carto-bloc-vide' }, 'Aucun dossier dans ce cas.')
  );

  return h('div', { className: 'carto-portefeuille' },
    h('section', { className: 'carto-bloc' },
      h('header', { className: 'carto-bloc-entete' }, h('h3', null, 'Répartition par niveau de vigilance')),
      parNiveau.map(p => {
        const pct = total ? Math.round((p.dossiers.length / total) * 100) : 0;
        return h('div', { className: 'carto-barre', key: p.niveau },
          h('div', { className: 'carto-barre-tete' },
            h('span', { className: 'carto-barre-nom' }, 'Vigilance ', p.niveau.toLowerCase()),
            h('span', { className: 'carto-barre-valeur' }, p.dossiers.length, ' (', pct, ' %)')),
          h('div', { className: 'carto-barre-piste' },
            h('div', {
              className: cx('carto-barre-remplie', 'niv-' + niveauVigilanceCouleur(p.niveau)),
              style: { width: pct + '%' },
            })));
      })
    ),

    tableauPays(deplein, 'Dossiers relevant de l’article L. 561-10-1',
      'Pays tiers à haut risque au sens du règlement délégué (UE) 2016/1675 : la '
      + 'vigilance renforcée s’applique de plein droit, sans appréciation du cabinet.'),

    tableauPays(autres, 'Autres dossiers à dimension internationale',
      'Le facteur est identifié et documenté, sans entraîner de classement '
      + 'automatique en vigilance renforcée.'),

    h('section', { className: 'carto-bloc' },
      h('header', { className: 'carto-bloc-entete' },
        h('h3', null, 'Répartition par secteur d’activité'),
        h('span', { className: 'carto-bloc-compte' }, secteurs.length)
      ),
      h('div', { className: 'tableau-moderne-enveloppe' },
        h('table', { className: 'tableau-moderne' },
          h('thead', null, h('tr', null,
            h('th', null, 'Division d’activité'), h('th', null, 'Dossiers'), h('th', null, '%'))),
          h('tbody', null, secteurs.map(sec => h('tr', {
            key: sec.cle, className: cx(NAF_DIVISIONS_SENSIBLES[sec.cle] && 'ligne-signalee'),
          },
            h('td', { className: 'col-principale' },
              sec.label,
              NAF_DIVISIONS_SENSIBLES[sec.cle]
                ? h('span', { className: 'secteur-signal' }, 'typologie TRACFIN')
                : null),
            h('td', null, sec.n),
            h('td', null, sec.pct, ' %'))))
        )
      )
    )
  );
}

/* Ce que le cabinet déclare : les sections 5 à 7 du document.

   Elles ne se déduisent d'aucun calcul — elles décrivent le cabinet, pas ses
   dossiers. ComplyEC propose une rédaction, reprise de celle que le cabinet a
   lui-même écrite, et la conserve. C'est le cabinet qui signe. */
function CartoCabinet({ showToast }) {
  useDonnees();
  const enregistre = dbCartographieCabinet();
  const [form, setForm] = useState(enregistre);
  const maj = (cle, v) => setForm(f => Object.assign({}, f, { [cle]: v }));
  const referent = (dbRoles().find(r => r.code === 'lbcft') || {}).titulaireEffectif;

  async function enregistrer() {
    await dbMajCartographieCabinet(form);
    showToast('Déclarations du cabinet enregistrées.');
  }

  const remplacerReferent = t => String(t || '')
    .replace('{{referent}}', referent || 'à désigner dans Paramètres › Responsables');

  return h('div', { className: 'carto-cabinet' },
    h('section', { className: 'carto-bloc' },
      h('header', { className: 'carto-bloc-entete' },
        h('h3', null, 'Canaux d’entrée en relation'),
        h('span', { className: 'carto-bloc-note-inline' }, 'Section 5')
      ),
      h(CasesPanneau, {
        label: null, libre: true,
        options: CANAUX_ENTREE.map(c => ({ code: c, label: c })),
        valeurs: form.canaux, onChange: v => maj('canaux', v),
        aide: 'Par quels chemins les nouveaux clients arrivent au cabinet.',
      })
    ),

    h('section', { className: 'carto-bloc' },
      h('header', { className: 'carto-bloc-entete' },
        h('h3', null, 'Contrôles et mesures d’atténuation en place'),
        h('span', { className: 'carto-bloc-note-inline' }, 'Section 6')
      ),
      h('div', { className: 'carto-mesures' },
        CARTO_MESURES.map(m => h(ChampPanneau, {
          key: m.cle, label: m.titre, lignes: 2,
          valeur: remplacerReferent(form['mesure_' + m.cle]),
          onChange: v => maj('mesure_' + m.cle, v),
        }))
      )
    ),

    h('section', { className: 'carto-bloc' },
      h('header', { className: 'carto-bloc-entete' },
        h('h3', null, 'Narratif de gouvernance'),
        h('span', { className: 'carto-bloc-note-inline' }, 'Section 7')
      ),
      h('div', { className: 'carto-mesures' },
        CARTO_GOUVERNANCE.map(g => h(ChampPanneau, {
          key: g.cle, label: g.titre, lignes: 2,
          valeur: form['gouv_' + g.cle], onChange: v => maj('gouv_' + g.cle, v),
        }))
      )
    ),

    h('div', { className: 'carto-cabinet-pied' },
      h('button', { className: 'btn btn-primary', onClick: enregistrer },
        'Enregistrer les déclarations')
    )
  );
}

function CartographieLbcft({ onBack, showToast, cabinetSettings, dansParcours, onAnalyser }) {
  const settings = cabinetSettings || CABINET_SETTINGS_DEFAUT;
  useDonnees();
  const [volet, setVolet] = useState('perimetre');
  const [reponses, setReponses] = useState({});
  const [note, setNote] = useState('');
  const derniere = dbCartographies().length ? dbCartographies()[0] : null;
  const toutesRepondues = CARTO_QUESTIONS.every(q => reponses[q.code]);

  const ignores = dbDossiersIgnores();
  const tous = dbVigilanceDossiers();
  const retenus = tous.filter(d => d.statut === 'complete' && !ignores[d.dossier]);
  const sansAnalyse = tous.filter(d => d.statut !== 'complete' && !ignores[d.dossier]);
  const aujourdhui = new Date().toISOString().slice(0, 10);

  /* La cartographie ne s'arrête pas tant qu'un dossier reste sans réponse :
     ni analysé, ni écarté. Un document qui annonce un portefeuille sans dire
     ce qu'il a laissé de côté n'oppose rien à un contrôleur. */
  const perimetreComplet = sansAnalyse.length === 0;
  const pretAArreter = toutesRepondues && perimetreComplet && retenus.length > 0;

  async function arreter() {
    const synthese = {
      total: tous.length,
      analyses: retenus.length,
      ecartes: Object.keys(ignores).length,
      renforcees: retenus.filter(d => d.niveauRetenu === 'Renforcée').length,
      normales: retenus.filter(d => d.niveauRetenu === 'Normale').length,
      allegees: retenus.filter(d => d.niveauRetenu === 'Allégée').length,
      deplein: retenus.filter(d => d.paysListe).length,
      divergences: rbeDivergences().length,
      revue: Object.assign({}, reponses),
      note: note.trim() || null,
    };
    await dbArreterCartographie(synthese);
    telechargerCartographie({ retenus, ignores, synthese, settings, reponses, note });
    showToast(`Cartographie arrêtée au ${formatDateLong(aujourdhui)} et document produit.`);
  }

  const courant = CARTO_VOLETS.find(v => v.code === volet);

  return h(CadreHub, {
    encadre: dansParcours,
    titre: 'Cartographie des risques LBC-FT',
    actions: h(React.Fragment, null,
      onBack && !dansParcours ? h('button', { className: 'btn btn-secondary', onClick: onBack }, '← Retour') : null,
      h('button', {
        className: 'btn btn-primary',
        disabled: !pretAArreter,
        title: pretAArreter ? undefined
          : (!perimetreComplet
            ? `${sansAnalyse.length} ${pluriel(sansAnalyse.length, 'dossier reste', 'dossiers restent')} sans analyse : traitez-les ou écartez-les.`
            : 'Répondez d’abord aux trois questions de la revue.'),
        onClick: arreter,
      }, '✅ Arrêter et produire le document')
    ),
  },
    h('div', { className: 'filtres-internes' },
      CARTO_VOLETS.map(v => h('button', {
        key: v.code,
        className: cx('filtre-interne', 'teinte-' + v.teinte, volet === v.code && 'actif'),
        onClick: () => setVolet(v.code),
      },
        v.label,
        v.code === 'perimetre' && sansAnalyse.length
          ? h('span', { className: 'filtre-compte' }, `${sansAnalyse.length} à traiter`)
          : null
      ))
    ),

    h('div', { className: 'carto-volet', key: volet },
      volet === 'perimetre'
        ? h(CartoPerimetre, { onAnalyser, showToast })
        : volet === 'portefeuille'
          ? h(CartoPortefeuille, { retenus })
          : h(CartoCabinet, { showToast })
    ),

    /* La revue de l'expert-comptable, toujours visible : c'est elle qui fait
       de l'arrêté une décision et non un export. */
    h('section', { className: 'carto-revue' },
      h('h3', null, 'Votre revue avant l’arrêté'),
      h('div', { className: 'carto-revue-questions' },
        CARTO_QUESTIONS.map(q => h('div', { className: 'carto-question', key: q.code },
          h('span', { className: 'carto-question-libelle' }, q.libelle),
          h('div', { className: 'toggle-pair' },
            ['Oui', 'Non'].map(v => h('button', {
              key: v,
              className: cx('toggle-btn', reponses[q.code] === v && 'active'),
              onClick: () => setReponses(p => Object.assign({}, p, { [q.code]: v })),
            }, v))
          )
        ))
      ),
      h('input', {
        className: 'form-input', value: note,
        placeholder: 'Note de revue (facultative)',
        'aria-label': 'Note de revue',
        onChange: e => setNote(e.target.value),
      }),
      h('p', { className: 'carto-revue-etat' },
        derniere
          ? `Dernier arrêté le ${formatDate(derniere.date)} par ${derniere.utilisateur}.`
          : 'La cartographie n’a jamais été arrêtée. L’article L. 561-4-1 du code '
            + 'monétaire et financier impose de la tenir régulièrement actualisée.')
    )
  );
}

// ============================================ S40 — Campagnes & contrôles

function etapeLbcft(code) {
  const i = LBCFT_ETAPES.findIndex(e => e.code === code);
  return i < 0 ? null : Object.assign({ rang: i + 1 }, LBCFT_ETAPES[i]);
}

/* L'état des cinq étapes, déduit des faits — comme le parcours principal, et
   pour la même raison : une étape qui se dirait prête parce qu'on l'a
   ouverte tromperait l'expert-comptable la veille de son contrôle. */
function computeLbcftJourneyState() {
  const annee = currentCalendarYear();
  const roles = dbRoles().filter(x => ['lbcft', 'declarant', 'correspondant'].includes(x.code));
  const rolesKo = roles.filter(x => !x.titulaireEffectif);
  const dossiers = dbVigilanceDossiers();
  const couverts = dossiers.filter(d => d.statut === 'complete');
  const aTraiter = vigilanceATraiter();
  const sensibles = dossiersSensiblesLbcft();
  const divergences = rbeDivergences();
  const controles = controlesAFaire();
  const cartographies = dbCartographies();
  const derniere = cartographies.length ? cartographies[0] : null;
  // Le cabinet arrête sa cartographie une fois par an. Une cartographie de
  // l'année précédente est à actualiser, pas à refaire (§ 45).
  const perimee = derniere && Number(String(derniere.date).slice(0, 4)) < annee;

  const etapes = {
    organiser: {
      pret: rolesKo.length === 0,
      resume: rolesKo.length
        ? `${rolesKo.length} ${pluriel(rolesKo.length, 'rôle')} sans titulaire`
        : 'Référent, déclarant et correspondant désignés',
      action: rolesKo.length ? 'Désigner les responsables' : null,
      section: 'gouvernance', sub: 'organisation',
    },
    couverture: {
      pret: aTraiter.length === 0,
      resume: `${couverts.length} ${pluriel(couverts.length, 'dossier couvert', 'dossiers couverts')} sur ${dossiers.length}`,
      action: aTraiter.length ? `Mettre à jour ${aTraiter.length} ${pluriel(aTraiter.length, 'dossier')}` : null,
      section: 'vigilance', sub: 'a-traiter',
    },
    sensibles: {
      pret: sensibles.every(d => d.traite),
      resume: sensibles.length
        ? `${sensibles.filter(d => d.traite).length} ${pluriel(sensibles.filter(d => d.traite).length, 'traité', 'traités')} sur ${sensibles.length}`
        : 'Aucun dossier ne demande d’attention particulière',
      action: sensibles.some(d => !d.traite)
        ? `Examiner ${sensibles.filter(d => !d.traite).length} ${pluriel(sensibles.filter(d => !d.traite).length, 'dossier')}`
        : null,
      section: 'vigilance', sub: 'sensibles',
    },
    controles: {
      pret: divergences.length === 0 && controles.length === 0,
      resume: `${dbCampagneRbe().filter(r => r.consulteLe).length} ${pluriel(dbCampagneRbe().filter(r => r.consulteLe).length, 'consultation')} RBE, ${dbControles().filter(c => c.date).length} ${pluriel(dbControles().filter(c => c.date).length, 'contrôle ciblé', 'contrôles ciblés')}`,
      action: (divergences.length || controles.length)
        ? `Traiter ${divergences.length + controles.length} ${pluriel(divergences.length + controles.length, 'point')}`
        : null,
      section: 'vigilance', sub: 'campagnes',
    },
    cartographie: {
      pret: !!derniere && !perimee,
      resume: derniere
        ? `Arrêtée le ${formatDate(derniere.date)}`
        : 'Jamais arrêtée',
      action: (!derniere || perimee) ? (derniere ? 'Actualiser la cartographie' : 'Arrêter la cartographie') : null,
      section: 'vigilance', sub: 'cartographie',
    },
  };

  LBCFT_ETAPES.forEach((e, i) => {
    Object.assign(etapes[e.code], { code: e.code, titre: e.titre, court: e.court, icone: e.icone, rang: i + 1 });
  });

  const liste = LBCFT_ETAPES.map(e => etapes[e.code]);
  const pretes = liste.filter(s => s.pret).length;
  /* À l'ouverture, on va à la première étape qui n'est pas prête. Si tout est
     prêt, on ouvre la cinquième, qui porte la synthèse à jour (§ 19). */
  const courante = liste.find(s => !s.pret) || liste[liste.length - 1];
  return { etapes, liste, pretes, total: liste.length, courante };
}

/* Le fil des cinq étapes, même grammaire que celui du parcours principal :
   on reconnaît la mécanique avant d'avoir lu le titre. */
function SimpleProgress({ fait, total }) {
  const part = total > 0 ? Math.round(fait / total * 100) : 0;
  return h('div', { className: 'simple-progress', role: 'img', 'aria-label': `${fait} sur ${total}` },
    h('span', { style: { width: part + '%' } })
  );
}

/* =====================================================================
   REFONTE — Rubrique LCB-FT
   =====================================================================

   Trois vues, aucune nouvelle saisie.

   L'analyse dossier par dossier et la cartographie sont les modèles déjà
   validés par le cabinet : ils sont repris tels quels, pas réinventés. Ce que
   la rubrique ajoute, c'est de les rendre atteignables et de leur adjoindre le
   suivi du registre des bénéficiaires, qui est la seule chose qui manquait. */

/* Trois briques, donc un hub à trois cartes. Le troisième niveau ne monte pas
   dans la barre de gauche : il s'ouvre ici, en grand. */
/* Les cinq objets de la LCB-FT.

   Chacun est une question à laquelle le cabinet doit pouvoir répondre devant
   un contrôleur, et chacun porte son compte : combien de dossiers sont à jour,
   combien restent à traiter. Sans ce compte, on ouvre les cinq cartes pour
   découvrir que quatre n'ont rien à faire.

   La cartographie n'a pas de compte par dossier : elle s'arrête à une date,
   et c'est cette date qui dit si elle est à jour. */
/* L'ordre est celui du travail, et il est numéroté.

   On commence par savoir qui est derrière le client — le registre des
   bénéficiaires effectifs. On regarde ensuite si l'une de ces personnes est
   politiquement exposée. On en tire l'analyse de vigilance du dossier. On
   arrête alors la cartographie des risques du cabinet, qui s'appuie sur
   l'ensemble des dossiers analysés. Les autres vérifications — gels d'avoirs,
   sanctions — viennent en dernier : elles se refont à chaque revue et ne
   conditionnent rien.

   L'ordre précédent ouvrait sur l'attestation PPE, c'est-à-dire sur une
   question qu'on ne peut pas poser avant de savoir de qui l'on parle. */
const LBCFT_CARTES = [
  { key: 'rbe', label: 'Registre RBE', icone: 'bouclier', teinte: 'menthe', rang: 1 },
  { key: 'ppe', label: 'Attestations PPE manquantes', icone: 'signature', teinte: 'ambre', rang: 2 },
  { key: 'analyse', label: 'Vigilance LCB-FT', icone: 'loupe', teinte: 'violet', rang: 3 },
  { key: 'cartographie', label: 'Cartographie du cabinet', icone: 'graphe', teinte: 'bleu', rang: 4 },
  { key: 'verifications', label: 'Autres vérifications', icone: 'liste', teinte: 'acier', rang: 5 },
];

/* Ce qui reste à faire, carte par carte. Les nombres viennent des mêmes
   fonctions que les écrans qu'ils annoncent : ils ne peuvent pas diverger. */
function etatsLbcft() {
  const dossiers = dbVigilanceDossiers();
  const rbe = dbSuiviRbe();
  const controles = dbControles();
  const attestations = attestationsPpe();
  const derniere = dbCartographies().length ? dbCartographies()[0] : null;
  return {
    ppe: { reste: attestations.filter(a => !a.deposee).length, total: attestations.length },
    analyse: { reste: dossiers.filter(d => d.statut !== 'complete').length, total: dossiers.length },
    rbe: { reste: rbe.filter(l => !l.consulteLe).length, total: rbe.length },
    verifications: { reste: controles.filter(c => !c.date).length, total: controles.length },
    cartographie: { arreteeLe: derniere ? derniere.date || derniere.arreteeLe : null },
  };
}

function RubriqueLbcft({ navigateEc, showToast, cabinetSettings }) {
  const [vue, setVue] = useState(null);
  const [majDossier, setMajDossier] = useState(null);
  useDonnees();

  /* La mise à jour d'une vigilance ouvre le parcours existant en plein écran :
     c'est un travail, pas une consultation, et il ne tient pas dans une
     rubrique. */
  if (majDossier) {
    return h(MiseAJourVigilance, {
      dossierId: majDossier,
      onBack: () => setMajDossier(null),
      showToast, cabinetSettings,
    });
  }

  if (!vue) {
    const etats = etatsLbcft();
    const cartes = LBCFT_CARTES.map(c => {
      const e = etats[c.key];
      if (c.key === 'cartographie') {
        return Object.assign({}, c, {
          faite: !!e.arreteeLe,
          compte: e.arreteeLe ? `Arrêtée le ${formatDate(e.arreteeLe)}` : 'Jamais arrêtée',
        });
      }
      return Object.assign({}, c, {
        faite: e.reste === 0,
        compte: e.reste
          ? `${e.reste} sur ${e.total} à traiter`
          : `${e.total} sur ${e.total} à jour`,
      });
    });
    return h(RubriquePage, { titre: 'LCB-FT' },
      h(CartesHub, { cartes, onOuvrir: setVue })
    );
  }

  const carte = LBCFT_CARTES.find(c => c.key === vue);
  return h(RubriquePage, {
    titre: carte.label,
    retour: h(RetourHub, { vers: 'LCB-FT', onRetour: () => setVue(null) }),
  },
    vue === 'ppe'
      ? h(ParcoursPpe, { showToast, cabinetSettings })
      : vue === 'analyse'
        ? h(ParcoursVigilance, { showToast })
        : vue === 'rbe'
          ? h(SuiviRbe, { showToast })
          : vue === 'verifications'
            ? h(ParcoursVerifications, { showToast })
            : h(CartographieLbcft, { dansParcours: true, showToast, cabinetSettings, onAnalyser: () => setVue('analyse') })
  );
}

// --------------------------------------------- Parcours « un problème à la fois »

/* Le parcours guidé des deux cartes documentaires.

   Il reprend la forme de la contractualisation : on voit d'abord la liste des
   dossiers concernés, puis on traite un dossier par écran, avec le contexte
   qu'il faut et rien d'autre. On peut sortir à tout moment ; ce qui a été
   traité reste traité.

   Un seul problème par parcours : mélanger l'attestation PPE et le gel des
   avoirs dans le même enchaînement obligerait à changer de raisonnement d'un
   écran à l'autre, et c'est là qu'on se trompe. */
function ParcoursEtapes({ titre, sousTitre, lignes, colonnes, cle, rendreEtape, vide, showToast, libelleChaine }) {
  const [index, setIndex] = useState(null);

  if (index === null) {
    return h('div', { className: 'parcours-liste' },
      sousTitre ? h('p', { className: 'parcours-intro' }, sousTitre) : null,
      lignes.length
        ? h(React.Fragment, null,
          h('div', { className: 'tableau-moderne-enveloppe' },
            h('table', { className: 'tableau-moderne' },
              h('thead', null, h('tr', null, colonnes.map(c => h('th', { key: c.titre }, c.titre)))),
              h('tbody', null, lignes.map((l, i) => h('tr', {
                key: cle(l), className: 'ligne-cliquable', onClick: () => setIndex(i),
              }, colonnes.map(c => h('td', { key: c.titre, className: c.classe }, c.rendu(l))))))
            )
          ),
          /* Deux manières de s'y mettre, et les deux sont visibles : une ligne
             se clique pour traiter ce dossier-là, le bouton enchaîne tous les
             dossiers dans l'ordre. */
          h('div', { className: 'parcours-demarrer' },
            h('button', { className: 'btn btn-primary', onClick: () => setIndex(0) },
              libelleChaine
                ? libelleChaine(lignes.length)
                : `Traiter les ${lignes.length} ${pluriel(lignes.length, 'dossier', 'dossiers')} →`)
          )
        )
        : h('div', { className: 'anomalies-vide' },
          h('span', { className: 'anomalies-vide-marque' }, '✓'),
          h('p', null, vide)
        )
    );
  }

  const ligne = lignes[index];
  /* Un dossier traité sort de la liste : l'index suivant retombe donc
     naturellement sur le dossier d'après, et la fin du parcours est atteinte
     quand il n'y a plus rien. */
  if (!ligne) {
    return h('div', { className: 'anomalies-vide' },
      h('span', { className: 'anomalies-vide-marque' }, '✓'),
      h('p', null, 'Tous les dossiers ont été traités.'),
      h('button', { className: 'btn btn-secondary', onClick: () => setIndex(null) }, 'Revenir à la liste')
    );
  }

  return h('div', { className: 'parcours-etape' },
    h('div', { className: 'parcours-fil' },
      h('button', { className: 'lien-discret', onClick: () => setIndex(null) }, '← Revenir à la liste'),
      h('span', { className: 'parcours-position' },
        `Dossier ${index + 1} sur ${lignes.length}`)
    ),
    rendreEtape(ligne, {
      suivant: () => setIndex(i => i + 1),
      precedent: () => setIndex(i => Math.max(0, i - 1)),
      fermer: () => setIndex(null),
      premier: index === 0,
      dernier: index === lignes.length - 1,
    })
  );
}

/* Carte 3 — les analyses de vigilance manquantes.

   Repris le 24 septembre, sur le même raisonnement que les attestations PPE :
   ce que ComplyEC sait d'un dossier, c'est si la fiche de vigilance est dans
   l'espace documentaire ou si elle n'y est pas. Le portefeuille précédent
   listait les cent dossiers avec des filtres, des pastilles de critères et une
   fiche de lecture — beaucoup d'écran pour une question qui n'était pas posée.

   L'écran liste donc les dossiers sans analyse, et rien d'autre. On en ouvre
   un, et ce sont les deux étapes de la contractualisation qui reprennent : la
   cotation du risque sur quatre critères, puis le niveau de vigilance retenu
   et sa justification. Les mêmes écrans, pas une redite. */
function ParcoursVigilance({ showToast }) {
  useDonnees();
  const manquantes = dbVigilanceDossiers().filter(d => d.statut !== 'complete');

  return h(ParcoursEtapes, {
    sousTitre: manquantes.length
      ? 'ComplyEC constate l’absence de la fiche de vigilance dans l’espace '
        + 'documentaire, et rien de plus. Cliquez un dossier pour l’analyser seul, '
        + 'ou lancez-les à la chaîne.'
      : null,
    lignes: manquantes,
    cle: l => l.dossier,
    libelleChaine: n => `Analyser les ${n} ${pluriel(n, 'dossier', 'dossiers')} à la chaîne →`,
    colonnes: [
      { titre: 'Dossier', classe: 'col-principale', rendu: l => (client(l.dossier) ? client(l.dossier).nom : l.dossier) },
      { titre: 'Activité', rendu: l => (client(l.dossier) ? client(l.dossier).activite : '—') },
      { titre: 'Entrée en relation', rendu: l => (l.entreeEnRelation ? formatDate(l.entreeEnRelation) : '—') },
      { titre: '', classe: 'col-action', rendu: () => h('span', { className: 'btn btn-secondary btn-ligne' }, 'Analyser') },
    ],
    vide: 'Tous les dossiers ont leur analyse de vigilance au dossier permanent.',
    showToast,
    rendreEtape: (l, nav) => h(AnalyseVigilanceDossier, {
      ligne: l, nav, showToast, key: l.dossier,
    }),
  });
}

/* L'analyse d'un dossier : les étapes 8 et 9 de la contractualisation, dans
   l'ordre. On cote, on retient un niveau, on le justifie, on enregistre. */
const VIGILANCE_DEUX_ETAPES = ['Secteur et exposition', 'Cotation du risque', 'Niveau de vigilance'];

function AnalyseVigilanceDossier({ ligne, nav, showToast }) {
  const dossier = client(ligne.dossier) || {};
  const vig = useEtatVigilance(ligne);
  const [etape, setEtape] = useState(1);

  const identite = [
    ['Client', dossier.nom || ligne.dossier],
    ['Activité', dossier.activite || '—'],
    ['Dirigeant', dossier.dirigeant || '—'],
  ];
  const mission = [
    ['Entrée en relation', ligne.entreeEnRelation ? formatDate(ligne.entreeEnRelation) : '—'],
    ['Dernière analyse', ligne.derniereAnalyse ? formatDate(ligne.derniereAnalyse) : 'Jamais'],
  ];

  async function enregistrer() {
    await dbEnregistrerAnalyse(ligne.dossier,
      Object.assign(vig.aEnregistrer(), { statut: 'complete' }));
    showToast(`Analyse enregistrée — vigilance ${vig.niveauRetenu.toLowerCase()}.`);
    nav.suivant();
  }

  const justifieSiEcart = vig.niveauRetenu === vig.niveauPropose || vig.justification.trim();

  return h('div', { className: 'ppe-regularisation' },
    h('div', { className: 'ppe-regularisation-tete' },
      h('h2', null, dossier.nom || ligne.dossier),
      h('span', { className: 'parcours-contexte' },
        `${dossier.dirigeant || '—'}, dirigeant. Activité : ${dossier.activite || '—'}.`)
    ),

    h(Stepper, { steps: VIGILANCE_DEUX_ETAPES, current: etape }),

    /* Trois étapes depuis le 25 septembre : les faits d'abord — secteur et
       pays —, la cotation ensuite, le niveau retenu enfin. Coter avant d'avoir
       posé le secteur, c'était coter de mémoire. */
    etape === 1
      ? h(VigilanceEtapeExposition, { v: vig })
      : etape === 2
        ? h(VigilanceEtapeCotation, { v: vig, identite, mission })
        : h(VigilanceEtapeNiveau, { v: vig, contexteSynthese: { client: dossier.nom, activite: dossier.activite }, showToast }),

    h('div', { className: 'etape-actions' },
      etape < 3
        ? h(React.Fragment, null,
          etape > 1
            ? h('button', { className: 'btn btn-secondary', onClick: () => setEtape(etape - 1) }, '← Retour')
            : null,
          h('button', {
            className: 'btn btn-primary',
            disabled: etape === 1 && !String(vig.secteurNaf || '').trim(),
            title: etape === 1 && !String(vig.secteurNaf || '').trim()
              ? 'Choisissez la division d’activité : c’est elle qui alimente la répartition par secteur.'
              : undefined,
            onClick: () => setEtape(etape + 1),
          }, 'Continuer →')
        )
        : h(React.Fragment, null,
          h('button', { className: 'btn btn-secondary', onClick: () => setEtape(2) }, '← Retour'),
          h('button', {
            className: 'btn btn-primary',
            disabled: !justifieSiEcart,
            title: justifieSiEcart ? undefined : 'Justifiez l’écart avec le niveau calculé.',
            onClick: enregistrer,
          }, 'Enregistrer et passer au dossier suivant')
        ),
      h('button', { className: 'lien-discret', onClick: nav.suivant }, 'Passer ce dossier')
    )
  );
}

/* Carte 1 — les attestations PPE manquantes.

   Repris le 24 septembre, sur une remarque de fond du cabinet : ce que
   ComplyEC sait d'un dossier, c'est si l'attestation est au dossier permanent
   ou si elle n'y est pas. Rien d'autre. Il n'a pas lu le document, il n'a pas
   vu qui l'a signée, il ne sait pas si son contenu est à jour.

   L'écran dit donc exactement cela : voici les dossiers où la pièce manque.
   Et il donne les deux manières de s'y mettre — un dossier au choix en
   cliquant sa ligne, ou tous à la chaîne avec le bouton.

   Une fois dans un dossier, on ne repose pas une question au rabais : c'est
   l'écran de la contractualisation qui s'ouvre, le même, avec ses trois
   questions, ses signataires et son attestation préremplie. Deux endroits qui
   posent la même question de deux façons différentes, c'est deux réponses qui
   finissent par diverger. */
function ParcoursPpe({ showToast, cabinetSettings }) {
  useDonnees();
  const toutes = attestationsPpe();
  const aFaire = toutes.filter(a => !a.deposee);

  return h(ParcoursEtapes, {
    sousTitre: aFaire.length
      ? 'ComplyEC constate l’absence de la pièce dans l’espace documentaire, et rien de plus : '
        + 'il n’en lit pas le contenu. Cliquez un dossier pour le régulariser seul, '
        + 'ou lancez-les à la chaîne.'
      : null,
    lignes: aFaire,
    cle: l => l.dossier,
    libelleChaine: n => `Régulariser les ${n} ${pluriel(n, 'dossier', 'dossiers')} à la chaîne →`,
    colonnes: [
      { titre: 'Dossier', classe: 'col-principale', rendu: l => l.dossierInfo.nom },
      { titre: 'Dirigeant', rendu: l => l.dossierInfo.dirigeant },
      { titre: 'Activité', rendu: l => l.dossierInfo.activite },
      { titre: '', classe: 'col-action', rendu: () => h('span', { className: 'btn btn-secondary btn-ligne' }, 'Régulariser') },
    ],
    vide: 'Toutes les attestations PPE sont au dossier permanent.',
    showToast,
    rendreEtape: (l, nav) => h(RegularisationPpe, {
      ligne: l, nav, showToast, cabinetSettings,
      key: l.dossier,
    }),
  });
}

/* La régularisation d'un dossier : l'écran « Attestation PPE » de la
   contractualisation, tel quel.

   Les bénéficiaires effectifs viennent du dossier quand ils y sont ; sinon la
   liste s'ouvre sur le dirigeant, qu'on corrige. Le pointage de l'attestation
   comme déposée reste un geste manuel tant que l'espace documentaire n'est pas
   raccordé : ComplyEC ne peut pas constater tout seul qu'un papier signé est
   revenu. */
function RegularisationPpe({ ligne, nav, showToast, cabinetSettings }) {
  const dossier = ligne.dossierInfo;
  const vig = useEtatVigilance({
    beneficiaires: (ligne.beneficiaires && ligne.beneficiaires.length)
      ? ligne.beneficiaires
      : [{ nom: dossier.dirigeant || '', part: '', verifie: false }],
  });

  /* Les deux mentions que la fiche légale ne donne pas, rangées par nom pour
     survivre à un aller-retour entre les dossiers. */
  const [identites, setIdentites] = useState({});

  const signataires = vig.beneficiaires
    .filter(b => (b.nom || '').trim())
    .map(b => {
      const cle = b.nom.trim();
      const mots = cle.split(/\s+/).filter(Boolean);
      const complement = identites[cle] || {};
      return {
        cle,
        prenom: mots.length > 1 ? mots[0] : '',
        nom: mots.length > 1 ? mots.slice(1).join(' ') : (mots[0] || ''),
        dateNaissance: complement.dateNaissance || '',
        adresse: complement.adresse || '',
      };
    });

  function majSignataire(i, champ, valeur) {
    const cle = signataires[i] && signataires[i].cle;
    if (!cle) return;
    setIdentites(prev => Object.assign({}, prev, {
      [cle]: Object.assign({}, prev[cle], { [champ]: valeur }),
    }));
  }

  async function enregistrer() {
    await dbEnregistrerAttestationPpe(ligne.dossier, {
      ppe: vig.ppeStatut === 'oui',
      detail: vig.ppeStatut === 'oui' ? (vig.ppeDetail.trim() || null) : null,
    });
    showToast(vig.ppeStatut === 'oui'
      ? 'Attestation enregistrée : le dossier passe en vigilance renforcée à la prochaine revue.'
      : 'Attestation enregistrée : aucune fonction concernée.');
    nav.suivant();
  }

  const pretes = signataires.filter(g => g.dateNaissance && String(g.adresse).trim());

  return h('div', { className: 'ppe-regularisation' },
    h('div', { className: 'ppe-regularisation-tete' },
      h('h2', null, dossier.nom),
      h('span', { className: 'parcours-contexte' },
        `${dossier.dirigeant}, dirigeant. Activité : ${dossier.activite}.`)
    ),

    h(VigilanceEtapePpe, {
      v: vig,
      signataires,
      onSignataire: majSignataire,
      cabinetSettings,
    }),

    h('div', { className: 'etape-actions' },
      h('button', {
        className: 'btn btn-primary',
        disabled: vig.ppeStatut === 'a_verifier',
        title: vig.ppeStatut === 'a_verifier' ? 'Répondez à la deuxième question.' : undefined,
        onClick: enregistrer,
      }, 'Enregistrer et passer au dossier suivant'),
      h('span', { className: 'ppe-regularisation-compte' },
        pretes.length
          ? `${pretes.length} ${pluriel(pretes.length, 'attestation prête', 'attestations prêtes')} à envoyer`
          : 'Renseignez date de naissance et adresse pour préremplir les attestations.'),
      h('button', { className: 'lien-discret', onClick: nav.suivant }, 'Passer ce dossier')
    )
  );
}

/* Carte 4 — les autres vérifications : gel des avoirs, pays à risque, PPE
   confirmée. Un contrôle par écran, avec le site officiel à ouvrir. */
/* Où se fait chaque contrôle. Les adresses ont été relevées sur les domaines
   officiels ; elles n'ont pas pu être ouvertes depuis l'environnement de
   développement, dont la sortie réseau est filtrée. */
const CONTROLE_LIENS = {
  gel: { url: 'https://gels-avoirs.dgtresor.gouv.fr/List', label: 'Ouvrir le registre national des gels' },
  pays: { url: 'https://www.fatf-gafi.org/fr/countries/liste-noire-et-liste-gris.html', label: 'Ouvrir les listes du GAFI' },
  ppe: { url: 'https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000047324763', label: 'Ouvrir la liste des fonctions' },
};

/* La teinte de chaque contrôle : elle suit l'objet, pas l'humeur. Le gel des
   avoirs est une mesure de police — ambre ; les pays à risque relèvent de la
   géographie — bleu ; la personne politiquement exposée touche aux personnes —
   violet. La même teinte porte l'onglet, le bandeau et le bouton. */
const CONTROLE_TEINTES = { gel: 'ambre', pays: 'bleu', ppe: 'violet' };

/* Carte 5 — les autres vérifications, un onglet par nature de contrôle.

   Les trois contrôles étaient mêlés dans une seule liste : on passait du gel
   des avoirs à un pays à risque sans s'en apercevoir, alors que ce ne sont ni
   les mêmes sources, ni les mêmes conséquences. Un onglet par nature, avec son
   compte, et l'écran de saisie prend sa couleur. */
function ParcoursVerifications({ showToast }) {
  useDonnees();
  const tous = dbControles();
  const [type, setType] = useState('gel');
  const [ouvert, setOuvert] = useState(null);

  const natures = Object.keys(CONTROLE_TYPES).map(code => ({
    code,
    label: CONTROLE_TYPES[code].label,
    teinte: CONTROLE_TEINTES[code] || 'acier',
    reste: tous.filter(c => c.type === code && !c.date).length,
    total: tous.filter(c => c.type === code).length,
  }));
  const lignes = tous.filter(c => c.type === type && !c.date);
  const courant = ouvert ? tous.find(c => c.id === ouvert) : null;

  if (courant) {
    return h(FicheControle, {
      controle: courant,
      onFerme: () => setOuvert(null),
      onSuivant: () => {
        const reste = dbControles().filter(c => c.type === courant.type && !c.date && c.id !== courant.id);
        setOuvert(reste.length ? reste[0].id : null);
      },
      showToast,
    });
  }

  return h('div', { className: 'verif-parcours' },
    h('div', { className: 'filtres-internes' },
      natures.map(n => h('button', {
        key: n.code,
        className: cx('filtre-interne', 'teinte-' + n.teinte, type === n.code && 'actif'),
        onClick: () => setType(n.code),
      },
        n.label,
        h('span', { className: 'filtre-compte' },
          n.reste ? `${n.reste} à faire` : 'à jour')
      ))
    ),

    h('p', { className: 'verif-fondement' }, CONTROLE_TYPES[type].fondement),

    lignes.length
      ? h('div', { className: 'tableau-moderne-enveloppe' },
        h('table', { className: 'tableau-moderne' },
          h('thead', null, h('tr', null,
            h('th', null, 'Dossier'),
            h('th', null, 'Activité'),
            h('th', null, 'Source à consulter'),
            h('th', { className: 'col-action' }, '')
          )),
          h('tbody', null, lignes.map(c => {
            const d = client(c.dossier);
            return h('tr', {
              key: c.id, className: 'ligne-cliquable', onClick: () => setOuvert(c.id),
            },
              h('td', { className: 'col-principale' }, d ? d.nom : c.dossier),
              h('td', null, d ? d.activite : '—'),
              h('td', null, c.source),
              h('td', { className: 'col-action' },
                h('span', { className: 'btn btn-secondary btn-ligne' }, 'Faire ce contrôle'))
            );
          }))
        )
      )
      : h('div', { className: 'anomalies-vide' },
        h('span', { className: 'anomalies-vide-marque' }, '✓'),
        h('p', null, `Tous les contrôles « ${CONTROLE_TYPES[type].label.toLowerCase()} » ont été faits.`)
      )
  );
}

/* L'écran d'un contrôle. Une page, pas une ligne.

   Le cabinet l'a jugée « trop compacte, pas assez espacée ni colorée » le
   25 septembre : tout y était empilé dans la largeur d'un paragraphe, la source
   officielle avait l'allure d'un lien de bas de page, et les deux décisions
   étaient deux boutons gris côte à côte. L'écran reprend la disposition des
   grandes cartes : un bandeau qui nomme le contrôle, ce qu'il faut ouvrir à
   gauche, ce qu'on y a vu à droite, et deux décisions qui se voient. */
function FicheControle({ controle, onFerme, onSuivant, showToast }) {
  const [commentaire, setCommentaire] = useState('');
  const d = client(controle.dossier);
  const nature = CONTROLE_TYPES[controle.type];
  const teinte = CONTROLE_TEINTES[controle.type] || 'acier';
  const lien = CONTROLE_LIENS[controle.type];

  async function consigner(resultat) {
    await dbEnregistrerControle(controle.id, {
      resultat,
      commentaire: commentaire.trim() || (resultat === 'negatif' ? 'Aucune correspondance.' : null),
    });
    setCommentaire('');
    showToast(resultat === 'negatif'
      ? 'Contrôle consigné : aucune correspondance, avec sa date et sa source.'
      : 'Correspondance consignée : le dossier passe en vigilance renforcée à la prochaine revue.');
    onSuivant();
  }

  return h('div', { className: cx('fiche-controle', 'teinte-' + teinte) },
    h('div', { className: 'parcours-fil' },
      h('button', { className: 'lien-discret', onClick: onFerme }, '← Revenir à la liste')
    ),

    h('header', { className: 'fiche-controle-bandeau' },
      h('span', { className: 'fiche-controle-icone' },
        h(IconeCarte, { nom: controle.type === 'gel' ? 'bouclier' : controle.type === 'pays' ? 'graphe' : 'signature', taille: 30 })),
      h('div', { className: 'fiche-controle-titres' },
        h('h2', null, d ? d.nom : controle.dossier),
        h('span', null, d ? d.activite : '')
      ),
      h('span', { className: 'fiche-controle-nature' }, nature.label)
    ),

    h('div', { className: 'fiche-controle-corps' },
      h('section', { className: 'fiche-controle-pan' },
        h('h3', null, 'Ce qu’il faut consulter'),
        h('p', { className: 'fiche-controle-source' }, controle.source),
        h('p', { className: 'fiche-controle-fondement' }, nature.fondement),
        lien
          ? h('a', {
            className: 'btn btn-accent btn-lg fiche-controle-lien', href: lien.url,
            target: '_blank', rel: 'noopener noreferrer',
          }, lien.label, h('span', { className: 'lien-externe' }, '↗'))
          : null,
        h(MentionCapacite, { cle: controle.type === 'gel' ? 'sanctionsGel' : 'registreLegal' })
      ),

      h('section', { className: 'fiche-controle-pan fiche-controle-constat' },
        h('h3', null, 'Ce que vous avez constaté'),
        h(ChampPanneau, {
          label: 'Votre constat', lignes: 5,
          valeur: commentaire, onChange: setCommentaire,
          placeholder: 'Aucune correspondance, ou la correspondance relevée et ce qu’elle implique',
          aide: 'Ce texte est repris tel quel dans la fiche de vigilance du dossier.',
        })
      )
    ),

    h('div', { className: 'fiche-controle-decision' },
      h('button', { className: 'btn btn-primary btn-lg', onClick: () => consigner('negatif') },
        '✓ Rien à signaler'),
      h('button', { className: 'btn btn-secondary btn-lg', onClick: () => consigner('positif') },
        '⚠ Correspondance relevée'),
      h('button', { className: 'lien-discret', onClick: onSuivant }, 'Passer ce contrôle')
    )
  );
}

// ------------------------------------------------------- Suivi RBE (§ 9.3)

/* Très opérationnel, et volontairement pauvre : quatre colonnes, une ligne par
   dossier, et la possibilité de compléter sans ouvrir de processus.

   ComplyEC ne consulte pas le registre — aucun connecteur INPI n'est en place.
   Il enregistre ce que l'expert-comptable a constaté sur data.inpi.fr, avec sa
   date. C'est exactement ce qu'un contrôleur demande à voir. */
function SuiviRbe({ showToast }) {
  const lignes = dbSuiviRbe();
  const [edite, setEdite] = useState(null);
  const consultes = lignes.filter(l => l.consulteLe).length;
  const divergences = lignes.filter(l => l.resultat === 'divergence').length;

  return h('div', { className: 'vue-rbe' },
    h('div', { className: 'rbe-resume' },
      h('span', null, `${consultes} ${pluriel(consultes, 'dossier consulté', 'dossiers consultés')} sur ${lignes.length}`),
      divergences
        ? h(Pastille, { ton: 'rouge' }, `${divergences} ${pluriel(divergences, 'divergence', 'divergences')}`)
        : null
    ),
    h(MentionCapacite, { cle: 'rbe' }),

    h('div', { className: 'tableau-moderne-enveloppe' },
      h('table', { className: 'tableau-moderne' },
        h('thead', null, h('tr', null,
          h('th', null, 'Dossier'),
          h('th', null, 'RBE consulté'),
          h('th', null, 'Consulté le'),
          h('th', null, 'Divergence')
        )),
        h('tbody', null, lignes.map(l => h('tr', {
          key: l.dossier, className: 'ligne-cliquable', onClick: () => setEdite(l),
        },
          h('td', { className: 'col-principale' },
            l.dossierInfo.nom,
            l.source === 'contractualisation'
              ? h('span', { className: 'col-detail' }, 'Renseigné à la contractualisation')
              : null),
          h('td', null, l.consulteLe
            ? h(Pastille, { ton: 'vert' }, 'Oui')
            : h(Pastille, { ton: 'orange' }, 'Non')),
          h('td', { className: 'col-date' }, l.consulteLe ? formatDate(l.consulteLe) : '—'),
          h('td', null, l.resultat === 'divergence'
            ? h(Pastille, { ton: 'rouge' }, 'Oui')
            : (l.consulteLe ? h(Pastille, { ton: 'gris' }, 'Non') : h('span', { className: 'cellule-vide' }, '—')))
        )))
      )
    ),

    edite ? h(PanneauSuiviRbe, { ligne: edite, onFermer: () => setEdite(null), showToast }) : null
  );
}

function PanneauSuiviRbe({ ligne, onFermer, showToast }) {
  const [consulteLe, setConsulteLe] = useState(ligne.consulteLe || new Date().toISOString().slice(0, 10));
  const [divergence, setDivergence] = useState(ligne.resultat === 'divergence');
  const [texte, setTexte] = useState(ligne.divergence || '');

  async function enregistrer() {
    if (!consulteLe) { showToast('La date de consultation est obligatoire.'); return; }
    if (divergence && !texte.trim()) { showToast('Décrivez la divergence constatée.'); return; }
    await dbEnregistrerSuiviRbe(ligne.dossier, {
      consulteLe,
      resultat: divergence ? 'divergence' : 'concordant',
      divergence: divergence ? texte.trim() : null,
    });
    showToast('Consultation enregistrée.');
    onFermer();
  }

  return h(PanneauLateral, {
    ouvert: true,
    titre: ligne.dossierInfo.nom,
    sousTitre: 'Registre des bénéficiaires effectifs',
    onFermer,
    pied: h(React.Fragment, null,
      h('button', { className: 'btn btn-secondary', onClick: onFermer }, 'Annuler'),
      h('button', { className: 'btn btn-primary', onClick: enregistrer }, 'Enregistrer')
    ),
  },
    h(MentionCapacite, { cle: 'rbe' }),
    h(ChampPanneau, {
      label: 'Consulté le', type: 'date',
      valeur: consulteLe, onChange: setConsulteLe,
    }),
    h(BasculePanneau, {
      label: 'Divergence constatée',
      valeur: divergence, onChange: setDivergence,
      aide: 'Une divergence se signale au registre — article L. 561-45-1 du code monétaire et financier.',
    }),
    divergence
      ? h(ChampPanneau, {
        label: 'Ce qui diverge', lignes: 3,
        valeur: texte, onChange: setTexte,
      })
      : null,
    ligne.beneficiaires && ligne.beneficiaires.length
      ? h('div', { className: 'champ-panneau' },
        h('span', { className: 'champ-label' }, 'Bénéficiaires connus du cabinet'),
        h('div', { className: 'panneau-liste' },
          ligne.beneficiaires.map((b, i) => h('div', { className: 'panneau-ligne', key: i },
            h('span', { className: 'panneau-ligne-nom' }, b))))
      )
      : null
  );
}

function CampagnesLbcft({ sub, navigateEc, showToast }) {
  const retour = () => navigateEc('vigilance', 'campagnes');

  if (sub === 'rbe') return h(CampagneRbe, { onBack: retour, showToast });
  if (sub === 'controles') return h(ControlesCibles, { onBack: retour, showToast });

  const aConsulter = rbeAConsulter().length;
  const divergences = rbeDivergences().length;
  const aControler = controlesAFaire().length;

  return h('div', { className: 'page' },
    h(EnteteHub, { titre: 'Campagnes & contrôles', onRetour: () => navigateEc('vigilance', null) }),
    h(ThemeHub, { cartes: [
      { cle: 'rbe', icone: '🏛️', titre: 'Registre des bénéficiaires effectifs',
        compteur: divergences ? `${divergences} ${pluriel(divergences, 'divergence')}` : (aConsulter ? `${aConsulter} à consulter` : null),
        tonCompteur: divergences ? 'rouge' : 'violet',
        onOuvrir: () => navigateEc('vigilance', 'campagne-rbe') },
      { cle: 'controles', icone: '🎯', titre: 'Contrôles PPE, gel et pays à risque',
        compteur: aControler ? `${aControler} à faire` : null, tonCompteur: 'violet',
        onOuvrir: () => navigateEc('vigilance', 'campagne-controles') },
    ] })
  );
}

// ---------------------------------------------------------- S40A — Campagne RBE

function CampagneRbe({ onBack, showToast }) {
  const [choisi, setChoisi] = useState(null);
  const [consultes, setConsultes] = useState({});

  const lignes = CAMPAGNE_RBE.map(r => (consultes[r.dossier]
    ? Object.assign({}, r, { consulteLe: consultes[r.dossier], par: 'martin', resultat: 'concordant' })
    : r));
  const traites = lignes.filter(r => r.consulteLe);
  const divergences = lignes.filter(r => r.resultat === 'divergence');

  const colonnes = [
    { code: 'dossier', titre: 'Dossier', classe: 'table-name', valeur: r => client(r.dossier).nom, rendu: r => client(r.dossier).nom },
    { code: 'consulte', titre: 'Consulté le', valeur: r => r.consulteLe || '',
      rendu: r => (r.consulteLe ? formatDate(r.consulteLe) : h(Badge, { color: 'violet' }, 'à consulter')) },
    { code: 'resultat', titre: 'Rapprochement', valeur: r => r.resultat || '',
      rendu: r => (r.resultat ? h(Badge, { color: RBE_RESULTATS[r.resultat].couleur }, RBE_RESULTATS[r.resultat].label) : '—') },
  ];

  const courant = choisi ? lignes.find(r => r.dossier === choisi) : null;
  const detail = courant
    ? h(Card, {
      title: client(courant.dossier).nom,
      subtitle: courant.consulteLe ? `Consulté le ${formatDate(courant.consulteLe)} par ${personneNom(courant.par)}` : 'Registre non consulté',
      icon: '🏛️', iconBg: '#F1EAFE', iconColor: '#7C3AED',
      tone: courant.resultat === 'divergence' ? 'orange' : courant.consulteLe ? 'vert' : 'bleu',
    },
      /* Les bénéficiaires déjà confirmés ne sont jamais ressaisis : le cahier
         l'exige, et c'est ce qui distingue un rapprochement d'une saisie. */
      h('div', { className: 'detail-field' },
        h('div', { className: 'detail-field-label' }, 'Bénéficiaires connus du cabinet'),
        h('div', { className: 'detail-field-value' },
          courant.beneficiaires.length
            ? courant.beneficiaires.map((b, i) => h('div', { key: i }, b))
            : h('span', { className: 'info-source-vide' }, 'Aucun bénéficiaire enregistré'))),
      courant.divergence
        ? h('div', { className: 'info-box', style: { marginBottom: 12 } }, '⚠️ ', courant.divergence,
          h('div', { style: { marginTop: 6 } },
            'Une divergence entre le registre et ce que le cabinet connaît doit être signalée à l’INPI (article L. 561-45-1 du code monétaire et financier).'))
        : null,
      h('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } },
        courant.consulteLe
          ? null
          : h('button', {
            className: 'btn btn-primary btn-sm',
            onClick: () => {
              setConsultes(c => Object.assign({}, c, { [courant.dossier]: new Date().toISOString().slice(0, 10) }));
              showToast(`Registre consulté pour ${client(courant.dossier).nom} — date et personne tracées.`);
            },
          }, 'Consulter et enregistrer'),
        courant.resultat === 'divergence'
          /* Le signalement d'une divergence se fait sur data.inpi.fr : aucun
             connecteur n'existe. ComplyEC enregistre que le signalement a été
             fait, avec sa date — c'est cette trace que l'article L. 561-45-1
             du code monétaire et financier rend opposable, et prétendre l'avoir
             transmis serait attester d'une démarche qui n'a pas eu lieu. */
          ? h('button', {
            className: 'btn btn-secondary btn-sm',
            onClick: async () => {
              await dbEnregistrerRbe(courant.dossier, { signaleLe: new Date().toISOString().slice(0, 10), signalePar: EXPERT_COMPTABLE.nom });
              showToast('Signalement noté comme fait. La déclaration s’effectue sur data.inpi.fr : ComplyEC n’y est pas raccordé.');
            },
          }, 'Noter le signalement comme fait')
          : null
      )
    )
    : null;

  return h('div', { className: 'page' },
    h(EnteteHub, { titre: 'Campagne — registre des bénéficiaires effectifs', onRetour: onBack }),
    h(CampaignView, {
      faits: traites.length, total: lignes.length,
      libelleProgression: 'dossiers consultés',
      tuiles: [
        { libelle: 'Consultés', valeur: traites.length, ton: 'vert' },
        { libelle: 'À consulter', valeur: lignes.length - traites.length, ton: lignes.length - traites.length ? 'orange' : null },
        { libelle: 'Divergences', valeur: divergences.length, ton: divergences.length ? 'rouge' : null },
      ],
      titreListe: 'Dossiers de la campagne', iconeListe: '🏛️', tonListe: 'violet',
      sousTitreListe: String(lignes.length),
      colonnes, lignes, cle: r => r.dossier,
      triDefaut: { col: 'consulte', sens: 'asc' },
      vide: 'Aucun dossier dans la campagne.',
      selection: choisi, onSelect: r => setChoisi(r.dossier),
      detail, detailIcone: '🏛️',
      detailVide: 'Choisissez un dossier pour voir le rapprochement',
    })
  );
}

// ------------------------------------------------- S40B — Contrôles PPE & gel

function ControlesCibles({ onBack, showToast }) {
  const [type, setType] = useState('tous');
  const [choisi, setChoisi] = useState(null);
  const [faits, setFaits] = useState({});

  const lignes = CONTROLES_CIBLES
    .map(c => (faits[c.id] ? Object.assign({}, c, { date: faits[c.id], par: 'martin', resultat: 'negatif', commentaire: 'Aucune correspondance.' }) : c))
    .filter(c => type === 'tous' || c.type === type);
  const tous = CONTROLES_CIBLES.map(c => (faits[c.id] ? Object.assign({}, c, { date: faits[c.id] }) : c));
  const traites = tous.filter(c => c.date);

  const colonnes = [
    { code: 'dossier', titre: 'Dossier', classe: 'table-name', valeur: c => client(c.dossier).nom, rendu: c => client(c.dossier).nom },
    { code: 'type', titre: 'Contrôle', valeur: c => CONTROLE_TYPES[c.type].court,
      rendu: c => h(Badge, { color: 'violet' }, CONTROLE_TYPES[c.type].court) },
    { code: 'date', titre: 'Contrôlé le', valeur: c => c.date || '',
      rendu: c => (c.date ? formatDate(c.date) : h(Badge, { color: 'orange' }, 'à faire')) },
    { code: 'resultat', titre: 'Résultat', valeur: c => c.resultat || '',
      rendu: c => (c.resultat ? h(Badge, { color: CONTROLE_RESULTATS[c.resultat].couleur }, CONTROLE_RESULTATS[c.resultat].label) : '—') },
  ];

  const courant = choisi ? lignes.find(c => c.id === choisi) : null;
  const detail = courant
    ? h(Card, {
      title: client(courant.dossier).nom,
      subtitle: CONTROLE_TYPES[courant.type].label,
      icon: '🎯', iconBg: '#F1EAFE', iconColor: '#7C3AED',
      tone: courant.resultat === 'positif' ? 'orange' : courant.date ? 'vert' : 'bleu',
    },
      h('div', { className: 'list-row' },
        h('span', { className: 'list-row-label' }, 'Fondement'),
        h('span', { className: 'conf-note' }, CONTROLE_TYPES[courant.type].fondement)),
      h('div', { className: 'list-row' },
        h('span', { className: 'list-row-label' }, 'Source consultée'),
        h('span', { className: 'conf-note', style: { textAlign: 'right', maxWidth: '60%' } }, courant.source)),
      courant.date
        ? h(React.Fragment, null,
          h('div', { className: 'list-row' },
            h('span', { className: 'list-row-label' }, 'Contrôlé le'),
            h('span', { className: 'conf-note' }, `${formatDate(courant.date)} par ${personneNom(courant.par)}`)),
          h('div', { className: 'detail-field', style: { marginTop: 10 } },
            h('div', { className: 'detail-field-label' }, 'Résultat'),
            h('div', { className: 'detail-field-value' }, courant.commentaire)))
        : h('button', {
          className: 'btn btn-primary btn-sm', style: { marginTop: 12 },
          onClick: () => {
            setFaits(f => Object.assign({}, f, { [courant.id]: new Date().toISOString().slice(0, 10) }));
            showToast(`Contrôle ${CONTROLE_TYPES[courant.type].court} enregistré pour ${client(courant.dossier).nom}.`);
          },
        }, 'Enregistrer le contrôle')
    )
    : null;

  const filtres = [{ code: 'tous', label: 'Tous' }].concat(
    Object.keys(CONTROLE_TYPES).map(k => ({ code: k, label: CONTROLE_TYPES[k].court })));

  return h('div', { className: 'page' },
    h(EnteteHub, { titre: 'Contrôles PPE, gel et pays à risque', onRetour: onBack }),
    h('div', { className: 'tabs', style: { marginBottom: 14 } },
      filtres.map(f => h('button', {
        key: f.code, className: cx('tab', type === f.code && 'active'),
        onClick: () => { setType(f.code); setChoisi(null); },
      }, f.label, ' ', h('span', { className: 'tab-compte' },
        f.code === 'tous' ? tous.length : tous.filter(c => c.type === f.code).length)))
    ),
    h(CampaignView, {
      faits: traites.length, total: tous.length,
      libelleProgression: 'contrôles enregistrés',
      tuiles: [
        { libelle: 'Enregistrés', valeur: traites.length, ton: 'vert' },
        { libelle: 'À faire', valeur: tous.length - traites.length, ton: tous.length - traites.length ? 'orange' : null },
        { libelle: 'Correspondances', valeur: tous.filter(c => c.resultat === 'positif').length, ton: 'rouge' },
      ],
      titreListe: 'Contrôles ciblés', iconeListe: '🎯', tonListe: 'violet',
      sousTitreListe: String(lignes.length),
      colonnes, lignes, cle: c => c.id,
      triDefaut: { col: 'date', sens: 'asc' },
      vide: 'Aucun contrôle dans cette vue.',
      selection: choisi, onSelect: c => setChoisi(c.id),
      detail, detailIcone: '🎯',
      detailVide: 'Choisissez un contrôle pour voir sa source et son résultat',
    })
  );
}

/* =====================================================================
   LbcftGuidedShell — le parcours LBC-FT en cinq étapes (§ 19 du V6)
   =====================================================================

   Le module LBC-FT présentait quatre cartes : À traiter, Portefeuille,
   Cartographie, Campagnes. C'est une table des matières, pas un mode d'emploi :
   il fallait déjà connaître le dispositif pour savoir par où commencer, et
   rien ne disait si la cartographie pouvait être arrêtée ou s'il restait des
   dossiers à analyser d'abord.

   Le parcours suit l'ordre dans lequel le travail se fait réellement :
   organiser, couvrir, traiter ce qui sort, contrôler, arrêter la cartographie.
   Il s'ouvre à la première étape qui n'est pas prête — on reprend là où l'on
   en est, sans chercher.

   Ce parcours ne détient aucune donnée. Il lit l'état LBC-FT et ouvre les
   écrans qui existent déjà : ouvrir « LBC-FT » depuis la barre latérale ou
   depuis l'étape 5 du parcours principal mène ici, sur le même état (§ 11).
   ===================================================================== */

const LBCFT_ETAPES = [
  { code: 'organiser', titre: 'Organiser le dispositif', court: 'Organiser', icone: '🏛️' },
  /* Le code de l'étape ne peut pas être « portefeuille » : cette adresse
     ouvre déjà la liste complète du portefeuille, et l'étape aurait été
     court-circuitée par elle. */
  { code: 'couverture', titre: 'Couvrir le portefeuille', court: 'Portefeuille', icone: '🔍' },
  { code: 'sensibles', titre: 'Traiter les dossiers sensibles', court: 'Dossiers sensibles', icone: '📌' },
  { code: 'controles', titre: 'Faire les contrôles', court: 'Contrôles', icone: '✔️' },
  { code: 'cartographie', titre: 'Arrêter la cartographie', court: 'Cartographie', icone: '🗺️' },
];

function LbcftGuidedShell({ etape, onAller, navigateEc, showToast, cabinetSettings, onMettreAJour }) {
  const etat = computeLbcftJourneyState();
  const code = etapeLbcft(etape) ? etape : etat.courante.code;
  const e = etapeLbcft(code);
  const s = etat.etapes[code];
  const suivante = e.rang < LBCFT_ETAPES.length ? LBCFT_ETAPES[e.rang] : null;
  const precedente = e.rang > 1 ? LBCFT_ETAPES[e.rang - 2] : null;

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null,
        h('div', { className: 'parcours-rang' }, `Étape ${e.rang} sur ${LBCFT_ETAPES.length} — dispositif LBC-FT`),
        h('h1', null, e.titre)
      ),
      h('div', { className: 'page-header-actions' },
        precedente
          ? h('button', { className: 'btn btn-secondary', onClick: () => onAller(precedente.code) }, '← ' + precedente.court)
          : null,
        suivante
          ? h('button', { className: 'btn btn-secondary', onClick: () => onAller(suivante.code) }, suivante.court + ' →')
          : null
      )
    ),
    h(LbcftFil, { courante: code, onAller, etat }),
    h('div', { className: 'parcours-contenu' },
      h(LbcftEtapeContenu, { code, etat, navigateEc, showToast, cabinetSettings, onMettreAJour, onAller })
    )
  );
}

/* Le contenu d'une étape. Chacune affiche son état et emmène à l'écran qui la
   traite ; aucune ne redéfinit les données qu'elle montre. */

function LbcftEtapeContenu({ code, etat, navigateEc, showToast, cabinetSettings, onMettreAJour, onAller }) {
  const s = etat.etapes[code];

  if (code === 'organiser') return h(LbcftOrganiser, { navigateEc, showToast, etat, onAller });
  if (code === 'couverture') return h(LbcftATraiter, { showToast, cabinetSettings, onMettreAJour, dansParcours: true, navigateEc });
  if (code === 'sensibles') return h(LbcftDossiersSensibles, { onMettreAJour, navigateEc });
  if (code === 'controles') return h(LbcftControles, { navigateEc, etat });
  return h(CartographieLbcft, { showToast, cabinetSettings, dansParcours: true });
}

/* Étape 1 — Organiser le dispositif (§ 20).

   Deux colonnes : les rôles que le code monétaire et financier impose, et les
   règles que le cabinet s'est données. Un rôle absent est une ligne orange,
   pas un grand panneau rouge : le cabinet sait qu'il lui manque un déclarant,
   il n'a pas besoin qu'on le lui crie dessus. */

function LbcftFil({ courante, onAller, etat }) {
  return h('div', { className: 'parcours-fil', role: 'navigation', 'aria-label': 'Étapes du dispositif LBC-FT' },
    LBCFT_ETAPES.map((e, i) => {
      const actif = e.code === courante;
      const pret = etat.etapes[e.code].pret;
      return h('button', {
        key: e.code,
        className: cx('parcours-fil-etape', actif && 'active', pret && 'pret'),
        onClick: () => onAller(e.code),
        'aria-current': actif ? 'step' : undefined,
        title: `Étape ${i + 1} sur ${LBCFT_ETAPES.length} — ${e.titre}`,
      },
        h('span', { className: 'parcours-fil-rang' }, pret && !actif ? '✓' : String(i + 1)),
        h('span', { className: 'parcours-fil-titre' }, e.court)
      );
    })
  );
}

/* L'enveloppe du parcours LBC-FT. Chaque étape ouvre l'écran qui existe déjà :
   le parcours ordonne le travail, il ne le refait pas. */

function LbcftATraiter({ onBack, showToast, cabinetSettings, onMettreAJour, dansParcours, navigateEc }) {
  const lignes = vigilanceATraiter();
  const [choisi, setChoisi] = useState(null);

  const colonnes = [
    { code: 'dossier', titre: 'Dossier', classe: 'table-name', valeur: l => client(l.dossier).nom, rendu: l => client(l.dossier).nom },
    { code: 'motif', titre: 'Motif', valeur: l => VIGILANCE_MOTIFS[l.principal].label,
      rendu: l => VIGILANCE_MOTIFS[l.principal].label },
    { code: 'priorite', titre: 'Priorité', valeur: l => ['Critique', 'Haute', 'Moyenne', 'Faible'].indexOf(l.priorite),
      rendu: l => h(PriorityBadge, { priorite: l.priorite }) },
    { code: 'date', titre: 'Dernière analyse', valeur: l => l.derniereAnalyse || '',
      rendu: l => (l.derniereAnalyse ? formatDate(l.derniereAnalyse) : h('span', { className: 'info-source-vide' }, 'Aucune')) },
  ];

  const courant = choisi ? lignes.find(l => l.dossier === choisi) : null;
  const detail = courant
    ? h(Card, {
      title: client(courant.dossier).nom,
      subtitle: `${collaborateur(client(courant.dossier).collaborateur).nom} — ${client(courant.dossier).activite}`,
      icon: '📌', iconBg: '#E9F1FE', iconColor: '#2563EB',
      tone: courant.priorite === 'Critique' ? 'orange' : 'bleu',
    },
      courant.motifs.map(m => h('div', { className: 'list-row', key: m },
        h('span', { className: 'list-row-label' }, VIGILANCE_MOTIFS[m].label),
        h('span', { className: 'conf-note', style: { textAlign: 'right', maxWidth: '58%' } }, VIGILANCE_MOTIFS[m].detail))),
      h('button', {
        className: 'btn btn-primary btn-block', style: { marginTop: 14 },
        onClick: () => onMettreAJour(courant.dossier),
      }, 'Mettre à jour la vigilance →')
    )
    : null;

  return h(CadreHub, {
    encadre: dansParcours,
    titre: 'LBC-FT — à traiter',
    actions: h(React.Fragment, null,
      onBack && !dansParcours ? h('button', { className: 'btn btn-secondary', onClick: onBack }, '← Retour') : null,
      /* « Voir tous les dossiers » (§ 21) : c'est la même vue, filtrée
         autrement, et non un second module. Sans ce raccourci, le portefeuille
         complet n'était plus atteignable depuis le parcours. */
      navigateEc
        ? h('button', { className: 'btn btn-secondary', onClick: () => navigateEc('vigilance', 'portefeuille') },
          'Voir tous les dossiers')
        : null
    ),
  },
    h(ActionListDetail, {
      titreListe: 'Dossiers appelant une action', iconeListe: '📌',
      sousTitreListe: String(lignes.length),
      colonnes, lignes, cle: l => l.dossier, parPage: 5,
      vide: 'Aucun dossier n’appelle de mise à jour.',
      selection: choisi, onSelect: l => setChoisi(l.dossier),
      detail, detailIcone: '📌',
      detailVide: 'Choisissez un dossier pour voir ce qui l’appelle',
    })
  );
}

// ================================================ S33 — LBC-FT — Portefeuille

/* Quatre pastilles compactes plutôt que quatre colonnes : le cahier interdit
   le tableau à dix colonnes, et une pastille colorée se lit plus vite qu'un
   mot répété seize fois dans une grille. */

function LbcftControles({ navigateEc, etat }) {
  const rbe = dbCampagneRbe();
  const rbeFaits = rbe.filter(r => r.consulteLe);
  const divergences = rbeDivergences();
  const controles = dbControles();
  const controlesFaits = controles.filter(c => c.date);

  const bloc = (icone, titre, faits, total, reste, libelleReste, section, sub) =>
    h(FormSection, { icon: icone, title: titre, ton: 'violet' },
      h('div', { className: 'campagne-ligne', style: { marginBottom: 10 } },
        h('span', { className: 'campagne-compte' }, faits, ' sur ', total),
        h('span', { className: 'campagne-libelle' }, libelleReste)
      ),
      h(SimpleProgress, { fait: faits, total }),
      reste
        ? h('p', { className: 'conf-detail' }, reste)
        : h('p', { className: 'conf-detail' }, 'Rien ne reste à traiter dans cette campagne.'),
      h('button', {
        className: cx('btn', reste ? 'btn-primary' : 'btn-secondary'),
        onClick: () => navigateEc(section, sub),
      }, reste ? 'Continuer' : 'Consulter')
    );

  return h('div', { className: 'parcours-colonnes' },
    bloc('🏛️', 'Revue du registre des bénéficiaires effectifs',
      rbeFaits.length, rbe.length,
      divergences.length
        ? `${divergences.length} ${pluriel(divergences.length, 'divergence relevée', 'divergences relevées')} — l’article L. 561-45-1 du code monétaire et financier impose de les signaler.`
        : null,
      'dossiers consultés', 'vigilance', 'campagne-rbe'),
    bloc('🚫', 'Gel des avoirs, personnes exposées et pays à risque',
      controlesFaits.length, controles.length,
      controles.length - controlesFaits.length
        ? `${controles.length - controlesFaits.length} ${pluriel(controles.length - controlesFaits.length, 'contrôle reste', 'contrôles restent')} à faire.`
        : null,
      'contrôles consignés', 'vigilance', 'campagne-controles')
  );
}

/* Une barre de progression simple : une part faite sur un total. Elle ne dit
   rien qu'un pourcentage ne dirait, mais elle se lit sans lire. */

function LbcftDossiersSensibles({ onMettreAJour, navigateEc }) {
  const lignes = dossiersSensiblesLbcft();
  const [choisi, setChoisi] = useState(lignes.length ? lignes[0].dossier : null);
  const courant = lignes.find(l => l.dossier === choisi) || null;

  if (!lignes.length) {
    return h(FormSection, { icon: '✅', title: 'Aucun dossier sensible', ton: 'vert' },
      h('p', { className: 'conf-detail', style: { marginBottom: 0 } },
        'Aucun dossier du portefeuille ne présente de vigilance renforcée, de personne politiquement exposée, de divergence au registre des bénéficiaires effectifs ni de contrôle ciblé positif.')
    );
  }

  const colonnes = [
    { code: 'nom', titre: 'Dossier', classe: 'table-name',
      valeur: l => client(l.dossier).nom, rendu: l => client(l.dossier).nom },
    { code: 'motif', titre: 'Motif principal', valeur: l => l.principal, rendu: l => l.principal },
    { code: 'etat', titre: 'État', valeur: l => (l.traite ? 1 : 0),
      rendu: l => h(Badge, { color: l.traite ? 'vert' : 'orange' }, l.traite ? 'Traité' : 'À examiner') },
  ];

  return h(ActionListDetail, {
    titreListe: 'Dossiers qui demandent votre attention', iconeListe: '📌',
    sousTitreListe: `${lignes.filter(l => !l.traite).length} sur ${lignes.length}`,
    tonListe: 'dore',
    colonnes, lignes, cle: l => l.dossier, parPage: 5,
    selection: courant, onSelect: l => setChoisi(l.dossier),
    vide: 'Aucun dossier sensible.',
    detailVide: 'Choisissez un dossier pour voir pourquoi il ressort',
    detail: courant
      ? h(FormSection, { icon: '📁', title: client(courant.dossier).nom, ton: 'dore' },
        h('div', { className: 'parcours-faits' },
          h('div', { className: 'parcours-fait' },
            h('div', { className: 'parcours-fait-libelle' }, 'Pourquoi ce dossier ressort'),
            h('div', { className: 'parcours-reste-detail' },
              courant.motifs.map((m, i) => h('div', { key: i }, '• ', m)))
          ),
          h('div', { className: 'parcours-fait' },
            h('div', { className: 'parcours-fait-libelle' }, 'Ce qu’il reste à faire'),
            h('div', { className: 'parcours-reste-detail' },
              courant.reste || 'Rien : l’analyse est à jour et les mesures sont consignées.')
          ),
          h('div', { className: 'parcours-fait' },
            h('div', { className: 'parcours-fait-libelle' }, 'Dernière analyse'),
            h('div', { className: 'parcours-reste-detail' },
              courant.derniereAnalyse ? formatDate(courant.derniereAnalyse) : 'Aucune',
              courant.niveau ? ` — niveau ${courant.niveau.toLowerCase()}` : '')
          )
        ),
        h('button', {
          className: 'btn btn-primary btn-block', style: { marginTop: 12 },
          onClick: () => onMettreAJour(courant.dossier),
        }, 'Traiter ce dossier')
      )
      : null,
  });
}

/* Étape 4 — Contrôles périodiques (§ 24).

   Deux campagnes, chacune avec sa progression et son reste. Le § 24 est
   explicite sur un point : ne jamais marquer un contrôle comme réalisé parce
   que l'utilisateur a ouvert la ligne. Un contrôle n'existe que quand son
   résultat a été consigné. */

function LbcftOrganiser({ navigateEc, showToast, etat, onAller }) {
  const [edite, setEdite] = useState(null);
  const roles = dbRoles().filter(x => ['lbcft', 'declarant', 'correspondant'].includes(x.code));
  const noms = [EXPERT_COMPTABLE.nom].concat(COLLABORATEURS.map(c => c.nom))
    .filter((n, i, t) => t.indexOf(n) === i);
  const derniereRevision = CONFORMITE_CABINET.classificationRisquesLBCFT.derniereRevision;

  return h(React.Fragment, null,
    h('div', { className: 'parcours-colonnes' },
      h(FormSection, { icon: '🏛️', title: 'Rôles LBC-FT', ton: 'bleu' },
        roles.map(r => h(React.Fragment, { key: r.code },
          h(EditableValueRow, {
            libelle: r.label,
            valeur: r.titulaireEffectif,
            source: r.fondement,
            absent: !r.titulaireEffectif,
            onModifier: r.titulaireCle ? () => setEdite(r) : null,
          })
        )),
        roles.some(r => !r.titulaireEffectif)
          ? h('p', { className: 'ligne-manquante' },
            '⚠ ',
            `${roles.filter(r => !r.titulaireEffectif).length} ${pluriel(roles.filter(r => !r.titulaireEffectif).length, 'rôle reste', 'rôles restent')} à pourvoir.`)
          : null
      ),
      h(FormSection, { icon: '⚖️', title: 'Règles du cabinet', ton: 'bleu' },
        h('div', { className: 'parcours-faits' },
          h('div', { className: 'parcours-fait' },
            h('div', { className: 'parcours-fait-libelle' }, 'Dernière revue de la classification'),
            h('div', { className: 'parcours-reste-detail' }, formatDate(derniereRevision),
              ' — le cabinet s’est donné un rythme annuel.')
          ),
          h('div', { className: 'parcours-fait' },
            h('div', { className: 'parcours-fait-libelle' }, 'Périodicité des analyses'),
            h('div', { className: 'parcours-reste-detail' },
              `${VIGILANCE_PERIODICITE_MOIS} mois — au-delà, le dossier repasse à analyser.`)
          ),
          h('div', { className: 'parcours-fait' },
            h('div', { className: 'parcours-fait-libelle' }, 'Critères de cotation'),
            h('div', { className: 'parcours-reste-detail' },
              NPLAB_CRITERES.map(c => c.label).join(' · '))
          )
        ),
        h('p', { className: 'conf-detail', style: { marginBottom: 0 } },
          'L’article L. 561-4-1 du code monétaire et financier impose de tenir la classification régulièrement actualisée, sans fixer d’échéance. Le rythme annuel est celui que le cabinet s’est fixé.')
      )
    ),
    h('div', { className: 'parcours-pied' },
      h('div', { className: 'parcours-pied-etat' },
        `${etat.pretes} ${pluriel(etat.pretes, 'étape prête', 'étapes prêtes')} sur ${etat.total}`),
      h('button', { className: 'btn btn-primary', onClick: () => onAller('couverture') }, 'Couvrir le portefeuille →')
    ),
    edite
      ? h(FunctionalEditModal, {
        libelle: edite.label,
        valeur: edite.titulaireEffectif,
        options: noms,
        aide: edite.fondement,
        onAnnuler: () => setEdite(null),
        onEnregistrer: async valeur => {
          await dbMajRole(edite.code, valeur);
          setEdite(null);
          if (showToast) showToast(`${edite.label} : ${valeur}.`);
        },
      })
      : null
  );
}

/* Étape 3 — Dossiers sensibles (§ 23).

   La question de l'écran tient en une phrase : quels dossiers demandent mon
   attention ? Elle est distincte de la couverture du portefeuille, qui demande
   si chaque dossier a été analysé. Un portefeuille entièrement couvert peut
   contenir trois dossiers sensibles — les confondre laissait croire le travail
   fini parce que le compteur de couverture était plein. */
