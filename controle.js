/* =====================================================================
   Contrôle demain, simulation, pack et journal — § 31 à § 34 du V6
   =====================================================================

   Ces quatre écrans répondent à une seule question, posée la veille d'un
   contrôle : « est-ce que je suis prêt, et qu'est-ce que je montre ? »

   Aucun d'eux n'invente de règle métier. Ils agrègent la matrice de preuves
   que le cabinet alimente déjà, écran par écran, depuis les six autres
   modules. C'est ce qui permet au pack d'être opposable : chaque pièce vient
   d'un travail réellement fait, pas d'une case cochée ici.

   Ce qu'on n'y trouvera pas : un score de conformité. Le § 38 l'interdit, et
   il aurait tort — « 92 % conforme » ne dit ni ce qui manque ni si ce qui
   manque est grave. Trois nombres le disent mieux : ce qui est disponible, ce
   qui reste à compléter, ce qui se traite hors de ComplyEC.
   ===================================================================== */

/* ------------------------------------------------- § 31 — Contrôle demain */

function ControlTomorrowView({ navigateEc, showToast, cabinetSettings, onPreparerPack, onSimuler }) {
  const etat = preparationControleQualite(cabinetSettings);
  const journee = computeControlJourneyState(cabinetSettings);
  const pretes = etat.composantes.reduce((acc, c) => acc.concat(
    c.preuves.filter(p => p.etat === 'ok').map(p => ({ libelle: p.libelle, detail: p.detail, composante: c.titre, icone: c.icone }))
  ), []);
  const externes = etat.composantes.reduce((acc, c) => acc.concat(
    c.preuves.filter(p => p.etat === 'externe').map(p => ({ libelle: p.libelle, detail: p.detail }))
  ), []);

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null, h('h1', null, 'Contrôle demain')),
      h('div', { className: 'page-header-actions' },
        h('button', { className: 'btn btn-secondary', onClick: onSimuler }, '🎧 Simulation de contrôle'),
        h('button', { className: 'btn btn-primary', onClick: onPreparerPack }, 'Préparer le pack de contrôle')
      )
    ),

    /* Trois nombres, pas un score. Chacun dit une chose différente, et le
       troisième — ce qui se traite hors de ComplyEC — est celui qu'un
       logiciel a le plus souvent la tentation de taire. */
    h('div', { className: 'controle-indicateurs' },
      h('div', { className: 'controle-indicateur ton-vert' },
        h('div', { className: 'controle-indicateur-valeur' }, etat.ok),
        h('div', { className: 'controle-indicateur-libelle' },
          pluriel(etat.ok, 'preuve disponible', 'preuves disponibles'))),
      h('div', { className: cx('controle-indicateur', etat.aTraiter && 'ton-orange') },
        h('div', { className: 'controle-indicateur-valeur' }, etat.aTraiter),
        h('div', { className: 'controle-indicateur-libelle' },
          pluriel(etat.aTraiter, 'pièce à compléter', 'pièces à compléter'))),
      h('div', { className: 'controle-indicateur' },
        h('div', { className: 'controle-indicateur-valeur' }, etat.externe),
        h('div', { className: 'controle-indicateur-libelle' }, 'hors ComplyEC'))
    ),

    h('div', { className: 'controle-colonnes' },
      h(FormSection, { icon: '📋', title: 'À faire avant le contrôle', ton: etat.aFaire.length ? 'orange' : 'vert',
        subtitle: String(etat.aFaire.length) },
        etat.aFaire.length
          ? h('div', { className: 'controle-liste' },
            etat.aFaire.map((t, i) => h('div', { className: 'controle-tache', key: i },
              h('span', { className: cx('accueil-pastille', t.etat === 'absent' ? 'urgence-0' : 'urgence-1') }),
              h('div', { className: 'controle-tache-texte' },
                h('div', { className: 'controle-tache-titre' }, t.icone, ' ', t.faire),
                h('div', { className: 'parcours-reste-detail' }, t.detail),
                h('div', { className: 'verif-source' }, t.composante, ' · ', t.source)
              ),
              t.ou
                ? h('button', { className: 'btn btn-secondary btn-sm', onClick: () => navigateEc(t.ou[0], t.ou[1]) }, 'Ouvrir')
                : null
            ))
          )
          : h('div', { className: 'parcours-pret' },
            h('span', { className: 'parcours-pret-marque' }, '✓'),
            h('div', null,
              h('div', { className: 'parcours-pret-titre' }, 'Rien ne reste à compléter.'),
              h('div', { className: 'parcours-reste-detail' },
                'Toutes les pièces que ComplyEC produit sont disponibles.'))
          )
      ),
      h(FormSection, { icon: '✅', title: 'Déjà prêt', ton: 'vert', subtitle: String(pretes.length) },
        h('div', { className: 'controle-pret-liste' },
          pretes.map((p, i) => h('div', { className: 'parcours-fait', key: i },
            h('div', { className: 'parcours-fait-libelle' }, p.libelle),
            h('div', { className: 'parcours-reste-detail' }, p.detail)
          ))
        ),
        /* Ce qui se traite ailleurs se dit, il ne se cache pas : un cabinet
           qui découvrirait la veille qu'il lui manque une décision écrite de
           direction n'aurait plus le temps de la prendre. */
        externes.length
          ? h('div', { className: 'controle-externe' },
            h('div', { className: 'controle-externe-titre' },
              `${externes.length} ${pluriel(externes.length, 'pièce se traite', 'pièces se traitent')} hors de ComplyEC`),
            externes.slice(0, 4).map((e, i) => h('div', { className: 'parcours-reste-detail', key: i }, '• ', e.libelle)),
            externes.length > 4
              ? h('div', { className: 'parcours-reste-detail' },
                `et ${externes.length - 4} ${pluriel(externes.length - 4, 'autre', 'autres')}.`)
              : null
          )
          : null
      )
    )
  );
}

