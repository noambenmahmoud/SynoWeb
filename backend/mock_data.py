"""Mock data for demo mode - lets users preview the app without a NAS connection."""
from datetime import datetime, timezone, timedelta

DEMO_PHOTOS = [
    {
        "id": "p1", "name": "Montagne au coucher du soleil.jpg", "type": "photo",
        "url": "https://images.unsplash.com/photo-1670180909157-78094afdad01?w=1600&q=85",
        "thumbnail": "https://images.unsplash.com/photo-1670180909157-78094afdad01?w=600&q=70",
        "size": 4_823_120, "modified": "2024-08-12T18:23:00Z", "folder": "/Photos/Vacances 2024",
        "width": 4000, "height": 2667,
    },
    {
        "id": "p2", "name": "Lac alpin.jpg", "type": "photo",
        "url": "https://images.unsplash.com/photo-1603611847484-f4009220576f?w=1600&q=85",
        "thumbnail": "https://images.unsplash.com/photo-1603611847484-f4009220576f?w=600&q=70",
        "size": 3_212_440, "modified": "2024-07-22T10:11:00Z", "folder": "/Photos/Vacances 2024",
        "width": 4000, "height": 6000,
    },
    {
        "id": "p3", "name": "Forêt brumeuse.jpg", "type": "photo",
        "url": "https://images.unsplash.com/photo-1681347189603-18318e629c75?w=1600&q=85",
        "thumbnail": "https://images.unsplash.com/photo-1681347189603-18318e629c75?w=600&q=70",
        "size": 5_120_900, "modified": "2024-06-15T07:48:00Z", "folder": "/Photos/Nature",
        "width": 4000, "height": 5500,
    },
    {
        "id": "p4", "name": "Sommet enneigé.jpg", "type": "photo",
        "url": "https://images.unsplash.com/photo-1659342618742-9158429c63a7?w=1600&q=85",
        "thumbnail": "https://images.unsplash.com/photo-1659342618742-9158429c63a7?w=600&q=70",
        "size": 4_009_200, "modified": "2024-02-04T14:32:00Z", "folder": "/Photos/Hiver",
        "width": 4000, "height": 2667,
    },
    {
        "id": "p5", "name": "Plage été.jpg", "type": "photo",
        "url": "https://images.unsplash.com/photo-1552249352-02a0817a2d95?w=1600&q=85",
        "thumbnail": "https://images.unsplash.com/photo-1552249352-02a0817a2d95?w=600&q=70",
        "size": 2_984_220, "modified": "2024-08-02T16:01:00Z", "folder": "/Photos/Vacances 2024",
        "width": 4000, "height": 2667,
    },
    {
        "id": "p6", "name": "Famille week-end.jpg", "type": "photo",
        "url": "https://images.unsplash.com/photo-1690187256229-e1fe4b82f9f6?w=1600&q=85",
        "thumbnail": "https://images.unsplash.com/photo-1690187256229-e1fe4b82f9f6?w=600&q=70",
        "size": 3_412_000, "modified": "2024-09-21T12:10:00Z", "folder": "/Photos/Famille",
        "width": 4000, "height": 5000,
    },
    {
        "id": "p7", "name": "Aurore boréale.jpg", "type": "photo",
        "url": "https://images.unsplash.com/photo-1483347756197-71ef80e95f73?w=1600&q=85",
        "thumbnail": "https://images.unsplash.com/photo-1483347756197-71ef80e95f73?w=600&q=70",
        "size": 6_120_440, "modified": "2023-12-28T22:12:00Z", "folder": "/Photos/Voyages",
        "width": 4000, "height": 2667,
    },
    {
        "id": "p8", "name": "Architecture moderne.jpg", "type": "photo",
        "url": "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1600&q=85",
        "thumbnail": "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=70",
        "size": 2_211_440, "modified": "2024-03-10T09:30:00Z", "folder": "/Photos/Urbain",
        "width": 4000, "height": 5000,
    },
    {
        "id": "p9", "name": "Café matin.jpg", "type": "photo",
        "url": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1600&q=85",
        "thumbnail": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=70",
        "size": 1_812_220, "modified": "2024-10-04T08:15:00Z", "folder": "/Photos/Quotidien",
        "width": 4000, "height": 2667,
    },
    {
        "id": "p10", "name": "Désert dunes.jpg", "type": "photo",
        "url": "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1600&q=85",
        "thumbnail": "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=600&q=70",
        "size": 4_801_010, "modified": "2024-04-18T17:45:00Z", "folder": "/Photos/Voyages",
        "width": 4000, "height": 2667,
    },
    {
        "id": "p11", "name": "Anniversaire enfant.jpg", "type": "photo",
        "url": "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=1600&q=85",
        "thumbnail": "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=600&q=70",
        "size": 3_012_300, "modified": "2024-05-22T15:00:00Z", "folder": "/Photos/Famille",
        "width": 4000, "height": 2667,
    },
    {
        "id": "p12", "name": "Rue parisienne.jpg", "type": "photo",
        "url": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1600&q=85",
        "thumbnail": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=70",
        "size": 2_540_120, "modified": "2024-01-12T11:20:00Z", "folder": "/Photos/Voyages",
        "width": 4000, "height": 2667,
    },
]

