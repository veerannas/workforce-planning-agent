import { useEffect, useState, useCallback } from "react";
import {
  Card, CardHeader, Title, Text, Icon, FlexBox,
  BusyIndicator, TabContainer, Tab,
} from "@ui5/webcomponents-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import "@ui5/webcomponents-icons/dist/add-employee.js";
import "@ui5/webcomponents-icons/dist/education.js";
import "@ui5/webcomponents-icons/dist/switch-views.js";
import "@ui5/webcomponents-icons/dist/ai.js";
import "@ui5/webcomponents-icons/dist/money-bills.js";
import "@ui5/webcomponents-icons/dist/time-entry-request.js";
import "@ui5/webcomponents-icons/dist/employee.js";
import "@ui5/webcomponents-icons/dist/trend-up.js";

const API = import.meta.env.DEV ? "http://localhost:8000" : "";

const DEPTS   = ["Technology", "Operations", "Finance"];
const COLORS: Record<string, string> = {
  Technology: "#0F62FE",
  Operations: "#198754",
  Finance:    "#6E32C9",
};

/* ── Aggregation helpers ────────────────────────────────────────── */
function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = String(item[key]);
    (acc[k] = acc[k] || []).push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

function avg(arr: number[]): number {
  return arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : 0;
}

/* ── Dept Summary Card ──────────────────────────────────────────── */
function DeptSummaryCard({ dept, headcount, hiring, upskilling, reskilling, automation }: {
  dept: string;
  headcount: number;
  hiring:     { count: number; cost: number; days: number };
  upskilling: { count: number; cost: number; weeks: number };
  reskilling: { count: number; cost: number; weeks: number };
  automation: { count: number; cost: number; months: number };
}) {
  const color = COLORS[dept] ?? "#333";
  const rows = [
    { icon: "add-employee",  label: "Hiring",      value: `${hiring.count} open`,     cost: `$${(hiring.cost / 1000).toFixed(0)}K`,     time: `${hiring.days}d avg` },
    { icon: "trend-up",      label: "UpSkilling",  value: `${upskilling.count} enrolled`, cost: `$${(upskilling.cost / 1000).toFixed(0)}K`, time: `${upskilling.weeks}w avg` },
    { icon: "education",     label: "ReSkilling",  value: `${reskilling.count} candidates`, cost: `$${(reskilling.cost / 1000).toFixed(0)}K`, time: `${reskilling.weeks}w avg` },
    { icon: "ai",            label: "Automation",  value: `${automation.count} targets`,  cost: `$${(automation.cost / 1000).toFixed(0)}K`,  time: `${automation.months}m timeline` },
  ];
  return (
    <div style={{
      flex: "1 1 280px", background: "#fff",
      border: "1px solid #e4e8ed", borderRadius: "12px",
      borderTop: `4px solid ${color}`,
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ padding: "14px 18px 10px", borderBottom: "1px solid #eef0f5" }}>
        <FlexBox alignItems="Center" style={{ gap: "8px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: `${color}12`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="employee" style={{ fontSize: "16px", color }} />
          </div>
          <div>
            <Text style={{ fontWeight: 700, fontSize: "14px", color, display: "block" }}>{dept}</Text>
            <Text style={{ fontSize: "11px", color: "#556b82" }}>{headcount} employees</Text>
          </div>
        </FlexBox>
      </div>
      {/* 4 centre rows */}
      {rows.map(r => (
        <div key={r.label} style={{ padding: "9px 18px", borderBottom: "1px solid #f4f6f9", display: "flex", alignItems: "center", gap: "10px" }}>
          <Icon name={r.icon} style={{ fontSize: "14px", color: "#556b82", width: "20px", flexShrink: 0 }} />
          <Text style={{ fontSize: "12px", fontWeight: 600, color: "#1a2027", width: "80px", flexShrink: 0 }}>{r.label}</Text>
          <Text style={{ fontSize: "11px", color: "#556b82", flex: 1 }}>{r.value}</Text>
          <Text style={{ fontSize: "12px", fontWeight: 700, color: "#0F62FE", minWidth: "44px", textAlign: "right" }}>{r.cost}</Text>
          <Text style={{ fontSize: "11px", color: "#D26900", minWidth: "52px", textAlign: "right" }}>{r.time}</Text>
        </div>
      ))}
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────── */
export function WorkforceCentresExecutive() {
  const [insights, setInsights]     = useState<any>(null);
  const [pipeline, setPipeline]     = useState<any[]>([]);
  const [hireMetrics, setHireMetrics] = useState<any>(null);
  const [rsEmployees, setRsEmployees] = useState<any[]>([]);
  const [autoRecs, setAutoRecs]       = useState<any[]>([]);
  const [autoLoading, setAutoLoading] = useState(false);
  const [, setActiveTab] = useState("hiring");

  /* Fetch core data on mount */
  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/org/executive-insights`).then(r => r.json()),
      fetch(`${API}/api/hiring/pipeline`).then(r => r.json()),
      fetch(`${API}/api/hiring/metrics`).then(r => r.json()),
      fetch(`${API}/api/reskilling/employees`).then(r => r.json()),
    ]).then(([ins, pipe, hm, rse]) => {
      setInsights(ins); setPipeline(pipe); setHireMetrics(hm); setRsEmployees(rse);
    }).catch(() => {});
  }, []);

  /* Lazy-load automation only when tab selected */
  const fetchAutomation = useCallback(async () => {
    if (autoRecs.length > 0) return;
    setAutoLoading(true);
    try {
      const res = await fetch(`${API}/api/analyze`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: "Identify all automation opportunities across the entire organisation.", scenario_type: "automation_opportunity", user_role: "executive", employee_id: null, department: null }),
      });
      const data = await res.json();
      setAutoRecs(data.recommendations ?? []);
    } catch (_) {} finally { setAutoLoading(false); }
  }, [autoRecs.length]);

  if (!insights || !hireMetrics) return <BusyIndicator active size="L" style={{ display: "block", margin: "3rem auto" }} />;

  /* ── Dept-level aggregation ─────────────────────────────────── */
  const headcountByDept: Record<string, number> = Object.fromEntries(
    insights.departments.filter((d: any) => d.department !== "Executive").map((d: any) => [d.department, d.headcount])
  );

  const hiringByDept  = groupBy(pipeline, "department" as any);
  const rsEmpByDept   = groupBy(rsEmployees, "department" as any);
  const autoByDept    = groupBy(autoRecs.filter((r: any) => r.action === "AUTOMATE"), "department" as any);

  const deptData = DEPTS.map(dept => {
    const hRows   = hiringByDept[dept] ?? [];
    const rsRows  = rsEmpByDept[dept] ?? [];
    const upRows  = rsRows.filter((r: any) => r.reskill_fit_score >= 0.6);
    const autoRows = autoByDept[dept] ?? [];

    return {
      dept,
      headcount: headcountByDept[dept] ?? 0,
      hiring: {
        count: hRows.length,
        cost:  hRows.reduce((s: number, r: any) => s + (r.cost_to_fill_usd || 0), 0),
        days:  avg(hRows.map((r: any) => r.days_open)),
      },
      upskilling: {
        count: upRows.length,
        cost:  upRows.reduce((s: number, r: any) => s + (r.estimated_cost_usd || 0), 0),
        weeks: avg(upRows.map((r: any) => r.estimated_weeks)),
      },
      reskilling: {
        count: rsRows.length,
        cost:  rsRows.reduce((s: number, r: any) => s + (r.estimated_cost_usd || 0), 0),
        weeks: avg(rsRows.map((r: any) => r.estimated_weeks)),
      },
      automation: {
        count: autoRows.length,
        cost:  autoRows.reduce((s: number, r: any) => s + (r.cost_estimate_usd || 0), 0),
        months: avg(autoRows.map((r: any) => r.timeline_months)),
      },
    };
  });

  /* ── Aggregate hero numbers ─────────────────────────────────── */
  const totalHiringCost   = deptData.reduce((s, d) => s + d.hiring.cost, 0);
  const totalReskillCost  = deptData.reduce((s, d) => s + d.reskilling.cost + d.upskilling.cost, 0);
  const avgHireDays       = avg(deptData.map(d => d.hiring.days).filter(v => v > 0));

  /* ── Chart data ─────────────────────────────────────────────── */
  const hiringChart    = deptData.map(d => ({ dept: d.dept, "Open Roles": d.hiring.count, "Cost ($K)": Math.round(d.hiring.cost / 1000), "Avg Days": d.hiring.days }));
  const upskillChart   = deptData.map(d => ({ dept: d.dept, "Enrolled": d.upskilling.count, "Cost ($K)": Math.round(d.upskilling.cost / 1000), "Avg Weeks": d.upskilling.weeks }));
  const reskillChart   = deptData.map(d => ({ dept: d.dept, "Candidates": d.reskilling.count, "Cost ($K)": Math.round(d.reskilling.cost / 1000), "Avg Weeks": d.reskilling.weeks }));
  const autoChart      = deptData.map(d => ({ dept: d.dept, "Targets": d.automation.count, "Cost ($K)": Math.round(d.automation.cost / 1000), "Avg Months": d.automation.months }));

  const ChartPair = ({ costData, timeKey, timeUnit, timeColor }: { costData: any[]; timeKey: string; timeUnit: string; timeColor: string }) => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
      <Card header={<CardHeader titleText={`Cost by Department ($K)`} avatar={<Icon name="money-bills" />} />} style={{ borderRadius: "10px", border: "1px solid #e4e8ed" }}>
        <div style={{ padding: "0.75rem 1rem", height: "200px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={costData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef0f5" />
              <XAxis dataKey="dept" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} unit="K" />
              <Tooltip formatter={(v: any) => `$${v}K`} />
              <Bar dataKey="Cost ($K)" radius={[4, 4, 0, 0]}>
                {costData.map((_: any, i: number) => <Cell key={i} fill={COLORS[DEPTS[i]] ?? "#0F62FE"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card header={<CardHeader titleText={`${timeKey} by Department (${timeUnit})`} avatar={<Icon name="time-entry-request" />} />} style={{ borderRadius: "10px", border: "1px solid #e4e8ed" }}>
        <div style={{ padding: "0.75rem 1rem", height: "200px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={costData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef0f5" />
              <XAxis dataKey="dept" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} unit={timeUnit[0]} />
              <Tooltip formatter={(v: any) => `${v} ${timeUnit}`} />
              <Bar dataKey={timeKey} radius={[4, 4, 0, 0]}>
                {costData.map((_: any, i: number) => <Cell key={i} fill={timeColor} opacity={0.75 + i * 0.08} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );

  /* ── Department detail table (no individual names) ─────────── */
  const DeptTable = ({ rows, cols }: { rows: any[]; cols: { label: string; key: string; fmt?: (v: any) => string; color?: string }[] }) => (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
      <thead>
        <tr style={{ background: "#f4f6f9", borderBottom: "1.5px solid #e4e8ed" }}>
          {cols.map(c => <th key={c.key} style={{ padding: "9px 12px", textAlign: "left", fontWeight: 600, color: "#556b82", fontSize: "11px", textTransform: "uppercase" }}>{c.label}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} style={{ borderBottom: "1px solid #eef0f5" }}>
            {cols.map(c => (
              <td key={c.key} style={{ padding: "10px 12px", fontWeight: c.key === "dept" ? 700 : 500, color: c.color ?? (c.key === "dept" ? (COLORS[r.dept] ?? "#333") : "#1a2027") }}>
                {c.fmt ? c.fmt(r[c.key]) : r[c.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <Title level="H3" style={{ fontSize: "18px" }}>Workforce Centres — Executive View</Title>

      {/* ── Hero KPI Strip ──────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
        {[
          { icon: "add-employee",  label: "Total Hiring Cost",       value: `$${(totalHiringCost / 1000).toFixed(0)}K`,   sub: `${pipeline.length} open roles`,                          color: "#0F62FE" },
          { icon: "education",     label: "Reskilling Investment",   value: `$${(totalReskillCost / 1000).toFixed(0)}K`, sub: `${rsEmployees.length} employees in programs`,             color: "#198754" },
          { icon: "time-entry-request", label: "Avg Time to Hire",  value: `${avgHireDays}d`,                           sub: "Across all departments",                                   color: "#D26900" },
          { icon: "ai",            label: "Automation Targets",      value: autoRecs.length > 0 ? String(autoRecs.filter(r => r.action === "AUTOMATE").length) : "—", sub: "Click Automation tab to analyse", color: "#6E32C9" },
        ].map(k => (
          <div key={k.label} style={{ background: "#fff", border: "1px solid #e8ebef", borderRadius: "10px", padding: "14px 16px", borderTop: `3px solid ${k.color}`, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <Icon name={k.icon} style={{ fontSize: "15px", color: k.color }} />
              <Text style={{ fontSize: "11px", color: "#556b82", fontWeight: 500 }}>{k.label}</Text>
            </div>
            <Text style={{ fontSize: "22px", fontWeight: 700, color: k.color, display: "block" }}>{k.value}</Text>
            <Text style={{ fontSize: "10px", color: "#888" }}>{k.sub}</Text>
          </div>
        ))}
      </div>

      {/* ── Dept Summary Cards ──────────────────────────────────── */}
      <div>
        <Text style={{ fontSize: "12px", fontWeight: 700, color: "#556b82", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "10px" }}>
          Department Overview
        </Text>
        <FlexBox wrap="Wrap" style={{ gap: "1rem" }}>
          {deptData.map(d => (
            <DeptSummaryCard key={d.dept} {...d} />
          ))}
        </FlexBox>
      </div>

      {/* ── Sub-tabs ────────────────────────────────────────────── */}
      <TabContainer
        onTabSelect={(e: any) => {
          const text = e.detail?.tab?.getAttribute("text") ?? "";
          const key  = text.toLowerCase().replace(/skilling/g, "skilling").split(" ")[0];
          setActiveTab(key);
          if (key === "automation") fetchAutomation();
        }}
        tabLayout="Inline"
        style={{ marginTop: "0.25rem" }}
      >
        {/* Hiring */}
        <Tab text="Hiring Center" design="Default" selected>
          <div style={{ paddingTop: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <ChartPair costData={hiringChart} timeKey="Avg Days" timeUnit="days" timeColor="#D26900" />
            <Card header={<CardHeader titleText="Hiring Summary by Department" subtitleText="No individual data — department-level view" />} style={{ borderRadius: "10px", border: "1px solid #e4e8ed" }}>
              <div style={{ padding: "0 1rem 0.5rem" }}>
                <DeptTable rows={hiringChart.map((r, i) => ({ ...r, dept: DEPTS[i], headcount: deptData[i].headcount }))} cols={[
                  { label: "Department",  key: "dept" },
                  { label: "Headcount",   key: "headcount" },
                  { label: "Open Roles",  key: "Open Roles", color: "#DA1E28" },
                  { label: "Total Cost",  key: "Cost ($K)",  fmt: v => `$${v}K`, color: "#0F62FE" },
                  { label: "Avg Days Open", key: "Avg Days", fmt: v => `${v}d`, color: "#D26900" },
                ]} />
              </div>
            </Card>
          </div>
        </Tab>

        {/* UpSkilling */}
        <Tab text="UpSkilling Center" design="Default">
          <div style={{ paddingTop: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <ChartPair costData={upskillChart} timeKey="Avg Weeks" timeUnit="weeks" timeColor="#198754" />
            <Card header={<CardHeader titleText="UpSkilling Summary by Department" subtitleText="High-fit employees (fit score ≥60%)" />} style={{ borderRadius: "10px", border: "1px solid #e4e8ed" }}>
              <div style={{ padding: "0 1rem 0.5rem" }}>
                <DeptTable rows={upskillChart.map((r, i) => ({ ...r, dept: DEPTS[i], headcount: deptData[i].headcount }))} cols={[
                  { label: "Department",       key: "dept" },
                  { label: "Headcount",        key: "headcount" },
                  { label: "Enrolled (≥60% fit)", key: "Enrolled",  color: "#6E32C9" },
                  { label: "Total Cost",       key: "Cost ($K)",  fmt: v => `$${v}K`, color: "#0F62FE" },
                  { label: "Avg Duration",     key: "Avg Weeks",  fmt: v => `${v}w`,  color: "#198754" },
                ]} />
              </div>
            </Card>
          </div>
        </Tab>

        {/* ReSkilling */}
        <Tab text="ReSkilling Center" design="Default">
          <div style={{ paddingTop: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <ChartPair costData={reskillChart} timeKey="Avg Weeks" timeUnit="weeks" timeColor="#6E32C9" />
            <Card header={<CardHeader titleText="ReSkilling Summary by Department" subtitleText="All reskilling candidates by department" />} style={{ borderRadius: "10px", border: "1px solid #e4e8ed" }}>
              <div style={{ padding: "0 1rem 0.5rem" }}>
                <DeptTable rows={reskillChart.map((r, i) => ({ ...r, dept: DEPTS[i], headcount: deptData[i].headcount }))} cols={[
                  { label: "Department",   key: "dept" },
                  { label: "Headcount",    key: "headcount" },
                  { label: "Candidates",   key: "Candidates", color: "#6E32C9" },
                  { label: "Total Cost",   key: "Cost ($K)",  fmt: v => `$${v}K`, color: "#0F62FE" },
                  { label: "Avg Duration", key: "Avg Weeks",  fmt: v => `${v}w`,  color: "#D26900" },
                ]} />
              </div>
            </Card>
          </div>
        </Tab>

        {/* Automation */}
        <Tab text="Automation Center" design="Default" onClick={() => fetchAutomation()}>
          <div style={{ paddingTop: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {autoLoading && <BusyIndicator active size="L" style={{ display: "block", margin: "2rem auto" }} />}
            {!autoLoading && autoRecs.length === 0 && (
              <div style={{ textAlign: "center", padding: "2rem", color: "#556b82" }}>
                <Text>Click the tab to run automation analysis across all 3 departments.</Text>
              </div>
            )}
            {!autoLoading && autoRecs.length > 0 && (
              <>
                <ChartPair costData={autoChart} timeKey="Avg Months" timeUnit="months" timeColor="#6E32C9" />
                <Card header={<CardHeader titleText="Automation Summary by Department" subtitleText="Roles targeted for automation — no individual names" />} style={{ borderRadius: "10px", border: "1px solid #e4e8ed" }}>
                  <div style={{ padding: "0 1rem 0.5rem" }}>
                    <DeptTable rows={autoChart.map((r, i) => ({ ...r, dept: DEPTS[i], headcount: deptData[i].headcount }))} cols={[
                      { label: "Department",      key: "dept" },
                      { label: "Headcount",       key: "headcount" },
                      { label: "Automation Targets", key: "Targets",   color: "#6E32C9" },
                      { label: "Total Cost",      key: "Cost ($K)",   fmt: v => `$${v}K`, color: "#0F62FE" },
                      { label: "Avg Timeline",    key: "Avg Months",  fmt: v => `${v}m`,  color: "#D26900" },
                    ]} />
                  </div>
                </Card>
              </>
            )}
          </div>
        </Tab>
      </TabContainer>

      {/* Tab icon/text CSS */}
      <style>{`
        [ui5-tabcontainer]::part(content) { padding: 0; }
        [ui5-tabcontainer]::part(tabStrip) { border-bottom: 2px solid #eef0f5; }
        [ui5-tab]::part(icon) { display: none !important; }
        [ui5-tab]::part(text) { font-size: 13.5px; font-weight: 500; }
        [ui5-tab][selected]::part(text) { font-weight: 700; color: #0F62FE; }
        [ui5-tab]::part(tab) { padding: 10px 18px; border-radius: 8px 8px 0 0; }
      `}</style>
    </div>
  );
}
