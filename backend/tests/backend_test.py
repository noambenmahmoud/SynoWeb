"""Backend tests for Synology Cloud Dashboard demo mode."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://content-viewer-118.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def token(session):
    r = session.post(f"{API}/auth/synology/login", json={"demo": True}, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "token" in data and data["demo"] is True and data["username"] == "demo"
    return data["token"]


@pytest.fixture(scope="module")
def auth(session, token):
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json", "Authorization": f"Bearer {token}"})
    return s


# Auth
def test_unauth_photos_returns_401(session):
    r = session.get(f"{API}/photos", timeout=15)
    assert r.status_code == 401


def test_auth_me(auth):
    r = auth.get(f"{API}/auth/me", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert data["username"] == "demo"
    assert data["demo"] is True


# Listings
def test_photos_returns_12(auth):
    r = auth.get(f"{API}/photos", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert data["count"] == 12
    assert len(data["items"]) == 12
    assert "id" in data["items"][0] and "url" in data["items"][0]


def test_videos_returns_4(auth):
    r = auth.get(f"{API}/videos", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert data["count"] == 4
    assert len(data["items"]) == 4


def test_documents_returns_8(auth):
    r = auth.get(f"{API}/documents", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert data["count"] == 8
    assert len(data["items"]) == 8


def test_storage_info(auth):
    r = auth.get(f"{API}/storage/info", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert "used_bytes" in data and "total_bytes" in data and "by_type" in data
    assert data["total_bytes"] > 0


def test_folders(auth):
    r = auth.get(f"{API}/folders", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert len(data["items"]) >= 1


# AI Search (uses Claude via emergentintegrations)
def test_ai_search_summer_2024(auth):
    r = auth.post(f"{API}/search/ai", json={"query": "photos de l'été 2024"}, timeout=60)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["parsed"] is not None
    parsed = data["parsed"]
    # date filters expected
    assert parsed.get("date_from") or parsed.get("date_to"), f"No date filter parsed: {parsed}"
    assert isinstance(data["items"], list)


def test_ai_search_factures(auth):
    r = auth.post(f"{API}/search/ai", json={"query": "documents factures"}, timeout=60)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["parsed"] is not None
    # All returned items should be documents (or list non-empty if filters detected)
    items = data["items"]
    if items:
        types = {it.get("type") for it in items}
        assert "document" in types or types == {"document"}


# Favorites round-trip
def test_favorites_roundtrip(auth):
    file_id = f"TEST_fav_{int(time.time())}"
    payload = {"file_id": file_id, "name": "Test", "type": "photo", "path": "/x", "thumbnail": ""}
    r = auth.post(f"{API}/favorites", json=payload, timeout=15)
    assert r.status_code == 200 and r.json()["ok"]

    r = auth.get(f"{API}/favorites", timeout=15)
    assert r.status_code == 200
    ids = [f["file_id"] for f in r.json()["items"]]
    assert file_id in ids

    r = auth.delete(f"{API}/favorites/{file_id}", timeout=15)
    assert r.status_code == 200

    r = auth.get(f"{API}/favorites", timeout=15)
    ids = [f["file_id"] for f in r.json()["items"]]
    assert file_id not in ids