/* ------------------------------------------ § 32 — Simulation de contrôle

   Les questions d'un contrôleur, une par écran, et la preuve en face. Ce ne
   sont pas des questions inventées : chacune reprend une pièce de la matrice,
   avec l'état réel de cette pièce. Quand la preuve manque, l'écran dit quoi
   faire et y emmène — c'est tout l'intérêt de la faire la veille plutôt que
   le jour même. */
function ControlSimulation({ onBack, navigateEc, cabinetSettings }) {
  const etat = preparationControleQualite(cabinetSettings);

  /* Huit à dix questions (§ 32). On prend les pièces les plus parlantes de
     chaque composante : celle qui manque en priorité, sinon la première. */
  const questions = etat.composantes.map(c => {
    const manquante = c.preuves.find(p => p.etat === 'absent' || p.etat === 'partiel');
    const p = manquante || c.preuves[0];
    return {
      composante: c.titre, icone: c.icone, ton: c.ton,
      question: questionDeControleur(p, c),
      preuve: p,
    };
  }).filter(q => q.preuve);

  const [index, setIndex] = useState(0);
  const q = questions[index];
  if (!q) return h('div', { className: 'page' }, h(EnteteHub, { titre: 'Simulation de contrôle', onRetour: onBack }));

  const disponible = q.preuve.etat === 'ok';
  const externe = q.preuve.etat === 'externe';

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null,
        h('div', { className: 'parcours-rang' }, `Question ${index + 1} sur ${questions.length}`),
        h('h1', null, 'Simulation de contrôle')
      ),
      h('div', { className: 'page-header-actions' },
        h('button', { className: 'btn btn-secondary', onClick: onBack }, '← Quitter la simulation')
      )
    ),
    h('div', { className: 'parcours-fil-mobile', style: { display: 'block', marginBottom: 18 } },
      h('div', { className: 'parcours-fil-mobile-barre' },
        h('span', { style: { width: Math.round((index + 1) / questions.length * 100) + '%' } }))
    ),
    h('div', { className: 'parcours-contenu' },
      h(FormSection, { icon: '🎧', title: 'Ce que le contrôleur demande', ton: q.ton || 'bleu' },
        h('p', { className: 'simulation-question' }, '« ', q.question, ' »'),
        h('div', { className: 'verif-source' }, q.icone, ' ', q.composante, ' · ', q.preuve.source)
      ),
      h(FormSection, { icon: disponible ? '✅' : (externe ? '📁' : '⚠️'),
        title: disponible ? 'Ce que vous montrez' : (externe ? 'Ce que vous apportez vous-même' : 'Ce qui manque'),
        ton: disponible ? 'vert' : (externe ? 'gris' : 'orange'),
        style: { marginTop: 16 } },
        h('div', { className: 'parcours-fait-libelle' }, q.preuve.libelle),
        h('p', { className: 'parcours-reste-detail', style: { marginTop: 4 } }, q.preuve.detail),
        disponible
          ? h('button', {
            className: 'btn btn-secondary', style: { marginTop: 10 },
            disabled: !q.preuve.ou,
            onClick: () => q.preuve.ou && navigateEc(q.preuve.ou[0], q.preuve.ou[1]),
          }, 'Afficher la preuve')
          : (externe
            ? h('p', { className: 'conf-detail', style: { marginBottom: 0, marginTop: 8 } },
              'Cette pièce ne sort pas de ComplyEC : elle se trouve dans les archives du cabinet et se joint au dossier de contrôle.')
            : h('button', {
              className: 'btn btn-primary', style: { marginTop: 10 },
              disabled: !q.preuve.ou,
              onClick: () => q.preuve.ou && navigateEc(q.preuve.ou[0], q.preuve.ou[1]),
            }, q.preuve.faire || 'Corriger maintenant'))
      )
    ),
    h('div', { className: 'parcours-pied' },
      h('div', { className: 'parcours-pied-etat' },
        `${questions.filter(x => x.preuve.etat === 'ok').length} ${pluriel(questions.filter(x => x.preuve.etat === 'ok').length, 'réponse documentée', 'réponses documentées')} sur ${questions.length}`),
      h('div', { style: { display: 'flex', gap: 10 } },
        index > 0
          ? h('button', { className: 'btn btn-secondary', onClick: () => setIndex(index - 1) }, '← Question précédente')
          : null,
        index < questions.length - 1
          ? h('button', { className: 'btn btn-primary', onClick: () => setIndex(index + 1) }, 'Question suivante →')
          : h('button', { className: 'btn btn-primary', onClick: onBack }, 'Terminer la simulation')
      )
    )
  );
}

