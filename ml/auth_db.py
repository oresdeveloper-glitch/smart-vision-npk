"""Real server-side authentication backed by a local SQLite database.

- Passwords hashed with werkzeug (PBKDF2 / scrypt via werkzeug.security).
- Logins return opaque bearer tokens generated with the stdlib `secrets`.
- Sessions are stored in SQLite with an expiration date.

No external services required. Works over plain HTTP on a LAN.
"""
import json
import os
import secrets
import sqlite3
import threading
from datetime import datetime, timedelta, timezone

from werkzeug.security import generate_password_hash, check_password_hash

APP_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.environ.get("NPK_AUTH_DB", os.path.join(APP_DIR, "users.db"))
TOKEN_TTL_HOURS = 72

_lock = threading.Lock()

ROLES = ("farmer", "expert", "researcher", "admin", "guest")


def _connect():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with _lock:
        conn = _connect()
        try:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    username TEXT NOT NULL UNIQUE,
                    email TEXT NOT NULL UNIQUE,
                    role TEXT NOT NULL DEFAULT 'farmer',
                    phone TEXT,
                    avatar TEXT,
                    password_hash TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS sessions (
                    token TEXT PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    expires_at TEXT NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
                )
                """
            )
            conn.commit()
        finally:
            conn.close()


def _user_row_to_dict(row: sqlite3.Row) -> dict:
    return {
        "id": str(row["id"]),
        "name": row["name"],
        "username": row["username"],
        "email": row["email"],
        "role": row["role"],
        "phone": row["phone"],
        "avatar": row["avatar"],
        "createdAt": row["created_at"],
    }


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _now_dt() -> datetime:
    return datetime.now(timezone.utc)


def register_user(name: str, username: str, email: str, password: str, role: str = "farmer"):
    """Create a new user. Returns (user_dict, error_message). error is None on success."""
    if role not in ROLES:
        role = "farmer"
    name = (name or "").strip()
    username = (username or "").strip()
    email = (email or "").strip().lower()
    if not name or not username or not email or not password:
        return None, "All fields are required."
    if len(password) < 6:
        return None, "Password must be at least 6 characters."

    with _lock:
        conn = _connect()
        try:
            exists = conn.execute(
                "SELECT 1 FROM users WHERE username = ? OR email = ?", (username, email)
            ).fetchone()
            if exists:
                return None, "Username or email is already taken."
            phash = generate_password_hash(password)
            cur = conn.execute(
                """
                INSERT INTO users (name, username, email, role, password_hash, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (name, username, email, role, phash, _now()),
            )
            conn.commit()
            row = conn.execute("SELECT * FROM users WHERE id = ?", (cur.lastrowid,)).fetchone()
            return _user_row_to_dict(row), None
        finally:
            conn.close()


def authenticate_user(identifier: str, password: str):
    """Log in by email or username. Returns (user_dict, error_message)."""
    identifier = (identifier or "").strip().lower()
    if not identifier or not password:
        return None, "Email and password are required."
    with _lock:
        conn = _connect()
        try:
            row = conn.execute(
                "SELECT * FROM users WHERE email = ? OR username = ?",
                (identifier, identifier),
            ).fetchone()
            if row is None or not check_password_hash(row["password_hash"], password):
                return None, "Invalid credentials."
            return _user_row_to_dict(row), None
        finally:
            conn.close()


def create_session(user_id: int) -> str:
    token = secrets.token_urlsafe(32)
    expires_at = (_now_dt() + timedelta(hours=TOKEN_TTL_HOURS)).isoformat()
    with _lock:
        conn = _connect()
        try:
            conn.execute(
                "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)",
                (token, user_id, expires_at),
            )
            conn.commit()
        finally:
            conn.close()
    return token


def revoke_session(token: str) -> None:
    with _lock:
        conn = _connect()
        try:
            conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
            conn.commit()
        finally:
            conn.close()


def get_user_by_token(token: str):
    """Return (user_dict, None) if token is valid and unexpired, else (None, reason)."""
    if not token:
        return None, "No token provided."
    with _lock:
        conn = _connect()
        try:
            row = conn.execute(
                "SELECT u.*, s.expires_at AS exp FROM sessions s "
                "JOIN users u ON u.id = s.user_id WHERE s.token = ?",
                (token,),
            ).fetchone()
            if row is None:
                return None, "Invalid session."
            exp = datetime.fromisoformat(row["exp"])
            if exp < _now_dt():
                conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
                conn.commit()
                return None, "Session expired."
            return _user_row_to_dict(row), None
        finally:
            conn.close()


def change_user_password(user_id: int, current_password: str, new_password: str):
    """Verify current password, then set new. Returns (ok, message)."""
    if len(new_password or "") < 6:
        return False, "New password must be at least 6 characters."
    with _lock:
        conn = _connect()
        try:
            row = conn.execute(
                "SELECT password_hash FROM users WHERE id = ?", (user_id,)
            ).fetchone()
            if row is None:
                return False, "User not found."
            if not check_password_hash(row["password_hash"], current_password):
                return False, "Current password is incorrect."
            phash = generate_password_hash(new_password)
            conn.execute("UPDATE users SET password_hash = ? WHERE id = ?", (phash, user_id))
            conn.execute("DELETE FROM sessions WHERE user_id = ?", (user_id,))
            conn.commit()
            return True, None
        finally:
            conn.close()


def update_user_profile(user_id: int, data: dict) -> dict:
    allowed = ["name", "username", "email", "phone", "avatar"]
    with _lock:
        conn = _connect()
        try:
            sets, params = [], []
            for k in allowed:
                if k in data:
                    sets.append(f"{k} = ?")
                    params.append(data[k])
            if not sets:
                row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
                return _user_row_to_dict(row)
            params.append(user_id)
            conn.execute(f"UPDATE users SET {', '.join(sets)} WHERE id = ?", params)
            conn.commit()
            row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
            return _user_row_to_dict(row)
        finally:
            conn.close()


def list_users() -> list:
    with _lock:
        conn = _connect()
        try:
            rows = conn.execute("SELECT * FROM users ORDER BY id ASC").fetchall()
            return [_user_row_to_dict(r) for r in rows]
        finally:
            conn.close()


def delete_user(user_id: int) -> bool:
    with _lock:
        conn = _connect()
        try:
            cur = conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
            conn.execute("DELETE FROM sessions WHERE user_id = ?", (user_id,))
            conn.commit()
            return cur.rowcount > 0
        finally:
            conn.close()