import { useEffect, useState } from "react";
import {
  Card, CardHeader, Title, Text, FlexBox, ObjectStatus, Icon,
  AnalyticalTable, ProgressIndicator, BusyIndicator,
} from "@ui5/webcomponents-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import "@ui5/webcomponents-icons/dist/employee.js";
import "@ui5/webcomponents-icons/dist/education.js";
import "@ui5/webcomponents-icons/dist/chain-link.js";
import "@ui5/webcomponents-icons/dist/money-bills.js";
import "@ui5/webcomponents-icons/dist/time-entry-request.js";
import "@ui5/webcomponents-icons/dist/alert.js";
import "@ui5/webcomponents-icons/dist/trend-up.js";
import "@ui5/webcomponents-icons/dist/add-employee.js";
import "@ui5/webcomponents-icons/dist/switch-views.js";
import "@ui5/webcomponents-icons/dist/ai.js";
import "@ui5/webcomponents-icons/dist/heart.js";

const API = import.meta.env.DEV ? "http://localhost:8000" : "";

const DEPTS = ["Technology", "Operations", "Finance"];
const DEPT_COLORS: Record<string, string> = {
  Technology: "#0F62FE", Operations: "#198754", Finance: "#6E32C9",
};

interface TalentData {
  pipeline: { stages: { stage: string; count: number }[]; by_department: any[] };
  reskilling: { programs: any[]; totals: { enrolled: number; completed: number }; roi: any };
  succession: { critical_roles: any[]; summary: any };
}

interface DeptInsight {
  department: string; vp: string; headcount: number; budget: number;
  cost_per_head: number; avg_tenure_years: number; vacancy_rate: number;
  attrition_rate: number; avg_performance: number; span_of_control: number;
  roles_count: number; health_score: number; headcount_trend_12m: number[];
  open_positions: number; critical_roles_unfilled: number;
}
interface InsightsData {
  departments: DeptInsight[];
  totals: { headcount: number; budget: number; avg_health: number; total_vacancies: number; avg_attrition: number };
}

function CoverageTag({ coverage }: { coverage: string }) {
  if (coverage === "strong")   return <ObjectStatus state="Positive"  showDefaultIcon>Strong</ObjectStatus>;
  if (coverage === "adequate") return <ObjectStatus state="Critical"  showDefaultIcon>Adequate</ObjectStatus>;
  return                              <ObjectStatus state="Negative"  showDefaultIcon>At Risk</ObjectStatus>;
}

function HealthBadge({ score }: { score: number }) {
  const state = score >= 80 ? "Positive" : score >= 65 ? "Critical" : "Negative";
  return <ObjectStatus state={state} showDefaultIcon>{score}</ObjectStatus>;
}

