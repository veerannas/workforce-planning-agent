import { useState, useRef, useEffect, useCallback } from "react";
import {
  Card,
  CardHeader,
  Title,
  TextArea,
  Button,
  MessageStrip,
  Tag,
  ProgressIndicator,
  FlexBox,
  Text,
  BusyIndicator,
  Bar,
  Icon,
  TabContainer,
  Tab,
} from "@ui5/webcomponents-react";
import { AnalyticalTable } from "@ui5/webcomponents-react";
import { useAuth } from "../auth/AuthContext";
import { JoulePanel } from "./JoulePanel";
import "@ui5/webcomponents-icons/dist/employee.js";
import "@ui5/webcomponents-icons/dist/money-bills.js";
import "@ui5/webcomponents-icons/dist/alert.js";
import "@ui5/webcomponents-icons/dist/ai.js";
import "@ui5/webcomponents-icons/dist/switch-views.js";
import "@ui5/webcomponents-icons/dist/education.js";
import "@ui5/webcomponents-icons/dist/group.js";
import "@ui5/webcomponents-icons/dist/org-chart.js";
import "@ui5/webcomponents-icons/dist/target-group.js";
import "@ui5/webcomponents-icons/dist/add-employee.js";
import "@ui5/webcomponents-icons/dist/task.js";
import "@ui5/webcomponents-icons/dist/measure.js";
import "@ui5/webcomponents-icons/dist/approvals.js";
import "@ui5/webcomponents-icons/dist/trend-up.js";
import "@ui5/webcomponents-icons/dist/compare.js";
import "@ui5/webcomponents-icons/dist/bo-strategy-management.js";
import "@ui5/webcomponents-icons/dist/world.js";
import "@ui5/webcomponents-icons/dist/collaborate.js";
import "@ui5/webcomponents-icons/dist/lead.js";
import "@ui5/webcomponents-icons/dist/download.js";
import "@ui5/webcomponents-icons/dist/share.js";
import "@ui5/webcomponents-icons/dist/calendar.js";

const API_BASE = import.meta.env.DEV ? "http://localhost:8000" : "";

interface Recommendation {
  employee_id: string;
  employee_name: string;
  department: string;
  current_role: string;
  action: string;
  target_role: string | null;
  confidence: number;
  cost_estimate_usd: number;
  rationale: string;
  flags: string[];
  timeline_months: number;
}

interface Summary {
  total_employees: number;
  actions_breakdown: Record<string, number>;
  total_cost_usd: number;
  cost_by_action: Record<string, number>;
  cost_by_department: Record<string, number>;
  flagged_for_review: number;
  top_risks: string[];
  timeline_summary: string;
  confidence_avg: number;
}

interface AnalyzeResponse {
  strategy: { parsed_confidence: number; clarifying_questions?: string[]; roles_to_grow: string[]; roles_to_reduce: string[] };
  recommendations: Recommendation[];
  summary: Summary | { error: string; clarifying_questions: string[] };
  hr_review_queue: Recommendation[];
}

interface ScenarioChip {
  label: string;
  icon: string;
  type: string;
  text: string;
}

interface KpiData {
  total_employees: number;
  high_retention_risk: number;
  total_budget_usd: number;
  open_positions: number;
}

const ACTION_ICONS: Record<string, string> = {
  BUILD: "education", BUY: "add-employee", REDEPLOY: "switch-views", AUTOMATE: "ai", REVIEW: "task",
};
const ACTION_COLORS: Record<string, string> = {
  BUILD: "#198754", BUY: "#0F62FE", REDEPLOY: "#6E32C9", AUTOMATE: "#D26900", REVIEW: "#DA1E28",
};

