# Workforce Planning Agent — Architecture & Design

> **AI-powered workforce decision engine for SAP SuccessFactors — built for the Executive, Manager, and Employee persona.**

---

## 1. Problem Statement

Organizations have workforce data in SAP SuccessFactors but lack actionable per-employee decisions aligned to business strategy. The Workforce Planning Agent answers:

> *"Given our business strategy and financial plan, what specific workforce actions should we take — for which people, in which roles — over the next three years?"*

The system uses the **UHRA framework**:

| Action | Meaning | When |
|--------|---------|------|
| **UpSkill** | Develop existing employees for new skills | Strategic skill, time available, adjacent capability exists |
| **Hire** | Hire externally | Skill scarce internally, time-critical |
| **ReSkill** | Move talent internally to different role | Skill already exists elsewhere in org |
| **Automate** | Replace with AI/tooling | High-repetition, low-judgment task work |

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + UI5 Web Components React 2.23.x + Vite + TypeScript |
| **Backend** | Python 3.12 + FastAPI + Uvicorn |
| **AI / LLM** | Anthropic Claude (claude-sonnet-4) via SAP Hyperspace proxy |
| **Data** | Mock SAP EC data: 150 employees (CSV/JSON), future roles, skills taxonomy |
| **Charts** | Recharts |
| **PDF Export** | html2canvas + jsPDF |
| **Deployment** | SAP BTP Cloud Foundry (Python buildpack) |

---

## 3. System Architecture

### Five Processing Layers

```
[1] DATA LAYER          Mock SAP EC data: employees.csv (150 records),
                        future_roles.json, skills_taxonomy.json, org_structure.json
                        Intentionally imperfect — missing fields, stale ratings.

[2] STRATEGY PARSER     Deterministic. Converts scenario_type to structured intent:
                        roles_to_grow, roles_to_reduce, skill_targets, timeline.

[3] GAP ANALYZER        Deterministic. Compares current workforce inventory
                        against future state. Outputs gap matrix per role/skill.

[4] EMPLOYEE ASSESSOR   Rules-based. Scores each employee's reskilling fit,
                        internal mobility potential, and retention risk.

[5] ACTION RECOMMENDER  Rules engine. Assigns UHRA action per employee.
                        Attaches cost estimate, confidence score, and rationale.

[6] PLAN SYNTHESIZER    Aggregates: executive summary, timeline, total cost, risks.

[7] AI ASSISTANT        Anthropic Claude via /api/joule/chat.
                        Grounded in full 150-employee dataset for natural language Q&A.
```

### Key Design Principle

> Deterministic for math. AI for judgment.

The LLM never computes numbers — it receives pre-computed facts and reasons over them.

---

## 4. Personas & Nav Structure

### Executive (`exe123`)
Home · Workforce Agent · Workforce Health · Executive Report · Hiring Center · UpSkilling Center · ReSkilling Center · Automation Center · Org Structure

### Manager (`man123`)
Home · Workforce Agent · Hiring Center · UpSkilling Center · ReSkilling Center · Automation Center · Org Structure

### Employee (`emp123`)
Home · Workforce Agent · ReSkilling Center · Redeployment Hub

---

## 5. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/login` | Authenticate, returns JWT token |
| POST | `/api/analyze` | Run UHRA analysis (scenario → recommendations) |
| POST | `/api/joule/chat` | Claude AI chat grounded in employee data |
| POST | `/api/scenarios/compare` | Compare up to 3 scenarios side-by-side |
| GET | `/api/dashboard/kpis` | Org-level KPIs |
| GET | `/api/org/tree` | Org chart tree (role-scoped) |
| GET | `/api/org/executive-insights` | Dept health metrics for exec |
| GET | `/api/executive/board-report` | Full board report with sections |
| GET | `/api/executive/talent-health` | Reskilling + succession data |
| GET | `/api/hiring/pipeline` | Open requisitions |
| GET | `/api/hiring/metrics` | Hiring KPIs |
| GET | `/api/reskilling/programs` | Active reskilling programs |
| GET | `/api/reskilling/employees` | Reskilling candidates |
| GET | `/api/future-roles` | Future role targets by dept |
| GET | `/api/team/{dept}` | Manager's team members |
| GET | `/api/employees` | All employees |

---

## 6. Scenario Types

| Scenario Type | Label |
|---|---|
| `org_transformation` | Org Transformation |
| `cost_optimisation` | Cost Optimisation |
| `talent_strategy` | Talent Strategy |
| `digital_workforce` | Digital Workforce |
| `geo_consolidation` | Geo Consolidation |
| `ma_integration` | M&A Integration |
| `sustainability_workforce` | Sustainability |
| `attrition_risk` | Attrition Risk (Joule) |
| `skills_gap` | Skills Gap (Joule) |
| `succession_planning` | Succession Planning (Joule) |
| `cost_forecast` | Cost Forecast (Joule) |
| `automation_opportunity` | Automation Center |

---

## 7. Configuration & Environment

All credentials and configuration are loaded from environment variables. See `.env.example` in the backend folder.

Key variables:
- `ANTHROPIC_API_KEY` — Anthropic Claude API key (Hyperspace proxy)
- `ANTHROPIC_BASE_URL` — Proxy URL (default: `http://localhost:6655/anthropic`)
- `ANTHROPIC_MODEL` — Model name (default: `claude-sonnet-4-20250514`)
- `TOKEN_SECRET` — JWT signing secret for session tokens
- `EMPLOYEE_PASSWORD` / `MANAGER_PASSWORD` / `EXECUTIVE_PASSWORD` — Login credentials

---

## 8. Evaluation & Quality Checks

| Check | Method | Pass Condition |
|-------|--------|----------------|
| **Coverage** | All employees assigned UHRA action | 100% classified or flagged |
| **Headcount math** | `future_HC = current + hired − separated ± reskilled` | Zero delta violations |
| **Consistency** | Same scenario run 3× same data | Categorical actions match ≥85% |
| **Hallucination guard** | All employee IDs in output exist in source dataset | 0 phantom references |
| **Cost sanity** | Total plan cost vs. annual HR budget | Cost < 2× annual HR budget |

---

## 9. Deployment

### Local
```bash
# Backend
cd backend && uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Frontend (dev)
cd frontend && npm run dev

# Frontend (prod build → served by backend)
cd frontend && npm run build && cp -r dist/* ../backend/static/
```

### BTP (Cloud Foundry)
```bash
cf login -a https://api.cf.us10-001.hana.ondemand.com --sso
cf push workforce-planning-agent
```

**Live URL:** https://workforce-planning-agent.cfapps.us10-001.hana.ondemand.com/

**GitHub:** https://github.com/veerannas/workforce-planning-agent

---

*Stack: Python 3.12 · FastAPI · React 19 · UI5 Web Components React · Anthropic Claude · SAP BTP CF*
