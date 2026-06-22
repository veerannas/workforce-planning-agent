# Plan: Executive Role Enhancement
Created: 2026-06-21

## Requirements (from Q&A)
- Q1:a — Add Talent Pipeline, Reskilling Progress, Succession Planning, Board Report
- Q2:a — Manager also gets Scenarios (dept-scoped)
- Q3:a — Reorganize Executive into grouped tabs: Strategic Dashboard, Talent Health, Org Design, Analytics, Board Report
- Q4:a — Board Report tab with auto-generated narrative summary
- Q5:a — Succession Planning anonymized (no names, just counts)

## New Tab Structure

### Executive (7 tabs → 6 focused tabs):
1. **Home** — org-wide KPIs (existing)
2. **Strategic Dashboard** — combined: Risk + Investment + Scenarios (merge 3→1)
3. **Talent Health** — NEW: aggregated hiring funnel + reskilling progress + succession coverage
4. **Org Design** — existing enhanced version
5. **Analytics** — existing org-wide
6. **Board Report** — NEW: auto-generated narrative with key metrics

### Manager (9 tabs → 10 tabs):
- Add "Scenarios" (dept-scoped) to existing nav

## Steps
- [ ] 1. Backend: POST /api/executive/talent-health (pipeline funnel + reskilling rates + succession)
- [ ] 2. Backend: GET /api/executive/board-report (narrative summary synthesis)
- [ ] 3. Frontend: TalentHealth.tsx (3-panel: pipeline funnel, reskilling progress, succession)
- [ ] 4. Frontend: StrategicDashboard.tsx (merge Risk + Investment + Scenarios into tabbed panel)
- [ ] 5. Frontend: BoardReport.tsx (narrative cards + key metrics + export button placeholder)
- [ ] 6. Update AppShell ROLE_NAV: Executive=[home, strategic, talent, org, analytics, board-report], Manager adds scenarios
- [ ] 7. Remove standalone RiskDashboard/InvestmentCalc/ScenarioComparison from Executive nav (merged into Strategic)
- [ ] 8. Build + deploy + verify all 3 logins

## Impact
- Files affected: main.py, AppShell.tsx, 3 new components, ScenarioComparison import stays (used inside Strategic)
- New dependencies: none
- Potential side effects: Executive loses direct-access Risk/Investment/Scenario tabs (merged)
- Rollback: revert AppShell ROLE_NAV to previous array

## Assumptions
- Succession data derived from existing employees.csv (senior roles + performance rating)
- Board Report is a read-only view (no PDF export yet, just placeholder button)
- StrategicDashboard uses internal tab/segmented button to switch Risk/Investment/Scenarios

## Risk
- Merging 3 exec views into 1 StrategicDashboard may feel cramped; mitigated with internal tabs.
