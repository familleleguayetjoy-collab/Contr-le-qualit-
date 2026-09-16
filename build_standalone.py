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
    "data.js",
    "db.js",
    "anomalies.js",
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


css = read("styles.css")
scripts = "\n".join(bloc(p) for p in VENDOR + SOURCES)

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

print(f"ComplyEC.html regénéré — {len(html)} caractères")
