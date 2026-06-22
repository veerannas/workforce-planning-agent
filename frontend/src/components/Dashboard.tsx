import { useState } from "react";
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
} from "@ui5/webcomponents-react";
import { AnalyticalTable } from "@ui5/webcomponents-react";
import { useAuth } from "../auth/AuthContext";
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
  type: string;  // matches scenario_type in backend
  text: string;
}

const ACTION_ICONS: Record<string, string> = {
  BUILD:    "education",
  BUY:      "add-employee",
  REDEPLOY: "switch-views",
  AUTOMATE: "ai",
  REVIEW:   "task",
};

const ACTION_COLORS: Record<string, string> = {
  BUILD:    "#198754",
  BUY:      "#0F62FE",
  REDEPLOY: "#6E32C9",
  AUTOMATE: "#D26900",
  REVIEW:   "#DA1E28",
};

export function Dashboard() {
  const { user } = useAuth();
  const role    = user?.role        || "employee";
  const name    = user?.name        || "You";
  const dept    = user?.department  || "your department";
  const empId   = user?.employee_id || "";

  // Each chip has a `type` that maps 1-to-1 to a backend parse_strategy fast-path.
  // Text is pre-filled into the textarea for context — the type drives the actual logic.
  const ROLE_SCENARIOS: Record<string, ScenarioChip[]> = {
    employee: [
      {
        label: "AI Career Growth",
        icon: "ai",
        type: "career_ai",
        text: `I want to grow into an ML Engineer or AI Product Manager role within the next 12 months. ` +
              `Which of my current skills transfer directly, what are my biggest gaps in Machine Learning and Python, ` +
              `and what is the fastest reskilling path available for me?`,
      },
      {
        label: "Role Transition",
        icon: "switch-views",
        type: "career_transition",
        text: `I am planning to transition into a Platform Engineer or AI Product Manager position. ` +
              `Assess my readiness, identify gaps in Cloud Architecture and Kubernetes, ` +
              `and recommend a realistic 2-year transition roadmap with certifications.`,
      },
      {
        label: "Skill Gap Analysis",
        icon: "education",
        type: "skill_gap",
        text: `Compare my current skills against the top Data Engineer and Data Analyst openings. ` +
              `Identify exact gaps in SQL, Python, and Data Pipelines, rank them by impact, ` +
              `and recommend the quickest way to close each gap within 12 months.`,
      },
    ],
    manager: [
      {
        label: "Team Capacity",
        icon: "group",
        type: "team_capacity",
        text: `My team in ${dept} needs to grow AI/ML engineering capacity by 50% over 18 months ` +
              `while reducing manual-operations headcount. Which team members should be reskilled internally, ` +
              `who are strong candidates for redeployment into ML Engineer or Data Engineer roles, ` +
              `and where do we need to hire externally?`,
      },
      {
        label: "Succession Planning",
        icon: "approvals",
        type: "succession",
        text: `Identify the top succession risks in my team in ${dept} for senior and lead roles. ` +
              `For each at-risk position, recommend whether to develop an internal successor, ` +
              `redeploy from another team, or initiate an external search — with timelines.`,
      },
      {
        label: "Automation Opportunity",
        icon: "ai",
        type: "automation_opportunity",
        text: `Which roles in my ${dept} team have the highest automation potential over the next 2 years? ` +
              `For each at-risk employee, propose a concrete redeployment or reskilling path ` +
              `so no one is left without a clear career alternative.`,
      },
    ],
    executive: [
      {
        label: "Org Transformation",
        icon: "org-chart",
        type: "org_transformation",
        text: `Design a 3-year AI-first workforce transformation across the entire organisation. ` +
              `Grow all critical and high-priority technology roles, reduce roles targeted for automation, ` +
              `and reallocate 30% of the operations budget toward technology talent. ` +
              `Show the full BBRA breakdown and cost impact for all 150 employees.`,
      },
      {
        label: "Cost Optimisation",
        icon: "money-bills",
        type: "cost_optimisation",
        text: `Analyse the full organisation and identify where automation, redeployment, and ` +
              `targeted hiring can reduce total workforce costs by 15% within 24 months. ` +
              `Focus on reducing Operations Analyst, Administrative, Procurement, and Accounts Payable roles ` +
              `while growing Data Analyst and FP&A capacity. Show costs and savings by department.`,
      },
      {
        label: "Talent Strategy",
        icon: "target-group",
        type: "talent_strategy",
        text: `The organisation has a critical AI/ML skills gap across all 150 employees. ` +
              `Build a comprehensive 2-year talent strategy to grow ML Engineer, AI Product Manager, ` +
              `Data Engineer, and Platform Engineer capacity. Show build-vs-buy trade-offs, ` +
              `reskilling candidates, and total investment required.`,
      },
    ],
  };

  const scenarios = ROLE_SCENARIOS[role] ?? ROLE_SCENARIOS.employee;

  const [activeChip, setActiveChip]   = useState(0);
  const [scenarioText, setScenarioText] = useState(scenarios[0].text);
  const [loading, setLoading]         = useState(false);
  const [result, setResult]           = useState<AnalyzeResponse | null>(null);
  const [error, setError]             = useState("");

  const selectChip = (index: number) => {
    setActiveChip(index);
    setScenarioText(scenarios[index].text);
    setResult(null);
    setError("");
  };

  const analyze = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario:      scenarioText,
          scenario_type: scenarios[activeChip].type,
          user_role:     role,
          employee_id:   empId || null,
          department:    dept || null,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: AnalyzeResponse = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e.message || "Failed to connect to backend");
    } finally {
      setLoading(false);
    }
  };

  const summary   = result?.summary as Summary | undefined;
  const hasError  = result?.summary && "error" in result.summary;
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

  const scopeLabel =
    role === "employee" ? `Your personal analysis (${name})` :
    role === "manager"  ? `Your team · ${dept}` :
                          "Entire organisation · All departments";

  const columns: any[] = [
    { Header: "Employee",     accessor: "employee_name",   width: 150 },
    { Header: "Department",   accessor: "department",      width: 100 },
    { Header: "Current Role", accessor: "current_role",   width: 140 },
    {
      Header: "Action",
      accessor: "action",
      width: 100,
      Cell: ({ value }: { value: string }) => (
        <Tag
          icon={<Icon name={ACTION_ICONS[value] || "task"} />}
          style={{ color: ACTION_COLORS[value] || "#333" }}
        >
          {value}
        </Tag>
      ),
    },
    { Header: "Target Role",  accessor: "target_role",    width: 130 },
    {
      Header: "Confidence",
      accessor: "confidence",
      width: 110,
      Cell: ({ value }: { value: number }) => (
        <ProgressIndicator
          value={Math.round(value * 100)}
          valueState={value >= 0.7 ? "Positive" : value >= 0.5 ? "Critical" : "Negative"}
          style={{ width: "80px" }}
        />
      ),
    },
    {
      Header: "Cost (USD)",
      accessor: "cost_estimate_usd",
      width: 100,
      Cell: ({ value }: { value: number }) => `$${value.toLocaleString()}`,
    },
    {
      Header: "Timeline",
      accessor: "timeline_months",
      width: 80,
      Cell: ({ value }: { value: number }) => `${value} mo`,
    },
    { Header: "Rationale", accessor: "rationale", width: 320 },
  ];

  return (
    <div style={{ padding: "1rem", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <Bar
        startContent={<Title level="H3">Workforce Agent</Title>}
        endContent={
          <FlexBox style={{ gap: "0.5rem", alignItems: "center" }}>
            <Tag>{roleLabel} View</Tag>
            <Text style={{ fontSize: "0.8rem", color: "#666" }}>{scopeLabel}</Text>
          </FlexBox>
        }
        style={{ marginBottom: "1rem" }}
      />

      {/* Scenario Input */}
      <Card
        header={
          <CardHeader
            titleText="Strategic Scenario"
            subtitleText="Select a scenario or type your own — results are scoped to your access level"
          />
        }
        style={{ marginBottom: "1rem" }}
      >
        <div style={{ padding: "1rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
            {scenarios.map((s, i) => (
              <Tag
                key={s.type}
                icon={<Icon name={s.icon} />}
                interactive
                onClick={() => selectChip(i)}
                style={{
                  cursor: "pointer",
                  padding: "0.3rem 0.6rem",
                  outline: activeChip === i ? "2px solid #0F62FE" : "none",
                  borderRadius: "4px",
                }}
              >
                {s.label}
              </Tag>
            ))}
          </div>

          <TextArea
            value={scenarioText}
            onInput={(e: any) => setScenarioText(e.target.value)}
            rows={4}
            style={{ width: "100%" }}
            placeholder="Describe your workforce scenario or click a suggestion above…"
          />

          <Button
            design="Emphasized"
            onClick={analyze}
            disabled={loading || !scenarioText.trim()}
            style={{ marginTop: "0.75rem" }}
          >
            {loading ? "Analysing…" : "Run Workforce Agent"}
          </Button>
        </div>
      </Card>

      {error && (
        <MessageStrip design="Negative" style={{ marginBottom: "1rem" }}>{error}</MessageStrip>
      )}

      {loading && (
        <BusyIndicator active size="L" style={{ display: "block", margin: "2rem auto" }} />
      )}

      {/* Clarifying Questions fallback */}
      {hasError && result?.summary && "clarifying_questions" in result.summary && (
        <Card header={<CardHeader titleText="Clarification Needed" />} style={{ marginBottom: "1rem" }}>
          <div style={{ padding: "1rem" }}>
            <MessageStrip design="Critical">The scenario is too vague. Please provide more detail:</MessageStrip>
            <ul style={{ marginTop: "0.5rem" }}>
              {(result.summary as any).clarifying_questions.map((q: string, i: number) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      {/* Results */}
      {summary && !hasError && (
        <>
          {/* KPI row */}
          <FlexBox wrap="Wrap" style={{ gap: "1rem", marginBottom: "1rem" }}>
            <Card
              header={<CardHeader titleText="In Scope" subtitleText="Employees analysed" avatar={<Icon name="employee" />} />}
              style={{ width: "220px" }}
            >
              <div style={{ padding: "1rem", textAlign: "center" }}>
                <Title level="H1">{summary.total_employees}</Title>
              </div>
            </Card>
            <Card
              header={<CardHeader titleText="Plan Cost" subtitleText="Estimated investment" avatar={<Icon name="money-bills" />} />}
              style={{ width: "220px" }}
            >
              <div style={{ padding: "1rem", textAlign: "center" }}>
                <Title level="H2">${summary.total_cost_usd.toLocaleString()}</Title>
              </div>
            </Card>
            <Card
              header={<CardHeader titleText="Avg Confidence" subtitleText="Agent certainty" avatar={<Icon name="measure" />} />}
              style={{ width: "220px" }}
            >
              <div style={{ padding: "1rem", textAlign: "center" }}>
                <Title level="H2">{Math.round(summary.confidence_avg * 100)}%</Title>
              </div>
            </Card>
            <Card
              header={<CardHeader titleText="HR Review Queue" subtitleText="Needs human judgment" avatar={<Icon name="alert" />} />}
              style={{ width: "220px" }}
            >
              <div style={{ padding: "1rem", textAlign: "center" }}>
                <Title level="H1" style={{ color: "#DA1E28" }}>{summary.flagged_for_review}</Title>
              </div>
            </Card>
          </FlexBox>

          {/* Actions breakdown */}
          <Card
            header={<CardHeader titleText="BBRA Actions Breakdown" subtitleText="Build · Buy · Redeploy · Automate" />}
            style={{ marginBottom: "1rem" }}
          >
            <FlexBox wrap="Wrap" style={{ padding: "1rem", gap: "1rem" }}>
              {Object.entries(summary.actions_breakdown).map(([action, count]) => (
                <div key={action} style={{ textAlign: "center", minWidth: "100px" }}>
                  <Tag
                    icon={<Icon name={ACTION_ICONS[action] || "task"} />}
                    style={{ color: ACTION_COLORS[action], marginBottom: "0.25rem" }}
                  >
                    {action}
                  </Tag>
                  <Title level="H3">{count}</Title>
                  <Text style={{ fontSize: "0.8rem", color: "#666" }}>
                    ${(summary.cost_by_action[action] || 0).toLocaleString()}
                  </Text>
                </div>
              ))}
            </FlexBox>
          </Card>

          {/* Risks */}
          {summary.top_risks.length > 0 && (
            <Card header={<CardHeader titleText="Top Risks" />} style={{ marginBottom: "1rem" }}>
              <div style={{ padding: "1rem" }}>
                {summary.top_risks.map((risk, i) => (
                  <MessageStrip key={i} design="Critical" style={{ marginBottom: "0.5rem" }}>{risk}</MessageStrip>
                ))}
              </div>
            </Card>
          )}

          {/* Timeline */}
          <Card header={<CardHeader titleText="Implementation Timeline" />} style={{ marginBottom: "1rem" }}>
            <div style={{ padding: "1.25rem" }}>
              {(() => {
                const phases = [
                  { label: "Redeploy",  timeframe: "0–6 mo",   icon: "switch-views", color: "#0070F2", bg: "#e8f3ff", key: "REDEPLOY" },
                  { label: "Reskill",   timeframe: "6–18 mo",  icon: "education",    color: "#0f7c3b", bg: "#e8f5ec", key: "BUILD"    },
                  { label: "Automate",  timeframe: "12–36 mo", icon: "ai",           color: "#8b5cf6", bg: "#f3efff", key: "AUTOMATE" },
                ];
                // Parse counts from the flat string: "Phase N (X mo): Verb Y employees/roles."
                const counts: Record<string, number> = {};
                const matches = summary.timeline_summary.matchAll(/:\s*(\w+)\s+(\d+)/g);
                let i = 0;
                for (const m of matches) {
                  if (i < 3) { counts[phases[i].key] = parseInt(m[2], 10); i++; }
                }
                return (
                  <div style={{ display: "flex", gap: "0", alignItems: "stretch" }}>
                    {phases.map((phase, idx) => (
                      <div key={phase.key} style={{ display: "flex", alignItems: "stretch", flex: 1 }}>
                        {/* Phase card */}
                        <div style={{
                          flex: 1,
                          background: phase.bg,
                          borderRadius: "12px",
                          padding: "1.25rem 1rem",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "0.5rem",
                          border: `2px solid ${phase.color}22`,
                          position: "relative",
                        }}>
                          {/* Phase number badge */}
                          <div style={{
                            position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)",
                            background: phase.color, color: "#fff", borderRadius: "50%",
                            width: "24px", height: "24px", display: "flex", alignItems: "center",
                            justifyContent: "center", fontSize: "12px", fontWeight: 700,
                          }}>{idx + 1}</div>
                          {/* Icon */}
                          <div style={{
                            background: phase.color, borderRadius: "50%",
                            width: "48px", height: "48px", display: "flex",
                            alignItems: "center", justifyContent: "center", marginTop: "0.5rem",
                          }}>
                            <Icon name={phase.icon} style={{ width: "24px", height: "24px", color: "#fff" }} />
                          </div>
                          {/* Metric */}
                          <div style={{ fontSize: "2rem", fontWeight: 700, color: phase.color, lineHeight: 1 }}>
                            {counts[phase.key] ?? 0}
                          </div>
                          {/* Label */}
                          <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#1D2D3E" }}>{phase.label}</div>
                          {/* Timeframe pill */}
                          <div style={{
                            background: phase.color, color: "#fff", borderRadius: "999px",
                            padding: "2px 10px", fontSize: "0.75rem", fontWeight: 600,
                          }}>{phase.timeframe}</div>
                          {/* Sub-label */}
                          <div style={{ fontSize: "0.75rem", color: "#666", textAlign: "center" }}>
                            {phase.key === "REDEPLOY" ? "employees redeployed" : phase.key === "BUILD" ? "employees reskilled" : "roles automated"}
                          </div>
                        </div>
                        {/* Connector arrow between phases */}
                        {idx < 2 && (
                          <div style={{
                            display: "flex", alignItems: "center", padding: "0 0.5rem",
                            color: "#aaa", fontSize: "1.5rem", flexShrink: 0,
                          }}>›</div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </Card>

          {/* Recommendations table */}
          <Card
            header={
              <CardHeader
                titleText="Recommendations"
                subtitleText={`${result!.recommendations.length} employee${result!.recommendations.length !== 1 ? "s" : ""} · ${scopeLabel}`}
              />
            }
            style={{ marginBottom: "1rem" }}
          >
            <AnalyticalTable
              columns={columns}
              data={result!.recommendations}
              filterable
              sortable
              groupable
              rowHeight={45}
              visibleRows={15}
              scaleWidthMode="Smart"
            />
          </Card>

          {/* HR Review Queue */}
          {result!.hr_review_queue.length > 0 && (
            <Card
              header={
                <CardHeader
                  titleText="HR Review Queue"
                  subtitleText={`${result!.hr_review_queue.length} employee${result!.hr_review_queue.length !== 1 ? "s" : ""} need human judgment`}
                />
              }
              style={{ marginBottom: "1rem", border: "2px solid #DA1E28" }}
            >
              <AnalyticalTable
                columns={columns.filter(c => c.accessor !== "rationale")}
                data={result!.hr_review_queue}
                rowHeight={45}
                visibleRows={10}
              />
            </Card>
          )}
        </>
      )}
    </div>
  );
}