/* La question telle qu'un contrôleur la pose : au vous, sans jargon de norme.
   « Montrez-moi votre cartographie des risques » plutôt que « Processus
   d'évaluation des risques de la structure — pièce 1 ». */
function questionDeControleur(preuve, composante) {
  const l = preuve.libelle;
  if (/chapitre/i.test(l)) return `Montrez-moi le chapitre « ${l.replace(/^Chapitre\s*/i, '').replace(/ du manuel$/i, '')} » de votre manuel.`;
  if (/registre/i.test(l)) return `Pouvez-vous me présenter votre ${l.toLowerCase()} ?`;
  if (/cartographie/i.test(l)) return `Montrez-moi votre ${l.toLowerCase()}, et dites-moi quand elle a été arrêtée.`;
  if (/désignation|déclarant|correspondant/i.test(l)) return `Qui, dans le cabinet, tient ce rôle, et depuis quand ?`;
  if (/formation/i.test(l)) return `Comment justifiez-vous la formation de vos collaborateurs sur ce point ?`;
  if (/déclaration/i.test(l)) return `Où sont les ${l.toLowerCase()} de cette année ?`;
  return `Au titre de « ${composante.titre.toLowerCase()} », que pouvez-vous me montrer sur ce point ?`;
}

/* ------------------------------------------------ § 33 — Pack de contrôle

   Le pack est un instantané : il fige ce que le cabinet pouvait montrer à une
   date et à une heure données. Une modification postérieure ne le change pas,
   et c'est tout son intérêt — un contrôleur qui revient sur un pack de la
   semaine dernière doit y retrouver ce qu'il a vu la semaine dernière. */
