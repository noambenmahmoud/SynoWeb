"""AI-powered natural language search using Claude Sonnet 4.5 via emergentintegrations."""
from __future__ import annotations

import json
import os
import re
import uuid
from typing import Optional

from emergentintegrations.llm.chat import LlmChat, UserMessage


SYSTEM_PROMPT = """Tu es un assistant qui transforme une requête utilisateur en français ou en anglais en filtres structurés pour rechercher des fichiers (photos, vidéos, documents) sur un NAS Synology.

Réponds UNIQUEMENT avec un objet JSON valide (sans backticks, sans markdown, sans explication) ayant exactement cette forme :
{
  "types": ["photo" | "video" | "document"],
  "keywords": [string, ...],
  "folder_hint": string | null,
  "date_from": "YYYY-MM-DD" | null,
  "date_to": "YYYY-MM-DD" | null,
  "summary": string
}

Règles :
- "types" : liste les types pertinents. Si l'utilisateur ne précise pas, mets ["photo","video","document"].
- "keywords" : 1 à 6 mots-clés extraits (sans stopwords), en minuscules, en français quand l'entrée est en français.
- "folder_hint" : nom de dossier probable si l'utilisateur évoque un thème ("vacances", "famille", "travail"...), sinon null.
- "date_from"/"date_to" : convertis les notions de date (ex: "été 2024" => 2024-06-01 / 2024-09-30 ; "le mois dernier" => calcul relatif au 2026-02-15).
- "summary" : phrase courte en français résumant la recherche.
Aucun autre champ. Pas de texte hors JSON.
"""


def _extract_json(text: str) -> dict:
    text = text.strip()
    # Remove fenced code blocks if any
    fence = re.search(r"```(?:json)?\s*(.*?)```", text, re.DOTALL)
    if fence:
        text = fence.group(1).strip()
    try:
        return json.loads(text)
    except Exception:
        # try to find first { ... }
        m = re.search(r"\{.*\}", text, re.DOTALL)
        if m:
            try:
                return json.loads(m.group(0))
            except Exception:
                pass
    return {}


async def parse_query(query: str) -> dict:
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        return _fallback(query)
    chat = LlmChat(
        api_key=api_key,
        session_id=f"search-{uuid.uuid4()}",
        system_message=SYSTEM_PROMPT,
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")
    try:
        response = await chat.send_message(UserMessage(text=query))
    except Exception:
        return _fallback(query)
    parsed = _extract_json(response or "")
    if not parsed:
        return _fallback(query)
    # Sanitize
    parsed.setdefault("types", ["photo", "video", "document"])
    parsed.setdefault("keywords", [])
    parsed.setdefault("folder_hint", None)
    parsed.setdefault("date_from", None)
    parsed.setdefault("date_to", None)
    parsed.setdefault("summary", query)
    return parsed


def _fallback(query: str) -> dict:
    words = [w.lower() for w in re.findall(r"\w{3,}", query, re.UNICODE)]
    return {
        "types": ["photo", "video", "document"],
        "keywords": words[:6],
        "folder_hint": None,
        "date_from": None,
        "date_to": None,
        "summary": query,
    }
