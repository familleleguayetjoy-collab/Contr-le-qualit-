// ComplyEC — Surveillance et qualité (S43 à S50) — phase 6 de la refonte V3
'use strict';

/* =====================================================================
   Le système de management de la qualité, comme processus vivant
   =====================================================================

   Le cahier est net sur ce point : cartographie, non-conformités,
   surveillance et évaluation annuelle sont des processus vivants, et le
   dossier de contrôle est une sortie, pas un silo. On ne prépare donc pas un
   contrôle qualité : on tient un système, et le dossier s'en déduit.

   Deux interdits gouvernent ces écrans. Aucun score automatique de conformité
   — c'est l'expert-comptable qui conclut sur l'efficacité de son système, à
   partir de faits que le logiciel rassemble. Et aucune validation
   automatique : le logiciel propose un risque, une réponse, un échantillon ;
   la décision reste humaine à chaque fois.
   ===================================================================== */

// =============================================== S43 — Cartographie qualité

function CartographieQualite({ onBack, showToast, onOuvrirRisque }) {
  const pages = usePagination(dbRisquesQualite(), 4);
  const aValider = risquesQualiteAValider();

  return h('div', { className: 'page' },
    h(EnteteHub, {
      titre: 'Cartographie des risques qualité',
      onRetour: onBack,
      /* « Lancer la revue » ne lançait rien. La revue de la cartographie,
         c'est valider ses domaines un par un : le bouton ouvre donc le
         premier qui reste, et disparaît quand ils sont tous validés. */
      actions: aValider.length
        ? h('button', { className: 'btn btn-primary', onClick: () => onOuvrirRisque(aValider[0].id) },
          `Reprendre la revue — ${aValider.length} ${pluriel(aValider.length, 'domaine', 'domaines')}`)
        : null,
    }),
    h('div', { className: 'campagne-entete' },
      h('div', { className: 'campagne-ligne' },
        h('span', { className: 'campagne-compte' }, dbRisquesQualite().length - aValider.length, ' sur ', dbRisquesQualite().length),
        h('span', { className: 'campagne-libelle' },
          'domaines revus — dernière revue le ', formatDate(QUALITE_DERNIERE_REVUE))
      ),
      h('div', { className: 'campagne-jauge' },
        h('div', { className: 'campagne-jauge-remplie',
          style: { width: Math.round(((dbRisquesQualite().length - aValider.length) / dbRisquesQualite().length) * 100) + '%' } }))
    ),
    /* Quatre cartes par page plutôt qu'un tableau de huit lignes sur six
       colonnes : le cahier l'exige, et les huit composantes de la NPMQ se
       lisent mieux en cartes qu'en grille. */
    h(ThemeHub, {
      cartes: pages.pageItems.map(r => ({
        cle: r.id, icone: r.icone, titre: r.domaine,
        points: [r.objectif],
        compteur: r.etat === 'a-valider' ? 'à valider' : null,
        tonCompteur: 'orange',
        libelleAction: r.etat === 'valide' ? 'Revu →' : 'Ouvrir →',
        onOuvrir: () => onOuvrirRisque(r.id),
      })),
    }),
    h(Pagination, { pagination: pages })
  );
}

// ================================================= S44 — Fiche risque qualité

