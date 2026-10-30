import pytest
from app.services.eligibility_engine import EligibilityEngine


def test_eligible_student():
    profile = {
        "degree": "BTech",
        "graduation_year": 2027,
        "academic_year": 3
    }
    opportunity = {
        "mandatory_requirements": {
            "degrees": ["BTech", "BE"],
            "graduation_years": [2026, 2027],
            "min_academic_year": 2,
            "mandatory_skills": ["Python"]
        }
    }
    student_skills = ["Python", "DSA"]

    status, reasons, unmet = EligibilityEngine.evaluate(profile, opportunity, student_skills)
    assert status == "Eligible"
    assert len(unmet) == 0
    assert len(reasons) >= 3


def test_ineligible_wrong_graduation_year():
    profile = {
        "degree": "BTech",
        "graduation_year": 2025,
        "academic_year": 4
    }
    opportunity = {
        "mandatory_requirements": {
            "degrees": ["BTech"],
            "graduation_years": [2026, 2027],
            "mandatory_skills": []
        }
    }
    student_skills = ["Python"]

    status, reasons, unmet = EligibilityEngine.evaluate(profile, opportunity, student_skills)
    assert status == "Not eligible"
    assert any("Graduation year 2025" in u for u in unmet)


def test_ineligible_missing_mandatory_skill():
    profile = {
        "degree": "BTech",
        "graduation_year": 2027,
        "academic_year": 3
    }
    opportunity = {
        "mandatory_requirements": {
            "degrees": ["BTech"],
            "graduation_years": [2027],
            "mandatory_skills": ["Computer Networks", "Linux"]
        }
    }
    student_skills = ["Python", "DSA"]

    status, reasons, unmet = EligibilityEngine.evaluate(profile, opportunity, student_skills)
    assert status == "Not eligible"
    assert any("Computer Networks" in u for u in unmet)


def test_potentially_eligible_unspecified_criteria():
    profile = {
        "degree": "BSc",
        "graduation_year": 2026,
        "academic_year": 2
    }
    opportunity = {
        "mandatory_requirements": {}
    }
    student_skills = ["Python"]

    status, reasons, unmet = EligibilityEngine.evaluate(profile, opportunity, student_skills)
    assert status == "Potentially eligible"
    assert len(unmet) == 0
