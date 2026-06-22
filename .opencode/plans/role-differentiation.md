# Plan: Role Differentiation (Manager vs Executive)
Created: 2026-06-21

## Requirements
- Manager: scoped to OWN department only, gets "My Team" + "Approvals" tabs, can approve/reject/initiate
- Executive: org-wide ANONYMIZED data, gets "Risk Dashboard" + "Investment Calculator" + "Board Report" tabs
- Manager sees team names; Executive sees only counts/costs/percentages

## Steps
- [ ] 1. Backend: Add /api/team, /api/approvals, /api/executive/risk, /api/executive/investment APIs
- [ ] 2. Frontend: Create MyTeam.tsx, Approvals.tsx, RiskDashboard.tsx, InvestmentCalc.tsx
- [ ] 3. Update AppShell ROLE_NAV + scope existing Manager views to department
- [ ] 4. Build + deploy + verify

## Nav Structure
- Employee: home, reskilling, redeployment (3 tabs, self-only)
- Manager: home, my-team, agent, hiring, reskilling, redeployment, approvals, org, analytics (9 tabs, dept-scoped)
- Executive: home, agent, scenarios, risk, investment, org, analytics (7 tabs, anonymized org-wide)
