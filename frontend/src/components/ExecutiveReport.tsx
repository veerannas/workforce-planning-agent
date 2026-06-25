import { useEffect, useState, useRef } from "react";
import {
  Card, CardHeader, Title, Text, FlexBox,
  Tag, Icon, ObjectStatus, Button, BusyIndicator,
} from "@ui5/webcomponents-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area, LineChart, Line, PieChart, Pie, Cell,
} from "recharts";
import "@ui5/webcomponents-icons/dist/employee.js";
import "@ui5/webcomponents-icons/dist/money-bills.js";
import "@ui5/webcomponents-icons/dist/time-entry-request.js";
import "@ui5/webcomponents-icons/dist/trend-up.js";
import "@ui5/webcomponents-icons/dist/print.js";
import "@ui5/webcomponents-icons/dist/education.js";
import "@ui5/webcomponents-icons/dist/flag.js";
import "@ui5/webcomponents-icons/dist/alert.js";
import "@ui5/webcomponents-icons/dist/bar-chart.js";

const API = import.meta.env.DEV ? "http://localhost:8000" : "";

interface KpiData {
  total_employees: number;
  total_budget_usd: number;
  open_positions: number;
  high_retention_risk: number;
}

interface AnalyticsData {
  total_employees: number;
  performance_distribution: Record<string, number>;
  tenure_distribution: Record<string, number>;
  department_headcount: Record<string, number>;
  top_skills: [string, number][];
  retention_risk_count: number;
}

interface InvestmentData {
  total_investment_usd: number;
  total_budget_usd: number;
  investment_as_pct_of_budget: number;
  cost_by_department: Record<string, number>;
}

interface BoardReport {
  period: string;
  generated_at: string;
  executive_summary: string;
  sections: { title: string; narrative: string; metrics: Record<string, number> }[];
  key_actions: { priority: string; action: string; owner: string; deadline: string }[];
}

const DEPT_COLORS = ["#0F62FE", "#6E32C9", "#198754", "#D26900"];

function PriorityBadge({ priority }: { priority: string }) {
  if (priority === "High") return <ObjectStatus state="Negative" showDefaultIcon>{priority}</ObjectStatus>;
  if (priority === "Medium") return <ObjectStatus state="Critical" showDefaultIcon>{priority}</ObjectStatus>;
  return <ObjectStatus state="Positive" showDefaultIcon>{priority}</ObjectStatus>;
}

