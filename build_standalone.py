"""Assemble le fichier autonome ComplyEC.html à partir des sources.

Tout est incorporé — CSS, bibliothèques vendorisées, scripts — pour que le
fichier s'ouvre d'un double-clic, sans serveur ni accès réseau. C'est la
version qu'on remet au cabinet.

L'ordre des scripts est celui d'index.html, et il compte : `utils.js` construit
la table des sous-écrans valides à partir des onglets déclarés dans
`anomalies.js`, qui doit donc être chargé avant lui.

Usage : python3 build_standalone.py
"""

import os

# Le script vit dans le dépôt : il lit les sources à côté de lui, quel que soit
# l'endroit d'où on le lance.
ROOT = os.path.dirname(os.path.abspath(__file__))

VENDOR = [
    "vendor/js/react.production.min.js",
    "vendor/js/react-dom.production.min.js",
    "vendor/js/supabase.min.js",
    "vendor/js/xlsx.mini.min.js",
    "supabase-config.js",
]

# Une seule liste, dans l'ordre de chargement. Ajouter un écran, c'est ajouter
# une ligne ici et une dans index.html — et rien d'autre.
SOURCES = [
    "docx.js",
    "pdf.js",
    "data.js",
    "db.js",
    "partage.js",
    "anomalies.js",
    "semences.js",
    "regles.js",
    "synthese.js",
    "utils.js",
    "patrons.js",
    "wizard.js",
    "documents.js",
    "organisation.js",
    "lbcft.js",
    "qualite.js",
    "manuel.js",
    "accueil.js",
    "anomalies_ui.js",
    "controle.js",
    "parametres.js",
    "pilote.js",
    "regularisation.js",
    "ec.js",
    "collab.js",
    "app.js",
    "auth.js",
]


def read(path):
    with open(os.path.join(ROOT, path), "r", encoding="utf-8") as f:
        return f.read()


def safe_js(js):
    """Un script ne doit jamais contenir la suite « </script » : elle fermerait
    la balise en plein milieu du code."""
    return js.replace("</script", "<\\/script")


def bloc(path):
    return f"<script>\n{safe_js(read(path))}\n</script>"


def modeles_embarques():
    """Les modèles de lettre de mission, incorporés au fichier.

    Ouvert d'un double-clic, le fichier autonome est servi depuis le disque :
    le navigateur y interdit la lecture des fichiers voisins, et la génération
    de la lettre échouait avec « NetworkError when attempting to fetch
    resource ». Les modèles voyagent donc dans le fichier, encodés en base64,
    sous leur chemin relatif à « modeles/ » — celui que porte le catalogue."""
    import base64, json
    base = os.path.join(ROOT, "modeles")
    table = {}
    for dossier, _, fichiers in os.walk(base):
        for nom in sorted(fichiers):
            if not nom.lower().endswith(".docx"):
                continue
            chemin = os.path.join(dossier, nom)
            relatif = os.path.relpath(chemin, base).replace(os.sep, "/")
            with open(chemin, "rb") as f:
                table[relatif] = base64.b64encode(f.read()).decode("ascii")
    return "<script>\nwindow.MODELES_EMBARQUES = " + json.dumps(table, ensure_ascii=False) + ";\n</script>", len(table)


css = read("styles.css")
bloc_modeles, nb_modeles = modeles_embarques()
scripts = bloc_modeles + "\n" + "\n".join(bloc(p) for p in VENDOR + SOURCES)

html = f"""<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ComplyEC — Préparation au contrôle qualité</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🛡️</text></svg>">
<style>
{css}
</style>
</head>
<body>
<div id="root"></div>

{scripts}
</body>
</html>
"""

out_path = os.path.join(ROOT, "ComplyEC.html")
with open(out_path, "w", encoding="utf-8") as f:
    f.write(html)

print(f"ComplyEC.html regénéré — {len(html)} caractères, {nb_modeles} modèles de lettre incorporés")

# ---------------------------------------------------------------------------
# Publication en ligne (Netlify) — 30 octobre 2026
#
# Le dossier `publication/` est ce que Netlify met en ligne : le même fichier
# autonome, sous le nom index.html, et les en-têtes de sécurité. Netlify le
# republie à chaque mise à jour du dépôt (netlify.toml, à la racine) : le
# cabinet n'a rien à redéployer à la main pendant le pilote.
#
# Les en-têtes :
#   — Content-Security-Policy : la page ne parle qu'à la base du cabinet
#     (Supabase, dont l'adresse est lue dans supabase-config.js) et à
#     l'annuaire public des entreprises ; aucun script extérieur ;
#   — pas d'affichage dans un cadre d'un autre site (frame-ancestors) ;
#   — pas d'indexation par les moteurs de recherche ;
#   — aucune information de provenance envoyée aux sites ouverts depuis
#     ComplyEC (registres, Légifrance).
import re
config = read("supabase-config.js")
m = re.search(r"SUPABASE_URL\s*=\s*'(https://[^']+)'", config)
supabase_https = m.group(1).rstrip("/") if m else ""
supabase_wss = supabase_https.replace("https://", "wss://")
connect = " ".join(x for x in ["'self'", supabase_https, supabase_wss, "https://recherche-entreprises.api.gouv.fr"] if x)
csp = ("default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; "
       "img-src 'self' data: blob:; font-src 'self' data:; "
       f"connect-src {connect}; "
       "object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'")
entetes = f"""/*
  Content-Security-Policy: {csp}
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  X-Robots-Tag: noindex, nofollow
  Cache-Control: no-cache
"""
pub = os.path.join(ROOT, "publication")
os.makedirs(pub, exist_ok=True)
with open(os.path.join(pub, "index.html"), "w", encoding="utf-8") as f:
    f.write(html)
with open(os.path.join(pub, "_headers"), "w", encoding="utf-8") as f:
    f.write(entetes)
with open(os.path.join(pub, "robots.txt"), "w", encoding="utf-8") as f:
    f.write("User-agent: *\nDisallow: /\n")
print("publication/ regénérée — index.html, _headers, robots.txt")
