# Nexus AI — REST API Specification
**Base URL:** `/api/v1`

---

## 1. System Endpoints

### `GET /api/v1/health`
Checks backend readiness, database connectivity, and ML model status.
- **Auth:** None (Public)
- **Response:**
  ```json
  {
    "status": "healthy",
    "timestamp": "2026-10-27T16:00:00Z",
    "database": "connected",
    "model_loaded": true,
    "version": "1.0.0"
  }
  ```

---

## 2. Authentication & Profile Endpoints

### `GET /api/v1/profiles/me`
Fetches the authenticated student's profile including skills and preferences.
- **Auth:** Bearer Token (Supabase JWT)
- **Response:** Profile object or 404 if profile not yet created.

### `POST /api/v1/profiles/me`
Creates or updates the authenticated student's profile (including onboarding data).
- **Auth:** Bearer Token
- **Request Body:**
  ```json
  {
    "display_name": "Aarav Sharma",
    "degree": "BTech",
    "branch": "Computer Science & Engineering",
    "academic_year": 3,
    "graduation_year": 2027,
    "college": "Vellore Institute of Technology",
    "location": "Bengaluru, Karnataka",
    "career_interests": ["AI/ML", "Web Development"],
    "learning_goals": ["Docker", "Kubernetes", "PyTorch"],
    "opportunity_preferences": {
      "preferred_types": ["internship", "hackathon"],
      "work_mode": "hybrid",
      "stipend_preference": "paid_only",
      "preferred_locations": ["Bengaluru", "Remote", "Hyderabad"]
    },
    "portfolio_urls": {
      "github": "https://github.com/aarav-sharma",
      "linkedin": "https://linkedin.com/in/aarav-sharma",
      "portfolio": "https://aarav.dev"
    },
    "skills": [
      {"name": "Python", "proficiency": "intermediate", "is_learning_goal": false},
      {"name": "React", "proficiency": "beginner", "is_learning_goal": false},
      {"name": "DSA", "proficiency": "intermediate", "is_learning_goal": false},
      {"name": "Docker", "proficiency": "beginner", "is_learning_goal": true}
    ],
    "onboarding_completed": true
  }
  ```

---

## 3. Skills Catalogue Endpoints

### `GET /api/v1/skills`
Returns the canonical list of skills grouped by categories.
- **Auth:** None
- **Query Params:** `query` (optional string search), `category` (optional filter)
- **Response:** Array of skill objects: `[{"id": "...", "name": "Python", "category": "Programming Language"}]`

---

## 4. Opportunity Endpoints

### `GET /api/v1/opportunities`
Search and filter verified opportunities.
- **Auth:** Optional (if authenticated, returns user's save and application state)
- **Query Params:**
  - `query`: Keyword search (title, provider, description)
  - `type`: `internship` | `entry_level_job` | `hackathon` | `certification` | `open_source` | `research`
  - `work_mode`: `remote` | `hybrid` | `on_site`
  - `location`: City or State
  - `skills`: Comma-separated skill names
  - `stipend`: `paid_only` | `any`
  - `sort_by`: `deadline` | `recent` | `relevance`
  - `page`: integer (default 1)
  - `page_size`: integer (default 12)
- **Response:**
  ```json
  {
    "total": 45,
    "page": 1,
    "page_size": 12,
    "items": [...]
  }
  ```

### `GET /api/v1/opportunities/{id}`
Returns granular details of a specific opportunity.
- **Auth:** Optional (if authenticated, evaluates student's personalized eligibility and match breakdown).
- **Response:** Detailed opportunity object including structured requirements, skills, eligibility status, match breakdown, and official URL.

---

## 5. Recommendation Endpoints

### `GET /api/v1/recommendations`
Computes and returns personalized recommendations for the authenticated student.
- **Auth:** Bearer Token
- **Query Params:** `limit` (default 10), `min_score` (default 30)
- **Response:**
  ```json
  {
    "student_id": "...",
    "recommendations": [
      {
        "opportunity_id": "...",
        "title": "Software Engineering Intern - Cloud & Systems",
        "provider": "Cisco India",
        "opportunity_type": "internship",
        "work_mode": "hybrid",
        "location": "Bengaluru",
        "stipend_amount": 60000,
        "deadline": "2026-12-15T00:00:00Z",
        "overall_score": 88.5,
        "components": {
          "skill_match_K": 90.0,
          "semantic_relevance_M": 86.4,
          "interest_match_I": 95.0,
          "preference_match_P": 85.0,
          "goal_alignment_G": 80.0
        },
        "eligibility": {
          "status": "Eligible",
          "reasons": ["Graduation year 2027 matches eligible batch", "Degree BTech Computer Science accepted"],
          "unmet_criteria": []
        },
        "matched_skills": ["Python", "DSA", "Linux"],
        "missing_skills": ["Networking Protocols", "Docker"],
        "next_steps": "Review Docker fundamentals in the Skill Roadmap to reach a 95%+ match."
      }
    ]
  }
  ```

---

## 6. Applications & Saved Endpoints

### `GET /api/v1/applications`
Fetch student's tracked applications.
- **Auth:** Bearer Token
- **Response:** List of tracked applications with current stage (`Saved`, `Planned`, `Applied`, `Interview`, `Offer`, `Rejected/Closed`), dates, and personal notes.

### `POST /api/v1/applications`
Create or update an application stage.
- **Auth:** Bearer Token
- **Request Body:**
  ```json
  {
    "opportunity_id": "uuid",
    "stage": "Applied",
    "notes": "Applied via official portal with updated GitHub portfolio.",
    "applied_date": "2026-10-27"
  }
  ```

### `DELETE /api/v1/applications/{opportunity_id}`
Removes an opportunity from application tracker.
- **Auth:** Bearer Token

### `GET /api/v1/saved` & `POST /api/v1/saved/{opportunity_id}` & `DELETE /api/v1/saved/{opportunity_id}`
Saved bookmarks CRUD for students.
- **Auth:** Bearer Token

---

## 7. Skill Gap & Learning Endpoints

### `GET /api/v1/learning/roadmap`
Calculates missing skill frequency across the student's top recommended and saved opportunities and returns verified learning paths.
- **Auth:** Bearer Token
- **Response:**
  ```json
  {
    "prioritized_missing_skills": [
      {
        "skill_name": "Docker",
        "frequency": 4,
        "category": "Cloud/DevOps",
        "resources": [
          {
            "title": "Introduction to Containers and Docker",
            "provider": "AWS Skill Builder",
            "official_url": "https://explore.skillbuilder.aws/learn/course/external/view/elearning/14470",
            "is_free": true,
            "cost_details": "Free",
            "difficulty_level": "beginner"
          }
        ]
      }
    ]
  }
  ```
