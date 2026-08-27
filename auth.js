// ComplyEC — Authentification (Supabase Auth + table profiles)
'use strict';

// Un lien d'invitation collaborateur déclenche l'événement 'SIGNED_IN' — pas
// 'PASSWORD_RECOVERY' — puisque son paramètre `type` vaut 'invite' et non
// 'recovery' (vérifié dans le client @supabase/supabase-js utilisé par
// l'app : seul `type === 'recovery'` produit PASSWORD_RECOVERY, tout le
// reste, invite compris, produit SIGNED_IN). Sans ce repérage, un
// collaborateur invité atterrirait directement dans l'application sans
// jamais définir de mot de passe, et ne pourrait plus se reconnecter ensuite.
// Capturé au chargement du script, avant que le SDK ne nettoie l'URL.
let pendingInviteOrRecoveryLink = /[#?].*\btype=(invite|recovery)\b/.test(window.location.href);

// -------------------------------------------------------------- Auth gate

function AuthGate() {
  const [status, setStatus] = useState('loading'); // loading | signed-out | needs-cabinet | ready
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // login | signup | forgot | set-password

  async function loadProfile(sess) {
    const { data, error } = await supabaseClient.from('profiles').select('*').eq('id', sess.user.id).maybeSingle();
    if (error) { console.error(error); setStatus('signed-out'); return; }
    if (data) { setProfile(data); setStatus('ready'); }
    else { setStatus('needs-cabinet'); }
  }

  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data }) => {
      if (data.session) { setSession(data.session); loadProfile(data.session); }
      else setStatus('signed-out');
    });
    const { data: sub } = supabaseClient.auth.onAuthStateChange((event, sess) => {
      setSession(sess);
      const isInviteOrRecovery = event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && pendingInviteOrRecoveryLink);
      if (isInviteOrRecovery) {
        pendingInviteOrRecoveryLink = false;
        setAuthMode('set-password'); setStatus('signed-out'); return;
      }
      if (sess) loadProfile(sess);
      else { setProfile(null); setStatus('signed-out'); }
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line
  }, []);

  async function handleSignOut() {
    await supabaseClient.auth.signOut();
    setProfile(null);
    setAuthMode('login');
    setStatus('signed-out');
  }

  if (status === 'loading') {
    return h('div', { className: 'auth-screen' }, h('div', { className: 'auth-spinner' }));
  }

  if (status === 'ready' && profile) {
    return h(App, { authProfile: profile, onSignOut: handleSignOut });
  }

  if (status === 'needs-cabinet') {
    return h(CreateCabinetScreen, { session, onDone: () => loadProfile(session) });
  }

  if (authMode === 'set-password') {
    // La session (invitation ou récupération) est déjà active à ce stade :
    // on recharge directement le profil plutôt que de forcer une reconnexion.
    return h(SetPasswordScreen, { onDone: () => { setAuthMode('login'); if (session) loadProfile(session); else setStatus('signed-out'); } });
  }
  if (authMode === 'signup') return h(SignUpScreen, { onBack: () => setAuthMode('login') });
  if (authMode === 'forgot') return h(ForgotPasswordScreen, { onBack: () => setAuthMode('login') });
  return h(LoginScreen, { onSignUp: () => setAuthMode('signup'), onForgot: () => setAuthMode('forgot') });
}

// -------------------------------------------------------------- Shared bits

function AuthShell({ title, hint, children }) {
  return h('div', { className: 'auth-screen' },
    h('div', { className: 'auth-card' },
      h('div', { className: 'auth-logo' }, h('span', { className: 'logo-mark' }, '🛡️'), 'ComplyEC'),
      h('h1', { className: 'auth-title' }, title),
      hint ? h('p', { className: 'auth-hint' }, hint) : null,
      children
    )
  );
}

// -------------------------------------------------------------- Login