function FicheRisqueQualite({ risqueId, onBack, showToast }) {
  const r = dbRisquesQualite().find(x => x.id === risqueId);
  const [importance, setImportance] = useState(r.importance);
  const [occurrence, setOccurrence] = useState(r.occurrence);
  const [action, setAction] = useState(r.action);
  const [ecarte, setEcarte] = useState(false);

  return h('div', { className: 'page' },
    h(EnteteHub, {
      titre: r.domaine,
      onRetour: onBack,
      actions: h(React.Fragment, null,
        /* Écarter un risque est une décision : elle demande un motif, et ce
           motif est ce qu'un contrôleur lira. Sans lui, « écarté » ne veut
           rien dire. */
        h('button', { className: 'btn btn-secondary', onClick: () => setEcarte(true) }, 'Écarter ce risque'),
        h('button', {
          className: 'btn btn-primary',
          onClick: async () => {
            await dbValiderRisqueQualite(r.id, { importance, occurrence, action });
            showToast(`Risque « ${r.domaine} » validé.`);
            onBack();
          },
        }, 'Valider le risque')
      ),
    }),
    ecarte
      ? h(FunctionalEditModal, {
        titre: `Écarter le risque « ${r.domaine} »`,
        libelle: 'Motif de la mise à l’écart',
        valeur: '',
        aide: 'Ce motif figurera au dossier de contrôle : il doit expliquer pourquoi ce domaine ne concerne pas le cabinet.',
        onAnnuler: () => setEcarte(false),
        onEnregistrer: async motif => {
          await dbValiderRisqueQualite(r.id, { importance, occurrence, action, ecarte: true, motifEcart: motif });
          setEcarte(false);
          showToast(`Risque « ${r.domaine} » écarté — motif consigné.`);
          onBack();
        },
      })
      : null,
    h('div', { className: 'step-body' },
      h('div', { className: 'step-scroll' },
        /* Même logique que la contractualisation : à gauche ce que nous
           savons, à droite ce que nous décidons. */
        h('div', { className: 'grid-2 colonnes-egales' },
          h(FormSection, { icon: '📌', title: 'Ce que nous savons', ton: 'violet' },
            h('div', { className: 'detail-field' },
              h('div', { className: 'detail-field-label' }, 'Objectif de la composante'),
              h('div', { className: 'detail-field-value' }, r.objectif)),
            h('div', { className: 'detail-field', style: { marginBottom: 0 } },
              h('div', { className: 'detail-field-label' }, 'Contexte du cabinet'),
              h('div', { className: 'detail-field-value' }, r.contexte)),
            h('div', { className: 'form-help' }, h(BadgeAuto), ' Rassemblé depuis les modules de ComplyEC.')
          ),
          h(FormSection, { icon: '⚠️', title: 'Risque proposé', ton: 'dore' },
            h('p', { className: 'carto-texte', style: { marginTop: 0 } }, r.risque),
            h('div', { className: 'form-group' },
              h('label', { className: 'form-label' }, 'Importance'),
              h('div', { className: 'radio-card-row large' },
                ['Faible', 'Moyenne', 'Élevée'].map(v => h('button', {
                  key: v, className: cx('radio-card', importance === v && 'selected'),
                  onClick: () => setImportance(v),
                }, v))
              )
            ),
            h('div', { className: 'form-group', style: { marginBottom: 0 } },
              h('label', { className: 'form-label' }, 'Occurrence'),
              h('div', { className: 'radio-card-row large' },
                ['Rare', 'Possible', 'Avérée'].map(v => h('button', {
                  key: v, className: cx('radio-card', occurrence === v && 'selected'),
                  onClick: () => setOccurrence(v),
                }, v))
              )
            )
          )
        ),
        h(FormSection, { icon: '🛡️', title: 'Réponse du cabinet', ton: 'dore', style: { marginTop: 16 } },
          h('div', { className: 'detail-field' },
            h('div', { className: 'detail-field-label' }, 'Mesures déjà en place'),
            h('div', { className: 'detail-field-value' }, r.reponse)),
          h('div', { className: 'grid-2', style: { gap: 16 } },
            h('div', { className: 'form-group', style: { marginBottom: 0 } },
              h('label', { className: 'form-label' }, 'Action complémentaire'),
              h('input', { className: 'form-input', value: action || '', onChange: e => setAction(e.target.value) })
            ),
            h('div', { className: 'grid-2', style: { gap: 12 } },
              h('div', { className: 'form-group', style: { marginBottom: 0 } },
                h('label', { className: 'form-label' }, 'Responsable'),
                h('div', { className: 'conf-note', style: { paddingTop: 9 } }, r.responsable ? personneNom(r.responsable) : '—')
              ),
              h('div', { className: 'form-group', style: { marginBottom: 0 } },
                h('label', { className: 'form-label' }, 'Échéance'),
                h('div', { className: 'conf-note', style: { paddingTop: 9 } }, r.echeance ? formatDate(r.echeance) : '—')
              )
            )
          )
        )
      )
    )
  );
}

// ==================================================== S45 — Non-conformités

