import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import {
  Card, CardHeader, Title, Text, Tag, Icon,
  FlexBox, BusyIndicator, MessageStrip, ObjectStatus,
} from "@ui5/webcomponents-react";
import { AnalyticalTable } from "@ui5/webcomponents-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie,
} from "recharts";
import "@ui5/webcomponents-icons/dist/ai.js";
import "@ui5/webcomponents-icons/dist/money-bills.js";
import "@ui5/webcomponents-icons/dist/time-entry-request.js";
import "@ui5/webcomponents-icons/dist/trend-up.js";
import "@ui5/webcomponents-icons/dist/employee.js";

const API = import.meta.env.DEV ? "http://localhost:8000" : "";

const ACTION_COLORS: Record<string, string> = {
  AUTOMATE: "#6E32C9", BUILD: "#198754", REDEPLOY: "#0F62FE",
  BUY: "#D26900", REVIEW: "#DA1E28",
};

export function AutomationCenter() {
  const { user } = useAuth();
  const dept = user?.department || "";

  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<any>(null);
  const [error, setError]       = useState("");
  const [hasRun, setHasRun]     = useState(false);

  // Auto-run on mount
  useEffect(() => {
    runAnalysis();
  }, []);

  const runAnalysis = async () => {
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch(`${API}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: `Identify which roles and tasks in the ${dept || "organisation"} department can be partially or fully automated with AI tools. For each automation candidate, show expected productivity gains, implementation cost, and which employees should be reskilled to higher-value work.`,
          scenario_type: "automation_opportunity",
          user_role: user?.role || "manager",
          employee_id: null,
          department: dept || null,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setResult(await res.json());
      setHasRun(true);
    } catch (e: any) {
      setError(e.message || "Failed to connect to backend");
    } finally {
      setLoading(false);
    }
  };

  const summary = result?.summary;
  const recs    = result?.recommendations ?? [];
  const automated = recs.filter((r: any) => r.action === "AUTOMATE");
  const others    = recs.filter((r: any) => r.action !== "AUTOMATE");

  // Cost vs Time chart: automation candidates
  const costTimeData = automated.slice(0, 10).map((r: any) => ({
    name: r.employee_name,
    dept: r.department,
    "Cost ($K)":       Math.round(r.cost_estimate_usd / 1000),
    "Timeline (mo)":   r.timeline_months,
    role: r.current_role,
  }));

  // Action breakdown pie
  const pieData = summary ? Object.entries(summary.actions_breakdown || {}).map(([action, count]) => ({
    name: action, value: count as number,
  })) : [];

  const cols: any[] = [
    { Header: "Employee",      accessor: "employee_name",      width: 140 },
    { Header: "Department",    accessor: "department",         width: 110 },
    { Header: "Current Role",  accessor: "current_role",       width: 150 },
    { Header: "Action",        accessor: "action",             width: 100, Cell: ({ value }: any) => (
      <Tag style={{ color: ACTION_COLORS[value] || "#333", fontWeight: 600 }}>{value}</Tag>
    )},
    { Header: "Target Role",   accessor: "target_role",        width: 130 },
    { Header: "Timeline (mo)", accessor: "timeline_months",    width: 110, hAlign: "End", Cell: ({ value }: any) => (
      <span style={{ fontWeight: 700, color: value > 12 ? "#D26900" : "#198754" }}>{value}m</span>
    )},
    { Header: "Cost ($)",      accessor: "cost_estimate_usd",  width: 110, hAlign: "End", Cell: ({ value }: any) => (
      <span style={{ fontWeight: 700, color: "#0F62FE" }}>${value?.toLocaleString()}</span>
    )},
    { Header: "Confidence",    accessor: "confidence",         width: 90,  Cell: ({ value }: any) => (
      <ObjectStatus state={value >= 0.8 ? "Positive" : value >= 0.6 ? "Critical" : "Negative"} showDefaultIcon>
        {Math.round(value * 100)}%
      </ObjectStatus>
    )},
    { Header: "Rationale",     accessor: "rationale",          width: 300 },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <FlexBox alignItems="Center" justifyContent="SpaceBetween" style={{ marginBottom: "0.25rem" }}>
        <Title level="H3" style={{ color: "#1a376c" }}>Automation Center</Title>
        <button
          onClick={runAnalysis}
          disabled={loading}
          style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: "#6E32C9", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Analysing…" : "Re-run Analysis"}
        </button>
      </FlexBox>

      {loading && <BusyIndicator active size="L" style={{ display: "block", margin: "2rem auto" }} />}
      {error   && <MessageStrip design="Negative">{error}</MessageStrip>}

      {summary && !loading && (
        <>
          {/* KPI strip */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
            {[
              { icon: "ai",                label: "Automation Candidates", value: String(summary.actions_breakdown?.AUTOMATE ?? 0),          color: "#6E32C9" },
              { icon: "money-bills",       label: "Total Cost",            value: `$${(summary.total_cost_usd / 1000).toFixed(0)}K`,         color: "#0F62FE" },
              { icon: "time-entry-request",label: "Avg Timeline",          value: `${recs.length ? Math.round(recs.reduce((s: number, r: any) => s + r.timeline_months, 0) / recs.length) : 0}m`, color: "#D26900" },
              { icon: "employee",          label: "Employees in Scope",    value: String(summary.total_employees ?? 0),                      color: "#198754" },
            ].map(k => (
              <div key={k.label} style={{ background: "#fff", border: "1px solid #e8ebef", borderRadius: "10px", padding: "14px 16px", borderTop: `3px solid ${k.color}`, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <Icon name={k.icon} style={{ fontSize: "15px", color: k.color }} />
                  <Text style={{ fontSize: "11px", color: "#556b82", fontWeight: 500 }}>{k.label}</Text>
                </div>
                <Text style={{ fontSize: "22px", fontWeight: 700, color: k.color, display: "block" }}>{k.value}</Text>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {/* Cost vs Timeline bar */}
            <Card header={<CardHeader titleText="Automation: Cost vs Timeline" subtitleText="Top 10 candidates ($K / months)" avatar={<Icon name="money-bills" />} />}
              style={{ borderRadius: "10px", border: "1px solid #e4e8ed" }}>
              <div style={{ padding: "0.75rem 1rem", height: "220px" }}>
                {costTimeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={costTimeData} margin={{ top: 5, right: 20, left: 0, bottom: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eef0f5" />
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" />
                      <YAxis yAxisId="left" tick={{ fontSize: 10 }} unit="K" />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} unit="m" />
                      <Tooltip />
                      <Bar yAxisId="left" dataKey="Cost ($K)" fill="#6E32C9" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="right" dataKey="Timeline (mo)" fill="#D26900" radius={[4, 4, 0, 0]} opacity={0.75} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <Text style={{ display: "block", textAlign: "center", marginTop: "4rem", color: "#888" }}>No automation candidates found</Text>}
              </div>
            </Card>

            {/* Action breakdown pie */}
            <Card header={<CardHeader titleText="Recommended Actions Breakdown" subtitleText="All employees in scope" avatar={<Icon name="ai" />} />}
              style={{ borderRadius: "10px", border: "1px solid #e4e8ed" }}>
              <div style={{ padding: "0.5rem", height: "220px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={11}>
                      {pieData.map((_: any, i: number) => <Cell key={i} fill={ACTION_COLORS[pieData[i]?.name] ?? "#999"} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Automation candidates table */}
          <Card header={<CardHeader titleText="Automation Candidates" subtitleText={`${automated.length} roles identified — sorted by cost`} avatar={<Icon name="ai" />} />}
            style={{ borderRadius: "10px", border: "1px solid #e4e8ed", borderLeft: "4px solid #6E32C9" }}>
            <AnalyticalTable columns={cols} data={[...automated].sort((a, b) => b.cost_estimate_usd - a.cost_estimate_usd)} filterable sortable rowHeight={42} visibleRows={10} scaleWidthMode="Smart" />
          </Card>

          {/* Other recommendations */}
          {others.length > 0 && (
            <Card header={<CardHeader titleText="Other Recommendations (Reskill / Redeploy)" subtitleText={`${others.length} employees with alternative actions`} />}
              style={{ borderRadius: "10px", border: "1px solid #e4e8ed" }}>
              <AnalyticalTable columns={cols} data={others} filterable sortable rowHeight={42} visibleRows={8} scaleWidthMode="Smart" />
            </Card>
          )}
        </>
      )}

      {!hasRun && !loading && !error && (
        <MessageStrip design="Information">
          Running automation opportunity analysis for your team…
        </MessageStrip>
      )}
    </div>
  );
}
