# Nexus AI — Recommendation & Eligibility Engine Specification

---

## 1. Mathematical Formulation

$$S = 0.35K + 0.25M + 0.15I + 0.15P + 0.10G$$

Where:
- $S \in [0, 100]$: The composite recommendation score.
- $K \in [0, 100]$: Structured skill match.
- $M \in [0, 100]$: Semantic relevance via sentence embeddings.
- $I \in [0, 100]$: Career interest alignment.
- $P \in [0, 100]$: Opportunity preference match (work mode, type, location, stipend).
- $G \in [0, 100]$: Goal synergy score (alignment with student's active learning goals).

---

## 2. Component Calculations

### 2.1 Structured Skill Match ($K$)
Given the student's normalized skill set $\mathcal{S}_{student}$, and the opportunity's required skills partitioned into mandatory ($\mathcal{S}_{mand}$) and preferred ($\mathcal{S}_{pref}$):

$$K_{mand} = \begin{cases} 100 & \text{if } |\mathcal{S}_{mand}| = 0 \\ \frac{|\mathcal{S}_{student} \cap \mathcal{S}_{mand}|}{|\mathcal{S}_{mand}|} \times 100 & \text{otherwise} \end{cases}$$

$$K_{pref} = \begin{cases} 100 & \text{if } |\mathcal{S}_{pref}| = 0 \\ \frac{|\mathcal{S}_{student} \cap \mathcal{S}_{pref}|}{|\mathcal{S}_{pref}|} \times 100 & \text{otherwise} \end{cases}$$

$$K = 0.70 \times K_{mand} + 0.30 \times K_{pref}$$

*Skill Alias Normalization:* Common abbreviations (e.g. `ML` $\rightarrow$ `Machine Learning`, `JS` $\rightarrow$ `JavaScript`, `TS` $\rightarrow$ `TypeScript`, `K8s` $\rightarrow$ `Kubernetes`, `DSA` $\rightarrow$ `Data Structures & Algorithms`) are resolved to canonical names before intersection.

### 2.2 Semantic Relevance ($M$)
Using Sentence Transformers with model `all-MiniLM-L6-v2`:
- Student profile text $\mathbf{t}_s$: Synthesized string of degree, branch, current skills with proficiencies, career interests, and goals.
- Opportunity text $\mathbf{t}_o$: Synthesized string of title, provider, opportunity type, description, and qualifications.
- Embeddings $\mathbf{e}_s = \text{Embed}(\mathbf{t}_s), \mathbf{e}_o = \text{Embed}(\mathbf{t}_o) \in \mathbb{R}^{384}$.
- Cosine Similarity:
$$\cos(\mathbf{e}_s, \mathbf{e}_o) = \frac{\mathbf{e}_s \cdot \mathbf{e}_o}{\|\mathbf{e}_s\|_2 \|\mathbf{e}_o\|_2}$$
- Transformed Score:
$$M = \max(0, \cos(\mathbf{e}_s, \mathbf{e}_o)) \times 100$$
Embeddings for opportunities are pre-computed and stored to ensure sub-millisecond query evaluation.

### 2.3 Career Interest Alignment ($I$)
$$\mathcal{I}_{student} = \text{set of student career interests (e.g. AI/ML, Cloud/DevOps)}$$
$$\mathcal{I}_{opp} = \text{set of opportunity domains / category tags}$$

$$I = \begin{cases} 50 & \text{if } |\mathcal{I}_{student}| = 0 \text{ or } |\mathcal{I}_{opp}| = 0 \\ \frac{|\mathcal{I}_{student} \cap \mathcal{I}_{opp}|}{|\mathcal{I}_{opp}|} \times 100 & \text{otherwise} \end{cases}$$

### 2.4 Opportunity Preference Match ($P$)
Evaluates 4 preference dimensions:
1. **Work Mode (25%):** Match between student's desired work mode (`remote`, `hybrid`, `on_site`) and opportunity mode.
2. **Opportunity Type (25%):** Match between preferred types (e.g. `internship`, `hackathon`) and listing type.
3. **Location (25%):** Exact city match, state match, or `Pan-India`/`Remote` applicability.
4. **Stipend Expectation (25%):** If student selected `paid_only`, score 100 if stipend $> 0$, 0 if unpaid. If `flexible` or `any`, score 100.

### 2.5 Goal Synergy ($G$)
Measures whether the opportunity helps the student grow towards their aspirational learning goals:
$$\mathcal{G}_{student} = \text{skills marked as learning goals}$$
$$\mathcal{S}_{opp} = \mathcal{S}_{mand} \cup \mathcal{S}_{pref}$$
$$G = \begin{cases} 70 & \text{if } |\mathcal{G}_{student}| = 0 \\ \min\left(100, \frac{|\mathcal{G}_{student} \cap \mathcal{S}_{opp}|}{\max(1, |\mathcal{G}_{student}|)} \times 100 + 40\right) & \text{otherwise} \end{cases}$$

---

## 3. Strict Eligibility Engine

The eligibility engine runs **strictly independent** of the recommendation score $S$.
Even if $S = 98\%$, if the student fails a mandatory graduation year or degree requirement, the status is marked **`Not eligible`** with explicit reasons.

Evaluated fields:
1. **Graduation Year Range:** Checked against `mandatory_requirements.graduation_years` (e.g., `[2026, 2027]`).
2. **Degree Qualification:** Checked against `mandatory_requirements.degrees` (e.g., `["BTech", "BE", "MCA"]`).
3. **Academic Year:** Checked against `mandatory_requirements.min_academic_year`.
4. **Mandatory Skills:** Verified whether mandatory prerequisite skills are met.

Outcomes:
- **`Eligible`**: All verified constraints are explicitly satisfied.
- **`Potentially eligible`**: Some criteria are not formally stated by the provider or are ambiguous.
- **`Not eligible`**: One or more concrete constraints are breached (with bulleted explanation of why).
