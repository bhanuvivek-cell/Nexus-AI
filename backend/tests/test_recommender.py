import pytest
from unittest.mock import patch
import numpy as np
from app.services.ai_recommender import recommender, normalize_skill


def test_alias_normalization():
    assert normalize_skill("dsa") == "Data Structures & Algorithms"
    assert normalize_skill("ml") == "Machine Learning"
    assert normalize_skill("py") == "Python"
    assert normalize_skill("k8s") == "Kubernetes"
    assert normalize_skill("reactjs") == "React"


def test_skill_match_scoring():
    student_skills = ["Python", "dsa", "Git & GitHub"]
    mandatory = ["Python", "Data Structures & Algorithms"]
    preferred = ["Docker", "Kubernetes"]

    K, matched, missing = recommender.compute_skill_match_K(
        student_skills=student_skills,
        mandatory_skills=mandatory,
        preferred_skills=preferred
    )

    # 100% of mandatory matched (K_mand = 100), 0% of preferred matched (K_pref = 0)
    # K = 0.70 * 100 + 0.30 * 0 = 70.0
    assert K == 70.0
    assert "Python" in matched
    assert "Data Structures & Algorithms" in matched
    assert "Docker" in missing


def test_recommendation_ranking_formula():
    profile = {
        "degree": "BTech",
        "branch": "Computer Science",
        "career_interests": ["Software Engineering", "AI/ML"],
        "opportunity_preferences": {
            "preferred_types": ["internship"],
            "work_mode": "hybrid",
            "stipend_preference": "flexible",
            "preferred_locations": ["Bengaluru"]
        },
        "learning_goals": ["Docker"]
    }

    opportunity = {
        "title": "Software Engineering Intern",
        "provider": "Cisco Systems",
        "opportunity_type": "internship",
        "description": "Cisco India internship focusing on networking and software development.",
        "location": "Bengaluru",
        "work_mode": "hybrid",
        "stipend_amount": 65000,
        "preferred_qualifications": {
            "preferred_interests": ["Software Engineering"]
        }
    }

    student_skills = ["Python", "Data Structures & Algorithms"]
    mandatory_skills = ["Python"]
    preferred_skills = ["Docker"]

    # Mock get_embedding for deterministic, instant test execution without network dependency
    dummy_vec = np.ones(384, dtype=np.float32) / np.sqrt(384)
    with patch.object(recommender, 'get_embedding', return_value=dummy_vec):
        result = recommender.rank_opportunity(
            profile=profile,
            opportunity=opportunity,
            student_skills=student_skills,
            mandatory_skills=mandatory_skills,
            preferred_skills=preferred_skills
        )

        assert "overall_score" in result
        assert "components" in result
        c = result["components"]
        assert 0 <= c["skill_match_K"] <= 100
        assert 0 <= c["semantic_relevance_M"] <= 100
        assert 0 <= c["interest_match_I"] <= 100
        assert 0 <= c["preference_match_P"] <= 100
        assert 0 <= c["goal_alignment_G"] <= 100

        # Verify formula S = 0.35K + 0.25M + 0.15I + 0.15P + 0.10G
        expected_S = round(
            0.35 * c["skill_match_K"] +
            0.25 * c["semantic_relevance_M"] +
            0.15 * c["interest_match_I"] +
            0.15 * c["preference_match_P"] +
            0.10 * c["goal_alignment_G"],
            1
        )
        assert abs(result["overall_score"] - expected_S) < 0.2
