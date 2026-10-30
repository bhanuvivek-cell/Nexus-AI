import sqlite3
import json
import os
from typing import Dict, Any, List, Optional
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

DB_PATH = Path(__file__).resolve().parent.parent.parent / "nexus_local.db"


def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_local_db():
    """Initializes local tables for username-only authentication and student data."""
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        
        # 1. User Accounts
        cur.execute("""
            CREATE TABLE IF NOT EXISTS user_accounts (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                full_name TEXT,
                role TEXT DEFAULT 'student',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        cur.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_user_username ON user_accounts(username);")

        # 2. User Profiles
        cur.execute("""
            CREATE TABLE IF NOT EXISTS user_profiles (
                id TEXT PRIMARY KEY REFERENCES user_accounts(id) ON DELETE CASCADE,
                username TEXT UNIQUE NOT NULL,
                display_name TEXT NOT NULL,
                degree TEXT DEFAULT 'BTech',
                branch TEXT DEFAULT 'Computer Science & Engineering',
                academic_year INT DEFAULT 1,
                graduation_year INT DEFAULT 2028,
                college TEXT DEFAULT '',
                location TEXT DEFAULT 'Pan-India',
                career_interests TEXT DEFAULT '[]',
                learning_goals TEXT DEFAULT '[]',
                opportunity_preferences TEXT DEFAULT '{"preferred_types": ["internship", "hackathon"], "work_mode": "any", "stipend_preference": "flexible", "preferred_locations": ["Pan-India"]}',
                portfolio_urls TEXT DEFAULT '{}',
                skills TEXT DEFAULT '[]',
                onboarding_completed BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 3. Saved Opportunities
        cur.execute("""
            CREATE TABLE IF NOT EXISTS user_saved_opportunities (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                opportunity_id TEXT NOT NULL,
                saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, opportunity_id)
            );
        """)

        # 4. User Applications
        cur.execute("""
            CREATE TABLE IF NOT EXISTS user_applications (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                opportunity_id TEXT NOT NULL,
                stage TEXT NOT NULL,
                notes TEXT DEFAULT '',
                applied_date TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, opportunity_id)
            );
        """)

        conn.commit()
    finally:
        conn.close()


# Ensure tables exist on import
init_local_db()


# -----------------------------------------------------------------------------
# User Account Queries
# -----------------------------------------------------------------------------
def get_user_by_username(username: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    try:
        row = conn.execute("SELECT * FROM user_accounts WHERE username = ?", (username.strip().lower(),)).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    try:
        row = conn.execute("SELECT * FROM user_accounts WHERE id = ?", (user_id,)).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def create_user_account(user_id: str, username: str, password_hash: str, full_name: Optional[str] = None, role: str = "student") -> Dict[str, Any]:
    conn = get_db_connection()
    try:
        normalized_username = username.strip().lower()
        display_name = (full_name or "").strip() or normalized_username
        
        conn.execute("""
            INSERT INTO user_accounts (id, username, password_hash, full_name, role)
            VALUES (?, ?, ?, ?, ?)
        """, (user_id, normalized_username, password_hash, display_name, role))

        # Also create initial profile
        conn.execute("""
            INSERT OR IGNORE INTO user_profiles (id, username, display_name)
            VALUES (?, ?, ?)
        """, (user_id, normalized_username, display_name))

        conn.commit()
        return {
            "id": user_id,
            "username": normalized_username,
            "full_name": display_name,
            "role": role
        }
    finally:
        conn.close()


# -----------------------------------------------------------------------------
# Profile Queries
# -----------------------------------------------------------------------------
def get_user_profile(user_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    try:
        row = conn.execute("SELECT * FROM user_profiles WHERE id = ?", (user_id,)).fetchone()
        if not row:
            return None
        d = dict(row)
        d["career_interests"] = json.loads(d.get("career_interests") or "[]")
        d["learning_goals"] = json.loads(d.get("learning_goals") or "[]")
        d["opportunity_preferences"] = json.loads(d.get("opportunity_preferences") or "{}")
        d["portfolio_urls"] = json.loads(d.get("portfolio_urls") or "{}")
        d["skills"] = json.loads(d.get("skills") or "[]")
        d["onboarding_completed"] = bool(d.get("onboarding_completed"))
        return d
    finally:
        conn.close()


def upsert_user_profile(user_id: str, profile_data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_db_connection()
    try:
        username = profile_data.get("username", "").strip().lower()
        display_name = profile_data.get("display_name", "") or username
        degree = profile_data.get("degree", "BTech")
        branch = profile_data.get("branch", "Computer Science & Engineering")
        academic_year = profile_data.get("academic_year", 1)
        graduation_year = profile_data.get("graduation_year", 2028)
        college = profile_data.get("college", "")
        location = profile_data.get("location", "Pan-India")
        career_interests = json.dumps(profile_data.get("career_interests", []))
        learning_goals = json.dumps(profile_data.get("learning_goals", []))
        opportunity_preferences = json.dumps(profile_data.get("opportunity_preferences", {}))
        portfolio_urls = json.dumps(profile_data.get("portfolio_urls", {}))
        skills = json.dumps(profile_data.get("skills", []))
        onboarding_completed = 1 if profile_data.get("onboarding_completed") else 0

        conn.execute("""
            INSERT INTO user_profiles (
                id, username, display_name, degree, branch, academic_year, graduation_year,
                college, location, career_interests, learning_goals, opportunity_preferences,
                portfolio_urls, skills, onboarding_completed, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET
                display_name = excluded.display_name,
                degree = excluded.degree,
                branch = excluded.branch,
                academic_year = excluded.academic_year,
                graduation_year = excluded.graduation_year,
                college = excluded.college,
                location = excluded.location,
                career_interests = excluded.career_interests,
                learning_goals = excluded.learning_goals,
                opportunity_preferences = excluded.opportunity_preferences,
                portfolio_urls = excluded.portfolio_urls,
                skills = excluded.skills,
                onboarding_completed = excluded.onboarding_completed,
                updated_at = CURRENT_TIMESTAMP
        """, (
            user_id, username, display_name, degree, branch, academic_year, graduation_year,
            college, location, career_interests, learning_goals, opportunity_preferences,
            portfolio_urls, skills, onboarding_completed
        ))
        conn.commit()
        return get_user_profile(user_id) or profile_data
    finally:
        conn.close()


# -----------------------------------------------------------------------------
# Saved Opportunities Queries
# -----------------------------------------------------------------------------
def get_user_saved_opportunity_ids(user_id: str) -> List[str]:
    conn = get_db_connection()
    try:
        rows = conn.execute("SELECT opportunity_id FROM user_saved_opportunities WHERE user_id = ?", (user_id,)).fetchall()
        return [row["opportunity_id"] for row in rows]
    finally:
        conn.close()


def save_user_opportunity(user_id: str, opportunity_id: str) -> bool:
    conn = get_db_connection()
    try:
        import uuid
        conn.execute("""
            INSERT OR IGNORE INTO user_saved_opportunities (id, user_id, opportunity_id)
            VALUES (?, ?, ?)
        """, (str(uuid.uuid4()), user_id, opportunity_id))
        conn.commit()
        return True
    finally:
        conn.close()


def unsave_user_opportunity(user_id: str, opportunity_id: str) -> bool:
    conn = get_db_connection()
    try:
        conn.execute("DELETE FROM user_saved_opportunities WHERE user_id = ? AND opportunity_id = ?", (user_id, opportunity_id))
        conn.commit()
        return True
    finally:
        conn.close()


# -----------------------------------------------------------------------------
# Applications Queries
# -----------------------------------------------------------------------------
def get_user_applications_list(user_id: str) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    try:
        rows = conn.execute("""
            SELECT id, user_id, opportunity_id, stage, notes, applied_date, created_at, updated_at
            FROM user_applications WHERE user_id = ? ORDER BY updated_at DESC
        """, (user_id,)).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def upsert_user_application(user_id: str, opp_id: str, stage: str, notes: str = "", applied_date: Optional[str] = None) -> Dict[str, Any]:
    conn = get_db_connection()
    try:
        import uuid
        app_id = str(uuid.uuid4())
        conn.execute("""
            INSERT INTO user_applications (id, user_id, opportunity_id, stage, notes, applied_date, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id, opportunity_id) DO UPDATE SET
                stage = excluded.stage,
                notes = excluded.notes,
                applied_date = excluded.applied_date,
                updated_at = CURRENT_TIMESTAMP
        """, (app_id, user_id, opp_id, stage, notes or "", applied_date))
        conn.commit()
        row = conn.execute("SELECT * FROM user_applications WHERE user_id = ? AND opportunity_id = ?", (user_id, opp_id)).fetchone()
        return dict(row)
    finally:
        conn.close()


def delete_user_application(user_id: str, opp_id: str) -> bool:
    conn = get_db_connection()
    try:
        conn.execute("DELETE FROM user_applications WHERE user_id = ? AND opportunity_id = ?", (user_id, opp_id))
        conn.commit()
        return True
    finally:
        conn.close()

