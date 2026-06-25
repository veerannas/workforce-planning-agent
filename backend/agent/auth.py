"""
Authentication module — mock login with simple token and role-based access.
Credentials loaded from environment variables (see .env.example).
"""
import hashlib
import json
import time
import base64
import os
from typing import Optional
from fastapi import HTTPException, Request

TOKEN_EXPIRY_HOURS = 8
SECRET = os.getenv("TOKEN_SECRET", "wfp-agent-2026")

USERS = {
    "employee": {
        "password": os.getenv("EMPLOYEE_PASSWORD", "emp123"),
        "role": "employee",
        "name": "Richard Harris",
        "department": "Finance",
        "employee_id": "EMP01025",
    },
    "manager": {
        "password": os.getenv("MANAGER_PASSWORD", "man123"),
        "role": "manager",
        "name": "Richard Chen",
        "department": "Technology",
        "employee_id": "EMP01020",
    },
    "executive": {
        "password": os.getenv("EXECUTIVE_PASSWORD", "exe123"),
        "role": "executive",
        "name": "Alex Morgan",
        "title": "Chief Executive Officer",
        "department": "Executive",
        "employee_id": "EMP00001",
    },
}


def _make_token(payload: dict) -> str:
    """Create a signed token."""
    payload["exp"] = time.time() + TOKEN_EXPIRY_HOURS * 3600
    data = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode()
    sig = hashlib.sha256(f"{data}{SECRET}".encode()).hexdigest()[:16]
    return f"{data}.{sig}"


def _verify_token(token: str) -> Optional[dict]:
    """Verify and decode token."""
    try:
        parts = token.split(".")
        if len(parts) != 2:
            return None
        data, sig = parts
        expected_sig = hashlib.sha256(f"{data}{SECRET}".encode()).hexdigest()[:16]
        if sig != expected_sig:
            return None
        payload = json.loads(base64.urlsafe_b64decode(data + "=="))
        if payload.get("exp", 0) < time.time():
            return None
        return payload
    except Exception:
        return None


def authenticate(username: str, password: str) -> Optional[dict]:
    """Verify credentials, return user info + token."""
    user = USERS.get(username)
    if not user or user["password"] != password:
        return None
    payload = {
        "sub": username,
        "role": user["role"],
        "name": user["name"],
        "department": user["department"],
        "employee_id": user["employee_id"],
    }
    token = _make_token(payload)
    user_info = {k: v for k, v in user.items() if k != "password"}
    user_info["username"] = username
    return {"token": token, "user": user_info}


def get_current_user(request: Request) -> dict:
    """Extract user from Authorization header."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = _verify_token(auth[7:])
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload


def require_role(request: Request, allowed_roles: list[str]) -> dict:
    """Verify user has allowed role."""
    user = get_current_user(request)
    if user["role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail=f"Role '{user['role']}' not authorized")
    return user