function RegistreNonConformites({ onBack, showToast, onTraiter }) {
  const [filtre, setFiltre] = useState('ouvertes');
  const [choisie, setChoisie] = useState(null);
  const [ajout, setAjout] = useState(false);

  const filtres = [
    { code: 'ouvertes', label: 'Ouvertes', test: n => n.etat === 'ouverte' },
    { code: 'efficacite', label: 'Efficacité à vérifier', test: n => n.etat === 'attente-efficacite' },
    { code: 'cloturees', label: 'Clôturées', test: n => n.etat === 'cloturee' },
  ];
  const actif = filtres.find(f => f.code === filtre);
  const lignes = dbNonConformites().filter(actif.test);

  const colonnes = [
    { code: 'date', titre: 'Date', valeur: n => n.date, rendu: n => formatDate(n.date) },
    { code: 'origine', titre: 'Origine', valeur: n => n.origine, rendu: n => n.origine },
    { code: 'dossier', titre: 'Dossier', classe: 'table-name', valeur: n => client(n.dossier).nom, rendu: n => client(n.dossier).nom },
    { code: 'gravite', titre: 'Gravité', valeur: n => NC_GRAVITES.indexOf(n.gravite),
      rendu: n => h(Badge, { color: n.gravite === 'Mineure' ? 'jaune' : n.gravite === 'Majeure' ? 'orange' : 'rouge' }, n.gravite) },
  ];

  const courante = choisie ? dbNonConformites().find(n => n.id === choisie) : null;
  const detail = courante
    ? h(Card, {
      title: client(courante.dossier).nom,
      subtitle: `${courante.origine} — ${formatDate(courante.date)}`,
      icon: '🛠️', iconBg: '#FEF3E1', iconColor: '#B45309',
      tone: courante.etat === 'cloturee' ? 'vert' : 'orange',
    },
      h('div', { className: 'detail-field' },
        h('div', { className: 'detail-field-label' }, 'Constat'),
        h('div', { className: 'detail-field-value' }, courante.constat)),
      h('div', { className: 'list-row' },
        h('span', { className: 'list-row-label' }, 'État'),
        h(Badge, { color: NC_ETATS[courante.etat].couleur }, NC_ETATS[courante.etat].label)),
      h('div', { className: 'list-row' },
        h('span', { className: 'list-row-label' }, 'Portée'),
        h('span', { className: 'conf-note' }, courante.portee === 'systemique' ? 'Systémique' : 'Isolée')),
      courante.reference
        ? h('div', { className: 'list-row' },
          h('span', { className: 'list-row-label' }, 'Origine liée'),
          h('span', { className: 'conf-note' }, 'Réclamation ', courante.reference))
        : null,
      h('button', {
        className: 'btn btn-primary btn-block', style: { marginTop: 14 },
        onClick: () => onTraiter(courante.id),
      }, 'Ouvrir le traitement →')
    )
    : null;

  return h('div', { className: 'page' },
    h(EnteteHub, {
      titre: 'Non-conformités', onRetour: onBack,
      actions: h('button', { className: 'btn btn-primary', onClick: () => setAjout(true) },
        '+ Ajouter une non-conformité'),
    }),
    h('div', { className: 'tabs', style: { marginBottom: 14 } },
      filtres.map(f => h('button', {
        key: f.code, className: cx('tab', filtre === f.code && 'active'),
        onClick: () => { setFiltre(f.code); setChoisie(null); },
      }, f.label, ' ', h('span', { className: 'tab-compte' }, dbNonConformites().filter(f.test).length)))
    ),
    h(ActionListDetail, {
      titreListe: actif.label, iconeListe: '🛠️',
      sousTitreListe: String(lignes.length),
      colonnes, lignes, cle: n => n.id, parPage: 5,
      triDefaut: { col: 'date', sens: 'desc' },
      vide: 'Aucune non-conformité dans cette vue.',
      selection: choisie, onSelect: n => setChoisie(n.id),
      detail, detailIcone: '🛠️',
      detailVide: 'Choisissez une non-conformité pour voir son constat',
    }),
    ajout
      ? h(AjoutNonConformite, {
        onAnnuler: () => setAjout(false),
        onEnregistrer: async valeurs => {
          const n = await dbCreerNonConformite(valeurs);
          setAjout(false);
          setChoisie(n.id);
          showToast(`Non-conformité ${n.id} enregistrée.`);
        },
      })
      : null
  );
}

/* Saisie d'une non-conformité. Le constat et l'incidence suffisent à
   l'ouvrir : la cause et l'action se décident au traitement, et exiger tout
   d'un coup découragerait de la déclarer — or une non-conformité tue
   s'enregistre, elle ne se cache pas. */
function AjoutNonConformite({ onAnnuler, onEnregistrer }) {
  const [dossier, setDossier] = useState('');
  const [origine, setOrigine] = useState('Supervision interne');
  const [constat, setConstat] = useState('');
  const [incidence, setIncidence] = useState('');

  return h(Modal, { title: 'Enregistrer une non-conformité', onClose: onAnnuler, width: 600 },
    h('div', { className: 'form-group' },
      h('label', { className: 'form-label' }, 'Dossier concerné'),
      h('select', { className: 'form-input', value: dossier, onChange: e => setDossier(e.target.value) },
        h('option', { value: '' }, '— Choisir —'),
        CLIENTS.map(c => h('option', { key: c.id, value: c.id }, c.nom))
      )
    ),
    h('div', { className: 'form-group' },
      h('label', { className: 'form-label' }, 'Comment a-t-elle été relevée ?'),
      h('select', { className: 'form-input', value: origine, onChange: e => setOrigine(e.target.value) },
        ['Supervision interne', 'Réclamation client', 'Surveillance annuelle', 'Contrôle externe', 'Autre']
          .map(o => h('option', { key: o, value: o }, o))
      )
    ),
    h('div', { className: 'form-group' },
      h('label', { className: 'form-label' }, 'Constat'),
      h('input', {
        className: 'form-input', value: constat, autoFocus: true,
        placeholder: 'Ce qui n’a pas été fait comme il aurait dû l’être',
        onChange: e => setConstat(e.target.value),
      })
    ),
    h('div', { className: 'form-group' },
      h('label', { className: 'form-label' }, 'Incidence'),
      h('input', {
        className: 'form-input', value: incidence,
        placeholder: 'Ce que cela a changé pour le client ou pour la mission',
        onChange: e => setIncidence(e.target.value),
      })
    ),
    h('div', { className: 'modal-actions' },
      h('button', { className: 'btn btn-secondary', onClick: onAnnuler }, 'Annuler'),
      h('button', {
        className: 'btn btn-primary',
        disabled: !dossier || !constat.trim(),
        onClick: () => onEnregistrer({
          dossier, origine, constat: constat.trim(),
          incidence: incidence.trim() || 'À apprécier.',
        }),
      }, 'Enregistrer')
    )
  );
}

