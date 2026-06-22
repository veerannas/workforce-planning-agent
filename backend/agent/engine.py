"""
WFP Agent Engine — Rule-based workforce planning agent.
Phases: UNDERSTAND → ASSESS → RECOMMEND
Each tool is deterministic or rule-based (mock LLM).
"""
import json
import csv
import os
import re
import random
from dataclasses import dataclass, field, asdict
from typing import Optional

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

# Grade conversion: IC1-IC5 / M1-M3 → T1-1 through T5-3
_GRADE_LEVEL: dict[str, str] = {
    "IC1": "T1", "IC2": "T2", "IC3": "T3", "IC4": "T4", "IC5": "T5",
    "M1":  "T3", "M2":  "T4", "M3":  "T5",
}

def convert_grade(raw_grade: str, employee_id: str) -> str:
    """Map IC/M grades to T1-1..T5-3 format. Sub-grade (1-3) is deterministic from emp id."""
    level = _GRADE_LEVEL.get(raw_grade, "T1")
    sub = (int(employee_id[3:]) % 3) + 1  # EMP01000 → 1000 % 3 + 1 → 1-3
    return f"{level}-{sub}"


# ═══════════════════════════════════════════════════════════════════════════════
# DATA LOADING
# ═══════════════════════════════════════════════════════════════════════════════
def load_employees() -> list[dict]:
    with open(os.path.join(DATA_DIR, "employees.csv")) as f:
        reader = csv.DictReader(f)
        employees = []
        for row in reader:
            row["skills"] = [s.strip() for s in row["skills"].split("|") if s.strip()]
            row["tenure_years"] = float(row["tenure_years"])
            row["salary"] = int(row["salary"])
            row["performance_rating"] = int(row["performance_rating"]) if row["performance_rating"] else None
            row["raw_grade"] = row["grade"]  # preserve original for hierarchy logic
            row["grade"] = convert_grade(row["grade"], row["employee_id"])
            employees.append(row)
    return employees


def load_skills_taxonomy() -> list[dict]:
    with open(os.path.join(DATA_DIR, "skills_taxonomy.json")) as f:
        return json.load(f)


def load_future_roles() -> list[dict]:
    with open(os.path.join(DATA_DIR, "future_roles.json")) as f:
        return json.load(f)


def load_org_structure() -> list[dict]:
    with open(os.path.join(DATA_DIR, "org_structure.json")) as f:
        return json.load(f)


# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 1: UNDERSTAND — Strategy Parser + Gap Analyzer
# ═══════════════════════════════════════════════════════════════════════════════
@dataclass
class StrategyTarget:
    roles_to_grow: list[str] = field(default_factory=list)
    roles_to_reduce: list[str] = field(default_factory=list)
    skill_targets: list[str] = field(default_factory=list)
    timeline_years: int = 3
    parsed_confidence: float = 0.0
    clarifying_questions: list[str] = field(default_factory=list)


