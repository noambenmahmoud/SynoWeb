# Synology Cloud Dashboard – PRD

## Original problem statement
> "je veux une interface graphique qui présente mes donées hebergées sur ma synology - photos - video - documents. une interface friendly"

## User choices (gathered 2026-02-08)
- Connection: real Synology DSM API (NAS URL + DSM username/password)
- Photo gallery
- Integrated video player
- AI-powered natural-language search
- User-friendly file organization
- Visual style: modern & clean ("moderne et épuré")
- Language: French

## Architecture
- **Backend**: FastAPI (Python). Async Synology DSM client (httpx). emergentintegrations + Claude Sonnet 4.5 for AI search query parsing. MongoDB for favorites only. In-memory session store.
- **Frontend**: React 19 + Tailwind + shadcn/ui (.js). Outfit/Manrope fonts. Light slate theme with glassmorphism on the topbar. Lucide icons.

## What's been implemented (2026-02-08)
- [x] Login page with demo mode + NAS connection form
- [x] AuthContext + protected routes
- [x] Sidebar (Accueil, Photos, Vidéos, Documents, Favoris, Dossiers)
- [x] Glassmorphic topbar with AI search
- [x] Dashboard: storage stats (used/total/by type), counters, recent photos, recent docs
- [x] Photos page: masonry grid + Lightbox (download + favorite)
- [x] Videos page: tile grid + inline `<video>` player modal
- [x] Documents page: list view, filter, color-coded file icons
- [x] Favorites: persisted in MongoDB
- [x] Folders: list shares
- [x] AI Search page: parses natural language → filters & summary chip banner
- [x] Backend Synology client: login/logout, list_share, list, search, thumb_url, stream_download (Range supported)
- [x] Demo data: 12 photos, 4 videos, 8 documents, storage info

## What is mocked
- The **demo mode** uses MOCKED data (curated Unsplash photos and Google sample videos). Real NAS mode talks to the DSM API.
- Storage usage values for real NAS sessions are also currently MOCKED (Synology Core.System.info is permission-restricted in many setups).

## Backlog
### P0
- Real-NAS thumbnails: add Authorization-aware proxying (currently uses redirect to DSM URL with `_sid` — works but exposes SID briefly).
### P1
- Folder browsing inside Photos / Videos / Documents (deep navigation into NAS subfolders).
- Real per-volume storage info via `SYNO.Core.Storage.Volume`.
- Resumable download endpoint with proper Content-Disposition.
### P2
- Drag-and-drop upload.
- Sharing links (Synology FileStation Sharing API).
- PWA support, offline favorites preview.

## Next tasks
1. Run testing agent against the demo mode end-to-end.
2. After user provides NAS access, validate real-NAS code path live.
