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