function PackControle({ onBack, navigateEc, showToast, cabinetSettings, onJournal }) {
  const packs = dbPacks();
  const [choisi, setChoisi] = useState(packs.length ? packs[0].id : null);
  const pack = packs.find(p => p.id === choisi) || null;
  const etat = preparationControleQualite(cabinetSettings);

  async function preparer() {
    const p = await dbPreparerPack(etat, cabinetSettings);
    setChoisi(p.id);
    showToast(`Pack de contrôle arrêté au ${formatDateLong(p.date)}.`);
  }

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null, h('h1', null, 'Pack de contrôle')),
      h('div', { className: 'page-header-actions' },
        onBack ? h('button', { className: 'btn btn-secondary', onClick: onBack }, '← Retour') : null,
        onJournal ? h('button', { className: 'btn btn-secondary', onClick: onJournal }, '📓 Journal des validations') : null,
        h('button', { className: 'btn btn-primary', onClick: preparer }, 'Préparer un pack')
      )
    ),
    h('div', { className: 'controle-colonnes' },
      h(FormSection, { icon: '📦', title: 'Packs préparés', ton: 'bleu', subtitle: String(packs.length) },
        packs.length
          ? h('div', { className: 'parcours-restes' },
            packs.slice(0, 6).map(p => h('button', {
              key: p.id,
              className: cx('pack-ligne', p.id === choisi && 'active'),
              onClick: () => setChoisi(p.id),
            },
              h('div', { className: 'parcours-reste-titre' }, formatDateLong(p.date), ' à ', p.heure),
              h('div', { className: 'parcours-reste-detail' },
                `${p.disponibles} disponibles · ${p.aCompleter} à compléter · ${p.horsComplyEC} hors ComplyEC`)
            ))
          )
          : h('p', { className: 'conf-detail', style: { marginBottom: 0 } },
            'Aucun pack n’a encore été préparé. Un pack fige ce que le cabinet peut montrer à une date donnée ; une modification postérieure ne le change pas.')
      ),
      pack
        ? h(FormSection, { icon: '🔒', title: `Pack du ${formatDate(pack.date)}`, ton: 'vert' },
          h('div', { className: 'parcours-faits' },
            h('div', { className: 'parcours-fait' },
              h('div', { className: 'parcours-fait-libelle' }, 'Arrêté le'),
              h('div', { className: 'parcours-reste-detail' }, `${formatDateLong(pack.date)} à ${pack.heure}, par ${pack.utilisateur}.`)),
            h('div', { className: 'parcours-fait' },
              h('div', { className: 'parcours-fait-libelle' }, 'Version du manuel'),
              h('div', { className: 'parcours-reste-detail' }, pack.manuel || 'Aucune version publiée à cette date.')),
            h('div', { className: 'parcours-fait' },
              h('div', { className: 'parcours-fait-libelle' }, 'Index des preuves'),
              h('div', { className: 'parcours-reste-detail' },
                `${pack.disponibles} ${pluriel(pack.disponibles, 'pièce disponible', 'pièces disponibles')}, `,
                `${pack.aCompleter} à compléter, ${pack.horsComplyEC} hors ComplyEC.`)),
            h('div', { className: 'parcours-fait' },
              h('div', { className: 'parcours-fait-libelle' }, 'Annexes'),
              h('div', { className: 'parcours-reste-detail' },
                `${pack.annexes.length} ${pluriel(pack.annexes.length, 'annexe recensée', 'annexes recensées')}.`))
          ),
          /* L'archive ZIP n'est pas embarquée dans l'application : proposer un
             bouton « Télécharger le pack » serait promettre un fichier qui ne
             sortirait pas. On propose donc les exports qui existent vraiment,
             et l'index. */
          h(CapabilityGate, {
            cle: 'zipExport',
            reel: h('button', { className: 'btn btn-primary', style: { marginTop: 12 } }, '⬇ Télécharger le pack'),
            indisponible: h(React.Fragment, null,
              h('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 } },
                h('button', {
                  className: 'btn btn-primary',
                  onClick: () => { telechargerIndexPack(pack); showToast('Index du pack téléchargé au format Word.'); },
                }, '⬇ Index des preuves (Word)'),
                h('button', { className: 'btn btn-secondary', onClick: () => navigateEc('qualite', 'dossier-controle') },
                  'Voir le dossier de contrôle')
              ),
              h(MentionCapacite, { cle: 'zipExport' })
            ),
          })
        )
        : h(FormSection, { icon: '📦', title: 'Aucun pack sélectionné', ton: 'gris' },
          h('p', { className: 'conf-detail', style: { marginBottom: 0 } },
            'Préparez un pack pour figer l’état du cabinet à cet instant.'))
    )
  );
}

