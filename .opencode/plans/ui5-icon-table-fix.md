# Plan: UI5 Icons + Table Width Consistency
Created: 2026-06-21

## Requirements (from Q&A)
- Skill chips (Python, ML, etc.) → `education` icon on all
- Status chips → `status-in-process` / `accept` / `circle-task-2` / `employee`
- Priority chips (critical/high) → `high-priority` / `warning`
- Action chips (BUILD/BUY/REDEPLOY/AUTOMATE/REVIEW) → `education` / `add-employee` / `switch-views` / `ai` / `task`
- Table: scaleWidthMode="Smart", Target Skills 280px, wider columns throughout

## Steps
- [ ] 1. Read Approvals, TalentHealth, MyTeam, StrategicDashboard, ScenarioComparison for Tag usage
- [ ] 2. Fix ReskillingCenter.tsx — skill tags + status tags + table widths
- [ ] 3. Fix RedeploymentHub.tsx — skill tags + priority tags
- [ ] 4. Fix Dashboard.tsx — action chip icons in table Cell renderer
- [ ] 5. Fix any Tag usage found in step 1
- [ ] 6. Build + deploy

## Impact
- Files affected: ReskillingCenter, RedeploymentHub, Dashboard + any others from step 1
- New dependencies: none (all icons already in @ui5/webcomponents-icons 2.23.1)
- Potential side effects: Tag icon slot type is UI5WCSlotsNode — must pass <Icon/> not string
- Rollback: revert edits, npm run build

## Assumptions
- `status-in-process`, `accept`, `circle-task-2`, `high-priority` exist in @ui5/webcomponents-icons 2.23.1
- All files that use `<Tag>` need Icon imported from @ui5/webcomponents-react

## Risk
- Icon names that don't exist in 2.23.1 will silently show `?` — need to verify against known imports.
