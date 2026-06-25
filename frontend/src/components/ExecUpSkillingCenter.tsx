/**
 * ExecUpSkillingCenter — Executive view: dept-level, cost+time primary
 * Focus: skill advancement, career growth, high-fit candidates by dept
 */
import { useEffect, useState } from "react";
import { Card, CardHeader, Title, Text, Icon, ObjectStatus } from "@ui5/webcomponents-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import "@ui5/webcomponents-icons/dist/education.js";
import "@ui5/webcomponents-icons/dist/money-bills.js";
import "@ui5/webcomponents-icons/dist/time-entry-request.js";
import "@ui5/webcomponents-icons/dist/trend-up.js";
import "@ui5/webcomponents-icons/dist/employee.js";

const API = import.meta.env.DEV ? "http://localhost:8000" : "";
const DEPTS = ["Technology", "Operations", "Finance"];
const DEPT_COLORS: Record<string, string> = { Technology: "#0F62FE", Operations: "#198754", Finance: "#6E32C9" };

export function ExecUpSkillingCenter() {
  const [programs, setPrograms]   = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [insights, setInsights]   = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/reskilling/programs`).then(r => r.json()),
      fetch(`${API}/api/reskilling/employees`).then(r => r.json()),
      fetch(`${API}/api/org/executive-insights`).then(r => r.json()),
    ]).then(([p, e, i]) => { setPrograms(p); setEmployees(e); setInsights(i); });
  }, []);

  if (!insights || !employees.length) return <Text>Loading UpSkilling Center...</Text>;

  // High-fit candidates only (fit ≥ 0.6 = upskilling focus)
  const highFit = employees.filter(e => e.reskill_fit_score >= 0.6);

  const byDept = DEPTS.map(dept => {
    const rows  = highFit.filter(e => e.department === dept);
    const ins   = insights.departments.find((d: any) => d.department === dept) ?? {};
    return {
      dept,
      headcount:    ins.headcount ?? 0,
      enrolled:     rows.length,
      totalCost:    rows.reduce((s: number, r: any) => s + (r.estimated_cost_usd || 0), 0),
      avgWeeks:     rows.length ? Math.round(rows.reduce((s: number, r: any) => s + (r.estimated_weeks || 0), 0) / rows.length) : 0,
      completed:    rows.filter(r => r.status === "Completed").length,
      inProgress:   rows.filter(r => r.status === "In Progress" || r.status === "Enrolled").length,
      avgFit:       rows.length ? Math.round(rows.reduce((s: number, r: any) => s + r.reskill_fit_score, 0) / rows.length * 100) : 0,
    };
  });

  const totalCost    = byDept.reduce((s, d) => s + d.totalCost, 0);
  const totalEnrolled = byDept.reduce((s, d) => s + d.enrolled, 0);
  const avgWeeks     = byDept.filter(d => d.avgWeeks > 0).length
    ? Math.round(byDept.reduce((s, d) => s + d.avgWeeks, 0) / byDept.filter(d => d.avgWeeks > 0).length) : 0;
  const avgCompletion = programs.length
    ? Math.round(programs.reduce((s, p) => s + p.completion_rate, 0) / programs.length * 100) : 0;

  const kpis = [
    { icon: "money-bills",         label: "Total UpSkill Investment", value: `$${(totalCost/1000).toFixed(0)}K`,  sub: `${totalEnrolled} high-fit employees`,           color: "#0F62FE" },
    { icon: "time-entry-request",  label: "Avg Program Duration",     value: `${avgWeeks}w`,                     sub: "Across all active programs",                    color: "#D26900" },
    { icon: "trend-up",            label: "High-Fit Candidates",      value: String(totalEnrolled),              sub: "Fit score ≥ 60%",                               color: "#6E32C9" },
    { icon: "education",           label: "Avg Completion Rate",      value: `${avgCompletion}%`,                sub: `${programs.length} active programs`,             color: avgCompletion >= 70 ? "#198754" : "#D26900" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <Title level="H3">UpSkilling Center — Executive View</Title>

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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <Card header={<CardHeader titleText="UpSkill Investment by Department ($K)" avatar={<Icon name="money-bills" />} />} style={{ borderRadius: "10px", border: "1px solid #e4e8ed" }}>
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
        <Card header={<CardHeader titleText="Avg Program Duration by Department (Weeks)" avatar={<Icon name="time-entry-request" />} />} style={{ borderRadius: "10px", border: "1px solid #e4e8ed" }}>
          <div style={{ padding: "0.75rem 1rem", height: "200px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byDept.map(d => ({ dept: d.dept, "Avg Weeks": d.avgWeeks }))} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef0f5" />
                <XAxis dataKey="dept" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} unit="w" />
                <Tooltip formatter={(v: any) => `${v} weeks`} />
                <Bar dataKey="Avg Weeks" radius={[4,4,0,0]}>
                  {byDept.map((_,i) => <Cell key={i} fill={DEPT_COLORS[DEPTS[i]]} opacity={0.8} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card header={<CardHeader titleText="UpSkilling Summary by Department" subtitleText="High-fit employees (≥60% fit score) — no individual data" avatar={<Icon name="trend-up" />} />} style={{ borderRadius: "10px", border: "1px solid #e4e8ed" }}>
        <div style={{ padding: "0 1rem 0.5rem" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#f4f6f9", borderBottom: "1.5px solid #e4e8ed" }}>
                {["Department","Headcount","Enrolled","Total Cost","Avg Duration","In Progress","Completed","Avg Fit Score"].map(h => (
                  <th key={h} style={{ padding: "9px 12px", textAlign: "left", fontWeight: 600, color: "#556b82", fontSize: "11px", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {byDept.map((d,i) => (
                <tr key={d.dept} style={{ borderBottom: "1px solid #eef0f5", background: i%2===0?"#fafbfc":"#fff" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 700, color: DEPT_COLORS[d.dept] }}>{d.dept}</td>
                  <td style={{ padding: "10px 12px" }}>{d.headcount}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 700, color: "#6E32C9" }}>{d.enrolled}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 700, color: "#0F62FE" }}>${(d.totalCost/1000).toFixed(0)}K</td>
                  <td style={{ padding: "10px 12px", fontWeight: 700, color: "#D26900" }}>{d.avgWeeks}w</td>
                  <td style={{ padding: "10px 12px" }}>{d.inProgress}</td>
                  <td style={{ padding: "10px 12px" }}><ObjectStatus state={d.completed > 0 ? "Positive" : "None"} showDefaultIcon>{d.completed}</ObjectStatus></td>
                  <td style={{ padding: "10px 12px", fontWeight: 700, color: d.avgFit >= 70 ? "#198754" : "#D26900" }}>{d.avgFit}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
