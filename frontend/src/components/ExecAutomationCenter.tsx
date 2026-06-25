/**
 * ExecAutomationCenter — Executive view: dept-level automation analysis
 * Primary: Cost ($) + Timeline (months) | Secondary: Candidates, Savings, Confidence
 */
import { useEffect, useState, useCallback } from "react";
import { Card, CardHeader, Title, Text, Icon, ObjectStatus, BusyIndicator, MessageStrip } from "@ui5/webcomponents-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import "@ui5/webcomponents-icons/dist/ai.js";
import "@ui5/webcomponents-icons/dist/money-bills.js";
import "@ui5/webcomponents-icons/dist/time-entry-request.js";
import "@ui5/webcomponents-icons/dist/trend-up.js";
import "@ui5/webcomponents-icons/dist/employee.js";
import "@ui5/webcomponents-icons/dist/accept.js";

const API = import.meta.env.DEV ? "http://localhost:8000" : "";
const DEPTS = ["Technology", "Operations", "Finance"];
const DEPT_COLORS: Record<string, string> = { Technology: "#0F62FE", Operations: "#198754", Finance: "#6E32C9" };
const ACTION_COLORS: Record<string, string> = { AUTOMATE: "#6E32C9", BUILD: "#198754", REDEPLOY: "#0F62FE", BUY: "#D26900", REVIEW: "#DA1E28" };

