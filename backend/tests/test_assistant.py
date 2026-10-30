import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings

client = TestClient(app)


def test_assistant_status():
    res = client.get("/api/v1/assistant/status")
    assert res.status_code == 200
    data = res.json()
    assert "configured" in data
    assert "model" in data
    assert data["model"] == settings.GEMINI_MODEL


def test_assistant_chat_general_and_coding():
    if not settings.GEMINI_API_KEY:
        pytest.skip("GEMINI_API_KEY not configured in environment.")

    # 1. General knowledge question
    payload = {
        "messages": [
            {"role": "user", "content": "What is the time complexity of binary search in one short sentence?"}
        ],
        "stream": False
    }
    res = client.post("/api/v1/assistant/chat", json=payload)
    if res.status_code in (503, 429):
        pytest.skip(f"Upstream Gemini API momentarily busy ({res.status_code}): {res.text}")
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["role"] == "assistant"
    assert "O(log n)" in data["content"] or "logarithmic" in data["content"].lower() or "binary" in data["content"].lower()

    # 2. Multi-turn coding & follow-up question
    multi_turn_payload = {
        "messages": [
            {"role": "user", "content": "I am working on Python. How do I sort a list of dicts by key 'age'?"},
            {"role": "assistant", "content": "You can use `sorted(data, key=lambda x: x['age'])`."},
            {"role": "user", "content": "How do I do the same in descending order?"}
        ],
        "stream": False
    }
    multi_res = client.post("/api/v1/assistant/chat", json=multi_turn_payload)
    if multi_res.status_code in (503, 429):
        pytest.skip(f"Upstream Gemini API momentarily busy ({multi_res.status_code}): {multi_res.text}")
    assert multi_res.status_code == 200, multi_res.text
    multi_data = multi_res.json()
    assert "reverse=True" in multi_data["content"] or "reverse = True" in multi_data["content"]


def test_assistant_empty_message_validation():
    res = client.post("/api/v1/assistant/chat", json={"messages": []})
    assert res.status_code == 422


def test_gemini_key_rotation_logic(monkeypatch):
    from app.services.gemini_service import GeminiService

    # Test settings key parsing
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "key_alpha, key_beta")
    monkeypatch.setattr(settings, "GEMINI_API_KEYS", "key_gamma; key_alpha\nkey_delta")
    keys = settings.gemini_keys
    # Should deduplicate and strip whitespace
    assert keys == ["key_gamma", "key_alpha", "key_delta", "key_beta"]

    # Test GeminiService rotation and cooldown
    svc = GeminiService()
    monkeypatch.setattr(settings, "GEMINI_API_KEYS", "k1, k2, k3")
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "")

    # Initial order should be k1, k2, k3
    assert svc.get_available_keys() == ["k1", "k2", "k3"]

    # Advance pointer
    svc.advance_key()
    assert svc.get_available_keys() == ["k2", "k3", "k1"]

    # Mark k2 rate-limited with cooldown
    svc.mark_key_rate_limited("k2", cooldown_seconds=30.0)
    # Available active keys should prioritize non-cooled keys
    available = svc.get_available_keys()
    assert available[0] in ("k3", "k1")
    assert "k2" in available  # Still present as fallback at the end

    # Test status endpoint with multiple keys
    res = client.get("/api/v1/assistant/status")
    assert res.status_code == 200
    data = res.json()
    assert data["key_count"] == 3
    assert data["rotation_enabled"] is True
