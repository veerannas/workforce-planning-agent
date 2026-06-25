/**
 * ExecHiringCenter — Executive view: dept-level, no individual names
 * Primary: Cost ($) + Time (days) | Secondary: Open roles, Pipeline, Offer rate
 */
import { useEffect, useState } from "react";
import { Card, CardHeader, Title, Text, Icon, ObjectStatus } from "@ui5/webcomponents-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import "@ui5/webcomponents-icons/dist/add-employee.js";
import "@ui5/webcomponents-icons/dist/money-bills.js";
import "@ui5/webcomponents-icons/dist/time-entry-request.js";
import "@ui5/webcomponents-icons/dist/approvals.js";
import "@ui5/webcomponents-icons/dist/pipeline-analysis.js";
import "@ui5/webcomponents-icons/dist/employee.js";

const API = import.meta.env.DEV ? "http://localhost:8000" : "";
const DEPTS = ["Technology", "Operations", "Finance"];
const DEPT_COLORS: Record<string, string> = { Technology: "#0F62FE", Operations: "#198754", Finance: "#6E32C9" };

export function ExecHiringCenter() {
  const [pipeline, setPipeline] = useState<any[]>([]);
  const [metrics, setMetrics]   = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/hiring/pipeline`).then(r => r.json()),
      fetch(`${API}/api/hiring/metrics`).then(r => r.json()),
      fetch(`${API}/api/org/executive-insights`).then(r => r.json()),
    ]).then(([p, m, i]) => { setPipeline(p); setMetrics(m); setInsights(i); });
  }, []);

  if (!metrics || !insights) return <Text>Loading Hiring Center...</Text>;

  const byDept = DEPTS.map(dept => {
    const rows = pipeline.filter(r => r.department === dept);
    const ins  = insights.departments.find((d: any) => d.department === dept) ?? {};
    return {
      dept,
      headcount:      ins.headcount ?? 0,
      openRoles:      rows.length,
      totalCost:      rows.reduce((s: number, r: any) => s + (r.cost_to_fill_usd || 0), 0),
      avgDays:        rows.length ? Math.round(rows.reduce((s: number, r: any) => s + r.days_open, 0) / rows.length) : 0,
      critical:       rows.filter(r => r.priority === "critical").length,
      candidates:     rows.reduce((s: number, r: any) => s + (r.candidates || 0), 0),
    };
  });

  const totalCost   = byDept.reduce((s, d) => s + d.totalCost, 0);
  const totalOpen   = byDept.reduce((s, d) => s + d.openRoles, 0);
  const totalCands  = byDept.reduce((s, d) => s + d.candidates, 0);
  const avgDays     = metrics.avg_time_to_fill_days;

  const kpis = [
    { icon: "money-bills",        label: "Total Cost to Fill",   value: `$${(totalCost/1000).toFixed(0)}K`,  sub: `Across ${totalOpen} open roles`,                  color: "#0F62FE" },
    { icon: "time-entry-request", label: "Avg Time to Fill",     value: `${avgDays}d`,                       sub: `Benchmark: 45 days`,                              color: metrics.avg_time_to_fill_days > 45 ? "#DA1E28" : "#198754" },
    { icon: "add-employee",       label: "Open Requisitions",    value: String(totalOpen),                   sub: `${byDept.reduce((s,d)=>s+d.critical,0)} critical`, color: "#D26900" },
    { icon: "pipeline",           label: "Candidates in Pipeline", value: String(totalCands),               sub: `${Math.round(metrics.offer_acceptance_rate*100)}% offer acceptance`, color: "#6E32C9" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <Title level="H3">Hiring Center — Executive View</Title>

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "10px" }}>
        {kpis.map(k => (
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

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <Card header={<CardHeader titleText="Cost to Fill by Department ($K)" avatar={<Icon name="money-bills" />} />} style={{ borderRadius: "10px", border: "1px solid #e4e8ed" }}>
          <div style={{ padding: "0.75rem 1rem", height: "200px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byDept.map(d => ({ dept: d.dept, "Cost ($K)": Math.round(d.totalCost/1000) }))} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef0f5" />
                <XAxis dataKey="dept" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} unit="K" />
                <Tooltip formatter={(v: any) => `$${v}K`} />
                <Bar dataKey="Cost ($K)" radius={[4,4,0,0]}>
                  {byDept.map((_,i) => <Cell key={i} fill={DEPT_COLORS[DEPTS[i]]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card header={<CardHeader titleText="Avg Days Open by Department" avatar={<Icon name="time-entry-request" />} />} style={{ borderRadius: "10px", border: "1px solid #e4e8ed" }}>
          <div style={{ padding: "0.75rem 1rem", height: "200px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byDept.map(d => ({ dept: d.dept, "Avg Days": d.avgDays }))} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef0f5" />
                <XAxis dataKey="dept" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} unit="d" />
                <Tooltip formatter={(v: any) => `${v} days`} />
                <Bar dataKey="Avg Days" radius={[4,4,0,0]}>
                  {byDept.map((d,i) => <Cell key={i} fill={d.avgDays > 45 ? "#DA1E28" : DEPT_COLORS[DEPTS[i]]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Dept summary table */}
      <Card header={<CardHeader titleText="Hiring Summary by Department" subtitleText="Aggregated — no individual data" avatar={<Icon name="add-employee" />} />} style={{ borderRadius: "10px", border: "1px solid #e4e8ed" }}>
        <div style={{ padding: "0 1rem 0.5rem" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#f4f6f9", borderBottom: "1.5px solid #e4e8ed" }}>
                {["Department","Headcount","Open Roles","Total Cost","Avg Days Open","Critical Roles","Candidates"].map(h => (
                  <th key={h} style={{ padding: "9px 12px", textAlign: "left", fontWeight: 600, color: "#556b82", fontSize: "11px", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {byDept.map((d,i) => (
                <tr key={d.dept} style={{ borderBottom: "1px solid #eef0f5", background: i%2===0?"#fafbfc":"#fff" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 700, color: DEPT_COLORS[d.dept] }}>{d.dept}</td>
                  <td style={{ padding: "10px 12px" }}>{d.headcount}</td>
                  <td style={{ padding: "10px 12px" }}><ObjectStatus state={d.openRoles > 5 ? "Negative" : "Critical"} showDefaultIcon>{d.openRoles}</ObjectStatus></td>
                  <td style={{ padding: "10px 12px", fontWeight: 700, color: "#0F62FE" }}>${(d.totalCost/1000).toFixed(0)}K</td>
                  <td style={{ padding: "10px 12px", fontWeight: 700, color: d.avgDays > 45 ? "#DA1E28" : "#198754" }}>{d.avgDays}d</td>
                  <td style={{ padding: "10px 12px" }}>{d.critical > 0 ? <ObjectStatus state="Negative" showDefaultIcon>{d.critical} critical</ObjectStatus> : <Text>0</Text>}</td>
                  <td style={{ padding: "10px 12px" }}>{d.candidates}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pipeline stage summary */}
      {metrics && (
        <Card header={<CardHeader titleText="Pipeline Stage Overview" avatar={<Icon name="pipeline-analysis" />} />} style={{ borderRadius: "10px", border: "1px solid #e4e8ed" }}>
          <div style={{ padding: "1rem", display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {Object.entries(metrics.pipeline_by_stage).map(([stage, count]) => (
              <div key={stage} style={{ padding: "10px 16px", background: "#f4f6f9", borderRadius: "8px", textAlign: "center", minWidth: "90px" }}>
                <Text style={{ fontSize: "20px", fontWeight: 700, color: "#0F62FE", display: "block" }}>{count as number}</Text>
                <Text style={{ fontSize: "11px", color: "#556b82" }}>{stage}</Text>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
