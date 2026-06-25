"""
Joule LLM integration — connects to Anthropic Claude via Hyperspace proxy.
Provides AI-powered workforce analysis grounded in the 150-employee dataset.
Falls back to simulated responses if no API key or proxy unavailable.
"""
import os
import json
from pathlib import Path

try:
    import anthropic
    HAS_ANTHROPIC = True
except ImportError:
    HAS_ANTHROPIC = False

# Hyperspace proxy config (from opencode.json)
# Note: Anthropic SDK appends /messages automatically, so base URL should NOT include /v1
ANTHROPIC_BASE_URL = os.getenv("ANTHROPIC_BASE_URL", "http://localhost:6655/anthropic")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")  # Set via env var or CF environment
ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-20250514")

# Load employee data for context grounding
DATA_DIR = Path(__file__).parent.parent / "data"


def _load_employee_summary() -> str:
    """Load a condensed version of employee data for LLM context."""
    import csv

    emp_file = DATA_DIR / "employees.csv"
    if not emp_file.exists():
        # try json fallback
        json_file = DATA_DIR / "employees.json"
        if json_file.exists():
            employees = json.loads(json_file.read_text())
        else:
            return "No employee data available."
    else:
        with open(emp_file, newline='') as f:
            employees = list(csv.DictReader(f))

    total = len(employees)

    # Aggregate stats
    depts: dict[str, int] = {}
    roles: dict[str, int] = {}
    for e in employees:
        d = e.get("department", "Unknown")
        r = e.get("role", e.get("current_role", "Unknown"))
        depts[d] = depts.get(d, 0) + 1
        roles[r] = roles.get(r, 0) + 1

    top_roles = sorted(roles.items(), key=lambda x: -x[1])[:15]

    # Sample first 10 employees (key fields only)
    sample_keys = ['employee_id', 'name', 'role', 'current_role', 'department', 'skills', 'performance_rating', 'tenure_years', 'salary']
    sample = [{k: e[k] for k in sample_keys if k in e} for e in employees[:10]]

    summary = f"""Organisation Data (grounded facts — use these, never invent):
- Total employees: {total}
- Departments: {json.dumps(depts)}
- Top roles (role: count): {json.dumps(top_roles)}
- Full employee list fields: {list(employees[0].keys()) if employees else []}
- Sample employees (first 10): {json.dumps(sample, indent=0)}
"""
    return summary


def _build_system_prompt() -> str:
    employee_ctx = _load_employee_summary()
    return f"""You are Joule — SAP's AI workforce copilot integrated into the Workforce Planning Agent.
You have access to the organisation's complete employee dataset and provide strategic workforce intelligence.

{employee_ctx}

Your role:
1. Analyse workforce scenarios using the REAL employee data above
2. Identify attrition risks, skill gaps, succession issues, cost drivers
3. Recommend BBRA actions (Build, Buy, Redeploy, Automate) for specific employees
4. Provide executive-grade insights with numbers, timelines, and cost estimates
5. Reference specific departments, roles, and headcounts from the data

Style:
- Executive-level: concise, data-driven, actionable
- Use bullet points and structured formatting
- Always cite specific numbers from the dataset
- Suggest concrete next steps
- Be direct — no filler, no caveats about being an AI
"""


FALLBACK_RESPONSES = {
    "attrition": "Based on the 150-employee dataset, I've identified elevated attrition risk in the Technology department (57 employees). Key signals: 12 employees with tenure >5 years and no promotion in 2+ years. Estimated replacement cost if top 5 leave: $1.2M. Recommend: immediate comp review for 8 critical ML/Cloud roles + career path conversations for 12 high-performers.",
    "skills": "Skills gap analysis across 150 employees shows critical shortfalls in: AI/ML (32% coverage vs 80% target), Cloud Architecture (48% vs 70%), Cybersecurity (38% vs 75%). Estimated 18-month cost to close gaps: $2.4M via reskilling ($1.1M) + 8 strategic hires ($1.3M). Priority: start with 6 Python/ML reskilling candidates already identified in Operations.",
    "cost": "Total workforce cost: $21.7M across 3 departments. Technology ($12M, 57 FTE) accounts for 55% of spend. Optimisation scenarios: (1) Automate 12 Ops Analyst roles → save $1.8M/yr, (2) Nearshore 8 Finance roles → save $960K/yr, (3) Reskill 15 employees vs. hiring externally → save $450K in recruitment. Combined 24-month savings potential: $3.2M.",
    "default": "I've analysed your workforce of 150 employees across Technology (57), Operations (45), and Finance (48). The organisation's annual HR budget is $21.7M with 24 open requisitions. Key insight: 33% of employees are flagged for attrition risk. What specific area would you like me to dive deeper into — attrition, skills gaps, cost optimisation, or succession planning?"
}


def _get_fallback(message: str) -> str:
    """Return a realistic simulated response when LLM is unavailable."""
    lower = message.lower()
    if "attrition" in lower or "retention" in lower or "risk" in lower:
        return FALLBACK_RESPONSES["attrition"]
    elif "skill" in lower or "gap" in lower or "reskill" in lower:
        return FALLBACK_RESPONSES["skills"]
    elif "cost" in lower or "budget" in lower or "optim" in lower or "forecast" in lower:
        return FALLBACK_RESPONSES["cost"]
    return FALLBACK_RESPONSES["default"]


def chat_with_joule(message: str, history: list[dict] | None = None) -> dict:
    """
    Send a message to Claude via Hyperspace proxy, grounded in employee data.
    Returns: {"response": str, "model": str, "fallback": bool}
    """
    if not HAS_ANTHROPIC or not ANTHROPIC_API_KEY:
        return {"response": _get_fallback(message), "model": "fallback", "fallback": True}

    try:
        client = anthropic.Anthropic(
            base_url=ANTHROPIC_BASE_URL,
            api_key=ANTHROPIC_API_KEY,
        )

        # Build messages from history
        messages = []
        if history:
            for h in history[-6:]:  # keep last 6 messages for context window
                messages.append({"role": h["role"], "content": h["text"]})

        messages.append({"role": "user", "content": message})

        response = client.messages.create(
            model=ANTHROPIC_MODEL,
            max_tokens=1500,
            system=_build_system_prompt(),
            messages=messages,
        )

        text = response.content[0].text if response.content else _get_fallback(message)
        return {"response": text, "model": ANTHROPIC_MODEL, "fallback": False}

    except Exception as e:
        # Fallback on any error (proxy down, timeout, etc.)
        return {"response": _get_fallback(message), "model": "fallback", "fallback": True, "error": str(e)}