// =========================================== S46 — Traitement d'une non-conformité

function TraitementNonConformite({ ncId, onBack, showToast }) {
  const n = dbNonConformites().find(x => x.id === ncId);
  const [gravite, setGravite] = useState(n.gravite);
  const [portee, setPortee] = useState(n.portee);
  const [cause, setCause] = useState(n.cause || '');
  const [action, setAction] = useState(n.action || '');
  const echeanceDepassee = n.echeance && n.echeance <= new Date().toISOString().slice(0, 10);

  return h('div', { className: 'page' },
    h(EnteteHub, {
      titre: `Non-conformité — ${client(n.dossier).nom}`,
      onRetour: onBack,
      actions: h('button', {
        className: 'btn btn-primary',
        // Toute modification persiste (§ 26.2) : le plan d'action décidé ici
        // est celui que le dossier de contrôle montrera.
        onClick: async () => {
          await dbMajNonConformite(ncId, { gravite, portee, cause: cause.trim() || null, action: action.trim() || null });
          showToast('Traitement enregistré.');
          onBack();
        },
      }, 'Enregistrer le traitement'),
    }),
    h('div', { className: 'step-body' },
      h('div', { className: 'step-scroll' },
        /* Quatre blocs fixes, des champs narratifs courts : documenter une
           non-conformité ne doit pas coûter plus cher que la corriger. */
        h('div', { className: 'grid-2 colonnes-egales' },
          h(FormSection, { icon: '🔍', title: 'Constat', ton: 'bleu' },
            h('p', { className: 'carto-texte', style: { margin: 0 } }, n.constat),
            h('div', { className: 'form-help' },
              n.reference
                ? `Repris automatiquement de la réclamation ${n.reference} — rien à ressaisir.`
                : `Relevé par ${n.origine.toLowerCase()} le ${formatDate(n.date)}.`)
          ),
          h(FormSection, { icon: '⚡', title: 'Incidence', ton: 'bleu' },
            h('p', { className: 'carto-texte', style: { margin: 0 } },
              n.incidence || 'Incidence à apprécier.')
          )
        ),
        h('div', { className: 'grid-2 colonnes-egales', style: { marginTop: 16 } },
          h(FormSection, { icon: '🧩', title: 'Cause première', ton: 'dore' },
            h('textarea', {
              className: 'form-textarea', rows: 3, value: cause,
              placeholder: 'Pourquoi cela s’est-il produit ?',
              onChange: e => setCause(e.target.value),
            })
          ),
          h(FormSection, { icon: '🛠️', title: 'Action corrective', ton: 'dore' },
            h('textarea', {
              className: 'form-textarea', rows: 3, value: action,
              placeholder: 'Que fait le cabinet pour que cela ne se reproduise pas ?',
              onChange: e => setAction(e.target.value),
            })
          )
        ),
        h(FormSection, { icon: '⚖️', title: 'Qualification et suivi', ton: 'dore', style: { marginTop: 16 } },
          h('div', { className: 'grid-2', style: { gap: 18 } },
            h('div', { className: 'form-group', style: { marginBottom: 0 } },
              h('label', { className: 'form-label' }, 'Gravité'),
              h('div', { className: 'radio-card-row large' },
                NC_GRAVITES.map(g => h('button', {
                  key: g, className: cx('radio-card', gravite === g && 'selected'), onClick: () => setGravite(g),
                }, g))
              )
            ),
            h('div', { className: 'form-group', style: { marginBottom: 0 } },
              h('label', { className: 'form-label' }, 'Portée'),
              h('div', { className: 'radio-card-row large' },
                [['isole', 'Isolée'], ['systemique', 'Systémique']].map(([code, lbl]) => h('button', {
                  key: code, className: cx('radio-card', portee === code && 'selected'), onClick: () => setPortee(code),
                }, lbl))
              )
            )
          ),
          h('div', { className: 'grid-2', style: { gap: 18, marginTop: 14 } },
            h('div', { className: 'list-row' },
              h('span', { className: 'list-row-label' }, 'Responsable'),
              h('span', { className: 'conf-note' }, n.responsable ? personneNom(n.responsable) : 'à désigner')),
            h('div', { className: 'list-row' },
              h('span', { className: 'list-row-label' }, 'Échéance'),
              h('span', { className: 'conf-note' }, n.echeance ? formatDate(n.echeance) : 'à fixer'))
          )
        ),
        /* Le contrôle d'efficacité n'apparaît qu'une fois l'échéance passée :
           avant, il n'y a rien à vérifier. C'est lui qui permet de clore. */
        echeanceDepassee
          ? h(FormSection, { icon: '✅', title: 'Contrôle d’efficacité', ton: 'vert', style: { marginTop: 16 } },
            n.efficacite
              ? h(React.Fragment, null,
                h('div', { className: 'list-row' },
                  h('span', { className: 'list-row-label' }, 'Vérifié le'),
                  h('span', { className: 'conf-note' }, formatDate(n.efficacite.date))),
                h('p', { className: 'carto-texte', style: { marginBottom: 0 } }, n.efficacite.constat))
              : h(React.Fragment, null,
                h('p', { className: 'conf-detail', style: { marginTop: 0 } },
                  'L’échéance est passée : une non-conformité ne se clôt qu’une fois son action corrective vérifiée sur le terrain.'),
                h('button', {
          className: 'btn btn-primary btn-sm',
          // Une non-conformité n'est close qu'une fois son efficacité
          // vérifiée : c'est ce qui distingue une action corrective d'une
          // intention, et l'état se déduit ensuite de ce fait.
          onClick: async () => {
            await dbMajNonConformite(courante.id, {
              efficacite: { date: new Date().toISOString().slice(0, 10), par: EXPERT_COMPTABLE.nom, verdict: 'efficace' },
            });
            showToast(`Contrôle d’efficacité enregistré — ${courante.id} close.`);
          },
        },
                  'Vérifier l’efficacité'))
          )
          : null
      )
    )
  );
}

