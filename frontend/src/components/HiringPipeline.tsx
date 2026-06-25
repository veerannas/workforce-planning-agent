import { useEffect, useState } from "react";
import { Card, CardHeader, Title, FlexBox, Text, Icon, ObjectStatus } from "@ui5/webcomponents-react";
import { AnalyticalTable } from "@ui5/webcomponents-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import "@ui5/webcomponents-icons/dist/add-employee.js";
import "@ui5/webcomponents-icons/dist/money-bills.js";
import "@ui5/webcomponents-icons/dist/time-entry-request.js";
import "@ui5/webcomponents-icons/dist/approvals.js";

const API = import.meta.env.DEV ? "http://localhost:8000" : "";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  Open:      { bg: "#fce4ec", color: "#c62828" },
  Screening: { bg: "#fff3e0", color: "#e65100" },
  Interview: { bg: "#e3f2fd", color: "#1565c0" },
  Offer:     { bg: "#f3e5f5", color: "#6a1b9a" },
  Filled:    { bg: "#e8f5e9", color: "#2e7d32" },
};
const DEPT_COLORS: Record<string, string> = {
  Technology: "#0F62FE", Operations: "#198754", Finance: "#6E32C9",
};

export function HiringPipeline() {
  const [pipeline, setPipeline] = useState<any[]>([]);
  const [metrics, setMetrics]   = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/hiring/pipeline`).then(r => r.json()),
      fetch(`${API}/api/hiring/metrics`).then(r => r.json()),
    ]).then(([p, m]) => { setPipeline(p); setMetrics(m); });
  }, []);


  // ── Dept bar data ─────────────────────────────────────────────────────────
  const deptData = metrics ? Object.entries(metrics.by_department).map(([dept, count]) => ({
    dept,
    "Open Roles": count as number,
    "Est. Cost ($K)": Math.round((count as number) * metrics.avg_cost_per_hire_usd / 1000),
    "Est. Days": Math.round((count as number) * metrics.avg_time_to_fill_days),
  })) : [];

  const columns: any[] = [
    { Header: "Role",         accessor: "role",             width: 160 },
    { Header: "Department",   accessor: "department",       width: 110 },
    { Header: "Status",       accessor: "status",           width: 105, Cell: ({ value }: any) => {
      const s = STATUS_COLORS[value] || { bg: "#f5f5f5", color: "#333" };
      return <span style={{ padding: "2px 8px", borderRadius: "10px", background: s.bg, color: s.color, fontSize: "0.8rem", fontWeight: 500 }}>{value}</span>;
    }},
    { Header: "Priority",     accessor: "priority",         width: 90, Cell: ({ value }: any) => (
      <ObjectStatus state={value === "critical" ? "Negative" : value === "high" ? "Critical" : "None"} showDefaultIcon>{value}</ObjectStatus>
    )},
    { Header: "Days Open",    accessor: "days_open",        width: 90,  hAlign: "End", Cell: ({ value }: any) => (
      <span style={{ fontWeight: 700, color: value > 50 ? "#DA1E28" : value > 35 ? "#D26900" : "#198754" }}>{value}d</span>
    )},
    { Header: "Cost to Fill", accessor: "cost_to_fill_usd", width: 115, hAlign: "End", Cell: ({ value }: any) => (
      <span style={{ fontWeight: 700, color: "#0F62FE" }}>${value?.toLocaleString()}</span>
    )},
    { Header: "Candidates",   accessor: "candidates",       width: 90,  hAlign: "End" },
    { Header: "Salary Range", accessor: "salary_range",     width: 140 },
    { Header: "Manager",      accessor: "hiring_manager",   width: 130 },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <Title level="H3" style={{ color: "#1a376c" }}>Hiring Center</Title>

      {/* ── Hero KPIs: Time + Cost primary ──────────────────────────────── */}
      {metrics && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
          {[
            { icon: "time-entry-request", label: "Avg Time to Fill", value: `${metrics.avg_time_to_fill_days}d`, sub: "Target: ≤42 days", color: metrics.avg_time_to_fill_days > 42 ? "#DA1E28" : "#198754" },
            { icon: "money-bills",        label: "Avg Cost / Hire",  value: `$${metrics.avg_cost_per_hire_usd.toLocaleString()}`, sub: "Total pipeline est.", color: "#0F62FE" },
            { icon: "add-employee",       label: "Open Requisitions",value: String(metrics.open_requisitions), sub: `${Object.values(metrics.pipeline_by_stage).reduce((a: number, b) => a + (b as number), 0)} in pipeline`, color: "#D26900" },
            { icon: "approvals",          label: "Offer Accept Rate",value: `${Math.round(metrics.offer_acceptance_rate * 100)}%`, sub: "Industry avg: 80%", color: "#198754" },
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
      )}

      {/* ── Charts: Cost + Time per Dept ────────────────────────────────── */}
      {metrics && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <Card header={<CardHeader titleText="Est. Cost by Department ($K)" subtitleText="Open roles × avg cost/hire" avatar={<Icon name="money-bills" />} />}
            style={{ borderRadius: "10px", border: "1px solid #e4e8ed" }}>
            <div style={{ padding: "0.75rem 1rem", height: "200px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef0f5" />
                  <XAxis dataKey="dept" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="K" />
                  <Tooltip formatter={(v: any) => `$${v}K`} />
                  <Bar dataKey="Est. Cost ($K)" radius={[4, 4, 0, 0]}>
                    {deptData.map((d, i) => <Cell key={i} fill={DEPT_COLORS[d.dept] ?? "#0F62FE"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card header={<CardHeader titleText="Est. Fill Time by Department (Days)" subtitleText="Open roles × avg time-to-fill" avatar={<Icon name="time-entry-request" />} />}
            style={{ borderRadius: "10px", border: "1px solid #e4e8ed" }}>
            <div style={{ padding: "0.75rem 1rem", height: "200px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef0f5" />
                  <XAxis dataKey="dept" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="d" />
                  <Tooltip formatter={(v: any) => `${v} days`} />
                  <Bar dataKey="Est. Days" radius={[4, 4, 0, 0]}>
                    {deptData.map((d, i) => <Cell key={i} fill={DEPT_COLORS[d.dept] ?? "#D26900"} opacity={0.8} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {/* ── Pipeline stage summary ───────────────────────────────────────── */}
      {metrics && (
        <Card header={<CardHeader titleText="Pipeline Stage Breakdown" avatar={<Icon name="add-employee" />} />}
          style={{ borderRadius: "10px", border: "1px solid #e4e8ed" }}>
          <div style={{ padding: "1rem" }}>
            <FlexBox style={{ gap: "8px", alignItems: "flex-end", height: "110px" }}>
              {Object.entries(metrics.pipeline_by_stage).map(([stage, count]) => {
                const s = STATUS_COLORS[stage] || { bg: "#e0e0e0", color: "#333" };
                return (
                  <div key={stage} style={{ flex: 1, textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%" }}>
                    <div style={{ background: s.bg, border: `1px solid ${s.color}30`, borderRadius: "6px 6px 0 0", height: `${Math.max(24, (count as number) * 18)}px`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ color: s.color, fontWeight: 700, fontSize: "0.9rem" }}>{count as number}</Text>
                    </div>
                    <Text style={{ fontSize: "0.7rem", color: "#666", marginTop: "4px" }}>{stage}</Text>
                  </div>
                );
              })}
            </FlexBox>
          </div>
        </Card>
      )}

      {/* ── Requisitions table ───────────────────────────────────────────── */}
      <Card header={<CardHeader titleText="Active Requisitions" subtitleText={`${pipeline.length} open · sorted by days open`} />}
        style={{ borderRadius: "10px", border: "1px solid #e4e8ed" }}>
        <AnalyticalTable columns={columns} data={[...pipeline].sort((a, b) => b.days_open - a.days_open)} filterable sortable groupable rowHeight={42} visibleRows={12} scaleWidthMode="Smart" />
      </Card>
    </div>
  );
}
