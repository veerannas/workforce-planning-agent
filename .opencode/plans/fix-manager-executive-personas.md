# Plan: Fix Manager & Executive Personas
Created: 2026-06-22

## Requirements (from Q&A)
- Manager persona → EMP01020 / Richard Chen (Engineering Manager M1, Technology)
- Seed 8 Technology employees as Richard Chen's direct reports in CSV
- Filter /api/team to direct reports only via manager_id query param
- Fix hiring_manager hardcode to use manager name from query param
- Fix get_approvals() dept hardcode ("Technology" → param)
- Executive persona → EMP01130 / Kenneth Williams, role overridden to "VP of Operations"
- Fix board-report generated_at to use datetime.now()
- MyTeam.tsx: pass user.employee_id as manager_id in fetch URL

## Steps
- [x] 1. CSV: seed manager_id=EMP01020 for 8 unassigned Technology employees
- [x] 2. auth.py: fix manager persona to EMP01020/Richard Chen; fix exec title to VP of Operations
- [x] 3. main.py: fix /api/team to accept manager_id param + filter; fix hiring_manager; fix approvals dept; fix board-report timestamp
- [x] 4. MyTeam.tsx: pass manager_id in fetch URL
- [x] 5. Build frontend, copy static, cf push, git push

## Impact
- Files affected: backend/data/employees.csv, backend/agent/auth.py, backend/main.py, frontend/src/components/MyTeam.tsx
- New dependencies: none
- Potential side effects: seeded employees appear under Richard Chen in org tree (correct)
- Rollback: revert CSV manager_id changes, revert auth.py

## Assumptions
- Only Technology employees with blank/missing manager_id are seeded
- Exec org tree uses full-tree mode (employee_id not used for tree shape)
- MyTeam.tsx fetch URL pattern is /api/team/{department}

## Risk
- CSV change affects org tree for 8 employees — desired side effect.
