# SynoCloud Desktop

Une application **desktop autonome** (Windows / macOS / Linux) pour parcourir votre NAS Synology — photos, vidéos, documents — avec recherche IA et affiches TMDB. Aucun service externe à installer.

## Architecture

| Composant            | Rôle                                                    |
|----------------------|---------------------------------------------------------|
| `desktop/main.py`    | Lance FastAPI sur `127.0.0.1:<port>` + fenêtre pywebview |
| `backend/server.py`  | Mêmes endpoints que la version cloud                    |
| `frontend/build/`    | App React compilée, servie par FastAPI                  |
| `~/.synocloud/`      | Données utilisateur (favoris en JSON, cache TMDB)       |

## Prérequis (uniquement pour la compilation)

- **Python 3.11+**
- **Node.js 18+** + **Yarn** (pour builder le frontend)
- **ffmpeg** (optionnel — pour le mode transcodage HLS si vous voulez le réactiver)
- Sur **Windows** : Microsoft Edge WebView2 Runtime (préinstallé sur Win10/11)
- Sur **macOS** : rien de spécial (WKWebView intégré)
- Sur **Linux** : `apt install python3-gi gir1.2-webkit2-4.0` (GTK + WebKit)

## Installation locale (mode développement)

```bash
# 1. Cloner le repo
git clone <votre-repo> synocloud
cd synocloud

# 2. Backend deps
pip install -r backend/requirements.txt
pip install -r desktop/requirements-desktop.txt

# 3. Frontend deps + build (REACT_APP_BACKEND_URL doit être vide)
cd frontend
cp .env.production.example .env.production
yarn install
yarn build
cd ..

# 4. Renseignez vos tokens (optionnel mais recommandé)
cp desktop/.env.example backend/.env
# Éditez backend/.env : ajoutez TMDB_TOKEN et EMERGENT_LLM_KEY

# 5. Lancer l'app
python desktop/main.py
```

L'app s'ouvre dans une fenêtre native. Connectez-vous à votre NAS via :
- l'IP locale `https://192.168.x.x:5001` (recommandé en local — plus rapide que QuickConnect)
- ou votre URL DDNS Synology
- ou QuickConnect comme dans la version cloud

## Compilation en exécutable

```bash
# Toujours depuis la racine du projet
python desktop/build.py
```

PyInstaller produit `dist/SynoCloud/` :

| OS       | Exécutable                                  |
|----------|---------------------------------------------|
| Windows  | `dist/SynoCloud/SynoCloud.exe`              |
| macOS    | `dist/SynoCloud.app`                        |
| Linux    | `dist/SynoCloud/SynoCloud`                  |

Vous pouvez zipper `dist/SynoCloud/` et le distribuer tel quel — il contient Python, FastAPI et toutes les dépendances embarquées.

## Configuration

Au premier lancement, l'app crée `~/.synocloud/` avec :
- `favorites.json` — vos favoris (remplace MongoDB)
- `tmdb_cache/` — cache des affiches TMDB

Pour les **clés API** (TMDB, Claude/Emergent), deux options :
1. **Embarquées** : créez `backend/.env` avant la compilation, elles seront incluses dans l'exécutable
2. **Externes** : créez un `.env` à côté de l'exécutable, `python-dotenv` le chargera au démarrage

## Différences vs version cloud

| Sujet              | Cloud (Emergent)                | Desktop                              |
|--------------------|---------------------------------|--------------------------------------|
| Stockage favoris   | MongoDB                         | JSON (`~/.synocloud/favorites.json`) |
| Frontend           | Servi par Vercel/Emergent       | Servi par FastAPI sur `127.0.0.1`   |
| LLM                | `EMERGENT_LLM_KEY` (universel)  | Clé Anthropic/OpenAI directe        |
| QuickConnect       | Oui (relay public)              | Oui, mais IP locale recommandée     |
| HLS transcodage    | Désactivé côté UI               | Code présent — réactivable          |

## Réactiver le mode transcodage HLS (audio AC3/DTS)

Le code `backend/hls.py` est toujours présent. Pour réactiver le bouton "Mode amélioré" :
1. Installez ffmpeg et ajoutez-le au PATH
2. Décommentez/restaurez les boutons HLS dans `frontend/src/components/VideoPlayer.jsx`

## Dépannage

| Problème                            | Solution                                                |
|-------------------------------------|----------------------------------------------------------|
| "ffmpeg not found"                  | `winget install ffmpeg` (Win) ou `brew install ffmpeg`  |
| Fenêtre blanche au démarrage        | Vérifiez que `frontend/build/index.html` existe         |
| 401 sur tous les endpoints          | Reconnectez-vous (la session est en mémoire)            |
| Exe Windows refusé par SmartScreen  | Signez le binaire ou cliquez "Plus d'infos > Exécuter"  |
