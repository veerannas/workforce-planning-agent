"""
FastAPI backend for Workforce Planning Agent.
Serves API + static React build (single CF app deployment).
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import os
import random
from datetime import datetime, timezone

from agent.engine import (run_agent, load_employees, load_future_roles,
                          load_org_structure, load_skills_taxonomy)
from agent.auth import authenticate, get_current_user, require_role

app = FastAPI(title="Workforce Planning Agent", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════════════════════════════════════════════
# AUTH ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════
class LoginRequest(BaseModel):
    username: str
    password: str


@app.post("/api/auth/login")
def login(req: LoginRequest):
    result = authenticate(req.username, req.password)
    if not result:
        return {"error": "Invalid credentials"}, 401
    return result


@app.get("/api/auth/me")
def get_me(request: Request):
    user = get_current_user(request)
    return user


# ═══════════════════════════════════════════════════════════════════════════════
# CORE AGENT ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════
class ScenarioRequest(BaseModel):
    scenario: str
    scenario_type: str = "general"
    user_role: str = "executive"
    employee_id: str | None = None
    department: str | None = None


@app.get("/api/health")
def health():
    return {"status": "ok", "version": "2.0.0"}


@app.post("/api/analyze")
def analyze_scenario(req: ScenarioRequest):
    result = run_agent(
        req.scenario,
        scenario_type=req.scenario_type,
        user_role=req.user_role,
        employee_id=req.employee_id,
        department=req.department,
    )
    return {
        "strategy": result.strategy,
        "gaps_count": len(result.gaps),
        "recommendations": result.recommendations,
        "summary": result.summary,
        "hr_review_queue": result.hr_review_queue,
    }


# ── Joule LLM Chat ──────────────────────────────────────────────────────────
from agent.joule_llm import chat_with_joule

class JouleChatRequest(BaseModel):
    message: str
    history: list[dict] | None = None

@app.post("/api/joule/chat")
def joule_chat(req: JouleChatRequest):
    result = chat_with_joule(req.message, req.history)
    return result


@app.get("/api/employees")
def get_employees():
    return load_employees()


@app.get("/api/future-roles")
def get_future_roles():
    return load_future_roles()


@app.get("/api/org-structure")
def get_org_structure():
    return load_org_structure()


@app.get("/api/skills-taxonomy")
def get_skills_taxonomy():
    return load_skills_taxonomy()


# ═══════════════════════════════════════════════════════════════════════════════
# HOME DASHBOARD KPIs
# ═══════════════════════════════════════════════════════════════════════════════
@app.get("/api/dashboard/kpis")
def get_dashboard_kpis():
    employees = load_employees()
    future_roles = load_future_roles()
    org = load_org_structure()

    total_emp = len(employees)
    total_budget = sum(o["annual_hr_budget_usd"] for o in org)
    open_positions = sum(max(0, r["target_y1"] - r["current_headcount"]) for r in future_roles)
    skills_gap_roles = sum(1 for r in future_roles if r["target_y1"] > r["current_headcount"])
    attrition_risk = sum(1 for e in employees if e["performance_rating"] and e["performance_rating"] >= 4 and e["tenure_years"] > 5)
    missing_skills = sum(1 for e in employees if not e["skills"])

    return {
        "total_employees": total_emp,
        "total_budget_usd": total_budget,
        "open_positions": open_positions,
        "skills_gap_roles": skills_gap_roles,
        "high_retention_risk": attrition_risk,
        "missing_skills_profiles": missing_skills,
        "departments": [
            {"name": o["department"], "headcount": sum(1 for e in employees if e["department"] == o["department"]),
             "budget": o["annual_hr_budget_usd"]}
            for o in org
        ],
    }


# ═══════════════════════════════════════════════════════════════════════════════
# HIRING PIPELINE
# ═══════════════════════════════════════════════════════════════════════════════
@app.get("/api/hiring/pipeline")
def get_hiring_pipeline():
    """Mock hiring pipeline data."""
    future_roles = load_future_roles()
    pipeline = []
    statuses = ["Open", "Screening", "Interview", "Offer", "Filled"]

    for role in future_roles:
        gap = role["target_y1"] - role["current_headcount"]
        if gap > 0:
            for i in range(min(gap, 3)):  # max 3 positions shown per role
                status = random.choice(statuses[:4]) if i < gap - 1 else "Open"
                candidates = random.randint(2, 15) if status != "Open" else 0
                pipeline.append({
                    "id": f"REQ-{role['role'][:3].upper()}-{1001+i}",
                    "role": role["role"],
                    "department": role["department"],
                    "status": status,
                    "candidates": candidates,
                    "days_open": random.randint(5, 60),
                    "priority": role["priority"],
                    "salary_range": f"${random.randint(80,150)}k - ${random.randint(150,220)}k",
                    "hiring_manager": "Richard Chen" if role["department"] == "Technology" else "David Patel",
                    "required_skills": role["required_skills"],
                    "cost_to_fill_usd": random.randint(8000, 25000),
                })
    return pipeline


@app.get("/api/hiring/metrics")
def get_hiring_metrics():
    """Hiring KPIs."""
    return {
        "open_requisitions": 18,
        "avg_time_to_fill_days": 42,
        "avg_cost_per_hire_usd": 14500,
        "offer_acceptance_rate": 0.78,
        "pipeline_by_stage": {
            "Open": 6,
            "Screening": 4,
            "Interview": 5,
            "Offer": 2,
            "Filled": 1,
        },
        "by_department": {
            "Technology": 12,
            "Operations": 3,
            "Finance": 3,
        },
    }


# ═══════════════════════════════════════════════════════════════════════════════
# RESKILLING CENTER
# ═══════════════════════════════════════════════════════════════════════════════
@app.get("/api/reskilling/programs")
def get_reskilling_programs():
    """Active reskilling programs."""
    taxonomy = load_skills_taxonomy()
    programs = []
    target_skills = ["Machine Learning", "Python", "Cloud Architecture", "Data Pipelines",
                     "Kubernetes", "Deep Learning", "SQL", "Power BI"]

    for skill_name in target_skills:
        skill = next((s for s in taxonomy if s["skill"] == skill_name), None)
        if skill:
            programs.append({
                "id": f"RSK-{skill_name[:4].upper()}-001",
                "skill": skill_name,
                "category": skill["category"],
                "duration_weeks": skill["reskill_weeks"],
                "cost_per_employee_usd": skill["reskill_cost_usd"],
                "enrolled": random.randint(3, 15),
                "completed": random.randint(0, 5),
                "in_progress": random.randint(2, 10),
                "completion_rate": round(random.uniform(0.4, 0.85), 2),
                "target_roles": [r["role"] for r in load_future_roles()
                                if skill_name in r["required_skills"]][:3],
            })
    return programs


@app.get("/api/reskilling/employees")
def get_reskilling_employees():
    """Employees eligible or enrolled in reskilling."""
    employees = load_employees()
    taxonomy = {s["skill"]: s for s in load_skills_taxonomy()}
    reskill_list = []

    for emp in employees[:50]:  # Top 50 candidates
        if not emp["skills"]:
            continue
        # Find missing high-value skills
        target_skills = {"Machine Learning", "Python", "Cloud Architecture", "Kubernetes", "Data Pipelines"}
        missing = target_skills - set(emp["skills"])
        if missing and emp["performance_rating"] and emp["performance_rating"] >= 3:
            status = random.choice(["Eligible", "Enrolled", "In Progress", "Completed"])
            reskill_list.append({
                "employee_id": emp["employee_id"],
                "name": f"{emp['first_name']} {emp['last_name']}",
                "department": emp["department"],
                "current_role": emp["role"],
                "current_skills": emp["skills"][:4],
                "target_skills": list(missing)[:3],
                "reskill_fit_score": round(random.uniform(0.4, 0.9), 2),
                "status": status,
                "estimated_weeks": sum(taxonomy.get(s, {}).get("reskill_weeks", 8) for s in list(missing)[:2]),
                "estimated_cost_usd": sum(taxonomy.get(s, {}).get("reskill_cost_usd", 5000) for s in list(missing)[:2]),
            })
    return reskill_list[:30]


# ═══════════════════════════════════════════════════════════════════════════════
# REDEPLOYMENT HUB
# ═══════════════════════════════════════════════════════════════════════════════
@app.get("/api/redeployment/opportunities")
def get_redeployment_opportunities():
    """Internal mobility opportunities."""
    future_roles = load_future_roles()
    employees = load_employees()
    opportunities = []

    growth_roles = [r for r in future_roles if r["priority"] in ("critical", "high")]
    for role in growth_roles:
        required_skills = set(role["required_skills"])
        # Find internal matches
        matches = []
        for emp in employees:
            if emp["skills"]:
                overlap = len(set(emp["skills"]) & required_skills)
                if overlap >= 2 and emp["role"] != role["role"]:
                    matches.append({
                        "employee_id": emp["employee_id"],
                        "name": f"{emp['first_name']} {emp['last_name']}",
                        "current_role": emp["role"],
                        "department": emp["department"],
                        "skill_match": round(overlap / len(required_skills), 2),
                        "matching_skills": list(set(emp["skills"]) & required_skills),
                    })
        matches.sort(key=lambda x: x["skill_match"], reverse=True)
        opportunities.append({
            "target_role": role["role"],
            "department": role["department"],
            "positions_available": role["target_y1"] - role["current_headcount"],
            "required_skills": role["required_skills"],
            "priority": role["priority"],
            "internal_candidates": matches[:5],
        })
    return opportunities


# ═══════════════════════════════════════════════════════════════════════════════
# ORG DESIGN
# ═══════════════════════════════════════════════════════════════════════════════
@app.get("/api/org/tree")
def get_org_tree(employee_id: str = "", role: str = "executive"):
    """
    Person-to-person org hierarchy built from actual manager_id relationships in employees.csv.
    Scoped by role:
      - executive: full tree (CEO → dept heads → all reports)
      - manager:   3-level subtree rooted at employee_id (manager's manager → manager → direct reports)
      - employee:  3-level subtree (employee's manager → employee → employee's direct reports)
    """
    employees = load_employees()
    emp_by_id: dict[str, dict] = {e["employee_id"]: e for e in employees}

    def make_phone(emp_id: str) -> str:
        n = int(emp_id[3:])
        return f"(555) {100 + n // 1000:03d}-{n % 10000:04d}"

    def make_email(first: str, last: str) -> str:
        return f"{first.lower()}.{last.lower()}@company.com"

    def to_node(e: dict, children: list | None = None) -> dict:
        return {
            "id": e["employee_id"],
            "name": f"{e['first_name']} {e['last_name']}",
            "role": e["role"],
            "grade": e.get("grade", e.get("raw_grade", "")),
            "email": make_email(e["first_name"], e["last_name"]),
            "phone": make_phone(e["employee_id"]),
            "location": e["location"],
            "department": e["department"],
            "children": children if children is not None else [],
        }

    # Build children index from manager_id
    children_of: dict[str, list[dict]] = {}
    for e in employees:
        mgr = e.get("manager_id", "")
        if mgr:
            children_of.setdefault(mgr, []).append(e)

    def build_subtree(emp_id: str, depth: int) -> dict:
        """Recursively build node with children up to given depth."""
        e = emp_by_id.get(emp_id)
        if not e:
            return {}
        kids = children_of.get(emp_id, [])
        child_nodes = [build_subtree(k["employee_id"], depth - 1) for k in kids] if depth > 0 else []
        node = to_node(e, [c for c in child_nodes if c])
        return node

    # ── CEO node from real CSV row (EMP00001 = Alex Morgan) ──────────────────
    ceo_emp = emp_by_id.get("EMP00001", {})
    ceo: dict = {
        "id": "CEO",
        "name": f"{ceo_emp.get('first_name', 'Alex')} {ceo_emp.get('last_name', 'Morgan')}",
        "role": ceo_emp.get("role", "Chief Executive Officer"),
        "grade": ceo_emp.get("grade", "M3"),
        "email": f"{ceo_emp.get('first_name', 'alex').lower()}.{ceo_emp.get('last_name', 'morgan').lower()}@company.com",
        "phone": "(555) 000-0001",
        "location": ceo_emp.get("location", "New York"),
        "department": ceo_emp.get("department", "Executive"),
        "children": [],
    }

    if role == "executive":
        # Full tree: find all top-level employees (no manager, or manager not in dataset)
        # excluding the CEO row itself — attach under CEO
        dept_heads: list[dict] = []
        for e in employees:
            if e["employee_id"] == "EMP00001":
                continue  # skip CEO — he is the root
            mgr_id = e.get("manager_id", "")
            if not mgr_id or mgr_id not in emp_by_id:
                dept_heads.append(e)
        for head in dept_heads:
            ceo["children"].append(build_subtree(head["employee_id"], depth=3))
        return ceo

    # ── Scoped views for manager and employee ────────────────────────────────
    if not employee_id or employee_id not in emp_by_id:
        return ceo  # fallback: return CEO tree

    me = emp_by_id[employee_id]
    my_manager_id = me.get("manager_id", "")
    my_manager = emp_by_id.get(my_manager_id)

    # Direct reports of the logged-in user
    my_reports = children_of.get(employee_id, [])
    report_nodes = [build_subtree(r["employee_id"], depth=1) for r in my_reports]

    me_node = to_node(me, report_nodes)
    me_node["_isMe"] = True  # highlight flag for frontend

    if my_manager:
        # Show manager's manager (greyed) → manager → me (+siblings for context)
        mgr_manager_id = my_manager.get("manager_id", "")
        mgr_manager = emp_by_id.get(mgr_manager_id)

        # Siblings = other direct reports of my manager (show but collapsed)
        siblings = [
            to_node(s, []) for s in children_of.get(my_manager_id, [])
            if s["employee_id"] != employee_id
        ]
        mgr_node = to_node(my_manager, [me_node] + siblings)
        mgr_node["_isManager"] = True

        if mgr_manager:
            top_node = to_node(mgr_manager, [mgr_node])
            top_node["_isGrandparent"] = True
            return top_node
        return mgr_node

    # No manager found — return just me with reports
    return me_node


@app.get("/api/org/executive-insights")
def get_org_executive_insights():
    """Executive-level org design metrics: span of control, cost/head, vacancy, attrition, health."""
    import random
    random.seed(42)
    org = load_org_structure()
    employees = load_employees()

    insights = []
    for dept in org:
        dept_name = dept["department"]
        dept_emps = [e for e in employees if e["department"] == dept_name]
        headcount = len(dept_emps)
        budget = dept["annual_hr_budget_usd"]

        # Derive metrics from mock data
        avg_tenure = round(sum(random.uniform(1, 12) for _ in dept_emps) / max(headcount, 1), 1)
        cost_per_head = round(budget / max(headcount, 1))
        vacancy_rate = round(random.uniform(0.03, 0.15), 3)
        attrition_rate = round(random.uniform(0.05, 0.18), 3)
        avg_perf = round(sum(float(e.get("performance_rating") or 3.0) for e in dept_emps) / max(headcount, 1), 2)
        roles_count = len(set(e["role"] for e in dept_emps))
        span_of_control = round(headcount / max(roles_count, 1), 1)

        # Health score: composite (lower attrition + lower vacancy + higher perf = better)
        health = round(min(100, max(0, 100 - attrition_rate * 200 - vacancy_rate * 150 + (avg_perf - 3) * 20)))

        # Headcount trend (12 months, slight growth/decline)
        base = headcount - random.randint(2, 8)
        trend = [max(1, base + int(i * random.uniform(0.3, 1.2))) for i in range(12)]
        trend[-1] = headcount  # current month = actual

        insights.append({
            "department": dept_name,
            "vp": dept["vp"],
            "headcount": headcount,
            "budget": budget,
            "cost_per_head": cost_per_head,
            "avg_tenure_years": avg_tenure,
            "vacancy_rate": vacancy_rate,
            "attrition_rate": attrition_rate,
            "avg_performance": avg_perf,
            "span_of_control": span_of_control,
            "roles_count": roles_count,
            "health_score": health,
            "headcount_trend_12m": trend,
            "open_positions": int(headcount * vacancy_rate),
            "critical_roles_unfilled": random.randint(0, 3),
        })

    return {
        "departments": insights,
        "totals": {
            "headcount": sum(d["headcount"] for d in insights),
            "budget": sum(d["budget"] for d in insights),
            "avg_health": round(sum(d["health_score"] for d in insights) / len(insights)),
            "total_vacancies": sum(d["open_positions"] for d in insights),
            "avg_attrition": round(sum(d["attrition_rate"] for d in insights) / len(insights), 3),
        }
    }


@app.get("/api/executive/talent-health")
def get_talent_health():
    """Aggregated talent pipeline, reskilling progress, and succession coverage."""
    import random
    random.seed(99)
    employees = load_employees()
    org = load_org_structure()
    skills = load_skills_taxonomy()

    # --- Hiring Pipeline Funnel (aggregated across all depts) ---
    pipeline_stages = [
        {"stage": "Open Requisitions", "count": 24},
        {"stage": "Applications Received", "count": 312},
        {"stage": "Phone Screen", "count": 89},
        {"stage": "Technical Interview", "count": 47},
        {"stage": "Final Round", "count": 18},
        {"stage": "Offers Extended", "count": 9},
        {"stage": "Offers Accepted", "count": 6},
    ]
    pipeline_by_dept = []
    for dept in org:
        pipeline_by_dept.append({
            "department": dept["department"],
            "open_reqs": random.randint(5, 12),
            "in_pipeline": random.randint(20, 80),
            "avg_time_to_fill_days": random.randint(28, 65),
            "offer_acceptance_rate": round(random.uniform(0.6, 0.92), 2),
        })

    # --- Reskilling Progress (org-wide) ---
    total_enrolled = random.randint(35, 55)
    total_completed = random.randint(12, 25)
    reskilling_programs = [
        {"program": "Cloud Architecture", "enrolled": 12, "completed": 5, "in_progress": 7, "success_rate": 0.83},
        {"program": "Data Science", "enrolled": 9, "completed": 3, "in_progress": 6, "success_rate": 0.78},
        {"program": "Product Management", "enrolled": 7, "completed": 4, "in_progress": 3, "success_rate": 0.91},
        {"program": "Cybersecurity", "enrolled": 8, "completed": 2, "in_progress": 6, "success_rate": 0.72},
        {"program": "AI/ML Engineering", "enrolled": 11, "completed": 3, "in_progress": 8, "success_rate": 0.85},
    ]
    reskilling_roi = {
        "total_investment": 420000,
        "projected_savings": 890000,
        "roi_percentage": round((890000 - 420000) / 420000 * 100, 1),
        "avg_salary_uplift_pct": 12.5,
    }

    # --- Succession Planning (anonymized) ---
    critical_roles = [
        {"role": "VP Technology", "department": "Technology", "ready_now": 2, "ready_1yr": 3, "ready_2yr": 1, "coverage": "strong"},
        {"role": "VP Operations", "department": "Operations", "ready_now": 1, "ready_1yr": 2, "ready_2yr": 2, "coverage": "adequate"},
        {"role": "VP Finance", "department": "Finance", "ready_now": 1, "ready_1yr": 1, "ready_2yr": 3, "coverage": "adequate"},
        {"role": "Director Engineering", "department": "Technology", "ready_now": 3, "ready_1yr": 4, "ready_2yr": 2, "coverage": "strong"},
        {"role": "Director Data Science", "department": "Technology", "ready_now": 0, "ready_1yr": 2, "ready_2yr": 1, "coverage": "at_risk"},
        {"role": "Head of Compliance", "department": "Finance", "ready_now": 1, "ready_1yr": 1, "ready_2yr": 0, "coverage": "at_risk"},
        {"role": "Head of Supply Chain", "department": "Operations", "ready_now": 2, "ready_1yr": 3, "ready_2yr": 1, "coverage": "strong"},
    ]
    succession_summary = {
        "total_critical_roles": len(critical_roles),
        "strong_coverage": sum(1 for r in critical_roles if r["coverage"] == "strong"),
        "adequate_coverage": sum(1 for r in critical_roles if r["coverage"] == "adequate"),
        "at_risk": sum(1 for r in critical_roles if r["coverage"] == "at_risk"),
        "bench_strength_index": round(sum(r["ready_now"] + r["ready_1yr"] * 0.5 for r in critical_roles) / len(critical_roles), 1),
    }

    return {
        "pipeline": {"stages": pipeline_stages, "by_department": pipeline_by_dept},
        "reskilling": {"programs": reskilling_programs, "totals": {"enrolled": total_enrolled, "completed": total_completed}, "roi": reskilling_roi},
        "succession": {"critical_roles": critical_roles, "summary": succession_summary},
    }


@app.get("/api/executive/board-report")
def get_board_report():
    """Auto-generated board-level narrative summary."""
    import random
    random.seed(42)
    employees = load_employees()
    org = load_org_structure()

    total_hc = len(employees)
    total_budget = sum(d["annual_hr_budget_usd"] for d in org)
    avg_perf = round(sum(float(e.get("performance_rating") or 3.0) for e in employees) / total_hc, 2)

    report = {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "period": "Q2 2026",
        "executive_summary": (
            f"The organization maintains a workforce of {total_hc} employees across "
            f"{len(org)} departments with an annual HR budget of ${total_budget/1e6:.1f}M. "
            f"Average performance rating stands at {avg_perf}/5.0. "
            "Key focus areas this quarter: AI/ML talent acquisition, reskilling pipeline expansion, "
            "and succession planning for 2 at-risk leadership positions."
        ),
        "sections": [
            {
                "title": "Workforce Composition",
                "narrative": f"Total headcount: {total_hc}. Technology leads with {sum(1 for e in employees if e['department']=='Technology')} employees, "
                f"followed by Finance ({sum(1 for e in employees if e['department']=='Finance')}) and Operations ({sum(1 for e in employees if e['department']=='Operations')}). "
                "Gender diversity is at 42% female representation. Average tenure is 4.2 years.",
                "metrics": {"headcount": total_hc, "departments": len(org), "avg_tenure": 4.2, "diversity_female_pct": 42},
            },
            {
                "title": "Talent Acquisition",
                "narrative": "24 open requisitions across all departments. Average time-to-fill: 42 days (industry benchmark: 45). "
                "Offer acceptance rate: 73%. Critical hiring focus on AI/ML Engineers and Cloud Architects.",
                "metrics": {"open_reqs": 24, "avg_time_to_fill": 42, "offer_acceptance": 0.73, "critical_hires_needed": 8},
            },
            {
                "title": "Reskilling & Development",
                "narrative": "47 employees actively enrolled in reskilling programs. ROI on reskilling investment projected at 112%. "
                "Top programs: Cloud Architecture (83% success), Product Management (91% success). "
                "Recommendation: Expand AI/ML Engineering cohort from 11 to 20.",
                "metrics": {"enrolled": 47, "roi_pct": 112, "avg_success_rate": 0.82, "budget_utilized_pct": 68},
            },
            {
                "title": "Succession Readiness",
                "narrative": "7 critical leadership roles monitored. 3 have strong bench coverage, 2 adequate, 2 at-risk. "
                "At-risk positions: Director Data Science and Head of Compliance. "
                "Action required: accelerate development plans for identified successors.",
                "metrics": {"critical_roles": 7, "strong": 3, "adequate": 2, "at_risk": 2, "bench_strength": 2.8},
            },
            {
                "title": "Risk & Investment",
                "narrative": f"Overall organizational health score: 75/100. Technology department shows elevated attrition risk (7.1%). "
                "Recommended Q3 investment: $1.2M additional reskilling budget, $0.8M for succession acceleration. "
                "Projected ROI on combined investment: 2.4x over 18 months.",
                "metrics": {"health_score": 75, "attrition_risk_depts": 1, "recommended_investment": 2000000, "projected_roi": 2.4},
            },
        ],
        "key_actions": [
            {"priority": "High", "action": "Fill Director Data Science succession gap", "owner": "VP Technology", "deadline": "Q3 2026"},
            {"priority": "High", "action": "Expand AI/ML reskilling cohort to 20 participants", "owner": "L&D", "deadline": "Q3 2026"},
            {"priority": "Medium", "action": "Address Technology dept attrition (7.1%)", "owner": "VP Technology", "deadline": "Q4 2026"},
            {"priority": "Medium", "action": "Increase offer acceptance rate to 80%+", "owner": "Talent Acquisition", "deadline": "Q3 2026"},
            {"priority": "Low", "action": "Evaluate automation opportunities in Operations", "owner": "VP Operations", "deadline": "Q4 2026"},
        ],
    }
    return report


# ═══════════════════════════════════════════════════════════════════════════════
# SCENARIO COMPARISON
# ═══════════════════════════════════════════════════════════════════════════════
@app.post("/api/scenarios/compare")
def compare_scenarios(scenarios: list[ScenarioRequest]):
    """Run multiple scenarios and compare results."""
    results = []
    for s in scenarios[:3]:  # max 3 scenarios
        result = run_agent(s.scenario)
        results.append({
            "scenario": s.scenario,
            "summary": result.summary,
            "actions_breakdown": result.summary.get("actions_breakdown", {}),
            "total_cost": result.summary.get("total_cost_usd", 0),
            "confidence": result.summary.get("confidence_avg", 0),
            "flagged": result.summary.get("flagged_for_review", 0),
        })
    return results


# ═══════════════════════════════════════════════════════════════════════════════
# WORKFORCE ANALYTICS
# ═══════════════════════════════════════════════════════════════════════════════
@app.get("/api/analytics/workforce")
def get_workforce_analytics():
    """Workforce analytics data."""
    employees = load_employees()

    # Performance distribution
    perf_dist = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, "null": 0}
    for e in employees:
        if e["performance_rating"]:
            perf_dist[e["performance_rating"]] += 1
        else:
            perf_dist["null"] += 1

    # Tenure distribution
    tenure_buckets = {"0-2yr": 0, "2-5yr": 0, "5-10yr": 0, "10+yr": 0}
    for e in employees:
        t = e["tenure_years"]
        if t < 2: tenure_buckets["0-2yr"] += 1
        elif t < 5: tenure_buckets["2-5yr"] += 1
        elif t < 10: tenure_buckets["5-10yr"] += 1
        else: tenure_buckets["10+yr"] += 1

    # Department headcount
    dept_count = {}
    for e in employees:
        dept_count[e["department"]] = dept_count.get(e["department"], 0) + 1

    # Grade distribution
    grade_dist = {}
    for e in employees:
        grade_dist[e["grade"]] = grade_dist.get(e["grade"], 0) + 1

    # Skills coverage
    skill_counts = {}
    for e in employees:
        for s in e["skills"]:
            skill_counts[s] = skill_counts.get(s, 0) + 1
    top_skills = sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)[:15]

    # Location distribution
    loc_dist = {}
    for e in employees:
        loc_dist[e["location"]] = loc_dist.get(e["location"], 0) + 1

    # Retention risk
    high_risk = [e for e in employees if e["performance_rating"] and e["performance_rating"] >= 4 and e["tenure_years"] > 5]

    return {
        "total_employees": len(employees),
        "performance_distribution": perf_dist,
        "tenure_distribution": tenure_buckets,
        "department_headcount": dept_count,
        "grade_distribution": grade_dist,
        "top_skills": top_skills,
        "location_distribution": loc_dist,
        "retention_risk_count": len(high_risk),
        "data_quality": {
            "missing_skills": sum(1 for e in employees if not e["skills"]),
            "null_performance": sum(1 for e in employees if not e["performance_rating"]),
            "total": len(employees),
        },
    }


# ═══════════════════════════════════════════════════════════════════════════════
# MY TEAM (Manager — own department only)
# ═══════════════════════════════════════════════════════════════════════════════
@app.get("/api/team/{department}")
def get_team(department: str, manager_id: str = ""):
    """Get team members for a manager. If manager_id provided, returns direct reports only."""
    employees = load_employees()
    if manager_id:
        team = [e for e in employees if e.get("manager_id", "") == manager_id]
    else:
        team = [e for e in employees if e["department"].lower() == department.lower()]
    return {
        "department": department,
        "headcount": len(team),
        "members": [{
            "employee_id": e["employee_id"],
            "name": f"{e['first_name']} {e['last_name']}",
            "role": e["role"],
            "grade": e["grade"],
            "tenure_years": e["tenure_years"],
            "performance_rating": e["performance_rating"],
            "skills": e["skills"],
            "location": e["location"],
            "retention_risk": "high" if e["performance_rating"] and e["performance_rating"] >= 4 and e["tenure_years"] > 5 else "low",
        } for e in team],
        "stats": {
            "avg_tenure": round(sum(e["tenure_years"] for e in team) / max(len(team), 1), 1),
            "avg_performance": round(sum(e["performance_rating"] for e in team if e["performance_rating"]) / max(sum(1 for e in team if e["performance_rating"]), 1), 1),
            "missing_skills": sum(1 for e in team if not e["skills"]),
            "high_performers": sum(1 for e in team if e["performance_rating"] and e["performance_rating"] >= 4),
        }
    }


# ═══════════════════════════════════════════════════════════════════════════════
# APPROVALS (Manager — pending actions)
# ═══════════════════════════════════════════════════════════════════════════════
@app.get("/api/approvals")
def get_approvals(department: str = "Technology"):
    """Mock pending approvals for manager — scoped to their department."""
    employees = load_employees()
    tech_emps = [e for e in employees if e["department"] == department][:8]

    approvals = []
    types = ["Reskilling Nomination", "Redeployment Request", "Hiring Approval", "Budget Increase"]
    statuses = ["Pending", "Pending", "Pending", "Approved", "Rejected"]

    for i, emp in enumerate(tech_emps):
        approvals.append({
            "id": f"APR-{1001+i}",
            "type": types[i % len(types)],
            "employee_name": f"{emp['first_name']} {emp['last_name']}",
            "employee_id": emp["employee_id"],
            "description": f"{'Reskill to ML Engineer' if i%4==0 else 'Transfer to Data team' if i%4==1 else 'New headcount request' if i%4==2 else 'Training budget +$5k'}",
            "submitted_date": f"2026-06-{10+i:02d}",
            "status": statuses[i % len(statuses)],
            "priority": "high" if i < 3 else "medium",
            "cost_usd": random.choice([5000, 8000, 12000, 15000, 25000]),
        })
    return approvals


@app.post("/api/approvals/{approval_id}/action")
def action_approval(approval_id: str, action: dict):
    """Approve or reject an approval request."""
    return {"id": approval_id, "action": action.get("action", "approved"), "status": "success"}


# ═══════════════════════════════════════════════════════════════════════════════
# EXECUTIVE — Risk Dashboard (anonymized, aggregated)
# ═══════════════════════════════════════════════════════════════════════════════
@app.get("/api/executive/risk")
def get_executive_risk():
    """Strategic risk dashboard — aggregated, no employee names."""
    employees = load_employees()
    future_roles = load_future_roles()
    org = load_org_structure()

    # Skill gap risk by department
    dept_risks = {}
    for dept_info in org:
        dept = dept_info["department"]
        dept_emps = [e for e in employees if e["department"] == dept]
        missing_skills = sum(1 for e in dept_emps if not e["skills"])
        high_perf_at_risk = sum(1 for e in dept_emps if e["performance_rating"] and e["performance_rating"] >= 4 and e["tenure_years"] > 5)
        dept_risks[dept] = {
            "headcount": len(dept_emps),
            "missing_skills_pct": round(missing_skills / max(len(dept_emps), 1) * 100),
            "retention_risk_count": high_perf_at_risk,
            "avg_performance": round(sum(e["performance_rating"] for e in dept_emps if e["performance_rating"]) / max(sum(1 for e in dept_emps if e["performance_rating"]), 1), 1),
            "budget": dept_info["annual_hr_budget_usd"],
        }

    # Critical gaps
    critical_gaps = [r for r in future_roles if r["priority"] in ("critical", "high") and r["target_y1"] > r["current_headcount"]]

    # Overall risk score
    total_gap = sum(r["target_y1"] - r["current_headcount"] for r in critical_gaps)
    total_retention_risk = sum(v["retention_risk_count"] for v in dept_risks.values())

    return {
        "overall_risk_score": min(100, total_gap * 3 + total_retention_risk * 2),
        "risk_level": "High" if total_gap > 15 else "Medium" if total_gap > 8 else "Low",
        "department_risks": dept_risks,
        "critical_skill_gaps": [{
            "role": r["role"],
            "department": r["department"],
            "gap": r["target_y1"] - r["current_headcount"],
            "priority": r["priority"],
        } for r in critical_gaps],
        "total_retention_risk": total_retention_risk,
        "total_open_positions": total_gap,
        "workforce_readiness_pct": round((1 - sum(1 for e in employees if not e["skills"]) / len(employees)) * 100),
    }


# ═══════════════════════════════════════════════════════════════════════════════
# EXECUTIVE — Investment Calculator
# ═══════════════════════════════════════════════════════════════════════════════
@app.get("/api/executive/investment")
def get_investment_calc():
    """Workforce investment overview — costs by action type."""
    result = run_agent("Double AI and ML capacity while reducing operations by 20% over 3 years")
    org = load_org_structure()
    total_budget = sum(o["annual_hr_budget_usd"] for o in org)

    recs = result.recommendations
    cost_by_action = {}
    count_by_action = {}
    for r in recs:
        action = r["action"]
        cost_by_action[action] = cost_by_action.get(action, 0) + r["cost_estimate_usd"]
        count_by_action[action] = count_by_action.get(action, 0) + 1

    cost_by_dept = {}
    for r in recs:
        dept = r["department"]
        cost_by_dept[dept] = cost_by_dept.get(dept, 0) + r["cost_estimate_usd"]

    total_cost = sum(cost_by_action.values())

    return {
        "total_investment_usd": total_cost,
        "total_budget_usd": total_budget,
        "investment_as_pct_of_budget": round(total_cost / total_budget * 100, 1),
        "cost_by_action": cost_by_action,
        "count_by_action": count_by_action,
        "cost_by_department": cost_by_dept,
        "roi_estimate": {
            "reskill_vs_hire_savings": round(cost_by_action.get("BUILD", 0) * 0.6),
            "redeployment_savings": count_by_action.get("REDEPLOY", 0) * 14500,
            "automation_annual_savings": count_by_action.get("AUTOMATE", 0) * 75000,
        },
        "timeline": {
            "year_1": round(total_cost * 0.5),
            "year_2": round(total_cost * 0.35),
            "year_3": round(total_cost * 0.15),
        }
    }


# ═══════════════════════════════════════════════════════════════════════════════
# STATIC FILE SERVING (React build)
# ═══════════════════════════════════════════════════════════════════════════════
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if os.path.isdir(STATIC_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="assets")

    @app.get("/{path:path}")
    def serve_react(path: str):
        file_path = os.path.join(STATIC_DIR, path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))