function LoginScreen({ onSignUp, onForgot }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError(null); setLoading(true);
    const { error: err } = await supabaseClient.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) setError(err.message === 'Invalid login credentials' ? 'E-mail ou mot de passe incorrect.' : err.message);
  }

  return h(AuthShell, { title: 'Connexion' },
    h('form', { className: 'auth-form', onSubmit: submit },
      h('label', { className: 'auth-field' }, 'E-mail', h('input', { type: 'email', required: true, value: email, onChange: e => setEmail(e.target.value), autoFocus: true })),
      h('label', { className: 'auth-field' }, 'Mot de passe', h('input', { type: 'password', required: true, value: password, onChange: e => setPassword(e.target.value) })),
      error ? h('div', { className: 'auth-error' }, error) : null,
      h('button', { type: 'submit', className: 'btn btn-primary btn-block', disabled: loading }, loading ? 'Connexion…' : 'Se connecter')
    ),
    h('div', { className: 'auth-links' },
      h('button', { type: 'button', className: 'auth-link', onClick: onForgot }, 'Mot de passe oublié ?'),
      h('button', { type: 'button', className: 'auth-link', onClick: onSignUp }, 'Créer votre cabinet →')
    )
  );
}

// -------------------------------------------------------------- Mot de passe oublié

function ForgotPasswordScreen({ onBack }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError(null); setLoading(true);
    const { error: err } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + window.location.pathname });
    setLoading(false);
    if (err) setError(err.message); else setSent(true);
  }

  if (sent) {
    return h(AuthShell, { title: 'E-mail envoyé', hint: `Un lien de réinitialisation a été envoyé à ${email}. Suivez-le pour choisir un nouveau mot de passe.` },
      h('div', { className: 'auth-links' }, h('button', { type: 'button', className: 'auth-link', onClick: onBack }, '← Retour à la connexion'))
    );
  }

  return h(AuthShell, { title: 'Mot de passe oublié' },
    h('form', { className: 'auth-form', onSubmit: submit },
      h('label', { className: 'auth-field' }, 'E-mail', h('input', { type: 'email', required: true, value: email, onChange: e => setEmail(e.target.value), autoFocus: true })),
      error ? h('div', { className: 'auth-error' }, error) : null,
      h('button', { type: 'submit', className: 'btn btn-primary btn-block', disabled: loading }, loading ? 'Envoi…' : 'Envoyer le lien')
    ),
    h('div', { className: 'auth-links' }, h('button', { type: 'button', className: 'auth-link', onClick: onBack }, '← Retour à la connexion'))
  );
}

// -------------------------------------------------------------- Définir le mot de passe
// (arrivée depuis un lien d'invitation ou de réinitialisation)

function SetPasswordScreen({ onDone }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return; }
    if (password !== confirm) { setError('Les deux mots de passe ne correspondent pas.'); return; }
    setError(null); setLoading(true);
    const { error: err } = await supabaseClient.auth.updateUser({ password });
    setLoading(false);
    if (err) setError(err.message); else onDone();
  }

  return h(AuthShell, { title: 'Définissez votre mot de passe', hint: 'Dernière étape avant d’accéder à votre espace.' },
    h('form', { className: 'auth-form', onSubmit: submit },
      h('label', { className: 'auth-field' }, 'Nouveau mot de passe', h('input', { type: 'password', required: true, value: password, onChange: e => setPassword(e.target.value), autoFocus: true })),
      h('label', { className: 'auth-field' }, 'Confirmer le mot de passe', h('input', { type: 'password', required: true, value: confirm, onChange: e => setConfirm(e.target.value) })),
      error ? h('div', { className: 'auth-error' }, error) : null,
      h('button', { type: 'submit', className: 'btn btn-primary btn-block', disabled: loading }, loading ? 'Enregistrement…' : 'Valider et accéder à mon espace')
    )
  );
}

// -------------------------------------------------------------- Créer son compte (bootstrap EC)

