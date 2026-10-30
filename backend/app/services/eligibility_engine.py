from typing import Dict, Any, List, Tuple
from app.schemas.profile import ProfileResponseSchema, SkillItemSchema


class EligibilityEngine:
    """
    Deterministic rule-based eligibility evaluation engine.
    Independent of recommendation scores.
    """

    @staticmethod
    def evaluate(
        profile: Dict[str, Any],
        opportunity: Dict[str, Any],
        student_skills: List[str]
    ) -> Tuple[str, List[str], List[str]]:
        """
        Returns:
            status: 'Eligible' | 'Potentially eligible' | 'Not eligible'
            reasons: List of explanatory strings confirming satisfaction
            unmet_criteria: List of failing mandatory conditions
        """
        mandatory_reqs = opportunity.get("mandatory_requirements") or {}
        reasons: List[str] = []
        unmet_criteria: List[str] = []
        has_ambiguity: bool = False

        student_degree = (profile.get("degree") or "").strip().upper()
        student_grad_year = profile.get("graduation_year")
        student_acad_year = profile.get("academic_year") or 1

        # 1. Degree qualification check
        allowed_degrees = mandatory_reqs.get("degrees")
        if allowed_degrees:
            allowed_degrees_upper = [d.strip().upper() for d in allowed_degrees]
            # Normalization: e.g. BTECH and BE are often interchangeable in India
            degree_matched = False
            for ad in allowed_degrees_upper:
                if ad == student_degree or (student_degree in ["BTECH", "BE"] and ad in ["BTECH", "BE"]):
                    degree_matched = True
                    break

            if degree_matched:
                reasons.append(f"Degree '{profile.get('degree')}' meets educational requirement.")
            else:
                unmet_criteria.append(
                    f"Degree '{profile.get('degree')}' is not listed in required qualifications ({', '.join(allowed_degrees)})."
                )
        else:
            has_ambiguity = True

        # 2. Graduation Year check
        allowed_grad_years = mandatory_reqs.get("graduation_years")
        if allowed_grad_years and student_grad_year:
            if student_grad_year in allowed_grad_years:
                reasons.append(f"Graduation year {student_grad_year} matches eligible graduating batches.")
            else:
                unmet_criteria.append(
                    f"Graduation year {student_grad_year} does not match eligible batches ({', '.join(map(str, allowed_grad_years))})."
                )
        elif not allowed_grad_years:
            has_ambiguity = True

        # 3. Minimum Academic Year check
        min_acad_year = mandatory_reqs.get("min_academic_year")
        if min_acad_year is not None:
            if student_acad_year >= min_acad_year:
                reasons.append(f"Current academic year (Year {student_acad_year}) satisfies minimum requirement (Year {min_acad_year}+).")
            else:
                unmet_criteria.append(
                    f"Current academic year (Year {student_acad_year}) is below the required Year {min_acad_year}."
                )

        # 4. Mandatory Skills check
        mandatory_skills = mandatory_reqs.get("mandatory_skills") or []
        student_skills_lower = [s.strip().lower() for s in student_skills]

        missing_mand_skills = []
        for ms in mandatory_skills:
            ms_lower = ms.strip().lower()
            if ms_lower not in student_skills_lower:
                missing_mand_skills.append(ms)

        if missing_mand_skills:
            unmet_criteria.append(
                f"Missing mandatory prerequisite skills: {', '.join(missing_mand_skills)}."
            )
        elif mandatory_skills:
            reasons.append(f"Satisfies all {len(mandatory_skills)} mandatory prerequisite skills.")

        # Determine overall eligibility state
        if unmet_criteria:
            status = "Not eligible"
        elif has_ambiguity and not reasons:
            status = "Potentially eligible"
            reasons.append("Opportunity details do not specify rigid batch or degree constraints; you may apply if interested.")
        else:
            status = "Eligible"
            if not reasons:
                reasons.append("All stated requirements are satisfied.")

        return status, reasons, unmet_criteria
