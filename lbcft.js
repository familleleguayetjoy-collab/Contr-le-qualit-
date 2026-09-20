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
const CARTO_QUESTIONS = [
  { code: 'concentration', libelle: 'Une concentration inhabituelle apparaît-elle dans le portefeuille ?' },
  { code: 'evolution', libelle: 'Le portefeuille a-t-il connu une évolution importante depuis la dernière revue ?' },
  { code: 'mesure', libelle: 'Un dossier appelle-t-il une mesure particulière non encore prise ?' },
];

function CartographieLbcft({ onBack, showToast, cabinetSettings, dansParcours }) {
  const settings = cabinetSettings || CABINET_SETTINGS_DEFAUT;
  const [reponses, setReponses] = useState({});
  const [note, setNote] = useState('');
  const derniere = dbCartographies().length ? dbCartographies()[0] : null;
  const toutesRepondues = CARTO_QUESTIONS.every(q => reponses[q.code]);
  const analyses = dbVigilanceDossiers().filter(d => d.statut === 'complete');
  const nonAnalyses = dbVigilanceDossiers().filter(d => d.statut !== 'complete');
  const total = dbVigilanceDossiers().length;
  const parNiveau = ['Allégée', 'Normale', 'Renforcée'].map(n => ({
    niveau: n,
    dossiers: analyses.filter(d => d.niveauRetenu === n),
  }));
  const attention = vigilanceATraiter().slice(0, 5);
  const aujourdhui = new Date().toISOString().slice(0, 10);

  return h(CadreHub, {
    encadre: dansParcours,
    titre: 'Cartographie des risques LBC-FT',
    actions: h(React.Fragment, null,
        onBack && !dansParcours ? h('button', { className: 'btn btn-secondary', onClick: onBack }, '← Retour') : null,
        /* L'arrêté écrit réellement : il fige un instantané daté, avec la
           personne qui l'arrête et les chiffres de la synthèse. Le bouton
           affichait auparavant « Cartographie arrêtée (démonstration) » sans
           rien conserver — or c'est précisément ce document qu'un contrôleur
           demande pour savoir ce que le cabinet savait, et quand. */
        h('button', {
          className: 'btn btn-primary',
          // Tant que les trois questions ne sont pas tranchées, l'arrêté
          // n'est pas une décision : le bouton reste inactif et l'écran dit
          // pourquoi, plutôt que de laisser cliquer dans le vide.
          disabled: !toutesRepondues,
          title: toutesRepondues ? undefined : 'Répondez d’abord aux trois questions de la revue.',
          onClick: async () => {
            const synthese = {
              total, analyses: analyses.length, nonAnalyses: nonAnalyses.length,
              renforcees: parNiveau.find(p => p.niveau === 'Renforcée').dossiers.length,
              normales: parNiveau.find(p => p.niveau === 'Normale').dossiers.length,
              allegees: parNiveau.find(p => p.niveau === 'Allégée').dossiers.length,
              divergences: rbeDivergences().length,
              revue: Object.assign({}, reponses),
              note: note.trim() || null,
            };
            await dbArreterCartographie(synthese);
            showToast(`Cartographie arrêtée au ${formatDateLong(aujourdhui)} et conservée.`);
          },
        }, '✅ Arrêter la cartographie')
      ),
  },
    h(FormSection, { icon: '📊', title: `Photographie du portefeuille au ${formatDateLong(aujourdhui)}`, ton: 'bleu' },
      h('div', { className: 'campagne-tuiles', style: { gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' } },
        h('div', { className: 'campagne-tuile' },
          h('div', { className: 'campagne-tuile-valeur' }, total),
          h('div', { className: 'campagne-tuile-libelle' }, 'Dossiers du portefeuille')),
        h('div', { className: 'campagne-tuile ton-vert' },
          h('div', { className: 'campagne-tuile-valeur' }, analyses.length),
          h('div', { className: 'campagne-tuile-libelle' }, 'Analysés')),
        h('div', { className: cx('campagne-tuile', parNiveau[2].dossiers.length && 'ton-orange') },
          h('div', { className: 'campagne-tuile-valeur' }, parNiveau[2].dossiers.length),
          h('div', { className: 'campagne-tuile-libelle' }, 'En vigilance renforcée')),
        h('div', { className: cx('campagne-tuile', nonAnalyses.length && 'ton-rouge') },
          h('div', { className: 'campagne-tuile-valeur' }, nonAnalyses.length),
          h('div', { className: 'campagne-tuile-libelle' }, 'Restant à analyser'))
      ),
      h('p', { className: 'conf-detail', style: { marginBottom: 0, marginTop: 14 } },
        'Établie en application de l’article L. 561-4-1 du code monétaire et financier. ',
        'Aucun chiffre n’est saisi sur cet écran : tout est agrégé depuis les analyses individuelles des dossiers.')
    ),
    h('div', { className: 'grid-2 colonnes-egales hauteur-contenu', style: { marginTop: 18 } },
      h(FormSection, { icon: '📶', title: 'Répartition par niveau', ton: 'bleu' },
        parNiveau.map(p => {
          const pct = total ? Math.round((p.dossiers.length / total) * 100) : 0;
          return h('div', { className: 'carto-barre', key: p.niveau },
            h('div', { className: 'carto-barre-tete' },
              h('span', { className: 'carto-barre-nom' }, 'Vigilance ', p.niveau.toLowerCase()),
              h('span', { className: 'carto-barre-valeur' }, p.dossiers.length, ' (', pct, ' %)')),
            h('div', { className: 'carto-barre-piste' },
              h('div', { className: cx('carto-barre-remplie', 'niv-' + niveauVigilanceCouleur(p.niveau)), style: { width: pct + '%' } })));
        }),
      ),
      /* La revue de l'expert-comptable : trois questions, et rien de plus.
         Le § 25 en fixe le nombre, et c'est une bonne limite — au-delà, on
         coche sans lire. */
      h(FormSection, { icon: '⚖️', title: 'Votre revue avant l’arrêté', ton: 'dore' },
        /* Le corps défile dans sa carte plutôt que de pousser le bas de la
           page hors de l'écran : à 1366 × 768, la dernière phrase passait
           78 px sous la ligne de flottaison sans qu'aucune barre de
           défilement ne le signale. */
        h('div', { className: 'carto-revue-corps' },
        CARTO_QUESTIONS.map(q => h('div', { className: 'carto-question', key: q.code },
          h('div', { className: 'carto-question-libelle' }, q.libelle),
          h('div', { className: 'toggle-pair' },
            ['Oui', 'Non'].map(v => h('button', {
              key: v,
              className: cx('toggle-btn', reponses[q.code] === v && 'active'),
              onClick: () => setReponses(p => Object.assign({}, p, { [q.code]: v })),
            }, v))
          )
        )),
        h('div', { className: 'form-group', style: { marginTop: 12, marginBottom: 0 } },
          h('label', { className: 'form-label' }, 'Note de revue (facultative)'),
          h('input', {
            className: 'form-input', value: note, placeholder: 'Ce que vous souhaitez consigner',
            onChange: e => setNote(e.target.value),
          })
        ),
        derniere
          ? h('p', { className: 'conf-detail', style: { marginBottom: 0, marginTop: 12 } },
            'Dernier arrêté le ', formatDate(derniere.date), ' par ', derniere.utilisateur,
            '. Prochaine revue attendue dans l’année civile suivante, selon le rythme que le cabinet s’est donné.')
          : h('p', { className: 'conf-detail', style: { marginBottom: 0, marginTop: 12 } },
            'La cartographie n’a jamais été arrêtée. L’article L. 561-4-1 du code monétaire et financier impose de la tenir régulièrement actualisée, sans fixer d’échéance.')
        )
      )
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
const LBCFT_CARTES = [
  { key: 'ppe', label: 'Attestation PPE', icone: 'signature', teinte: 'ambre' },
  { key: 'analyse', label: 'Vigilance LCB-FT', icone: 'loupe', teinte: 'violet' },
  { key: 'rbe', label: 'Registre RBE', icone: 'bouclier', teinte: 'menthe' },
  { key: 'verifications', label: 'Autres vérifications', icone: 'liste', teinte: 'acier' },
  { key: 'cartographie', label: 'Cartographie du cabinet', icone: 'graphe', teinte: 'bleu' },
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
      ? h(ParcoursPpe, { showToast })
      : vue === 'analyse'
        ? h(LbcftPortefeuille, { integre: true, showToast, onMettreAJour: setMajDossier })
        : vue === 'rbe'
          ? h(SuiviRbe, { showToast })
          : vue === 'verifications'
            ? h(ParcoursVerifications, { showToast })
            : h(CartographieLbcft, { dansParcours: true, showToast, cabinetSettings })
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
function ParcoursEtapes({ titre, sousTitre, lignes, colonnes, cle, rendreEtape, vide, showToast }) {
  const [index, setIndex] = useState(null);

  if (index === null) {
    return h('div', { className: 'parcours-liste' },
      h('p', { className: 'parcours-intro' }, sousTitre),
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
          h('div', { className: 'parcours-demarrer' },
            h('button', { className: 'btn btn-primary', onClick: () => setIndex(0) },
              `Traiter les ${lignes.length} ${pluriel(lignes.length, 'dossier', 'dossiers')} →`)
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

/* Carte 1 — l'attestation PPE, dossier par dossier. */
function ParcoursPpe({ showToast }) {
  useDonnees();
  const toutes = attestationsPpe();
  const aFaire = toutes.filter(a => !a.deposee);
  const [detail, setDetail] = useState('');

  async function enregistrer(ligne, ppe, nav) {
    await dbEnregistrerAttestationPpe(ligne.dossier, {
      ppe,
      detail: ppe ? (detail.trim() || null) : null,
    });
    setDetail('');
    showToast(ppe
      ? 'Attestation enregistrée : le dossier passe en vigilance renforcée à la prochaine revue.'
      : 'Attestation enregistrée : aucune fonction concernée.');
    nav.suivant();
  }

  return h(ParcoursEtapes, {
    sousTitre: `${aFaire.length} ${pluriel(aFaire.length, 'dossier n’a pas', 'dossiers n’ont pas')} son attestation PPE au dossier permanent. `
      + `Elle est signée par le dirigeant et porte sur les fonctions de l’article R. 561-18 du code monétaire et financier.`,
    lignes: aFaire,
    cle: l => l.dossier,
    colonnes: [
      { titre: 'Dossier', classe: 'col-principale', rendu: l => l.dossierInfo.nom },
      { titre: 'Dirigeant', rendu: l => l.dossierInfo.dirigeant },
      { titre: 'Activité', rendu: l => l.dossierInfo.activite },
    ],
    vide: 'Toutes les attestations PPE sont au dossier.',
    showToast,
    rendreEtape: (l, nav) => h('div', { className: 'parcours-carte' },
      h('h2', null, l.dossierInfo.nom),
      h('p', { className: 'parcours-contexte' },
        `${l.dossierInfo.dirigeant}, dirigeant. Activité : ${l.dossierInfo.activite}.`),
      h('p', { className: 'parcours-question' },
        'Le dirigeant, un bénéficiaire effectif ou l’un de leurs proches exerce-t-il l’une des fonctions de l’article R. 561-18 ?'),
      h('p', { className: 'champ-aide' },
        'La liste nationale de ces fonctions est fixée par l’arrêté du 17 mars 2023.'),
      h(ChampPanneau, {
        label: 'Si oui, quelle fonction',
        valeur: detail, onChange: setDetail,
        placeholder: 'Mandat, fonction exercée, lien avec la personne exposée',
      }),
      h('div', { className: 'etape-actions' },
        h('button', { className: 'btn btn-secondary', onClick: () => enregistrer(l, false, nav) },
          'Non — aucune fonction concernée'),
        h('button', { className: 'btn btn-primary', onClick: () => enregistrer(l, true, nav) },
          'Oui — personne politiquement exposée'),
        h('button', { className: 'lien-discret', onClick: nav.suivant }, 'Passer ce dossier')
      )
    ),
  });
}

/* Carte 4 — les autres vérifications : gel des avoirs, pays à risque, PPE
   confirmée. Un contrôle par écran, avec le site officiel à ouvrir. */
function ParcoursVerifications({ showToast }) {
  useDonnees();
  const tous = dbControles();
  const aFaire = tous.filter(c => !c.date);
  const [commentaire, setCommentaire] = useState('');

  async function consigner(c, resultat, nav) {
    await dbEnregistrerControle(c.id, {
      resultat,
      commentaire: commentaire.trim() || (resultat === 'negatif' ? 'Aucune correspondance.' : null),
    });
    setCommentaire('');
    showToast('Contrôle consigné avec sa date et sa source.');
    nav.suivant();
  }

  /* Où se fait chaque contrôle. Les adresses ont été relevées sur les
     domaines officiels ; elles n'ont pas pu être ouvertes depuis
     l'environnement de développement, dont la sortie réseau est filtrée. */
  const LIENS = {
    gel: { url: 'https://gels-avoirs.dgtresor.gouv.fr/List', label: 'Ouvrir le registre des gels' },
    pays: { url: 'https://www.fatf-gafi.org/fr/countries/liste-noire-et-liste-gris.html', label: 'Ouvrir les listes du GAFI' },
    ppe: { url: 'https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000047324763', label: 'Ouvrir la liste des fonctions' },
  };

  return h(ParcoursEtapes, {
    sousTitre: `${aFaire.length} ${pluriel(aFaire.length, 'contrôle reste', 'contrôles restent')} à faire. `
      + 'ComplyEC n’interroge aucune de ces bases : il ouvre la bonne page et enregistre ce que vous y constatez.',
    lignes: aFaire,
    cle: c => c.id,
    colonnes: [
      { titre: 'Dossier', classe: 'col-principale', rendu: c => (client(c.dossier) ? client(c.dossier).nom : c.dossier) },
      { titre: 'Contrôle', rendu: c => CONTROLE_TYPES[c.type].label },
      { titre: 'Fondement', rendu: c => CONTROLE_TYPES[c.type].fondement },
    ],
    vide: 'Tous les contrôles ciblés ont été faits.',
    showToast,
    rendreEtape: (c, nav) => {
      const d = client(c.dossier);
      const lien = LIENS[c.type];
      return h('div', { className: 'parcours-carte' },
        h('h2', null, d ? d.nom : c.dossier),
        h('p', { className: 'parcours-contexte' }, CONTROLE_TYPES[c.type].label,
          ' — ', CONTROLE_TYPES[c.type].fondement),
        h('p', { className: 'parcours-question' }, c.source),
        lien
          ? h('a', {
            className: 'btn btn-secondary', href: lien.url,
            target: '_blank', rel: 'noopener noreferrer',
          }, lien.label, h('span', { className: 'lien-externe' }, '↗'))
          : null,
        h(ChampPanneau, {
          label: 'Ce que vous avez constaté',
          valeur: commentaire, onChange: setCommentaire, lignes: 3,
          placeholder: 'Aucune correspondance, ou la correspondance relevée et ce qu’elle implique',
        }),
        h('div', { className: 'etape-actions' },
          h('button', { className: 'btn btn-primary', onClick: () => consigner(c, 'negatif', nav) },
            'Rien à signaler'),
          h('button', { className: 'btn btn-secondary', onClick: () => consigner(c, 'positif', nav) },
            'Correspondance'),
          h('button', { className: 'lien-discret', onClick: nav.suivant }, 'Passer ce contrôle')
        )
      );
    },
  });
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