def parse_strategy(scenario_text: str, scenario_type: str = "general") -> StrategyTarget:
    """Rule-based strategy parser. scenario_type drives distinct role/skill targets
    so each chip produces genuinely different recommendations."""
    text = scenario_text.lower()
    target = StrategyTarget()
    future_roles = load_future_roles()

    # ── Scenario-type fast paths (one per chip, fully distinct targets) ──
    # Employee chips
    if scenario_type == "career_ai":
        target.roles_to_grow = ["ML Engineer", "AI Product Manager"]
        target.skill_targets = ["Machine Learning", "Python", "Deep Learning", "TensorFlow"]
        target.timeline_years = 1
        target.parsed_confidence = 0.9
        return target

    if scenario_type == "career_transition":
        target.roles_to_grow = ["Platform Engineer", "AI Product Manager"]
        target.skill_targets = ["Cloud Architecture", "Kubernetes", "Docker", "Terraform"]
        target.timeline_years = 2
        target.parsed_confidence = 0.9
        return target

    if scenario_type == "skill_gap":
        target.roles_to_grow = ["Data Engineer", "Data Analyst"]
        target.skill_targets = ["Data Pipelines", "SQL", "Python", "Power BI"]
        target.timeline_years = 1
        target.parsed_confidence = 0.9
        return target

    # Manager chips
    if scenario_type == "team_capacity":
        target.roles_to_grow = ["ML Engineer", "Data Engineer"]
        target.roles_to_reduce = ["Operations Analyst", "Administrative Assistant"]
        target.skill_targets = ["Machine Learning", "Python", "Data Pipelines", "Cloud Architecture"]
        target.timeline_years = 2
        target.parsed_confidence = 0.9
        return target

    if scenario_type == "succession":
        target.roles_to_grow = ["AI Product Manager", "Platform Engineer", "FP&A Analyst"]
        target.skill_targets = ["Cloud Architecture", "Machine Learning", "SQL", "Data Pipelines"]
        target.timeline_years = 2
        target.parsed_confidence = 0.9
        return target

    if scenario_type == "automation_opportunity":
        target.roles_to_reduce = [
            "Operations Analyst", "Administrative Assistant",
            "Procurement Specialist", "Accounts Payable Clerk",
        ]
        target.roles_to_grow = ["ML Engineer", "Data Engineer"]
        target.skill_targets = ["Machine Learning", "Python", "Data Pipelines"]
        target.timeline_years = 2
        target.parsed_confidence = 0.9
        return target

    # Executive chips
    if scenario_type == "org_transformation":
        target.roles_to_grow = [r["role"] for r in future_roles if r["priority"] in ("critical", "high")]
        target.roles_to_reduce = [r["role"] for r in future_roles if r["priority"] == "reduce"]
        target.skill_targets = ["Machine Learning", "Python", "Cloud Architecture", "Data Pipelines", "Kubernetes"]
        target.timeline_years = 3
        target.parsed_confidence = 0.95
        return target

    if scenario_type == "cost_optimisation":
        target.roles_to_reduce = [r["role"] for r in future_roles if r["priority"] == "reduce"]
        target.roles_to_grow = ["Data Analyst", "FP&A Analyst"]
        target.skill_targets = ["SQL", "Power BI", "Python", "Data Pipelines"]
        target.timeline_years = 2
        target.parsed_confidence = 0.95
        return target

    if scenario_type == "talent_strategy":
        target.roles_to_grow = ["ML Engineer", "AI Product Manager", "Data Engineer", "Platform Engineer"]
        target.skill_targets = ["Machine Learning", "Deep Learning", "Python", "Cloud Architecture", "Kubernetes", "Data Pipelines"]
        target.timeline_years = 2
        target.parsed_confidence = 0.95
        return target

    # ── Fallback: free-text parsing for manually typed scenarios ──
    growth_keywords = {"grow", "double", "triple", "increase", "expand", "hire", "scale", "build", "invest"}
    reduce_keywords = {"reduce", "cut", "shrink", "eliminate", "automate", "consolidate", "downsize"}

    for role_data in future_roles:
        role_lower = role_data["role"].lower()
        if any(kw in text for kw in growth_keywords) and role_lower in text:
            target.roles_to_grow.append(role_data["role"])
        elif any(kw in text for kw in reduce_keywords) and role_lower in text:
            target.roles_to_reduce.append(role_data["role"])

    if not target.roles_to_grow and not target.roles_to_reduce:
        if any(kw in text for kw in {"ai", "ml", "machine learning", "data", "digital", "cloud", "platform"}):
            target.roles_to_grow = [r["role"] for r in future_roles if r["priority"] in ("critical", "high")]
            target.roles_to_reduce = [r["role"] for r in future_roles if r["priority"] == "reduce"]
            target.skill_targets = ["Machine Learning", "Python", "Cloud Architecture", "Data Pipelines"]
        elif any(kw in text for kw in {"cost", "efficiency", "lean", "save"}):
            target.roles_to_reduce = [r["role"] for r in future_roles if r["priority"] == "reduce"]
            target.roles_to_grow = []
        else:
            target.clarifying_questions = [
                "Which departments or roles does this strategy primarily affect?",
                "Are there specific skills or capabilities you want to build?",
                "What is the timeline for these changes (1, 2, or 3 years)?",
                "Is there a budget constraint or headcount target?"
            ]
            target.parsed_confidence = 0.3
            return target

    # Extract timeline
    timeline_match = re.search(r"(\d+)\s*year", text)
    if timeline_match:
        target.timeline_years = min(int(timeline_match.group(1)), 3)

    # Extract skills
    taxonomy = load_skills_taxonomy()
    all_skill_names = {s["skill"].lower(): s["skill"] for s in taxonomy}
    for skill_lower, skill_proper in all_skill_names.items():
        if skill_lower in text:
            target.skill_targets.append(skill_proper)

    # If still no skills, infer from growth roles
    if not target.skill_targets and target.roles_to_grow:
        for role_data in future_roles:
            if role_data["role"] in target.roles_to_grow:
                target.skill_targets.extend(role_data["required_skills"])
        target.skill_targets = list(set(target.skill_targets))

    target.parsed_confidence = 0.85 if target.roles_to_grow or target.roles_to_reduce else 0.5
    return target