DEMO_VIDEOS = [
    {
        "id": "v1", "name": "Mariage Léa & Tom.mp4", "type": "video",
        "url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        "thumbnail": "https://images.unsplash.com/photo-1542105726-7982ea78fb59?w=600&q=70",
        "size": 218_440_220, "modified": "2024-06-08T19:00:00Z", "folder": "/Videos/Famille",
        "duration": 312,
    },
    {
        "id": "v2", "name": "Trek Pyrénées Jour 1.mov", "type": "video",
        "url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        "thumbnail": "https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&q=70",
        "size": 504_120_000, "modified": "2024-07-14T20:30:00Z", "folder": "/Videos/Voyages",
        "duration": 645,
    },
    {
        "id": "v3", "name": "Concert été.mp4", "type": "video",
        "url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        "thumbnail": "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&q=70",
        "size": 132_220_440, "modified": "2024-08-19T22:10:00Z", "folder": "/Videos/Évènements",
        "duration": 180,
    },
    {
        "id": "v4", "name": "Anniversaire Léo.mov", "type": "video",
        "url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
        "thumbnail": "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=600&q=70",
        "size": 88_440_120, "modified": "2024-09-01T16:00:00Z", "folder": "/Videos/Famille",
        "duration": 95,
    },
]

DEMO_DOCUMENTS = [
    {"id": "d1", "name": "Contrat location 2024.pdf", "type": "document", "ext": "pdf",
     "size": 1_242_320, "modified": "2024-09-12T10:00:00Z", "folder": "/Documents/Administratif"},
    {"id": "d2", "name": "Rapport annuel.pdf", "type": "document", "ext": "pdf",
     "size": 4_120_440, "modified": "2024-10-22T14:30:00Z", "folder": "/Documents/Travail"},
    {"id": "d3", "name": "Recettes famille.docx", "type": "document", "ext": "docx",
     "size": 320_120, "modified": "2024-04-08T19:00:00Z", "folder": "/Documents/Personnel"},
    {"id": "d4", "name": "Budget 2024.xlsx", "type": "document", "ext": "xlsx",
     "size": 220_440, "modified": "2024-01-05T08:30:00Z", "folder": "/Documents/Finances"},
    {"id": "d5", "name": "Présentation client.pptx", "type": "document", "ext": "pptx",
     "size": 8_120_220, "modified": "2024-11-02T11:45:00Z", "folder": "/Documents/Travail"},
    {"id": "d6", "name": "Notes lecture.md", "type": "document", "ext": "md",
     "size": 18_440, "modified": "2024-10-30T22:10:00Z", "folder": "/Documents/Personnel"},
    {"id": "d7", "name": "Facture électricité.pdf", "type": "document", "ext": "pdf",
     "size": 412_220, "modified": "2024-11-15T09:00:00Z", "folder": "/Documents/Administratif"},
    {"id": "d8", "name": "Plan voyage Italie.pdf", "type": "document", "ext": "pdf",
     "size": 2_412_330, "modified": "2024-05-30T17:20:00Z", "folder": "/Documents/Voyages"},
]

DEMO_FOLDERS = [
    {"path": "/Photos", "name": "Photos", "count": 12},
    {"path": "/Photos/Vacances 2024", "name": "Vacances 2024", "count": 3},
    {"path": "/Photos/Famille", "name": "Famille", "count": 2},
    {"path": "/Photos/Nature", "name": "Nature", "count": 1},
    {"path": "/Videos", "name": "Vidéos", "count": 4},
    {"path": "/Documents", "name": "Documents", "count": 8},
    {"path": "/Documents/Travail", "name": "Travail", "count": 2},
    {"path": "/Documents/Administratif", "name": "Administratif", "count": 2},
]

DEMO_STORAGE = {
    "total_bytes": 4_000_000_000_000,   # 4 TB
    "used_bytes": 1_823_440_000_000,    # 1.82 TB
    "available_bytes": 2_176_560_000_000,
    "volumes": [
        {"name": "volume1", "total": 4_000_000_000_000, "used": 1_823_440_000_000},
    ],
    "by_type": {
        "photos": 612_000_000_000,
        "videos": 980_000_000_000,
        "documents": 18_440_000_000,
        "other": 213_000_000_000,
    },
}


def all_files():
    return DEMO_PHOTOS + DEMO_VIDEOS + DEMO_DOCUMENTS
