import { useEffect, useState } from "react";
import {
  Card, CardHeader, Title, Text, Tag, FlexBox,
  AnalyticalTable, ObjectStatus, Icon, Avatar
} from "@ui5/webcomponents-react";
import "@ui5/webcomponents-icons/dist/alert.js";
import "@ui5/webcomponents-icons/dist/positive.js";
import "@ui5/webcomponents-icons/dist/sys-minus.js";
import "@ui5/webcomponents-icons/dist/task.js";

const API = import.meta.env.DEV ? "http://localhost:8000" : "";

// ── Types ─────────────────────────────────────────────────────────────────────
interface PersonNode {
  id: string;
  name: string;
  role: string;
  grade: string;
  email: string;
  phone: string;
  location: string;
  department?: string;
  children?: PersonNode[];
}

interface DeptInsight {
  department: string;
  vp: string;
  headcount: number;
  budget: number;
  cost_per_head: number;
  avg_tenure_years: number;
  vacancy_rate: number;
  attrition_rate: number;
  avg_performance: number;
  span_of_control: number;
  roles_count: number;
  health_score: number;
  headcount_trend_12m: number[];
  open_positions: number;
  critical_roles_unfilled: number;
}

interface InsightsData {
  departments: DeptInsight[];
  totals: { headcount: number; budget: number; avg_health: number; total_vacancies: number; avg_attrition: number };
}

// ── Grade colours (T-level prefix) ───────────────────────────────────────────
const GRADE_BG: Record<string, string> = {
  T5: "#1A376C", T4: "#0D47A1", T3: "#1565C0", T2: "#42A5F5", T1: "#90CAF9",
};
const GRADE_TEXT: Record<string, string> = {
  T5: "#fff", T4: "#fff", T3: "#fff", T2: "#fff", T1: "#1A376C",
};
const AVATAR_SCHEME: Record<string, string> = {
  T5: "Accent1", T4: "Accent2", T3: "Accent3", T2: "Accent5", T1: "Accent6",
};
function gradeLevel(grade: string) { return grade.split("-")[0]; }

// ── Constants ─────────────────────────────────────────────────────────────────
const CARD_W = 175;
const COL_GAP = 10;
const LINE = "#90A4AE";

