# Workforce Planning Agent — One-Page Approach

> **Focused problem. Clear business outcome. Actionable decisions — not another report.**

---

## 1. How I Frame the Problem

**The gap is not data — it is decisions.**

Organizations already have workforce data in SAP SuccessFactors Employee Central (EC): headcount, roles, skills, performance ratings, org structure. What they lack is an answer to the question leadership actually needs:

> *"Given our business strategy and financial plan, what specific workforce actions should we take — for which people, in which roles — over the next three years?"*

I frame this as a **Workforce Action Decision Engine**: a single-scenario agent that takes a natural-language strategic intent (e.g., *"Double AI/ML capacity while reducing back-office ops by 20% over 3 years"*) and returns a prioritized, costed, per-role action plan using the industry-standard **BBRA framework**:

| Action | Meaning | When |
|--------|---------|------|
| **Build** | Reskill existing employees | Strategic skill, time available, adjacent capability exists |
| **Buy** | Hire externally | Skill scarce internally, time-critical |
| **Redeploy** | Move talent internally | Skill already exists elsewhere in org |
| **Automate** | Replace with AI/tooling | High-repetition, low-judgment task work |

**Why this problem, not another?**
Reskilling costs 20–30% of a new hire. Redeployment is nearly free when the data exists. Yet 92% of organizations still use manual skills mapping and default to external hiring. A focused decision engine that recommends Build vs. Buy vs. Redeploy vs. Automate — with cost estimates and confidence scores — delivers immediate, measurable business value.

---

## 2. How I Decompose It

The system is broken into five layers, each with a single responsibility:

```
[1] DATA LAYER          Mock SAP EC data: employees, skills, org structure,
                        future role targets, salary bands, skills taxonomy.
                        Intentionally imperfect — missing fields, stale ratings.

[2] STRATEGY PARSER     LLM tool. Converts natural-language scenario into
                        structured intent: roles_to_grow, roles_to_reduce,
                        skill_targets, timeline, budget_signal.

[3] GAP ANALYZER        Deterministic tool. Compares current workforce inventory
                        against future state needs. Outputs gap matrix per role/skill.

[4] EMPLOYEE ASSESSOR   LLM tool. Scores each employee's reskilling fit,
                        internal mobility potential, and retention risk
                        using profile + performance + tenure signals.

[5] ACTION RECOMMENDER  Rules + LLM. Assigns BBRA action per employee/role.
                        Attaches cost estimate, confidence score, and rationale.

[6] PLAN SYNTHESIZER    LLM tool. Produces executive summary, 3-year phased
                        timeline, total investment, and top strategic risks.

[7] STREAMLIT UI        Scenario input box → results dashboard:
                        action table, cost summary, risk flags.
```

**Orchestration:** A single orchestrator agent calls these tools in sequence, passing state through a shared context object. LangGraph manages the state machine.

---

## 3. Where I Use Deterministic Logic vs. AI Reasoning

This is the most important architectural decision. The rule is simple:

> *Deterministic for anything that must be mathematically correct. AI for anything that requires judgment, interpretation, or synthesis.*

| Deterministic (Trust with Math) | AI Reasoning (Trust with Nuance) |
|---|---|
| Skill gap count: `future_need − current_inventory` | Parse free-text strategic scenario into structured targets |
| Headcount balancing: `future = current + hire − separate ± redeploy` | Assess reskilling potential from employee profile signals |
| Cost estimation: salary bands × reskill cost table | Explain *why* a specific action is recommended |
| BBRA rule gates: grade < 3 AND perf < 2 → flag for REVIEW | Flag contradictory signals (high performer in declining role) |
| Data quality checks: null skills, stale dates, duplicate roles | Generate executive narrative and risk commentary |
| Confidence threshold gates: score < 0.6 → NEEDS_HR_REVIEW | Synthesize phased 3-year action plan |

The LLM **never touches numbers directly** — it receives pre-computed facts and reasons over them. This prevents hallucinated costs or fabricated headcount figures.

---

## 4. How I Handle Uncertainty

Uncertainty in enterprise HR data is not an edge case — it is the default. The system is designed to surface it, not hide it.

**Four uncertainty patterns and how each is handled:**

**Missing data** — Employee skill profiles that are incomplete or stale (>18 months old) are flagged in the output with a `DATA_QUALITY` warning. The recommendation is still generated but marked lower-confidence. The system never silently defaults.

**Contradictory signals** — When an employee shows high performance but sits in a role targeted for reduction, the system surfaces a `STRATEGIC_RISK` flag rather than forcing a recommendation. This is explicitly handed to HR for human review.

**Low LLM confidence** — Every LLM-generated recommendation includes a confidence score (0.0–1.0). Any score below 0.6 is tagged `NEEDS_HR_REVIEW` and excluded from automated cost totals. The system reports: *"X employees could not be confidently classified and require HR judgment."*

**Strategic ambiguity** — When the parsed strategy intent is vague (e.g., "improve efficiency"), the Strategy Parser returns clarifying questions before proceeding. It never invents specificity the user did not provide.

**Human-in-the-loop principle:** The system recommends — it does not decide. Every output is designed to be reviewed, challenged, and overridden by an HR professional or business leader.

---

## 5. How I Evaluate Whether the System Is Working

Five evaluation checks run automatically after every agent execution:

| Check | Method | Pass Condition |
|-------|--------|----------------|
| **Coverage** | Count employees with assigned BBRA action | 100% of employees classified (or explicitly flagged) |
| **Headcount math** | Assert: `future_HC = current + hired − separated ± redeployed` per dept | Zero delta violations |
| **Consistency** | Run same scenario 3× with same data | Categorical actions match ≥85% across runs |
| **Hallucination guard** | Verify all employee names/IDs in output exist in source dataset | 0 phantom references |
| **Cost sanity** | Total plan cost vs. configurable annual HR budget threshold | Cost < 2× annual HR budget (default) |

**What good output looks like:**
A correct run produces a table where every role gap has a costed BBRA action, the headcount math balances across all departments, no employee appears who was not in the source data, and the executive summary cites only facts derived from the gap analysis — no invented statistics.

**What failure looks like (and how it is caught):**
If the LLM invents a skill requirement not in the taxonomy, the hallucination guard catches it. If headcount math drifts, the assertion fails visibly. If the same employee gets different actions across runs, the consistency check flags it for prompt tuning.

---

## Key Tradeoffs

| Decision | Chosen | Why |
|----------|--------|-----|
| Scope: one focused problem | BBRA decision engine | Depth over breadth delivers real value in 2–4 hrs |
| UI: Streamlit | vs. FastAPI | Speed to demo; production path is clear |
| Agent framework: LangGraph | vs. raw LLM calls | State machine ensures deterministic flow order |
| Mock data: CSV/JSON | vs. live EC API | Controllable, reproducible, no auth overhead |
| LLM role: reasoning only | LLM never computes numbers | Prevents hallucinated figures in financial outputs |

---

*Built for: Forward Deployed AI Engineer Coding Exercise — SAP SuccessFactors Workforce Planning Agent*
*Time budget: 2–4 hours | Stack: Python, LangGraph, Pandas, Streamlit, Anthropic/OpenAI API*