@dataclass
class GapEntry:
    role: str
    department: str
    skill: str
    current_count: int
    needed_count: int
    delta: int
    year: int
    priority: str


def analyze_gaps(strategy: StrategyTarget) -> list[GapEntry]:
    """Deterministic gap analysis: current inventory vs future needs."""
    employees = load_employees()
    future_roles = load_future_roles()
    gaps = []

    for role_data in future_roles:
        role = role_data["role"]
        dept = role_data["department"]

        # Count current employees in this role
        current_in_role = [e for e in employees if e["role"] == role and e["department"] == dept]
        current_count = len(current_in_role)

        # Determine target based on strategy
        if role in strategy.roles_to_grow:
            targets = [role_data["target_y1"], role_data["target_y2"], role_data["target_y3"]]
        elif role in strategy.roles_to_reduce:
            targets = [role_data["target_y1"], role_data["target_y2"], role_data["target_y3"]]
        else:
            targets = [current_count, current_count, current_count]  # no change

        # Gap per year
        for year_idx, target in enumerate(targets):
            delta = target - current_count
            if delta != 0:
                for skill in role_data["required_skills"]:
                    # Count how many current employees have this skill
                    skilled_count = sum(1 for e in current_in_role if skill in e["skills"])
                    skill_gap = target - skilled_count
                    if skill_gap > 0 or delta < 0:
                        gaps.append(GapEntry(
                            role=role, department=dept, skill=skill,
                            current_count=skilled_count, needed_count=max(0, target),
                            delta=skill_gap if delta > 0 else delta,
                            year=year_idx + 1, priority=role_data["priority"]
                        ))

    return gaps


# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 2: ASSESS — Employee Assessor + Uncertainty Engine
# ═══════════════════════════════════════════════════════════════════════════════
@dataclass
class EmployeeAssessment:
    employee_id: str
    employee_name: str
    department: str
    current_role: str
    grade: str
    reskill_fit: float = 0.0
    redeploy_fit: float = 0.0
    retention_risk: str = "unknown"
    target_role: Optional[str] = None
    matching_skills: list[str] = field(default_factory=list)
    missing_skills: list[str] = field(default_factory=list)
    flags: list[str] = field(default_factory=list)
    flag_details: list[str] = field(default_factory=list)