// ── PersonCard ────────────────────────────────────────────────────────────────
function PersonCard({
  node, open, onToggle, hasKids,
}: {
  node: PersonNode; open: boolean; onToggle: () => void; hasKids: boolean;
}) {
  const level = gradeLevel(node.grade);
  const initials = node.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const headerBg = node.id === "CEO" ? "#1A376C" : "#3d4a5c";

  return (
    <div style={{
      width: CARD_W,
      border: "1px solid #dde3ed",
      borderRadius: 8,
      overflow: "hidden",
      boxShadow: "0 2px 8px rgba(0,0,0,0.09)",
      background: "#fff",
      flexShrink: 0,
    }}>
      {/* Clickable header: name + role + chevron */}
      <div
        onClick={hasKids ? onToggle : undefined}
        style={{
          background: headerBg,
          padding: "7px 10px 6px",
          cursor: hasKids ? "pointer" : "default",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 4,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: "0.78rem", color: "#fff", lineHeight: 1.25, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {node.name}
          </div>
          <div style={{ fontSize: "0.64rem", color: "#b0c4d8", marginTop: 2, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {node.role}
          </div>
        </div>
        {hasKids && (
          <span style={{
            color: "#b0c4d8",
            fontSize: "0.6rem",
            marginTop: 3,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 2,
            transition: "transform 0.15s",
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
          }}>
            ▶ {node.children?.length}
          </span>
        )}
      </div>

      {/* Body: avatar + contact details */}
      <div style={{ padding: "8px 10px 6px", display: "flex", gap: 8, alignItems: "flex-start" }}>
        <Avatar
          initials={initials}
          size="XS"
          colorScheme={AVATAR_SCHEME[level] as any || "Accent6"}
          style={{ flexShrink: 0, marginTop: 2 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "0.58rem", color: "#5a6880", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {node.email}
          </div>
          <div style={{ fontSize: "0.58rem", color: "#5a6880", marginBottom: 2 }}>
            {node.phone}
          </div>
          <div style={{ fontSize: "0.58rem", color: "#7a8ca8" }}>
            {node.location}
          </div>
        </div>
      </div>

      {/* Footer: grade badge only */}
      <div style={{
        padding: "3px 10px 5px",
        borderTop: "1px solid #f0f4f8",
      }}>
        <span style={{
          fontSize: "0.56rem", fontWeight: 700,
          background: GRADE_BG[level] || "#90CAF9",
          color: GRADE_TEXT[level] || "#1A376C",
          padding: "1px 6px", borderRadius: 4, letterSpacing: "0.3px",
        }}>
          {node.grade}
        </span>
      </div>
    </div>
  );
}

// ── Vertical connector ────────────────────────────────────────────────────────
function VLine({ h = 16 }: { h?: number }) {
  return <div style={{ width: 2, height: h, background: LINE, flexShrink: 0 }} />;
}

// ── Recursive tree node ───────────────────────────────────────────────────────
function OrgNode({ node, depth = 0 }: { node: PersonNode; depth?: number }) {
  // CEO + direct reports (depth 0, 1) start expanded; rest collapsed
  const [open, setOpen] = useState(depth < 2);
  const kids = node.children ?? [];
  const hasKids = kids.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <PersonCard
        node={node}
        open={open}
        onToggle={() => setOpen(o => !o)}
        hasKids={hasKids}
      />

      {open && hasKids && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <VLine />
          {/* Children row */}
          <div
            style={{
              display: "flex",
              gap: COL_GAP,
              alignItems: "flex-start",
              position: "relative",
            }}
          >
            {/* Horizontal bar: left = center of col 0, right = center of last col */}
            {kids.length > 1 && (
              <div style={{
                position: "absolute",
                top: 0,
                left: CARD_W / 2,
                right: CARD_W / 2,
                height: 2,
                background: LINE,
                zIndex: 0,
              }} />
            )}

            {kids.map(child => (
              <div key={child.id} style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                minWidth: CARD_W,
              }}>
                <VLine />
                <OrgNode node={child} depth={depth + 1} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helper components (reused from original) ──────────────────────────────────
function Sparkline({ data, color = "#275AA3" }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const h = 28, w = 80;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} style={{ verticalAlign: "middle" }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

function HealthBadge({ score }: { score: number }) {
  if (score >= 75) return <ObjectStatus state="Positive" showDefaultIcon>{score}</ObjectStatus>;
  if (score >= 50) return <ObjectStatus state="Critical" showDefaultIcon>{score}</ObjectStatus>;
  return <ObjectStatus state="Negative" showDefaultIcon>{score}</ObjectStatus>;
}

function MetricCard({ label, value, subtitle }: { label: string; value: string | number; subtitle?: string }) {
  return (
    <Card style={{ width: "180px", minHeight: "90px" }}>
      <div style={{ padding: "0.75rem", textAlign: "center" }}>
        <Text style={{ fontSize: "0.75rem", color: "#666" }}>{label}</Text>
        <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1A376C", margin: "0.25rem 0" }}>{value}</div>
        {subtitle && <Text style={{ fontSize: "0.7rem", color: "#888" }}>{subtitle}</Text>}
      </div>
    </Card>
  );
}

// ── Grade legend ──────────────────────────────────────────────────────────────
function GradeLegend() {
  const levels = [
    { grade: "T5", label: "C-Suite / Principal" },
    { grade: "T4", label: "VP / Staff" },
    { grade: "T3", label: "Director / Manager" },
    { grade: "T2", label: "Senior IC" },
    { grade: "T1", label: "Individual Contributor" },
  ];
  return (
    <FlexBox wrap="Wrap" style={{ gap: "0.5rem", marginBottom: "0.75rem" }}>
      {levels.map(({ grade, label }) => (
        <FlexBox key={grade} alignItems="Center" style={{ gap: 4 }}>
          <span style={{
            fontSize: "0.6rem", fontWeight: 700, padding: "1px 7px",
            borderRadius: 4, background: GRADE_BG[grade], color: GRADE_TEXT[grade],
          }}>
            {grade}-1/2/3
          </span>
          <Text style={{ fontSize: "0.68rem", color: "#666" }}>{label}</Text>
        </FlexBox>
      ))}
    </FlexBox>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function OrgDesign() {
  const [tree, setTree] = useState<PersonNode | null>(null);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const role = localStorage.getItem("wfp_role") || "employee";
  const isExec = role === "executive";

  useEffect(() => {
    fetch(`${API}/api/org/tree`).then(r => r.json()).then(setTree);
    if (isExec) {
      fetch(`${API}/api/org/executive-insights`).then(r => r.json()).then(setInsights);
    }
  }, []);

  if (!tree) return <Text>Loading org structure...</Text>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <Title level="H3">Organizational Design</Title>

      {/* Executive KPI banner */}
      {isExec && insights && (
        <FlexBox wrap="Wrap" style={{ gap: "0.75rem" }}>
          <MetricCard label="Total Headcount" value={insights.totals.headcount} />
          <MetricCard label="Total Budget" value={`$${(insights.totals.budget / 1_000_000).toFixed(1)}M`} />
          <MetricCard label="Avg Health Score" value={insights.totals.avg_health} subtitle="/ 100" />
          <MetricCard label="Open Positions" value={insights.totals.total_vacancies} />
          <MetricCard label="Avg Attrition" value={`${(insights.totals.avg_attrition * 100).toFixed(1)}%`} />
        </FlexBox>
      )}

      {/* Executive: department health table */}
      {isExec && insights && (
        <Card header={<CardHeader titleText="Department Health & Metrics" subtitleText="Span of control, attrition, vacancies, cost efficiency" />}>
          <AnalyticalTable
            columns={[
              { Header: "Department", accessor: "department", width: 140 },
              { Header: "VP", accessor: "vp", width: 130 },
              { Header: "HC", accessor: "headcount", width: 55, hAlign: "End" },
              { Header: "Health", accessor: "health_score", width: 75, Cell: ({ value }: any) => <HealthBadge score={value} /> },
              { Header: "Span", accessor: "span_of_control", width: 60, hAlign: "End" },
              { Header: "Cost/Head", accessor: "cost_per_head", width: 95, Cell: ({ value }: any) => `$${(value / 1000).toFixed(0)}K` },
              { Header: "Attrition", accessor: "attrition_rate", width: 80, Cell: ({ value }: any) => (
                <span style={{ color: value > 0.12 ? "#b71c1c" : "#2e7d32" }}>{(value * 100).toFixed(1)}%</span>
              )},
              { Header: "Vacancies", accessor: "open_positions", width: 80, hAlign: "End" },
              { Header: "Critical Unfilled", accessor: "critical_roles_unfilled", width: 110, Cell: ({ value }: any) => (
                value > 0 ? <ObjectStatus state="Negative">{value}</ObjectStatus> : <Text>0</Text>
              )},
              { Header: "Tenure (yr)", accessor: "avg_tenure_years", width: 90, hAlign: "End" },
              { Header: "Trend (12m)", accessor: "headcount_trend_12m", width: 100, Cell: ({ value }: any) => (
                <Sparkline data={value} color={value[11] > value[0] ? "#2e7d32" : "#b71c1c"} />
              )},
            ] as any[]}
            data={insights.departments}
            visibleRows={5}
            sortable filterable scaleWidthMode="Grow"
            style={{ marginBottom: "0.5rem" }}
          />
        </Card>
      )}

      {/* Executive: restructure signals */}
      {isExec && insights && (
        <Card header={<CardHeader titleText="Restructure Signals" subtitleText="Departments that may need structural intervention" />}>
          <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {insights.departments
              .filter(d => d.health_score < 65 || d.attrition_rate > 0.13 || d.critical_roles_unfilled >= 2)
              .map(d => (
                <FlexBox key={d.department} alignItems="Center" style={{ gap: "0.75rem", padding: "0.5rem", background: "#FFF8E1", borderRadius: "6px" }}>
                  <Icon name="alert" style={{ color: "#F57C00" }} />
                  <div>
                    <Text style={{ fontWeight: 600 }}>{d.department}</Text>
                    <Text style={{ fontSize: "0.8rem", color: "#555", display: "block" }}>
                      {d.health_score < 65 && `Health ${d.health_score}/100. `}
                      {d.attrition_rate > 0.13 && `Attrition ${(d.attrition_rate * 100).toFixed(1)}%. `}
                      {d.critical_roles_unfilled >= 2 && `${d.critical_roles_unfilled} critical roles unfilled. `}
                      Span of control: {d.span_of_control}:1.
                    </Text>
                  </div>
                  <Tag colorScheme="2" icon={<Icon name="task" />} style={{ marginLeft: "auto" }}>Review</Tag>
                </FlexBox>
              ))}
            {insights.departments.filter(d => d.health_score < 65 || d.attrition_rate > 0.13 || d.critical_roles_unfilled >= 2).length === 0 && (
              <FlexBox alignItems="Center" style={{ gap: "0.5rem" }}>
                <Icon name="positive" style={{ color: "#2e7d32" }} />
                <Text>All departments within healthy thresholds.</Text>
              </FlexBox>
            )}
          </div>
        </Card>
      )}

      {/* Org chart */}
      <Card header={<CardHeader titleText="Organizational Structure" subtitleText="Click a card header to expand or collapse its reports" />}>
        <div style={{ padding: "0.75rem 0.5rem 0.5rem" }}>
          <GradeLegend />
        </div>
        <div style={{ padding: "1rem 2rem 2rem", overflowX: "auto" }}>
          <OrgNode node={tree} depth={0} />
        </div>
      </Card>
    </div>
  );
}