/* L'index des preuves au format Word : la liste de ce que le pack contient,
   pièce par pièce, avec son état à la date de l'arrêté. C'est le document
   qu'on tend au contrôleur en début de séance. */
function telechargerIndexPack(pack) {
  const lignes = pack.annexes.map(a =>
    `<tr><td style="border:0.5pt solid #ccc; padding:4pt;">${docxEchapper(a.composante)}</td>
         <td style="border:0.5pt solid #ccc; padding:4pt;">${docxEchapper(a.libelle)}</td>
         <td style="border:0.5pt solid #ccc; padding:4pt;">${docxEchapper(a.source || '')}</td>
         <td style="border:0.5pt solid #ccc; padding:4pt;">${docxEchapper(a.etatLisible)}</td></tr>`).join('');

  downloadWordDoc(
    `Index_pack_controle_${pack.date}.doc`,
    'Index du pack de contrôle',
    `<h1 style="font-size:17pt;">Index du pack de contrôle</h1>
     <p style="font-size:9.5pt; color:#666;">Arrêté le ${formatDateLong(pack.date)} à ${pack.heure}, par ${docxEchapper(pack.utilisateur)}.
     Manuel de procédures : ${docxEchapper(pack.manuel || 'aucune version publiée')}.</p>
     <p style="font-size:9.5pt; color:#666;">${pack.disponibles} pièces disponibles, ${pack.aCompleter} à compléter, ${pack.horsComplyEC} hors ComplyEC.
     Cet index est un instantané : il décrit l’état du cabinet à la date ci-dessus et n’est pas modifié par les travaux postérieurs.</p>
     <table style="border-collapse:collapse; width:100%; font-size:9.5pt;">
       <tr>
         <th style="border:0.5pt solid #ccc; padding:4pt; background:#EEF3FB; text-align:left;">Composante</th>
         <th style="border:0.5pt solid #ccc; padding:4pt; background:#EEF3FB; text-align:left;">Pièce</th>
         <th style="border:0.5pt solid #ccc; padding:4pt; background:#EEF3FB; text-align:left;">Fondement</th>
         <th style="border:0.5pt solid #ccc; padding:4pt; background:#EEF3FB; text-align:left;">État</th>
       </tr>
       ${lignes}
     </table>`
  );
}

/* ------------------------------------------- § 34 — Journal des validations

   Qui a validé quoi, et quand. Pas d'entrée dans la barre latérale : on n'y
   va pas pour travailler, on y va pour répondre à une question précise —
   « quand avez-vous arrêté cette cartographie ? ». */
function JournalValidations({ onBack }) {
  const lignes = dbJournal();

  const colonnes = [
    { code: 'date', titre: 'Date', valeur: j => j.horodatage || j.date, rendu: j => formatDate(j.date) },
    { code: 'utilisateur', titre: 'Par', valeur: j => j.utilisateur, rendu: j => j.utilisateur },
    { code: 'action', titre: 'Action', classe: 'table-name', valeur: j => j.action, rendu: j => j.action },
    { code: 'element', titre: 'Élément', valeur: j => j.element || '', rendu: j => j.element || '—' },
    { code: 'reference', titre: 'Référence', valeur: j => j.reference || '', rendu: j => j.reference || '—' },
  ];

  return h('div', { className: 'page' },
    h(EnteteHub, { titre: 'Journal des validations', onRetour: onBack }),
    h(FormSection, { icon: '📓', title: 'Ce qui a été validé', ton: 'gris', subtitle: String(lignes.length) },
      lignes.length
        ? h(TableauTrie, {
          colonnes, lignes, cle: j => j.id, parPage: 8,
          triDefaut: { col: 'date', sens: 'desc' },
          vide: 'Aucune validation enregistrée.',
        })
        : h('p', { className: 'conf-detail', style: { marginBottom: 0 } },
          'Aucune validation n’a encore été enregistrée. Le journal se remplit à mesure que vous validez une vigilance, publiez un manuel, arrêtez une cartographie ou modifiez un rôle clé.')
    )
  );
}