def assess_employees(strategy: StrategyTarget, gaps: list[GapEntry]) -> list[EmployeeAssessment]:
    """Rule-based employee assessment with uncertainty detection."""
    employees = load_employees()
    taxonomy = {s["skill"]: s for s in load_skills_taxonomy()}
    future_roles = load_future_roles()
    assessments = []

    # Build target skills set from growth roles
    target_skills = set(strategy.skill_targets)
    for role_data in future_roles:
        if role_data["role"] in strategy.roles_to_grow:
            target_skills.update(role_data["required_skills"])

    for emp in employees:
        assessment = EmployeeAssessment(
            employee_id=emp["employee_id"],
            employee_name=f"{emp['first_name']} {emp['last_name']}",
            department=emp["department"],
            current_role=emp["role"],
            grade=emp["grade"]
        )

        # ── Uncertainty Engine: Gate 1 — Data Quality ──
        if not emp["skills"]:
            assessment.flags.append("DATA_QUALITY")
            assessment.flag_details.append("Missing skills data — cannot assess reskilling potential")
            assessment.reskill_fit = 0.0
            assessment.redeploy_fit = 0.0
            assessment.retention_risk = "unknown"
            assessments.append(assessment)
            continue

        if emp["last_skill_update"] and emp["last_skill_update"] < "2024-06-01":
            assessment.flags.append("DATA_QUALITY")
            assessment.flag_details.append(f"Skills last updated {emp['last_skill_update']} — may be stale")

        if emp["performance_rating"] is None:
            assessment.flags.append("DATA_QUALITY")
            assessment.flag_details.append("Missing performance rating")

        # ── Calculate reskill_fit ──
        emp_skills = set(emp["skills"])
        matching = emp_skills & target_skills
        missing = target_skills - emp_skills
        assessment.matching_skills = list(matching)
        assessment.missing_skills = list(missing)[:5]  # top 5

        # Adjacency score: how close are current skills to target skills
        adjacency_scores = []
        for skill in emp["skills"]:
            if skill in taxonomy:
                adjacency_scores.append(taxonomy[skill]["ai_adjacency_score"])
        avg_adjacency = sum(adjacency_scores) / len(adjacency_scores) if adjacency_scores else 0.3

        # Reskill fit = weighted combination
        skill_overlap = len(matching) / max(len(target_skills), 1)
        perf_factor = (emp["performance_rating"] / 5.0) if emp["performance_rating"] else 0.5
        tenure_factor = min(emp["tenure_years"] / 10, 1.0)  # longer tenure = more institutional knowledge

        assessment.reskill_fit = round(min(1.0,
            0.35 * skill_overlap + 0.25 * avg_adjacency + 0.25 * perf_factor + 0.15 * tenure_factor
        ), 2)

        # ── Calculate redeploy_fit ──
        # Can this person fill a growth role as-is?
        best_role_fit = 0.0
        best_target_role = None
        for role_data in future_roles:
            if role_data["role"] in strategy.roles_to_grow:
                required = set(role_data["required_skills"])
                overlap = len(emp_skills & required) / max(len(required), 1)
                if overlap > best_role_fit:
                    best_role_fit = overlap
                    best_target_role = role_data["role"]

        assessment.redeploy_fit = round(best_role_fit, 2)
        assessment.target_role = best_target_role

        # ── Calculate retention_risk ──
        if emp["performance_rating"] and emp["performance_rating"] >= 4 and emp["tenure_years"] > 5:
            assessment.retention_risk = "high"  # top performers with tenure are at risk if mismanaged
        elif emp["tenure_years"] < 2:
            assessment.retention_risk = "medium"
        else:
            assessment.retention_risk = "low"

        # ── Uncertainty Engine: Gate 2 — Confidence ──
        if assessment.reskill_fit < 0.3 and assessment.redeploy_fit < 0.3:
            if emp["performance_rating"] and emp["performance_rating"] >= 3:
                assessment.flags.append("NEEDS_HR_REVIEW")
                assessment.flag_details.append("Low fit scores but adequate performance — may have unlisted skills")

        # ── Uncertainty Engine: Gate 3 — Contradiction ──
        if emp["performance_rating"] and emp["performance_rating"] >= 4:
            if emp["role"] in strategy.roles_to_reduce:
                assessment.flags.append("STRATEGIC_RISK")
                assessment.flag_details.append(
                    f"High performer (rating {emp['performance_rating']}/5) in role targeted for reduction ({emp['role']})")

        # ── Uncertainty Engine: Gate 2 — Low confidence cap ──
        if any(f == "DATA_QUALITY" for f in assessment.flags):
            assessment.reskill_fit = min(assessment.reskill_fit, 0.5)

        assessments.append(assessment)

    return assessments


# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 3: RECOMMEND — Action Recommender + Plan Synthesizer
# ═══════════════════════════════════════════════════════════════════════════════
@dataclass
class Recommendation:
    employee_id: str
    employee_name: str
    department: str
    current_role: str
    action: str  # BUILD, BUY, REDEPLOY, AUTOMATE, REVIEW
    target_role: Optional[str]
    confidence: float
    cost_estimate_usd: int
    rationale: str
    flags: list[str] = field(default_factory=list)
    timeline_months: int = 0


def recommend_actions(strategy: StrategyTarget, assessments: list[EmployeeAssessment]) -> list[Recommendation]:
    """Rule-based BBRA action assignment with cost estimation."""
    taxonomy = {s["skill"]: s for s in load_skills_taxonomy()}
    recommendations = []

    for a in assessments:
        # Employees with STRATEGIC_RISK or NEEDS_HR_REVIEW → REVIEW action
        if "STRATEGIC_RISK" in a.flags or "NEEDS_HR_REVIEW" in a.flags:
            rec = Recommendation(
                employee_id=a.employee_id, employee_name=a.employee_name,
                department=a.department, current_role=a.current_role,
                action="REVIEW", target_role=a.target_role,
                confidence=0.4, cost_estimate_usd=0,
                rationale=f"Flagged for HR review: {'; '.join(a.flag_details)}",
                flags=a.flags, timeline_months=0
            )
            recommendations.append(rec)
            continue

        # Missing data employees
        if not a.matching_skills and not a.missing_skills and "DATA_QUALITY" in a.flags:
            rec = Recommendation(
                employee_id=a.employee_id, employee_name=a.employee_name,
                department=a.department, current_role=a.current_role,
                action="REVIEW", target_role=None,
                confidence=0.3, cost_estimate_usd=0,
                rationale="Insufficient data to make recommendation — skills profile empty",
                flags=a.flags, timeline_months=0
            )
            recommendations.append(rec)
            continue

        # ── BBRA Decision Rules ──
        # Rule 1: High redeploy fit (>0.7) → REDEPLOY
        if a.redeploy_fit >= 0.7:
            rec = Recommendation(
                employee_id=a.employee_id, employee_name=a.employee_name,
                department=a.department, current_role=a.current_role,
                action="REDEPLOY", target_role=a.target_role,
                confidence=round(0.6 + a.redeploy_fit * 0.3, 2),
                cost_estimate_usd=5000,  # internal transfer cost
                rationale=f"Strong skill match ({a.redeploy_fit:.0%}) for {a.target_role}. "
                         f"Has {len(a.matching_skills)} of required skills. Fastest path to fill gap.",
                flags=a.flags, timeline_months=1
            )
            recommendations.append(rec)
            continue

        # Rule 2: Good reskill fit (>0.5) + role is growing → BUILD
        if a.reskill_fit >= 0.5 and a.current_role not in strategy.roles_to_reduce:
            # Estimate reskilling cost from taxonomy
            reskill_cost = 0
            reskill_weeks = 0
            for skill in a.missing_skills[:3]:
                if skill in taxonomy:
                    reskill_cost += taxonomy[skill]["reskill_cost_usd"]
                    reskill_weeks += taxonomy[skill]["reskill_weeks"]

            rec = Recommendation(
                employee_id=a.employee_id, employee_name=a.employee_name,
                department=a.department, current_role=a.current_role,
                action="BUILD", target_role=a.target_role,
                confidence=round(0.5 + a.reskill_fit * 0.4, 2),
                cost_estimate_usd=max(reskill_cost, 8000),
                rationale=f"Adjacent skills ({a.reskill_fit:.0%} fit). Missing: {', '.join(a.missing_skills[:3])}. "
                         f"Reskilling estimated at {reskill_weeks} weeks.",
                flags=a.flags, timeline_months=max(3, reskill_weeks // 4)
            )
            recommendations.append(rec)
            continue

        # Rule 3: Role is targeted for reduction + low fit → candidate for separation/automation
        if a.current_role in strategy.roles_to_reduce:
            if a.reskill_fit < 0.4 and a.redeploy_fit < 0.4:
                rec = Recommendation(
                    employee_id=a.employee_id, employee_name=a.employee_name,
                    department=a.department, current_role=a.current_role,
                    action="AUTOMATE", target_role=None,
                    confidence=round(0.5 + (1 - a.reskill_fit) * 0.3, 2),
                    cost_estimate_usd=0,  # no direct employee cost — role elimination
                    rationale=f"Role '{a.current_role}' targeted for reduction. "
                             f"Low reskill ({a.reskill_fit:.0%}) and redeploy ({a.redeploy_fit:.0%}) fit. "
                             f"Consider role automation or managed transition.",
                    flags=a.flags, timeline_months=6
                )
                recommendations.append(rec)
                continue
            else:
                # Can be reskilled despite role reduction
                reskill_cost = sum(taxonomy.get(s, {}).get("reskill_cost_usd", 5000) for s in a.missing_skills[:3])
                rec = Recommendation(
                    employee_id=a.employee_id, employee_name=a.employee_name,
                    department=a.department, current_role=a.current_role,
                    action="BUILD", target_role=a.target_role,
                    confidence=round(0.4 + a.reskill_fit * 0.4, 2),
                    cost_estimate_usd=max(reskill_cost, 8000),
                    rationale=f"Role declining but employee shows reskill potential ({a.reskill_fit:.0%}). "
                             f"Recommend transition to {a.target_role or 'growth role'}.",
                    flags=a.flags, timeline_months=6
                )
                recommendations.append(rec)
                continue

        # Rule 4: Default — no strong signal → maintain or low-priority build
        rec = Recommendation(
            employee_id=a.employee_id, employee_name=a.employee_name,
            department=a.department, current_role=a.current_role,
            action="BUILD", target_role=a.target_role,
            confidence=round(0.4 + a.reskill_fit * 0.3, 2),
            cost_estimate_usd=6000,
            rationale=f"Moderate fit. Recommend gradual upskilling in target areas. "
                     f"Current skills: {', '.join(a.matching_skills[:3]) or 'none matched'}.",
            flags=a.flags, timeline_months=9
        )
        recommendations.append(rec)

    return recommendations


@dataclass
class ExecutiveSummary:
    scenario: str
    total_employees: int
    actions_breakdown: dict[str, int]
    total_cost_usd: int
    cost_by_action: dict[str, int]
    cost_by_department: dict[str, int]
    flagged_for_review: int
    headcount_changes: dict[str, dict]
    top_risks: list[str]
    timeline_summary: str
    confidence_avg: float


def synthesize_plan(scenario: str, strategy: StrategyTarget, recommendations: list[Recommendation]) -> ExecutiveSummary:
    """Synthesize recommendations into executive summary."""
    org = load_org_structure()
    org_budgets = {o["department"]: o["annual_hr_budget_usd"] for o in org}

    actions_breakdown = {}
    cost_by_action = {}
    cost_by_dept = {}

    for rec in recommendations:
        actions_breakdown[rec.action] = actions_breakdown.get(rec.action, 0) + 1
        cost_by_action[rec.action] = cost_by_action.get(rec.action, 0) + rec.cost_estimate_usd
        cost_by_dept[rec.department] = cost_by_dept.get(rec.department, 0) + rec.cost_estimate_usd

    total_cost = sum(rec.cost_estimate_usd for rec in recommendations)
    flagged = sum(1 for rec in recommendations if rec.action == "REVIEW")
    confidences = [rec.confidence for rec in recommendations if rec.confidence > 0]

    # Headcount changes per department
    headcount_changes = {}
    for dept in ["Technology", "Operations", "Finance"]:
        dept_recs = [r for r in recommendations if r.department == dept]
        redeployed_in = sum(1 for r in dept_recs if r.action == "REDEPLOY")
        automated_out = sum(1 for r in dept_recs if r.action == "AUTOMATE")
        headcount_changes[dept] = {
            "current": len(dept_recs),
            "redeploy_in": redeployed_in,
            "automate_out": automated_out,
            "net_change": redeployed_in - automated_out
        }

    # Top risks
    risks = []
    if flagged > 10:
        risks.append(f"{flagged} employees flagged for HR review — high uncertainty in recommendations")
    if total_cost > sum(org_budgets.values()) * 0.2:
        risks.append(f"Total plan cost (${total_cost:,}) exceeds 20% of combined HR budget")
    automate_count = actions_breakdown.get("AUTOMATE", 0)
    if automate_count > 15:
        risks.append(f"{automate_count} roles targeted for automation — significant change management required")
    strategic_risks = sum(1 for r in recommendations if "STRATEGIC_RISK" in r.flags)
    if strategic_risks > 0:
        risks.append(f"{strategic_risks} high-performers in declining roles — retention risk if mishandled")
    if not risks:
        risks.append("Plan is within normal risk parameters")

    return ExecutiveSummary(
        scenario=scenario,
        total_employees=len(recommendations),
        actions_breakdown=actions_breakdown,
        total_cost_usd=total_cost,
        cost_by_action=cost_by_action,
        cost_by_department=cost_by_dept,
        flagged_for_review=flagged,
        headcount_changes=headcount_changes,
        top_risks=risks,
        timeline_summary=f"Phase 1 (0-6 mo): Redeploy {actions_breakdown.get('REDEPLOY', 0)} employees. "
                        f"Phase 2 (6-18 mo): Reskill {actions_breakdown.get('BUILD', 0)} employees. "
                        f"Phase 3 (12-36 mo): Automate {actions_breakdown.get('AUTOMATE', 0)} roles.",
        confidence_avg=round(sum(confidences) / len(confidences), 2) if confidences else 0.0
    )


# ═══════════════════════════════════════════════════════════════════════════════
# ORCHESTRATOR — Runs full pipeline
# ═══════════════════════════════════════════════════════════════════════════════
@dataclass
class AgentResult:
    strategy: dict
    gaps: list[dict]
    assessments: list[dict]
    recommendations: list[dict]
    summary: dict
    hr_review_queue: list[dict]


def run_agent(
    scenario_text: str,
    scenario_type: str = "general",
    user_role: str = "executive",
    employee_id: str | None = None,
    department: str | None = None,
) -> AgentResult:
    """Full agent pipeline: parse → gap → assess → recommend → synthesize.

    Scope rules (enforced here — never leaks cross-user data):
      employee  → only their own row (matched by employee_id)
      manager   → only rows where manager_id == employee_id
      executive → all rows (no filter)
    """
    # Phase 1: UNDERSTAND
    strategy = parse_strategy(scenario_text, scenario_type)

    if strategy.clarifying_questions:
        return AgentResult(
            strategy=asdict(strategy),
            gaps=[], assessments=[], recommendations=[],
            summary={"error": "Scenario too vague", "clarifying_questions": strategy.clarifying_questions},
            hr_review_queue=[]
        )

    gaps = analyze_gaps(strategy)

    # Phase 2: ASSESS (full org — we scope AFTER, not before, so gap analysis stays accurate)
    assessments = assess_employees(strategy, gaps)

    # Phase 3: RECOMMEND
    recommendations = recommend_actions(strategy, assessments)

    # ── Scope filter — applied before anything leaves this function ──
    if user_role == "employee" and employee_id:
        recommendations = [r for r in recommendations if r.employee_id == employee_id]
        assessments = [a for a in assessments if a.employee_id == employee_id]
    elif user_role == "manager" and employee_id:
        # Load raw employee list to resolve manager_id relationships
        all_employees = load_employees()
        team_ids = {e["employee_id"] for e in all_employees if e.get("manager_id") == employee_id}
        # Also include the manager themselves
        team_ids.add(employee_id)
        recommendations = [r for r in recommendations if r.employee_id in team_ids]
        assessments = [a for a in assessments if a.employee_id in team_ids]
    # executive: no filter

    # Synthesize on scoped recommendations
    summary = synthesize_plan(scenario_text, strategy, recommendations)

    hr_queue = [asdict(r) for r in recommendations if r.action == "REVIEW"]

    return AgentResult(
        strategy=asdict(strategy),
        gaps=[asdict(g) for g in gaps],
        assessments=[asdict(a) for a in assessments],
        recommendations=[asdict(r) for r in recommendations],
        summary=asdict(summary),
        hr_review_queue=hr_queue
    )
