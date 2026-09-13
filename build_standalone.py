"""Assemble le fichier autonome ComplyEC.html à partir des sources.

Tout est incorporé — CSS, bibliothèques vendorisées, scripts — pour que le
fichier s'ouvre d'un double-clic, sans serveur ni accès réseau. C'est la
version qu'on remet au cabinet.

Usage : python3 build_standalone.py
"""

import os

# Le script vit dans le dépôt : il lit les sources à côté de lui, quel que soit
# l'endroit d'où on le lance.
ROOT = os.path.dirname(os.path.abspath(__file__))

def read(path):
    with open(f"{ROOT}/{path}", "r", encoding="utf-8") as f:
        return f.read()

css = read("styles.css")
react = read("vendor/js/react.production.min.js")
react_dom = read("vendor/js/react-dom.production.min.js")
supabase_lib = read("vendor/js/supabase.min.js")
xlsx_lib = read("vendor/js/xlsx.mini.min.js")
supabase_config = read("supabase-config.js")
docx_js = read("docx.js")
data_js = read("data.js")
db_js = read("db.js")
utils_js = read("utils.js")
patrons_js = read("patrons.js")
wizard_js = read("wizard.js")
ec_js = read("ec.js")
collab_js = read("collab.js")
app_js = read("app.js")
auth_js = read("auth.js")

# Scripts must never contain a literal "</script" sequence (would close the tag early).
def safe_js(js):
    return js.replace("</script", "<\\/script")

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

<script>
{safe_js(react)}
</script>
<script>
{safe_js(react_dom)}
</script>
<script>
{safe_js(supabase_lib)}
</script>
<script>
{safe_js(xlsx_lib)}
</script>
<script>
{safe_js(supabase_config)}
</script>

<script>
{safe_js(docx_js)}
</script>
<script>
{safe_js(data_js)}
</script>

<script>
{safe_js(db_js)}
</script>

<script>
{safe_js(utils_js)}
</script>
<script>
{safe_js(patrons_js)}
</script>
<script>
{safe_js(wizard_js)}
</script>
<script>
{safe_js(ec_js)}
</script>
<script>
{safe_js(collab_js)}
</script>
<script>
{safe_js(app_js)}
</script>

<script>
{safe_js(auth_js)}
</script>
</body>
</html>
"""

out_path = os.path.join(ROOT, "ComplyEC.html")
with open(out_path, "w", encoding="utf-8") as f:
    f.write(html)

print(f"ComplyEC.html regénéré — {len(html)} caractères")