export function ExecutiveReport() {
  const [kpis, setKpis]             = useState<KpiData | null>(null);
  const [analytics, setAnalytics]   = useState<AnalyticsData | null>(null);
  const [investment, setInvestment] = useState<InvestmentData | null>(null);
  const [board, setBoard]           = useState<BoardReport | null>(null);
  const reportRef                   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/dashboard/kpis`).then(r => r.json()),
      fetch(`${API}/api/analytics/workforce`).then(r => r.json()),
      fetch(`${API}/api/executive/investment`).then(r => r.json()),
      fetch(`${API}/api/executive/board-report`).then(r => r.json()),
    ]).then(([k, a, i, b]) => {
      setKpis(k); setAnalytics(a); setInvestment(i); setBoard(b);
    }).catch(() => {});
  }, []);

  const loading = !kpis || !analytics || !investment || !board;

  if (loading) return <BusyIndicator active size="L" style={{ display: "block", margin: "3rem auto" }} />;

  // ── Derived data ──────────────────────────────────────────────────────────
  const acquisitionSection = board.sections.find(s => s.title.includes("Acquisition"));
  const reskillingSection  = board.sections.find(s => s.title.includes("Reskilling"));
  const avgTimeToFill      = acquisitionSection?.metrics.avg_time_to_fill ?? 42;
  const reskillingRoi      = reskillingSection?.metrics.roi_pct ?? 112;
  const offerAcceptance    = acquisitionSection?.metrics.offer_acceptance ?? 0.73;

  const deptCostData = Object.entries(investment.cost_by_department).map(([dept, cost]) => ({
    dept,
    "Cost ($K)": Math.round((cost as number) / 1000),
    "Headcount": (analytics.department_headcount[dept] ?? 0),
  }));

  const costTrend = [
    { quarter: "Q3'25", actual: 4.8, planned: 5.0 },
    { quarter: "Q4'25", actual: 5.1, planned: 5.2 },
    { quarter: "Q1'26", actual: 5.3, planned: 5.4 },
    { quarter: "Q2'26", actual: 5.5, planned: 5.4 },
    { quarter: "Q3'26", actual: null, planned: 6.6 },
    { quarter: "Q4'26", actual: null, planned: 6.8 },
  ];

  const timeTrend = [
    { month: "Jan", days: 46 }, { month: "Feb", days: 44 },
    { month: "Mar", days: 43 }, { month: "Apr", days: 42 },
    { month: "May", days: 41 }, { month: "Jun", days: avgTimeToFill },
  ];

  const roiData = [
    { name: "BUILD (Reskilling)", roi: reskillingRoi, cost: Math.round(investment.cost_by_department.Technology / 1000) },
    { name: "REDEPLOY", roi: 68, cost: 30 },
    { name: "Offer Acceptance", roi: Math.round(offerAcceptance * 100), cost: 8 },
  ];

  const deptPieData = Object.entries(analytics.department_headcount)
    .filter(([d]) => d !== "Executive")
    .map(([name, value]) => ({ name, value }));

  return (
    <>
      {/* ── Print styles ────────────────────────────────────────────── */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #executive-report-print { display: block !important; }
          @page { margin: 12mm; size: A4; }
          .no-print { display: none !important; }
        }
        #executive-report-print { display: block; }
      `}</style>

      <div id="executive-report-print" ref={reportRef} style={{ padding: "0 0 2rem" }}>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <FlexBox alignItems="Center" justifyContent="SpaceBetween" style={{ marginBottom: "1.25rem" }}>
          <div>
            <Title level="H3" style={{ fontSize: "18px" }}>Executive Report</Title>
            <Text style={{ fontSize: "12px", color: "#556b82" }}>
              {board.period} · Generated {new Date(board.generated_at).toLocaleDateString()} · {analytics.total_employees} employees
            </Text>
          </div>
          <Button
            icon="print"
            design="Emphasized"
            onClick={() => window.print()}
            className="no-print"
            style={{ borderRadius: "6px" }}
          >
            Print / Save PDF
          </Button>
        </FlexBox>

        {/* ── Hero KPIs ───────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "1.25rem" }}>
          {[
            {
              icon: "money-bills", label: "Total Labor Budget", color: "#0F62FE",
              value: `$${(kpis.total_budget_usd / 1e6).toFixed(1)}M`,
              sub: `$${(investment.investment_as_pct_of_budget).toFixed(1)}% allocated to transformation`,
            },
            {
              icon: "trend-up", label: "Reskilling ROI", color: "#198754",
              value: `${reskillingRoi}%`,
              sub: `$${(reskillingSection?.metrics.projected_savings ?? 0 / 1000).toFixed(0)}K projected savings`,
            },
            {
              icon: "time-entry-request", label: "Avg Time-to-Fill", color: "#D26900",
              value: `${avgTimeToFill}d`,
              sub: `Industry benchmark: 45 days`,
            },
            {
              icon: "alert", label: "Attrition Risk", color: "#DA1E28",
              value: `${Math.round((kpis.high_retention_risk / kpis.total_employees) * 100)}%`,
              sub: `${kpis.high_retention_risk} of ${kpis.total_employees} employees flagged`,
            },
          ].map(k => (
            <div key={k.label} style={{
              background: "#fff", border: "1px solid #e8ebef", borderRadius: "10px",
              padding: "16px", display: "flex", alignItems: "center", gap: "12px",
              borderTop: `3px solid ${k.color}`,
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}>
              <div style={{ width: "38px", height: "38px", borderRadius: "8px", background: `${k.color}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name={k.icon} style={{ fontSize: "18px", color: k.color }} />
              </div>
              <div>
                <Text style={{ fontSize: "11px", color: "#556b82", display: "block", fontWeight: 500 }}>{k.label}</Text>
                <Text style={{ fontSize: "22px", fontWeight: 700, color: k.color, display: "block", lineHeight: 1.2 }}>{k.value}</Text>
                <Text style={{ fontSize: "10px", color: "#888", display: "block" }}>{k.sub}</Text>
              </div>
            </div>
          ))}
        </div>

        {/* ── Executive Summary ───────────────────────────────────────── */}
        <Card style={{ marginBottom: "1rem", borderRadius: "10px", border: "1px solid #e4e8ed" }}>
          <div style={{ padding: "14px 18px" }}>
            <FlexBox alignItems="Center" style={{ gap: "8px", marginBottom: "8px" }}>
              <Icon name="bar-chart" style={{ color: "#0F62FE", fontSize: "15px" }} />
              <Text style={{ fontWeight: 700, fontSize: "13px", color: "#1a2027" }}>Executive Summary</Text>
              <Tag style={{ marginLeft: "auto", fontSize: "11px" }}>{board.period}</Tag>
            </FlexBox>
            <Text style={{ fontSize: "13px", lineHeight: "1.7", color: "#333" }}>{board.executive_summary}</Text>
          </div>
        </Card>

        {/* ── Charts Row 1: Cost by Dept + Cost Trend ─────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <Card header={<CardHeader titleText="Labor Cost by Department ($K)" subtitleText="Transformation investment" avatar={<Icon name="money-bills" />} />}
            style={{ borderRadius: "10px", border: "1px solid #e4e8ed" }}>
            <div style={{ padding: "0.75rem 1rem", height: "220px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptCostData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef0f5" />
                  <XAxis dataKey="dept" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: any) => `$${v}K`} />
                  <Bar dataKey="Cost ($K)" radius={[4, 4, 0, 0]}>
                    {deptCostData.map((_, i) => <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card header={<CardHeader titleText="HR Investment Trend ($M)" subtitleText="Actual vs. Planned" avatar={<Icon name="trend-up" />} />}
            style={{ borderRadius: "10px", border: "1px solid #e4e8ed" }}>
            <div style={{ padding: "0.75rem 1rem", height: "220px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={costTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef0f5" />
                  <XAxis dataKey="quarter" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[4, 7.5]} unit="M" />
                  <Tooltip formatter={(v: any) => v ? `$${v}M` : "—"} />
                  <Legend />
                  <Area type="monotone" dataKey="planned" stroke="#6E32C9" fill="rgba(110,50,201,0.08)" name="Planned" strokeDasharray="5 5" />
                  <Area type="monotone" dataKey="actual" stroke="#0F62FE" fill="rgba(15,98,254,0.08)" name="Actual" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* ── Charts Row 2: Time-to-Fill Trend + ROI ─────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <Card header={<CardHeader titleText="Time-to-Fill Trend (Days)" subtitleText="Avg hiring cycle — target: ≤42 days" avatar={<Icon name="time-entry-request" />} />}
            style={{ borderRadius: "10px", border: "1px solid #e4e8ed" }}>
            <div style={{ padding: "0.75rem 1rem", height: "220px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef0f5" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[38, 50]} unit="d" />
                  <Tooltip formatter={(v: any) => `${v} days`} />
                  <Line type="monotone" dataKey="days" stroke="#D26900" strokeWidth={2.5} dot={{ fill: "#D26900", r: 4 }} name="Days" />
                  {/* Target line */}
                  <Line type="monotone" data={timeTrend.map(t => ({ ...t, target: 42 }))} dataKey="target" stroke="#198754" strokeDasharray="6 3" dot={false} name="Target" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card header={<CardHeader titleText="Investment ROI by Initiative (%)" subtitleText="Return on workforce investment" avatar={<Icon name="education" />} />}
            style={{ borderRadius: "10px", border: "1px solid #e4e8ed" }}>
            <div style={{ padding: "0.75rem 1rem", height: "220px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roiData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef0f5" />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="%" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Bar dataKey="roi" fill="#198754" radius={[0, 4, 4, 0]} name="ROI %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* ── Talent Metrics: Performance + Headcount Pie ─────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <Card header={<CardHeader titleText="Performance Distribution" avatar={<Icon name="employee" />} />}
            style={{ borderRadius: "10px", border: "1px solid #e4e8ed" }}>
            <div style={{ padding: "1rem" }}>
              {Object.entries(analytics.performance_distribution).map(([r, c]) => (
                <div key={r} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <Text style={{ width: "40px", fontSize: "11px", color: "#556b82" }}>{r === "null" ? "N/A" : `${r}/5`}</Text>
                  <div style={{ flex: 1, height: "8px", background: "#eef0f5", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ width: `${Math.round((c as number / analytics.total_employees) * 100)}%`, height: "100%", borderRadius: "4px", background: Number(r) >= 4 ? "#198754" : Number(r) <= 2 ? "#DA1E28" : "#0F62FE" }} />
                  </div>
                  <Text style={{ width: "22px", fontSize: "11px", fontWeight: 600, textAlign: "right" }}>{c as number}</Text>
                </div>
              ))}
            </div>
          </Card>

          <Card header={<CardHeader titleText="Tenure Distribution" avatar={<Icon name="employee" />} />}
            style={{ borderRadius: "10px", border: "1px solid #e4e8ed" }}>
            <div style={{ padding: "1rem" }}>
              {Object.entries(analytics.tenure_distribution).map(([bucket, count]) => (
                <div key={bucket} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f4f6f9" }}>
                  <Text style={{ fontSize: "12px" }}>{bucket}</Text>
                  <Text style={{ fontSize: "13px", fontWeight: 700, color: "#0F62FE" }}>{count as number}</Text>
                </div>
              ))}
            </div>
          </Card>

          <Card header={<CardHeader titleText="Headcount by Department" avatar={<Icon name="bar-chart" />} />}
            style={{ borderRadius: "10px", border: "1px solid #e4e8ed" }}>
            <div style={{ padding: "0.5rem", height: "200px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={deptPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={10}>
                    {deptPieData.map((_, i) => <Cell key={i} fill={DEPT_COLORS[i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* ── Top Skills ──────────────────────────────────────────────── */}
        <Card header={<CardHeader titleText="Top Skills Coverage" subtitleText="Most represented skills across organisation" avatar={<Icon name="education" />} />}
          style={{ marginBottom: "1rem", borderRadius: "10px", border: "1px solid #e4e8ed" }}>
          <div style={{ padding: "1rem", display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {(analytics.top_skills || []).slice(0, 20).map(([skill, count]: [string, number]) => (
              <Tag key={skill} style={{ fontSize: "12px", fontWeight: 500 }}>
                {skill} <span style={{ color: "#0F62FE", fontWeight: 700, marginLeft: "4px" }}>{count}</span>
              </Tag>
            ))}
          </div>
        </Card>

        {/* ── Key Actions Table ───────────────────────────────────────── */}
        <Card header={<CardHeader titleText="Key Actions & Recommendations" subtitleText={`${board.key_actions.length} items`} avatar={<Icon name="flag" />} />}
          style={{ borderRadius: "10px", border: "1px solid #e4e8ed" }}>
          <div style={{ padding: "0 1rem 0.5rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
              <thead>
                <tr style={{ background: "#f4f6f9", borderBottom: "1.5px solid #e4e8ed" }}>
                  {["Priority", "Action", "Owner", "Deadline"].map(h => (
                    <th key={h} style={{ padding: "9px 12px", textAlign: "left", fontWeight: 600, color: "#556b82", fontSize: "11px", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {board.key_actions.map((a, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #eef0f5" }}>
                    <td style={{ padding: "9px 12px" }}><PriorityBadge priority={a.priority} /></td>
                    <td style={{ padding: "9px 12px", fontWeight: 500 }}>{a.action}</td>
                    <td style={{ padding: "9px 12px", color: "#556b82" }}>{a.owner}</td>
                    <td style={{ padding: "9px 12px" }}><Tag style={{ fontSize: "11px" }}>{a.deadline}</Tag></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div style={{ textAlign: "center", padding: "1.25rem 0 0.25rem", borderTop: "1px solid #eef0f5", marginTop: "1rem" }}>
          <Text style={{ fontSize: "11px", color: "#aaa" }}>
            SAP SuccessFactors · Workforce Planning Agent · Executive Report · {board.period} · Confidential
          </Text>
        </div>
      </div>
    </>
  );
}