export function Dashboard() {
  const { user } = useAuth();
  const role    = user?.role || "employee";
  const name    = user?.name || "You";
  const dept    = user?.department || "your department";
  const empId   = user?.employee_id || "";

  // ── KPIs (reserved for future use) ─────────────────────────────────────────
  const [, setKpis] = useState<KpiData | null>(null);
  useEffect(() => {
    if (role === "executive") {
      fetch(`${API_BASE}/api/dashboard/kpis`).then(r => r.json()).then(setKpis).catch(() => {});
    }
  }, [role]);

  // ── Scenarios ──────────────────────────────────────────────────────────────
  const ROLE_SCENARIOS: Record<string, ScenarioChip[]> = {
    employee: [
      { label: "AI Career Growth", icon: "ai", type: "career_ai", text: `I want to grow into an ML Engineer or AI Product Manager role within the next 12 months. Which of my current skills transfer directly, what are my biggest gaps in Machine Learning and Python, and what is the fastest reskilling path available for me?` },
      { label: "Role Transition", icon: "switch-views", type: "career_transition", text: `I am planning to transition into a Platform Engineer or AI Product Manager position. Assess my readiness, identify gaps in Cloud Architecture and Kubernetes, and recommend a realistic 2-year transition roadmap with certifications.` },
      { label: "Skill Gap Analysis", icon: "education", type: "skill_gap", text: `Compare my current skills against the top Data Engineer and Data Analyst openings. Identify exact gaps in SQL, Python, and Data Pipelines, rank them by impact, and recommend the quickest way to close each gap within 12 months.` },
    ],
    manager: [
      { label: "Team Capacity", icon: "group", type: "team_capacity", text: `My team in ${dept} needs to grow AI/ML engineering capacity by 50% over 18 months while reducing manual-operations headcount. Which team members should be reskilled, who should be redeployed, and where do we need to hire?` },
      { label: "Succession Planning", icon: "approvals", type: "succession", text: `Identify the top succession risks in my team in ${dept} for senior and lead roles. For each at-risk position, recommend internal development, redeployment, or external search — with timelines.` },
      { label: "Automation Opportunity", icon: "ai", type: "automation_opportunity", text: `Identify which roles and tasks in my team (${dept}) can be automated with AI. Show expected productivity gains, implementation cost, and reskilling recommendations.` },
    ],
    executive: [
      { label: "Org Transformation", icon: "org-chart", type: "org_transformation", text: `Design a 3-year AI-first workforce transformation across the entire organisation. Grow all critical and high-priority technology roles, reduce roles targeted for automation, and reallocate 30% of the operations budget toward technology talent. Show the full BBRA breakdown and cost impact for all 150 employees.` },
      { label: "Cost Optimisation", icon: "money-bills", type: "cost_optimisation", text: `Analyse the full organisation and identify where automation, redeployment, and targeted hiring can reduce total workforce costs by 15% within 24 months. Focus on reducing Operations Analyst, Administrative, Procurement, and Accounts Payable roles while growing Data Analyst and FP&A capacity. Show costs and savings by department.` },
      { label: "Talent Strategy", icon: "target-group", type: "talent_strategy", text: `The organisation has a critical AI/ML skills gap across all 150 employees. Build a comprehensive 2-year talent strategy to grow ML Engineer, AI Product Manager, Data Engineer, and Platform Engineer capacity. Show build-vs-buy trade-offs, reskilling candidates, and total investment required.` },
      { label: "Digital Workforce", icon: "ai", type: "digital_workforce", text: `Model the transition to a digital-first workforce over 3 years. Identify which operational roles can be augmented or replaced by AI agents and automation. For each function (Finance, HR, Operations, Procurement), show the human-AI split ratio, productivity multiplier, and net FTE impact.` },
      { label: "Geo Consolidation", icon: "world", type: "geo_consolidation", text: `Evaluate workforce geographic distribution and recommend consolidation opportunities. Compare labor costs across EMEA, APAC, and Americas. Model 3 scenarios: consolidate to 2 hubs, go fully remote-first, nearshore critical functions. Show per-region cost savings and timeline.` },
      { label: "M&A Integration", icon: "collaborate", type: "ma_integration", text: `The organisation is acquiring a 60-person technology startup. Plan the workforce integration: identify role overlaps, retention risks for critical acquired talent, cultural fit gaps, and synergy savings. Recommend a 12-month integration roadmap.` },
      { label: "Sustainability", icon: "lead", type: "sustainability_workforce", text: `Build a sustainability-focused workforce strategy aligned with ESG commitments. Identify which roles need green skills, where to reskill vs. hire externally. Target: 30% of workforce with sustainability competency within 24 months.` },
    ],
  };

  const scenarios = ROLE_SCENARIOS[role] ?? ROLE_SCENARIOS.employee;

  const [activeChip, setActiveChip]     = useState(0);
  const [scenarioText, setScenarioText] = useState(scenarios[0].text);
  const [loading, setLoading]           = useState(false);
  const [result, setResult]             = useState<AnalyzeResponse | null>(null);
  const [error, setError]               = useState("");
  const [jouleSuggested, setJouleSuggested] = useState(false);

  // ── Resizable Joule Panel ──────────────────────────────────────────────────
  const [jouleWidth, setJouleWidth] = useState(420);
  const isDragging = useRef(false);
  const startX     = useRef(0);
  const startWidth = useRef(420);

  const onDragStart = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current     = e.clientX;
    startWidth.current = jouleWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [jouleWidth]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = startX.current - e.clientX;
      setJouleWidth(Math.min(600, Math.max(300, startWidth.current + delta)));
    };
    const onUp = () => { isDragging.current = false; document.body.style.cursor = ""; document.body.style.userSelect = ""; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []);

  // ── Scenario Comparison ────────────────────────────────────────────────────
  const COMPARE_PRESETS: Record<string, string[]> = {
    employee: [
      "Grow into ML Engineer via Python + cloud certifications within 12 months",
      "Transition to AI Product Manager over 18 months",
      "Close the top 3 skill gaps from my last review",
    ],
    manager: [
      "Double AI/ML capacity while reducing manual ops by 20% over 2 years",
      "Consolidate through redeployment and selective hiring to cut costs by 15%",
      "Reskill 40% of team into cloud and data engineering, maintain headcount",
    ],
    executive: [
      "Double AI and ML capacity while reducing back-office operations by 20% over 3 years. Prioritise building internal talent through reskilling programs before external hiring.",
      "Reduce total workforce costs by 30% through automation of finance and procurement functions, strategic nearshoring of operations, and consolidation of overlapping roles across departments.",
      "Execute a balanced growth strategy: invest $2M in AI/ML talent acquisition, reskill 40% of operations staff into data roles, maintain total headcount while shifting skills mix toward technology.",
    ],
  };
  const [compareScenarios, setCompareScenarios] = useState<string[]>((COMPARE_PRESETS[role] ?? COMPARE_PRESETS.employee).slice(0, 3));
  const [compareResults, setCompareResults]     = useState<any[]>([]);
  const [compareLoading, setCompareLoading]     = useState(false);
  const [compareError, setCompareError]         = useState("");

  const runComparison = async () => {
    setCompareLoading(true); setCompareError("");
    try {
      const res = await fetch(`${API_BASE}/api/scenarios/compare`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(compareScenarios.filter(s => s.trim()).map(s => ({ scenario: s }))) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setCompareResults(await res.json());
    } catch (e: any) { setCompareError(e.message || "Backend error"); }
    finally { setCompareLoading(false); }
  };

  const selectChip = (index: number) => {
    setActiveChip(index); setScenarioText(scenarios[index].text); setResult(null); setError(""); setJouleSuggested(false);
  };

  const handleJouleInject = (text: string, scenarioType: string) => {
    setScenarioText(text); setResult(null); setError(""); setJouleSuggested(true);
    const matchIdx = scenarios.findIndex(s => s.type === scenarioType);
    if (matchIdx >= 0) setActiveChip(matchIdx);
  };

  const analyze = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API_BASE}/api/analyze`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scenario: scenarioText, scenario_type: scenarios[activeChip]?.type ?? "org_transformation", user_role: role, employee_id: empId || null, department: dept || null }) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setResult(await res.json());
    } catch (e: any) { setError(e.message || "Backend error"); }
    finally { setLoading(false); }
  };

  const summary  = result?.summary as Summary | undefined;
  const hasError = result?.summary && "error" in result.summary;
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
  const scopeLabel = role === "employee" ? `Personal (${name})` : role === "manager" ? `Team · ${dept}` : "Entire organisation";

  const columns: any[] = [
    { Header: "Employee", accessor: "employee_name", width: 150 },
    { Header: "Department", accessor: "department", width: 100 },
    { Header: "Current Role", accessor: "current_role", width: 140 },
    { Header: "Action", accessor: "action", width: 100, Cell: ({ value }: { value: string }) => <Tag icon={<Icon name={ACTION_ICONS[value] || "task"} />} style={{ color: ACTION_COLORS[value] || "#333" }}>{value}</Tag> },
    { Header: "Target Role", accessor: "target_role", width: 130 },
    { Header: "Confidence", accessor: "confidence", width: 110, Cell: ({ value }: { value: number }) => <ProgressIndicator value={Math.round(value * 100)} valueState={value >= 0.7 ? "Positive" : value >= 0.5 ? "Critical" : "Negative"} style={{ width: "80px" }} /> },
    { Header: "Cost (USD)", accessor: "cost_estimate_usd", width: 100, Cell: ({ value }: { value: number }) => `$${value.toLocaleString()}` },
    { Header: "Timeline", accessor: "timeline_months", width: 80, Cell: ({ value }: { value: number }) => `${value} mo` },
    { Header: "Rationale", accessor: "rationale", width: 320 },
  ];

  /* ═══════════════════════════════ RENDER ═══════════════════════════════ */
  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>

      {/* ── LEFT: Main content ─────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, overflow: "auto", padding: "1.25rem" }}>

        {/* Header Bar */}
        <Bar
          startContent={<Title level="H3" style={{ fontSize: "18px" }}>Workforce Agent</Title>}
          endContent={
            <FlexBox style={{ gap: "0.75rem", alignItems: "center" }}>
              <Tag icon={<Icon name="calendar" />} style={{ fontSize: "12px" }}>Q2 2026</Tag>
              <Tag>{roleLabel} View</Tag>
              <Text style={{ fontSize: "0.8rem", color: "#556b82" }}>{scopeLabel}</Text>
            </FlexBox>
          }
          style={{ marginBottom: "1rem", borderRadius: "10px", background: "#fff", border: "1px solid #e4e8ed" }}
        />

        {/* ── TABS ─────────────────────────────────────────────── */}
        <TabContainer onTabSelect={() => {}} tabLayout="Inline" contentBackgroundDesign="Transparent" style={{ marginBottom: "0.5rem" }}>

          {/* ═══ TAB 1: Scenario Strategies ═══════════════════════ */}
          <Tab text="Scenario Strategies" design="Default" selected>
            <div style={{ padding: "1rem 0" }}>

              {/* Scenario strategy cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px", marginBottom: "16px" }}>
                {scenarios.map((s, i) => (
                  <div
                    key={s.type}
                    onClick={() => selectChip(i)}
                    title={s.text.slice(0, 100) + "…"}
                    style={{
                      cursor: "pointer",
                      padding: "12px 14px",
                      borderRadius: "10px",
                      border: activeChip === i ? "2px solid #0F62FE" : "1.5px solid #e4e8ed",
                      background: activeChip === i ? "#e8f2ff" : "#fff",
                      transition: "all 0.2s",
                      boxShadow: activeChip === i ? "0 2px 10px rgba(15,98,254,0.14)" : "0 1px 4px rgba(0,0,0,0.04)",
                      display: "flex", alignItems: "center", gap: "10px",
                    }}
                  >
                    <Icon name={s.icon} style={{ fontSize: "16px", color: activeChip === i ? "#0F62FE" : "#556b82", flexShrink: 0 }} />
                    <Text style={{ fontSize: "12.5px", fontWeight: activeChip === i ? 700 : 500, color: activeChip === i ? "#0F62FE" : "#1a2027" }}>
                      {s.label}
                    </Text>
                  </div>
                ))}
              </div>

              {/* Joule suggested badge */}
              {jouleSuggested && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "10px", padding: "4px 12px", borderRadius: "12px", background: "#f4eeff", border: "1px solid rgba(107,63,160,0.2)" }}>
                  <Icon name="ai" style={{ fontSize: "12px", color: "#6B3FA0" }} />
                  <Text style={{ fontSize: "11.5px", fontWeight: 600, color: "#6B3FA0" }}>Joule suggested this scenario</Text>
                </div>
              )}

              {/* Textarea */}
              <TextArea
                value={scenarioText}
                onInput={(e: any) => { setScenarioText(e.target.value); setJouleSuggested(false); }}
                rows={4}
                style={{ width: "100%", borderRadius: "8px", fontSize: "13.5px" }}
                placeholder="Describe your workforce scenario or click a strategy above…"
              />

              <Button design="Emphasized" onClick={analyze} disabled={loading || !scenarioText.trim()} style={{ marginTop: "0.75rem", borderRadius: "6px", fontSize: "13px" }}>
                {loading ? "Analysing…" : "Run Workforce Agent"}
              </Button>

              {error && <MessageStrip design="Negative" style={{ marginTop: "0.75rem" }}>{error}</MessageStrip>}
              {loading && <BusyIndicator active size="L" style={{ display: "block", margin: "2rem auto" }} />}

              {/* Clarifying questions */}
              {hasError && result?.summary && "clarifying_questions" in result.summary && (
                <Card header={<CardHeader titleText="Clarification Needed" />} style={{ marginTop: "1rem" }}>
                  <div style={{ padding: "1rem" }}>
                    <MessageStrip design="Critical">Scenario too vague — provide more detail:</MessageStrip>
                    <ul style={{ marginTop: "0.5rem" }}>{(result.summary as any).clarifying_questions.map((q: string, i: number) => <li key={i}>{q}</li>)}</ul>
                  </div>
                </Card>
              )}

              {/* Results */}
              {summary && !hasError && (
                <div style={{ marginTop: "1.25rem", animation: "fadeIn 0.3s ease" }}>
                  {/* KPI cards */}
                  <FlexBox wrap="Wrap" style={{ gap: "0.75rem", marginBottom: "1rem" }}>
                    {[
                      { title: "In Scope", value: String(summary.total_employees), color: "#0F62FE", icon: "employee" },
                      { title: "Total Cost", value: `$${summary.total_cost_usd.toLocaleString()}`, color: "#0F62FE", icon: "money-bills" },
                      { title: "Confidence", value: `${Math.round(summary.confidence_avg * 100)}%`, color: "#198754", icon: "measure" },
                      { title: "HR Review", value: String(summary.flagged_for_review), color: summary.flagged_for_review > 0 ? "#DA1E28" : "#198754", icon: "alert" },
                    ].map(k => (
                      <Card key={k.title} header={<CardHeader titleText={k.title} avatar={<Icon name={k.icon} />} />} style={{ width: "180px", borderRadius: "10px", border: "1px solid #e4e8ed" }}>
                        <div style={{ padding: "0.5rem 1rem", textAlign: "center" }}><Title level="H2" style={{ color: k.color }}>{k.value}</Title></div>
                      </Card>
                    ))}
                  </FlexBox>

                  {/* Action breakdown */}
                  <FlexBox style={{ gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                    {Object.entries(summary.actions_breakdown).map(([a, c]) => <Tag key={a} icon={<Icon name={ACTION_ICONS[a] || "task"} />} style={{ color: ACTION_COLORS[a] || "#333", fontWeight: 600 }}>{a}: {c}</Tag>)}
                  </FlexBox>

                  {/* Quick actions */}
                  <FlexBox style={{ gap: "8px", marginBottom: "1rem" }}>
                    <Button icon="download" design="Default" style={{ borderRadius: "6px", fontSize: "12px" }}>Export PDF</Button>
                    <Button icon="share" design="Default" style={{ borderRadius: "6px", fontSize: "12px" }}>Share with Board</Button>
                    <Button icon="calendar" design="Default" style={{ borderRadius: "6px", fontSize: "12px" }}>Schedule Review</Button>
                  </FlexBox>

                  {/* Table */}
                  <Card header={<CardHeader titleText="Recommendations" subtitleText={`${result!.recommendations.length} employees`} />} style={{ marginBottom: "1rem", borderRadius: "10px" }}>
                    <AnalyticalTable columns={columns} data={result!.recommendations} filterable sortable groupable rowHeight={45} visibleRows={12} scaleWidthMode="Smart" />
                  </Card>

                  {result!.hr_review_queue.length > 0 && (
                    <Card header={<CardHeader titleText="HR Review Queue" subtitleText={`${result!.hr_review_queue.length} need judgment`} />} style={{ marginBottom: "1rem", border: "2px solid #DA1E28", borderRadius: "10px" }}>
                      <AnalyticalTable columns={columns.filter(c => c.accessor !== "rationale")} data={result!.hr_review_queue} rowHeight={45} visibleRows={8} />
                    </Card>
                  )}
                </div>
              )}
            </div>
          </Tab>

          {/* ═══ TAB 2: Scenario Comparison ═════════════════════ */}
          <Tab text="Scenario Comparison" design="Neutral">
            <div style={{ padding: "1rem 0" }}>
              <Text style={{ fontSize: "13px", color: "#556b82", display: "block", marginBottom: "1rem" }}>
                Compare org-wide transformation strategies side-by-side — up to 3 scenarios
              </Text>

              {compareScenarios.map((s, i) => (
                <div key={i} style={{ marginBottom: "0.75rem" }}>
                  <Text style={{ fontWeight: 700, fontSize: "13px", display: "block", marginBottom: "4px", color: "#1a376c" }}>Scenario {i + 1}</Text>
                  <TextArea value={s} onInput={(e: any) => { const ns = [...compareScenarios]; ns[i] = e.target.value; setCompareScenarios(ns); }} rows={2} style={{ width: "100%" }} />
                </div>
              ))}

              <FlexBox style={{ gap: "0.5rem", marginTop: "0.5rem" }}>
                {compareScenarios.length < 3 && <Button onClick={() => setCompareScenarios([...compareScenarios, ""])}>Add Scenario</Button>}
                {compareScenarios.length > 1 && <Button design="Transparent" onClick={() => setCompareScenarios(compareScenarios.slice(0, -1))}>Remove Last</Button>}
                <Button design="Emphasized" onClick={runComparison} disabled={compareLoading || compareScenarios.every(s => !s.trim())}>{compareLoading ? "Comparing…" : "Compare Scenarios"}</Button>
              </FlexBox>

              {compareError && <MessageStrip design="Negative" style={{ marginTop: "0.75rem" }}>{compareError}</MessageStrip>}
              {compareLoading && <BusyIndicator active size="L" style={{ display: "block", margin: "1.5rem auto" }} />}

              {compareResults.length > 0 && (
                <FlexBox wrap="Wrap" style={{ gap: "1rem", marginTop: "1.25rem" }}>
                  {compareResults.map((r, i) => {
                    const costs = compareResults.map(x => x.total_cost || Infinity);
                    const isBest = (r.total_cost || Infinity) === Math.min(...costs);
                    return (
                      <Card key={i} header={<CardHeader titleText={`Scenario ${i + 1}`} subtitleText={(r.scenario || "").slice(0, 70) + "…"} />}
                        style={{ width: "350px", borderRadius: "12px", border: isBest ? "2px solid #198754" : "1px solid #e4e8ed", boxShadow: isBest ? "0 3px 12px rgba(25,135,84,0.12)" : "0 2px 6px rgba(0,0,0,0.05)", position: "relative" }}>
                        {isBest && <div style={{ position: "absolute", top: "8px", right: "12px", background: "#198754", color: "#fff", fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "8px" }}>BEST VALUE</div>}
                        <div style={{ padding: "1rem" }}>
                          <FlexBox style={{ gap: "1.25rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                            <div style={{ textAlign: "center" }}><Title level="H4" style={{ color: "#0F62FE" }}>${(r.total_cost || 0).toLocaleString()}</Title><Text style={{ fontSize: "11px", color: "#666" }}>Cost</Text></div>
                            <div style={{ textAlign: "center" }}><Title level="H4" style={{ color: "#198754" }}>{Math.round((r.confidence || 0) * 100)}%</Title><Text style={{ fontSize: "11px", color: "#666" }}>Confidence</Text></div>
                            <div style={{ textAlign: "center" }}><Title level="H4" style={{ color: "#DA1E28" }}>{r.flagged ?? 0}</Title><Text style={{ fontSize: "11px", color: "#666" }}>HR Review</Text></div>
                          </FlexBox>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                            {Object.entries(r.actions_breakdown || {}).map(([a, c]) => <Tag key={a} icon={<Icon name={ACTION_ICONS[a] || "task"} />} style={{ color: ACTION_COLORS[a] || "#333", fontSize: "11px" }}>{a}: {c as number}</Tag>)}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </FlexBox>
              )}
            </div>
          </Tab>
        </TabContainer>
      </div>

      {/* ── DRAG HANDLE ────────────────────────────────────────── */}
      {role === "executive" && (
        <div onMouseDown={onDragStart} style={{ width: "10px", cursor: "col-resize", background: "linear-gradient(180deg, #eef0f5 0%, #dde1e8 50%, #eef0f5 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.2s, width 0.15s", borderLeft: "1px solid #d0d5dd", borderRight: "1px solid #d0d5dd" }}
          onMouseEnter={e => { (e.currentTarget).style.background = "linear-gradient(180deg, #c4cad4 0%, #8b95a5 50%, #c4cad4 100%)"; (e.currentTarget).style.width = "12px"; }}
          onMouseLeave={e => { (e.currentTarget).style.background = "linear-gradient(180deg, #eef0f5 0%, #dde1e8 50%, #eef0f5 100%)"; (e.currentTarget).style.width = "10px"; }}
          title="Drag to resize Joule panel">
          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            {[0,1,2,3,4].map(i => <div key={i} style={{ width: "3px", height: "3px", borderRadius: "50%", background: "#8b95a5" }} />)}
          </div>
        </div>
      )}

      {/* ── RIGHT: Joule Panel ─────────────────────────────────── */}
      {role === "executive" && (
        <div style={{ width: `${jouleWidth}px`, flexShrink: 0, height: "100%", overflow: "hidden", boxShadow: "-4px 0 20px rgba(107,63,160,0.08)", borderLeft: "1px solid #eef0f5", borderRadius: "12px 0 0 12px" }}>
          <JoulePanel onInjectScenario={handleJouleInject} onClose={() => {}} />
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:none } }
        [ui5-tabcontainer]::part(content) { padding: 0; }
        [ui5-tabcontainer]::part(tabStrip) { border-bottom: 2px solid #eef0f5; padding: 0 4px; }
        [ui5-tabcontainer] [ui5-tab]::part(icon), [ui5-tabcontainer] ui5-tab::part(icon) { display: none !important; width: 0 !important; height: 0 !important; overflow: hidden !important; }
        [ui5-tab]::part(tab) { padding: 10px 18px; border-radius: 8px 8px 0 0; transition: background 0.15s; }
        [ui5-tab]::part(tab):hover { background: #f4f6f9; }
        [ui5-tab][selected]::part(tab) { background: #e8f2ff; }
        [ui5-tab]::part(text) { font-size: 13.5px; font-weight: 500; letter-spacing: 0.1px; }
        [ui5-tab][selected]::part(text) { font-weight: 700; color: #0F62FE; }
      `}</style>
    </div>
  );
}
