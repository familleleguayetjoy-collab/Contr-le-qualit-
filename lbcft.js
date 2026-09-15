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

function LbcftATraiter({ onBack, showToast, cabinetSettings, onMettreAJour }) {
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

  return h('div', { className: 'page' },
    h(EnteteHub, { titre: 'LBC-FT — à traiter', onRetour: onBack }),
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

function LbcftPortefeuille({ onBack, showToast, onMettreAJour }) {
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

  return h('div', { className: 'page' },
    h(EnteteHub, { titre: 'Portefeuille LBC-FT', onRetour: onBack }),
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
}

// ======================================= S34 à S38 — Mise à jour de la vigilance

const MAJ_VIGILANCE_ETAPES = ['Identification', 'Connaissance de la relation', 'Cotation', 'Mesures', 'Validation'];

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

    // ---- S36 : cotation — composant partagé S13 ----
    etape === 3 && h('div', { className: 'step-body' },
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

    // ---- S37 : les mesures que le niveau appelle ----
    etape === 4 && h('div', { className: 'step-body' },
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

    // ---- S38 : validation ----
    etape === 5 && h('div', { className: 'step-body' },
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
              h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Vérifications'), h('span', { className: 'v' }, `${vig.basesVerifiees.length} sur ${VIGILANCE_BASES.length}`))
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
          onClick: () => { showToast(`Vigilance de ${c.nom} mise à jour et historisée (démonstration).`); onBack(); },
        }, '✅ Enregistrer la mise à jour')
      )
    )
  );
}

// ================================================= S39 — LBC-FT — Cartographie

/* Le cahier V3 fait de la cartographie une photographie, pas un questionnaire :
   « la cartographie n'est pas un questionnaire indépendant », et tout est
   agrégé depuis les analyses individuelles. Elle remplace donc l'assistant en
   cinq étapes de la version précédente. Aucun nombre ne se saisit ici. */
function CartographieLbcft({ onBack, showToast, cabinetSettings }) {
  const settings = cabinetSettings || CABINET_SETTINGS_DEFAUT;
  const analyses = dbVigilanceDossiers().filter(d => d.statut === 'complete');
  const nonAnalyses = dbVigilanceDossiers().filter(d => d.statut !== 'complete');
  const total = dbVigilanceDossiers().length;
  const parNiveau = ['Allégée', 'Normale', 'Renforcée'].map(n => ({
    niveau: n,
    dossiers: analyses.filter(d => d.niveauRetenu === n),
  }));
  const attention = vigilanceATraiter().slice(0, 5);
  const aujourdhui = new Date().toISOString().slice(0, 10);

  return h('div', { className: 'page' },
    h(EnteteHub, {
      titre: 'Cartographie des risques LBC-FT',
      onRetour: onBack,
      actions: h(React.Fragment, null,
        h('button', { className: 'btn btn-secondary', onClick: () => showToast('Cartographie exportée (démonstration).') }, '⬇ Exporter'),
        h('button', { className: 'btn btn-primary', onClick: () => showToast(`Cartographie arrêtée au ${formatDateLong(aujourdhui)} et conservée (démonstration).`) },
          '✅ Arrêter la cartographie')
      ),
    }),
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
        parNiveau[0].dossiers.length === 0
          ? h('p', { className: 'conf-detail', style: { marginBottom: 0 } },
            'Aucun dossier n’est placé en vigilance allégée : le cabinet a fait le choix de ne pas y recourir en l’absence de décision expresse et documentée du référent LBC-FT.')
          : null
      ),
      h(FormSection, { icon: '⚠️', title: 'Dossiers demandant une attention', ton: 'bleu',
        subtitle: String(attention.length) },
        attention.length
          ? attention.map(a => h('div', { className: 'list-row', key: a.dossier },
            h('span', { className: 'list-row-label' },
              h(Dot, { color: a.priorite === 'Critique' ? 'rouge' : a.priorite === 'Haute' ? 'orange' : 'jaune' }),
              client(a.dossier).nom),
            h('span', { className: 'conf-note' }, VIGILANCE_MOTIFS[a.principal].label)))
          : h(EmptyDetail, { icon: '✅', label: 'Aucun dossier ne demande d’attention particulière.' })
      )
    )
  );
}

// ============================================ S40 — Campagnes & contrôles

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
          ? h('button', { className: 'btn btn-secondary btn-sm', onClick: () => showToast('Divergence signalée à l’INPI (démonstration).') },
            'Signaler la divergence')
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