// ======================================= S47 à S49 — Surveillance annuelle

const SURVEILLANCE_ETAPES = ['Échantillon', 'Contrôle', 'Synthèse'];

function SurveillanceAnnuelle({ onBack, showToast }) {
  const [etape, setEtape] = useState(1);
  const [echantillon, setEchantillon] = useState(ECHANTILLON_SURVEILLANCE);
  const [dossierCourant, setDossierCourant] = useState(0);
  const [verdicts, setVerdicts] = useState({});
  const [pointChoisi, setPointChoisi] = useState(POINTS_CONTROLE[0].code);

  const cle = (d, p) => `${d}|${p}`;
  const dossier = echantillon[dossierCourant];
  const nonConformes = Object.entries(verdicts).filter(([, v]) => v === 'non-conforme');
  const controles = echantillon.filter(d =>
    POINTS_CONTROLE.every(p => verdicts[cle(d.dossier, p.code)])).length;

  function remplacer(i) {
    const candidats = CLIENTS.filter(c => !echantillon.some(e => e.dossier === c.id));
    if (!candidats.length) { showToast('Aucun autre dossier disponible dans le portefeuille.'); return; }
    const remplacant = candidats[0];
    setEchantillon(e => e.map((d, j) => (j === i ? { dossier: remplacant.id, motif: 'Remplacement décidé par l’expert-comptable' } : d)));
    showToast(`${client(echantillon[i].dossier).nom} remplacé par ${remplacant.nom}.`);
  }

  // ---- S47 : l'échantillon ----
  if (etape === 1) {
    return h('div', { className: 'page' },
      h(EnteteHub, { titre: 'Surveillance annuelle', onRetour: onBack }),
      h(Stepper, { steps: SURVEILLANCE_ETAPES, current: 1 }),
      h('div', { className: 'step-body' },
        h('div', { className: 'step-scroll' },
          h('div', { className: 'grid-2-uneven', style: { alignItems: 'stretch' } },
            h(FormSection, { icon: '🎯', title: 'Critères appliqués', ton: 'bleu' },
              CRITERES_ECHANTILLON.map(c => h('div', { className: 'list-row', key: c.code },
                h('span', { className: 'list-row-label' }, c.label),
                h(Badge, { color: c.actif ? 'vert' : 'gris' }, c.actif ? 'appliqué' : 'écarté'))),
              h('div', { className: 'form-help' },
                'Ces critères sont ceux que le cabinet s’est donnés. La sélection qui en découle reste modifiable : rien n’est irréversible.')
            ),
            h(FormSection, { icon: '📋', title: 'Échantillon proposé', ton: 'bleu',
              subtitle: String(echantillon.length) },
              h('div', { className: 'echantillon-liste' },
                echantillon.map((d, i) => h('div', { className: 'echantillon-carte', key: d.dossier },
                  h('div', { className: 'echantillon-corps' },
                    h('div', { className: 'echantillon-nom' }, client(d.dossier).nom),
                    h('div', { className: 'echantillon-motif' }, d.motif)),
                  h('button', { className: 'btn btn-secondary btn-sm', onClick: () => remplacer(i) }, 'Remplacer')
                ))
              )
            )
          )
        ),
        h('div', { className: 'wizard-footer' },
          h('button', { className: 'btn btn-secondary', onClick: onBack }, '← Retour'),
          h('button', { className: 'btn btn-primary', onClick: () => setEtape(2) }, 'Valider l’échantillon →')
        )
      )
    );
  }

  // ---- S48 : le contrôle, dossier par dossier ----
  if (etape === 2) {
    const point = POINTS_CONTROLE.find(p => p.code === pointChoisi);
    const verdictCourant = verdicts[cle(dossier.dossier, pointChoisi)];
    const dernierDossier = dossierCourant >= echantillon.length - 1;

    return h('div', { className: 'page' },
      h(EnteteHub, { titre: `Surveillance annuelle — ${client(dossier.dossier).nom}` }),
      h(Stepper, { steps: SURVEILLANCE_ETAPES, current: 2 }),
      h('div', { className: 'step-body' },
        h('div', { className: 'tabs', style: { marginBottom: 14 } },
          echantillon.map((d, i) => h('button', {
            key: d.dossier, className: cx('tab', i === dossierCourant && 'active'),
            onClick: () => { setDossierCourant(i); setPointChoisi(POINTS_CONTROLE[0].code); },
          }, `Dossier ${i + 1}/${echantillon.length}`))
        ),
        h('div', { className: 'split-layout with-detail' },
          h(FormSection, { icon: '☑️', title: 'Points de contrôle', ton: 'bleu',
            subtitle: `${POINTS_CONTROLE.filter(p => verdicts[cle(dossier.dossier, p.code)]).length} sur ${POINTS_CONTROLE.length}` },
            /* Les trois boutons de cotation sont des symboles : ils sont
               nommés une fois ici, plutôt que répétés seize fois dans la
               liste ou laissés à deviner au survol. */
            h('div', { className: 'points-legende' },
              Object.keys(CONTROLE_VERDICTS).map(k => h('span', { className: 'points-legende-item', key: k },
                h('span', { className: cx('point-verdict', 'v-' + k, 'actif') }, CONTROLE_VERDICTS[k].puce),
                CONTROLE_VERDICTS[k].label))
            ),
            h('div', { className: 'points-liste' },
              POINTS_CONTROLE.map(p => {
                const v = verdicts[cle(dossier.dossier, p.code)];
                return h('div', { className: cx('point-ligne', pointChoisi === p.code && 'actif'), key: p.code,
                  onClick: () => setPointChoisi(p.code) },
                  h('span', { className: 'point-label' }, p.label),
                  h('span', { className: 'point-verdicts' },
                    Object.keys(CONTROLE_VERDICTS).map(k => h('button', {
                      key: k,
                      className: cx('point-verdict', 'v-' + k, v === k && 'actif'),
                      title: CONTROLE_VERDICTS[k].label,
                      onClick: e => {
                        e.stopPropagation();
                        setPointChoisi(p.code);
                        setVerdicts(x => Object.assign({}, x, { [cle(dossier.dossier, p.code)]: k }));
                      },
                    }, CONTROLE_VERDICTS[k].puce)))
                );
              })
            )
          ),
          h('div', { className: 'detail-panel' },
            h(Card, {
              title: point.label,
              subtitle: verdictCourant ? CONTROLE_VERDICTS[verdictCourant].label : 'Pas encore coté',
              icon: '📎', iconBg: '#E9F1FE', iconColor: '#2563EB',
              tone: verdictCourant === 'non-conforme' ? 'orange' : verdictCourant === 'conforme' ? 'vert' : 'bleu',
            },
              h('div', { className: 'detail-field' },
                h('div', { className: 'detail-field-label' }, 'Ce que ComplyEC sait déjà'),
                h('div', { className: 'detail-field-value' }, point.source)),
              h('div', { className: 'form-group' },
                h('label', { className: 'form-label' }, 'Observation'),
                h('input', { className: 'form-input', placeholder: 'Facultatif — une ligne suffit' })
              ),
              verdictCourant === 'non-conforme'
                ? h('button', {
                  className: 'btn btn-secondary btn-sm',
                  // Le dossier et le point contrôlé sont repris : c'est le
                  // contexte, on ne le ressaisit pas.
                  onClick: async () => {
                    const n = await dbCreerNonConformite({
                      dossier: dossier.dossier,
                      origine: 'Surveillance annuelle',
                      constat: point.label,
                      incidence: 'Relevée lors du contrôle du dossier.',
                    });
                    showToast(`Non-conformité ${n.id} créée — dossier et constat repris.`);
                  },
                }, 'Créer une non-conformité')
                : null
            )
          )
        ),
        h('div', { className: 'wizard-footer' },
          h('button', { className: 'btn btn-secondary', onClick: () => (dossierCourant > 0 ? setDossierCourant(i => i - 1) : setEtape(1)) }, '← Retour'),
          h('button', {
            className: 'btn btn-primary',
            onClick: () => {
              if (dernierDossier) { setEtape(3); return; }
              setDossierCourant(i => i + 1);
              setPointChoisi(POINTS_CONTROLE[0].code);
            },
          }, dernierDossier ? 'Voir la synthèse →' : 'Enregistrer et continuer →')
        )
      )
    );
  }

  // ---- S49 : la synthèse ----
  const rapport = [
    `RAPPORT DE SURVEILLANCE ANNUELLE — ${currentCalendarYear()}`,
    '',
    (REFERENTIEL_INFOS.find(i => i.cle === 'cabinet.denomination') || {}).valeur || '',
    `Arrêté au ${formatDateLong(new Date().toISOString().slice(0, 10))}`,
    '',
    'ÉTENDUE DES TRAVAUX',
    `${echantillon.length} dossiers ont été retenus selon les critères que le cabinet s'est`,
    `donnés, et ${controles} ont été contrôlés sur ${POINTS_CONTROLE.length} points chacun.`,
    '',
    'DOSSIERS CONTRÔLÉS',
    ...echantillon.map(d => `— ${client(d.dossier).nom} : ${d.motif}`),
    '',
    'CONSTATS',
    nonConformes.length
      ? `${nonConformes.length} point(s) ont été relevés non conformes et ont donné lieu à une`
      : 'Aucun point non conforme n’a été relevé sur les dossiers contrôlés.',
    nonConformes.length ? 'non-conformité inscrite au registre.' : '',
    '',
    'Établi conformément à la composante « Surveillance et actions correctives »',
    'de la norme professionnelle de management de la qualité.',
  ].join('\n');

  return h('div', { className: 'page' },
    h(EnteteHub, { titre: 'Surveillance annuelle — synthèse' }),
    h(Stepper, { steps: SURVEILLANCE_ETAPES, current: 3 }),
    h('div', { className: 'step-body' },
      h('div', { className: 'step-scroll' },
        h('div', { className: 'campagne-tuiles', style: { marginBottom: 16 } },
          h('div', { className: 'campagne-tuile ton-vert' },
            h('div', { className: 'campagne-tuile-valeur' }, controles, ' / ', echantillon.length),
            h('div', { className: 'campagne-tuile-libelle' }, 'Dossiers contrôlés')),
          h('div', { className: cx('campagne-tuile', nonConformes.length && 'ton-orange') },
            h('div', { className: 'campagne-tuile-valeur' }, nonConformes.length),
            h('div', { className: 'campagne-tuile-libelle' }, 'Points non conformes')),
          h('div', { className: cx('campagne-tuile', ncOuvertes().length && 'ton-orange') },
            h('div', { className: 'campagne-tuile-valeur' }, ncOuvertes().length),
            h('div', { className: 'campagne-tuile-libelle' }, 'Actions ouvertes'))
        ),
        h(DocumentPreviewShell, {
          titreDocument: `Rapport de surveillance ${currentCalendarYear()}`,
          feuille: rapport,
          titrePanneau: 'Actions correctives',
          iconePanneau: '🛠️',
          panneau: ncOuvertes().length
            ? ncOuvertes().slice(0, 5).map(n => h('div', { className: 'list-row', key: n.id },
              h('span', { className: 'list-row-label' }, client(n.dossier).nom),
              h('span', { className: 'conf-note' },
                n.responsable ? `${personneNom(n.responsable)} — ${n.echeance ? formatDate(n.echeance) : 'échéance à fixer'}` : 'à affecter')))
            : h(EmptyDetail, { icon: '✅', label: 'Aucune action corrective ouverte.' }),
          actions: h('p', { className: 'conf-detail', style: { margin: 0 } },
            'Le rapport se lit avant d’être finalisé : c’est la pièce que le contrôleur qualité demandera.'),
        })
      ),
      h('div', { className: 'wizard-footer' },
        h('button', { className: 'btn btn-secondary', onClick: () => setEtape(2) }, '← Retour'),
        h('button', {
          className: 'btn btn-primary',
          /* Le rapport de surveillance consigne les contrôles faits. Chaque
           point coté non conforme a déjà pu donner lieu à une non-conformité ;
           ce que l'arrêté ajoute, c'est la date et la personne. */
        onClick: async () => {
          for (const cle of Object.keys(verdicts)) {
            const [dossierId, code] = cle.split('|');
            await dbEnregistrerControle(`surv-${dossierId}-${code}`, {
              dossier: dossierId, type: 'surveillance', point: code, resultat: verdicts[cle],
            });
          }
          showToast('Rapport de surveillance finalisé et daté.');
          onBack();
        },
        }, '✅ Finaliser le rapport')
      )
    )
  );
}