export function ExecAutomationCenter() {
  const [recs, setRecs]         = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const runAnalysis = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [insData, analyzeData] = await Promise.all([
        fetch(`${API}/api/org/executive-insights`).then(r => r.json()),
        fetch(`${API}/api/analyze`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scenario: "Identify all roles and tasks across the entire organisation that can be automated with AI and technology. Provide full breakdown by department.", scenario_type: "automation_opportunity", user_role: "executive", employee_id: null, department: null }),
        }).then(r => r.json()),
      ]);
      setInsights(insData);
      setRecs(analyzeData.recommendations ?? []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { runAnalysis(); }, []);

  if (loading) return <BusyIndicator active size="L" style={{ display: "block", margin: "3rem auto" }} />;
  if (error)   return <MessageStrip design="Negative">{error}</MessageStrip>;
  if (!insights || recs.length === 0) return <Text>Loading Automation Center...</Text>;

  const autoRecs    = recs.filter(r => r.action === "AUTOMATE");
  const redeployRecs = recs.filter(r => r.action === "REDEPLOY");

  const byDept = DEPTS.map(dept => {
    const autoRows = autoRecs.filter(r => r.department === dept);
    const redRows  = redeployRecs.filter(r => r.department === dept);
    const ins      = insights.departments.find((d: any) => d.department === dept) ?? {};
    return {
      dept,
      headcount:      ins.headcount ?? 0,
      autoTargets:    autoRows.length,
      totalCost:      autoRows.reduce((s: number, r: any) => s + (r.cost_estimate_usd || 0), 0),
      avgMonths:      autoRows.length ? Math.round(autoRows.reduce((s: number, r: any) => s + r.timeline_months, 0) / autoRows.length) : 0,
      avgConf:        autoRows.length ? Math.round(autoRows.reduce((s: number, r: any) => s + r.confidence, 0) / autoRows.length * 100) : 0,
      redeployCount:  redRows.length,
      pctAutomatic:   ins.headcount > 0 ? Math.round(autoRows.length / ins.headcount * 100) : 0,
    };
  });

  const totalCost    = byDept.reduce((s, d) => s + d.totalCost, 0);
  const totalTargets = byDept.reduce((s, d) => s + d.autoTargets, 0);
  const avgMonths    = byDept.filter(d => d.avgMonths > 0).length
    ? Math.round(byDept.reduce((s, d) => s + d.avgMonths, 0) / byDept.filter(d => d.avgMonths > 0).length) : 0;
  const avgConf      = byDept.filter(d => d.avgConf > 0).length
    ? Math.round(byDept.reduce((s, d) => s + d.avgConf, 0) / byDept.filter(d => d.avgConf > 0).length) : 0;

  // Action pie
  const actionBreakdown = Object.entries(
    recs.reduce((acc: Record<string,number>, r: any) => { acc[r.action] = (acc[r.action]||0)+1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  const kpis = [
    { icon: "money-bills",        label: "Automation Cost",       value: `$${(totalCost/1000).toFixed(0)}K`,    sub: `${totalTargets} roles targeted`,            color: "#0F62FE" },
    { icon: "time-entry-request", label: "Avg Implementation",    value: `${avgMonths}m`,                       sub: "Est. rollout timeline",                     color: "#D26900" },
    { icon: "ai",                 label: "Automation Candidates", value: String(totalTargets),                   sub: `${redeployRecs.length} redeploy candidates`, color: "#6E32C9" },
    { icon: "accept",             label: "Avg Confidence",        value: `${avgConf}%`,                          sub: "AI model confidence",                       color: avgConf >= 70 ? "#198754" : "#D26900" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Title level="H3">Automation Center — Executive View</Title>
        <button onClick={runAnalysis} style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: "#6E32C9", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
          Re-run Analysis
        </button>
      </div>

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
        <Card header={<CardHeader titleText="Automation Cost by Department ($K)" avatar={<Icon name="money-bills" />} />} style={{ borderRadius: "10px", border: "1px solid #e4e8ed" }}>
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
        <Card header={<CardHeader titleText="Avg Implementation Timeline by Department (Months)" avatar={<Icon name="time-entry-request" />} />} style={{ borderRadius: "10px", border: "1px solid #e4e8ed" }}>
          <div style={{ padding: "0.75rem 1rem", height: "200px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byDept.map(d => ({ dept: d.dept, "Avg Months": d.avgMonths }))} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef0f5" />
                <XAxis dataKey="dept" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} unit="m" />
                <Tooltip formatter={(v: any) => `${v} months`} />
                <Bar dataKey="Avg Months" radius={[4,4,0,0]}>
                  {byDept.map((_,i) => <Cell key={i} fill={DEPT_COLORS[DEPTS[i]]} opacity={0.8} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem" }}>
        <Card header={<CardHeader titleText="Automation Summary by Department" subtitleText="No individual data — dept-level view" avatar={<Icon name="ai" />} />} style={{ borderRadius: "10px", border: "1px solid #e4e8ed" }}>
          <div style={{ padding: "0 1rem 0.5rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f4f6f9", borderBottom: "1.5px solid #e4e8ed" }}>
                  {["Department","Headcount","Auto Targets","% of Dept","Total Cost","Avg Timeline","Avg Confidence","Redeploy"].map(h => (
                    <th key={h} style={{ padding: "9px 12px", textAlign: "left", fontWeight: 600, color: "#556b82", fontSize: "11px", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {byDept.map((d,i) => (
                  <tr key={d.dept} style={{ borderBottom: "1px solid #eef0f5", background: i%2===0?"#fafbfc":"#fff" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: DEPT_COLORS[d.dept] }}>{d.dept}</td>
                    <td style={{ padding: "10px 12px" }}>{d.headcount}</td>
                    <td style={{ padding: "10px 12px" }}><ObjectStatus state={d.autoTargets > 10 ? "Negative" : d.autoTargets > 5 ? "Critical" : "None"} showDefaultIcon>{d.autoTargets}</ObjectStatus></td>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: d.pctAutomatic > 20 ? "#DA1E28" : "#D26900" }}>{d.pctAutomatic}%</td>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: "#0F62FE" }}>${(d.totalCost/1000).toFixed(0)}K</td>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: "#D26900" }}>{d.avgMonths}m</td>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: d.avgConf >= 70 ? "#198754" : "#D26900" }}>{d.avgConf}%</td>
                    <td style={{ padding: "10px 12px" }}>{d.redeployCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card header={<CardHeader titleText="Action Breakdown" subtitleText="All 150 employees" avatar={<Icon name="ai" />} />} style={{ borderRadius: "10px", border: "1px solid #e4e8ed" }}>
          <div style={{ height: "220px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={actionBreakdown} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={10}>
                  {actionBreakdown.map((_: any, i: number) => <Cell key={i} fill={ACTION_COLORS[actionBreakdown[i]?.name] ?? "#999"} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