function SignUpScreen({ onBack }) {
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return; }
    setError(null); setLoading(true);
    const { data, error: err } = await supabaseClient.auth.signUp({ email, password, options: { data: { prenom, nom } } });
    setLoading(false);
    if (err) { setError(err.message); return; }
    if (!data.session) { setConfirmSent(true); return; }
    // Session immédiate (confirmation e-mail désactivée sur le projet) :
    // AuthGate détecte tout seul l'absence de fiche "profiles" et affiche
    // CreateCabinetScreen au prochain rendu.
  }

  if (confirmSent) {
    return h(AuthShell, { title: 'Vérifiez votre boîte mail', hint: `Un e-mail de confirmation a été envoyé à ${email}. Cliquez sur le lien qu’il contient, puis reconnectez-vous ici.` },
      h('div', { className: 'auth-links' }, h('button', { type: 'button', className: 'auth-link', onClick: onBack }, '← Retour à la connexion'))
    );
  }

  return h(AuthShell, { title: 'Créer votre cabinet', hint: 'Réservé au premier compte expert-comptable du cabinet — les collaborateurs sont ensuite invités depuis « Mon équipe ».' },
    h('form', { className: 'auth-form', onSubmit: submit },
      h('div', { className: 'auth-field-row' },
        h('label', { className: 'auth-field' }, 'Prénom', h('input', { required: true, value: prenom, onChange: e => setPrenom(e.target.value), autoFocus: true })),
        h('label', { className: 'auth-field' }, 'Nom', h('input', { required: true, value: nom, onChange: e => setNom(e.target.value) }))
      ),
      h('label', { className: 'auth-field' }, 'E-mail', h('input', { type: 'email', required: true, value: email, onChange: e => setEmail(e.target.value) })),
      h('label', { className: 'auth-field' }, 'Mot de passe', h('input', { type: 'password', required: true, value: password, onChange: e => setPassword(e.target.value) })),
      error ? h('div', { className: 'auth-error' }, error) : null,
      h('button', { type: 'submit', className: 'btn btn-primary btn-block', disabled: loading }, loading ? 'Création…' : 'Créer mon compte')
    ),
    h('div', { className: 'auth-links' }, h('button', { type: 'button', className: 'auth-link', onClick: onBack }, '← Retour à la connexion'))
  );
}

// -------------------------------------------------------------- Créer le cabinet (bootstrap, étape 2)

function CreateCabinetScreen({ session, onDone }) {
  const meta = (session && session.user && session.user.user_metadata) || {};
  const [cabinetNom, setCabinetNom] = useState('');
  const [prenom, setPrenom] = useState(meta.prenom || '');
  const [nom, setNom] = useState(meta.nom || '');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError(null); setLoading(true);
    // L'id du cabinet est généré côté client (et non lu en retour via
    // .select()) : juste après l'insertion, l'utilisateur n'a encore aucune
    // fiche "profiles", donc la policy RLS de lecture des cabinets (qui
    // s'appuie sur le cabinet du profil) ne peut pas encore l'autoriser à
    // relire la ligne qu'il vient de créer — Postgres refuse alors tout
    // INSERT ... RETURNING dans ce cas et annule l'insertion entière.
    const cabinetId = crypto.randomUUID();
    const { error: cabErr } = await supabaseClient.from('cabinets').insert({ id: cabinetId, nom: cabinetNom });
    if (cabErr) { setLoading(false); setError(cabErr.message); return; }
    const { error: profErr } = await supabaseClient.from('profiles').insert({
      id: session.user.id, cabinet_id: cabinetId, role: 'expert_comptable', nom, prenom, email: session.user.email,
    });
    setLoading(false);
    if (profErr) { setError(profErr.message); return; }
    onDone();
  }

  return h(AuthShell, { title: 'Dernière étape', hint: 'Donnez un nom à votre cabinet pour terminer la création de votre compte.' },
    h('form', { className: 'auth-form', onSubmit: submit },
      h('label', { className: 'auth-field' }, 'Nom du cabinet', h('input', { required: true, value: cabinetNom, onChange: e => setCabinetNom(e.target.value), autoFocus: true })),
      h('div', { className: 'auth-field-row' },
        h('label', { className: 'auth-field' }, 'Prénom', h('input', { required: true, value: prenom, onChange: e => setPrenom(e.target.value) })),
        h('label', { className: 'auth-field' }, 'Nom', h('input', { required: true, value: nom, onChange: e => setNom(e.target.value) }))
      ),
      error ? h('div', { className: 'auth-error' }, error) : null,
      h('button', { type: 'submit', className: 'btn btn-primary btn-block', disabled: loading }, loading ? 'Création…' : 'Créer le cabinet et continuer')
    )
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(h(ErrorBoundary, null, h(AuthGate)));