// ============================================ S50 — Évaluation annuelle du SMQ

function EvaluationAnnuelle({ onBack, showToast }) {
  const faits = faitsEvaluationAnnuelle();
  const [conclusion, setConclusion] = useState(null);
  const [priorites, setPriorites] = useState(['', '', '']);

  return h('div', { className: 'page' },
    h(EnteteHub, {
      titre: `Évaluation annuelle du système qualité — ${currentCalendarYear()}`,
      onRetour: onBack,
      actions: h('button', {
        className: 'btn btn-primary', disabled: !conclusion,
        onClick: async () => {
          await dbMajReglage('evaluationAnnuelle', {
            date: new Date().toISOString().slice(0, 10),
            par: EXPERT_COMPTABLE.nom,
          });
          dbJournaliser('Évaluation annuelle validée', `exercice ${currentCalendarYear()}`, null);
          showToast('Évaluation annuelle validée et datée.');
          onBack();
        },
      }, 'Valider l’évaluation annuelle'),
    }),
    h('div', { className: 'step-body' },
      h('div', { className: 'step-scroll' },
        h('div', { className: 'grid-2 colonnes-egales' },
          /* Les faits de l'année, rassemblés par le logiciel. Aucun score :
             le cahier l'interdit, et la NPMQ confie la conclusion à
             l'expert-comptable, pas à un calcul. */
          h(FormSection, { icon: '📊', title: 'Les faits de l’année', ton: 'bleu' },
            faits.map(f => h('div', { className: 'fait-ligne', key: f.code },
              h('div', { className: 'fait-valeur' }, f.valeur),
              h('div', { className: 'fait-corps' },
                h('div', { className: 'fait-libelle' }, f.libelle),
                h('div', { className: 'fait-detail' }, f.detail))
            )),
            h('div', { className: 'form-help' }, h(BadgeAuto), ' Rassemblés depuis les registres du cabinet.')
          ),
          h(FormSection, { icon: '⚖️', title: 'Votre conclusion', ton: 'dore' },
            h('div', { className: 'conclusion-choix' },
              EVALUATION_CONCLUSIONS.map(c => h('button', {
                key: c.code,
                className: cx('conclusion-carte', conclusion === c.code && 'selected'),
                onClick: () => setConclusion(c.code),
              },
                h('span', { className: 'conclusion-titre' }, c.label),
                h('span', { className: 'conclusion-detail' }, c.detail)
              ))
            ),
            h('p', { className: 'conf-detail', style: { marginBottom: 0 } },
              'ComplyEC ne calcule aucun score de conformité : la norme confie cette conclusion à l’expert-comptable.')
          )
        ),
        h(FormSection, { icon: '🎯', title: 'Trois priorités pour l’année suivante', ton: 'dore', style: { marginTop: 16 } },
          h('div', { className: 'grid-2', style: { gap: 14 } },
            priorites.slice(0, 2).map((p, i) => h('div', { className: 'form-group', key: i, style: { marginBottom: 0 } },
              h('label', { className: 'form-label' }, `Priorité ${i + 1}`),
              h('input', {
                className: 'form-input', value: p, placeholder: 'Une ligne',
                onChange: e => setPriorites(ps => ps.map((x, j) => (j === i ? e.target.value : x))),
              })
            ))
          ),
          h('div', { className: 'form-group', style: { marginTop: 14, marginBottom: 0 } },
            h('label', { className: 'form-label' }, 'Priorité 3'),
            h('input', {
              className: 'form-input', value: priorites[2], placeholder: 'Une ligne',
              onChange: e => setPriorites(ps => ps.map((x, j) => (j === 2 ? e.target.value : x))),
            })
          )
        )
      )
    )
  );
}