/** Inline SVG sparkline */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data?.length) return null;
  const W = 72, H = 22, min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${H - ((v - min) / range) * (H - 4) - 2}`).join(" ");
  return <svg width={W} height={H} style={{ display: "block" }}><polyline points={pts} fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" /></svg>;
}

export function TalentHealth() {
  const [data, setData]           = useState<TalentData | null>(null);
  const [insights, setInsights]   = useState<InsightsData | null>(null);
  const [pipeline, setPipeline]   = useState<any[]>([]);
  const [rsEmployees, setRsEmployees] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/executive/talent-health`).then(r => r.json()),
      fetch(`${API}/api/org/executive-insights`).then(r => r.json()),
      fetch(`${API}/api/hiring/pipeline`).then(r => r.json()),
      fetch(`${API}/api/reskilling/employees`).then(r => r.json()),
    ]).then(([t, i, p, rs]) => {
      setData(t); setInsights(i); setPipeline(p); setRsEmployees(rs);
    }).catch(() => {});
  }, []);

  if (!data || !insights) return <BusyIndicator active size="L" style={{ display: "block", margin: "3rem auto" }} />;

  /* ── Dept aggregation for overview cards ─────────────────────────────── */
  const deptSummary = DEPTS.map(dept => {
    const ins     = insights.departments.find(d => d.department === dept) ?? {} as DeptInsight;
    const hRows   = pipeline.filter(r => r.department === dept);
    const rsRows  = rsEmployees.filter(e => e.department === dept);
    const upRows  = rsRows.filter(e => e.reskill_fit_score >= 0.6);
    return {
      dept,
      headcount:   ins.headcount ?? 0,
      healthScore: ins.health_score ?? 0,
      attrition:   ins.attrition_rate ?? 0,
      costPerHead: ins.cost_per_head ?? 0,
      trend:       ins.headcount_trend_12m ?? [],
      hiring:   { count: hRows.length,   cost: hRows.reduce((s,r)=>s+(r.cost_to_fill_usd||0),0),  days: hRows.length ? Math.round(hRows.reduce((s,r)=>s+r.days_open,0)/hRows.length) : 0 },
      upskill:  { count: upRows.length,  cost: upRows.reduce((s,r)=>s+(r.estimated_cost_usd||0),0), weeks: upRows.length ? Math.round(upRows.reduce((s,r)=>s+(r.estimated_weeks||0),0)/upRows.length) : 0 },
      reskill:  { count: rsRows.length,  cost: rsRows.reduce((s,r)=>s+(r.estimated_cost_usd||0),0), weeks: rsRows.length ? Math.round(rsRows.reduce((s,r)=>s+(r.estimated_weeks||0),0)/rsRows.length) : 0 },
    };
  });

  /* ── KPI strip data ─────────────────────────────────────────────────── */
  const totalHC     = insights.totals.headcount;
  const avgHealth   = insights.totals.avg_health;
  const avgAttrition = (insights.totals.avg_attrition * 100).toFixed(1);
  const openPos     = insights.totals.total_vacancies;
  const rsEnrolled  = data.reskilling.totals.enrolled;
  const roi         = data.reskilling.roi.roi_percentage;

  /* ── Chart data ─────────────────────────────────────────────────────── */
  const healthChart = deptSummary.map(d => ({ dept: d.dept, "Health Score": d.healthScore, "Attrition %": Math.round(d.attrition * 100) }));

  /* ── Table columns ──────────────────────────────────────────────────── */
  const deptCols: any[] = [
    { Header: "Department",        accessor: "department",          width: 130 },
    { Header: "VP",                accessor: "vp",                  width: 125 },
    { Header: "HC",                accessor: "headcount",           width: 55, hAlign: "End" },
    { Header: "Health",            accessor: "health_score",        width: 80, Cell: ({ value }: any) => <HealthBadge score={value} /> },
    { Header: "Monthly Cost ($K)", accessor: "monthly_cost_k",      width: 120, hAlign: "End",
      Cell: ({ value }: any) => <span style={{ fontWeight: 600, color: "#0F62FE" }}>${value}K</span> },
    { Header: "Time-to-Fill (d)",  accessor: "time_to_fill_days",   width: 115, hAlign: "End",
      Cell: ({ value }: any) => <span style={{ fontWeight: 600, color: value > 50 ? "#DA1E28" : value > 44 ? "#D26900" : "#198754" }}>{value}d</span> },
    { Header: "Cost/Head",         accessor: "cost_per_head",       width: 95,  Cell: ({ value }: any) => `$${(value/1000).toFixed(0)}K` },
    { Header: "Attrition",         accessor: "attrition_rate",      width: 85,
      Cell: ({ value }: any) => <span style={{ color: value > 0.12 ? "#DA1E28" : "#198754" }}>{(value*100).toFixed(1)}%</span> },
    { Header: "Vacancies",         accessor: "open_positions",      width: 80, hAlign: "End" },
    { Header: "Critical Unfilled", accessor: "critical_roles_unfilled", width: 115,
      Cell: ({ value }: any) => value > 0 ? <ObjectStatus state="Negative">{value}</ObjectStatus> : <Text>0</Text> },
    { Header: "Tenure (yr)",       accessor: "avg_tenure_years",    width: 90, hAlign: "End" },
    { Header: "Trend (12m)",       accessor: "headcount_trend_12m", width: 95,
      Cell: ({ value }: any) => <Sparkline data={value} color={value?.[11] > value?.[0] ? "#198754" : "#DA1E28"} /> },
  ];

  const deptRows = insights.departments
    .filter(d => d.department !== "Executive")
    .map(d => ({
      ...d,
      monthly_cost_k:    Math.round(d.budget / 12 / 1000),
      time_to_fill_days: Math.round(42 + d.critical_roles_unfilled * 4 + (d.vacancy_rate > 0.1 ? 3 : 0)),
    }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <Title level="H3">Workforce Health</Title>

      {/* ── Hero KPI strip ────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "10px" }}>
        {[
          { icon: "employee",           label: "Total Headcount",    value: String(totalHC),      color: "#0F62FE" },
          { icon: "heart",              label: "Avg Health Score",   value: `${avgHealth}/100`,   color: avgHealth >= 75 ? "#198754" : "#D26900" },
          { icon: "alert",              label: "Avg Attrition",      value: `${avgAttrition}%`,   color: Number(avgAttrition) > 10 ? "#DA1E28" : "#198754" },
          { icon: "add-employee",       label: "Open Positions",     value: String(openPos),      color: "#D26900" },
          { icon: "education",          label: "In Reskilling",      value: String(rsEnrolled),   color: "#6E32C9" },
          { icon: "trend-up",           label: "Reskilling ROI",     value: `${roi}%`,            color: roi >= 100 ? "#198754" : "#D26900" },
        ].map(k => (
          <div key={k.label} style={{ background: "#fff", border: "1px solid #e8ebef", borderRadius: "10px", padding: "12px 14px", borderTop: `3px solid ${k.color}`, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
              <Icon name={k.icon} style={{ fontSize: "13px", color: k.color }} />
              <Text style={{ fontSize: "10px", color: "#556b82", fontWeight: 500 }}>{k.label}</Text>
            </div>
            <Text style={{ fontSize: "20px", fontWeight: 700, color: k.color, display: "block" }}>{k.value}</Text>
          </div>
        ))}
      </div>

      {/* ── Department Overview Cards ─────────────────────────────────── */}
      <div>
        <Text style={{ fontSize: "11px", fontWeight: 700, color: "#556b82", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "10px" }}>
          Department Overview
        </Text>
        <FlexBox wrap="Wrap" style={{ gap: "1rem" }}>
          {deptSummary.map(d => {
            const color = DEPT_COLORS[d.dept] ?? "#333";
            return (
              <div key={d.dept} style={{ flex: "1 1 280px", background: "#fff", border: "1px solid #e4e8ed", borderRadius: "12px", borderTop: `4px solid ${color}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "hidden" }}>
                {/* Card header */}
                <div style={{ padding: "14px 18px 10px", borderBottom: "1px solid #eef0f5" }}>
                  <FlexBox alignItems="Center" style={{ gap: "10px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: `${color}12`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon name="employee" style={{ fontSize: "16px", color }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <Text style={{ fontWeight: 700, fontSize: "14px", color, display: "block" }}>{d.dept}</Text>
                      <Text style={{ fontSize: "11px", color: "#556b82" }}>{d.headcount} employees</Text>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <HealthBadge score={d.healthScore} />
                      <Text style={{ fontSize: "10px", color: d.attrition > 0.12 ? "#DA1E28" : "#556b82", display: "block", marginTop: "2px" }}>
                        {(d.attrition * 100).toFixed(1)}% attrition
                      </Text>
                    </div>
                  </FlexBox>
                </div>
                {/* 4 centre rows */}
                {[
                  { icon: "add-employee", label: "Hiring",      val: `${d.hiring.count} open`,        cost: `$${(d.hiring.cost/1000).toFixed(0)}K`,  time: `${d.hiring.days}d avg` },
                  { icon: "trend-up",     label: "UpSkilling",  val: `${d.upskill.count} enrolled`,   cost: `$${(d.upskill.cost/1000).toFixed(0)}K`, time: `${d.upskill.weeks}w avg` },
                  { icon: "switch-views", label: "ReSkilling",  val: `${d.reskill.count} candidates`, cost: `$${(d.reskill.cost/1000).toFixed(0)}K`, time: `${d.reskill.weeks}w avg` },
                  { icon: "ai",           label: "Automation",  val: "Run analysis",                  cost: "—",                                      time: "—" },
                ].map(r => (
                  <div key={r.label} style={{ padding: "9px 18px", borderBottom: "1px solid #f4f6f9", display: "flex", alignItems: "center", gap: "10px" }}>
                    <Icon name={r.icon} style={{ fontSize: "14px", color: "#556b82", width: "20px", flexShrink: 0 }} />
                    <Text style={{ fontSize: "12px", fontWeight: 600, color: "#1a2027", width: "80px", flexShrink: 0 }}>{r.label}</Text>
                    <Text style={{ fontSize: "11px", color: "#556b82", flex: 1 }}>{r.val}</Text>
                    <Text style={{ fontSize: "12px", fontWeight: 700, color: "#0F62FE", minWidth: "40px", textAlign: "right" }}>{r.cost}</Text>
                    <Text style={{ fontSize: "11px", color: "#D26900", minWidth: "50px", textAlign: "right" }}>{r.time}</Text>
                  </div>
                ))}
                {/* Trend sparkline */}
                <div style={{ padding: "8px 18px 10px", display: "flex", alignItems: "center", gap: "10px" }}>
                  <Text style={{ fontSize: "10px", color: "#556b82" }}>12m trend</Text>
                  <Sparkline data={d.trend} color={d.trend[11] > d.trend[0] ? "#198754" : "#DA1E28"} />
                  <Text style={{ fontSize: "10px", color: "#556b82", marginLeft: "auto" }}>${(d.costPerHead/1000).toFixed(0)}K / head</Text>
                </div>
              </div>
            );
          })}
        </FlexBox>
      </div>

      {/* ── Health & Attrition chart ──────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <Card header={<CardHeader titleText="Health Score by Department" subtitleText="Target: ≥80" avatar={<Icon name="heart" />} />} style={{ borderRadius: "10px", border: "1px solid #e4e8ed" }}>
          <div style={{ padding: "0.75rem 1rem", height: "180px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={healthChart} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef0f5" />
                <XAxis dataKey="dept" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="Health Score" radius={[4,4,0,0]}>
                  {healthChart.map((d,i) => <Cell key={i} fill={d["Health Score"] >= 80 ? "#198754" : d["Health Score"] >= 65 ? "#D26900" : "#DA1E28"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card header={<CardHeader titleText="Attrition Rate by Department (%)" subtitleText="Alert threshold: >12%" avatar={<Icon name="alert" />} />} style={{ borderRadius: "10px", border: "1px solid #e4e8ed" }}>
          <div style={{ padding: "0.75rem 1rem", height: "180px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={healthChart} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef0f5" />
                <XAxis dataKey="dept" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip formatter={(v: any) => `${v}%`} />
                <Bar dataKey="Attrition %" radius={[4,4,0,0]}>
                  {healthChart.map((d,i) => <Cell key={i} fill={d["Attrition %"] > 12 ? "#DA1E28" : DEPT_COLORS[DEPTS[i]]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* ── Dept Health & Metrics table ───────────────────────────────── */}
      <Card header={<CardHeader titleText="Department Health & Metrics" subtitleText="Cost, time, attrition, vacancies and health per department" avatar={<Icon name="employee" />} />} style={{ borderRadius: "10px", border: "1px solid #e4e8ed" }}>
        <AnalyticalTable columns={deptCols} data={deptRows} visibleRows={5} sortable filterable scaleWidthMode="Grow" />
      </Card>

      {/* ── Reskilling Progress ───────────────────────────────────────── */}
      <Card header={<CardHeader titleText="Reskilling Progress" subtitleText={`${data.reskilling.totals.enrolled} enrolled, ${data.reskilling.totals.completed} completed`} avatar={<Icon name="education" />} />} style={{ borderRadius: "10px", border: "1px solid #e4e8ed" }}>
        <div style={{ padding: "1rem" }}>
          <FlexBox wrap="Wrap" style={{ gap: "1rem", marginBottom: "1rem" }}>
            {[
              { label: "Total Investment", value: `$${(data.reskilling.roi.total_investment/1000).toFixed(0)}K` },
              { label: "Projected Savings", value: `$${(data.reskilling.roi.projected_savings/1000).toFixed(0)}K` },
              { label: "ROI",              value: `${data.reskilling.roi.roi_percentage}%`,      color: "#198754" },
              { label: "Avg Salary Uplift",value: `+${data.reskilling.roi.avg_salary_uplift_pct}%` },
            ].map(m => (
              <div key={m.label} style={{ background: "#F8FAFF", borderRadius: "8px", padding: "0.6rem 1rem", minWidth: "100px", textAlign: "center" }}>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: m.color || "#1A376C" }}>{m.value}</div>
                <div style={{ fontSize: "0.7rem", color: "#666" }}>{m.label}</div>
              </div>
            ))}
          </FlexBox>
          <AnalyticalTable
            columns={[
              { Header: "Program",      accessor: "program",      width: 180 },
              { Header: "Enrolled",     accessor: "enrolled",     width: 80, hAlign: "End" },
              { Header: "Completed",    accessor: "completed",    width: 90, hAlign: "End" },
              { Header: "In Progress",  accessor: "in_progress",  width: 100, hAlign: "End" },
              { Header: "Success Rate", accessor: "success_rate", width: 120,
                Cell: ({ value }: any) => <ProgressIndicator value={value * 100} valueState={value >= 0.85 ? "Positive" : value >= 0.75 ? "Critical" : "Negative"} /> },
            ] as any[]}
            data={data.reskilling.programs} visibleRows={5} sortable
          />
        </div>
      </Card>

      {/* ── Succession Planning ───────────────────────────────────────── */}
      <Card header={<CardHeader titleText="Succession Planning" subtitleText="Critical role coverage (anonymized)" avatar={<Icon name="chain-link" />} />} style={{ borderRadius: "10px", border: "1px solid #e4e8ed" }}>
        <div style={{ padding: "1rem" }}>
          <FlexBox wrap="Wrap" style={{ gap: "1rem", marginBottom: "1rem" }}>
            {[
              { label: "Critical Roles",  value: data.succession.summary.total_critical_roles },
              { label: "Strong Coverage", value: data.succession.summary.strong_coverage,   color: "#198754" },
              { label: "Adequate",        value: data.succession.summary.adequate_coverage, color: "#D26900" },
              { label: "At Risk",         value: data.succession.summary.at_risk,           color: "#DA1E28" },
              { label: "Bench Strength",  value: data.succession.summary.bench_strength_index },
            ].map(m => (
              <div key={m.label} style={{ background: "#F8FAFF", borderRadius: "8px", padding: "0.6rem 1rem", minWidth: "100px", textAlign: "center" }}>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: m.color || "#1A376C" }}>{m.value}</div>
                <div style={{ fontSize: "0.7rem", color: "#666" }}>{m.label}</div>
              </div>
            ))}
          </FlexBox>
          <AnalyticalTable
            columns={[
              { Header: "Critical Role", accessor: "role",        width: 200 },
              { Header: "Department",    accessor: "department",  width: 130 },
              { Header: "Ready Now",     accessor: "ready_now",   width: 90,  hAlign: "End" },
              { Header: "Ready 1yr",     accessor: "ready_1yr",   width: 90,  hAlign: "End" },
              { Header: "Ready 2yr",     accessor: "ready_2yr",   width: 90,  hAlign: "End" },
              { Header: "Coverage",      accessor: "coverage",    width: 110, Cell: ({ value }: any) => <CoverageTag coverage={value} /> },
            ] as any[]}
            data={data.succession.critical_roles} visibleRows={7} sortable
          />
        </div>
      </Card>
    </div>
  );
}
