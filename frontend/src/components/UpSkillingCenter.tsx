/**
 * UpSkilling Center — focuses on skill advancement & career growth
 * (same reskilling data, framed as progression not transition)
 */
import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Card, CardHeader, Title, Tag, Text, ProgressIndicator, Icon, ObjectStatus } from "@ui5/webcomponents-react";
import { AnalyticalTable } from "@ui5/webcomponents-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import "@ui5/webcomponents-icons/dist/education.js";
import "@ui5/webcomponents-icons/dist/positive.js";
import "@ui5/webcomponents-icons/dist/money-bills.js";
import "@ui5/webcomponents-icons/dist/time-entry-request.js";
import "@ui5/webcomponents-icons/dist/trend-up.js";

const API = import.meta.env.DEV ? "http://localhost:8000" : "";

const CAT_COLORS: Record<string, string> = {
  "AI/ML":          "#6E32C9",
  "Programming":    "#0F62FE",
  "Cloud":          "#198754",
  "Data":           "#D26900",
  "Leadership":     "#DA1E28",
  "Finance":        "#0E6027",
};

export function UpSkillingCenter() {
  const { user } = useAuth();
  const [programs, setPrograms]   = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API}/api/reskilling/programs`).then(r => r.json()).then(setPrograms);
    if (user?.role !== "employee") {
      fetch(`${API}/api/reskilling/employees`).then(r => r.json()).then(setEmployees);
    }
  }, [user]);

  // ── Time vs Cost per category ─────────────────────────────────────────────
  const catMap: Record<string, { cost: number; weeks: number; count: number }> = {};
  programs.forEach(p => {
    if (!catMap[p.category]) catMap[p.category] = { cost: 0, weeks: 0, count: 0 };
    catMap[p.category].cost  += p.cost_per_employee_usd;
    catMap[p.category].weeks += p.duration_weeks;
    catMap[p.category].count++;
  });
  const catData = Object.entries(catMap).map(([cat, v]) => ({
    category: cat,
    "Avg Cost ($)":  Math.round(v.cost / v.count),
    "Avg Weeks":     Math.round(v.weeks / v.count),
    "Programs":      v.count,
  }));

  // ── High-fit upskill candidates (fit score >= 0.6) ─────────────────────
  const highFit = employees.filter(e => e.reskill_fit_score >= 0.6);

  const progCols: any[] = [
    { Header: "Skill",         accessor: "skill",                 width: 180 },
    { Header: "Category",      accessor: "category",              width: 110 },
    { Header: "Duration (wk)", accessor: "duration_weeks",        width: 100, hAlign: "End", Cell: ({ value }: any) => (
      <span style={{ fontWeight: 700, color: value > 8 ? "#D26900" : "#198754" }}>{value}w</span>
    )},
    { Header: "Cost/Employee", accessor: "cost_per_employee_usd", width: 115, hAlign: "End", Cell: ({ value }: any) => (
      <span style={{ fontWeight: 700, color: "#0F62FE" }}>${value?.toLocaleString()}</span>
    )},
    { Header: "Enrolled",      accessor: "enrolled",              width: 80,  hAlign: "End" },
    { Header: "Completion",    accessor: "completion_rate",       width: 120, Cell: ({ value }: any) => (
      <ProgressIndicator value={Math.round(value * 100)} valueState={value >= 0.7 ? "Positive" : "Critical"} style={{ width: "90px" }} />
    )},
    { Header: "Target Roles", accessor: "target_roles", width: 320, Cell: ({ value }: any) => value?.map((r: string) => (
      <Tag key={r} colorScheme="8" style={{ marginRight: 4, fontSize: "11px" }}>{r}</Tag>
    ))},
  ];

  const empCols: any[] = [
    { Header: "Name",          accessor: "name",               width: 140 },
    { Header: "Department",    accessor: "department",         width: 110 },
    { Header: "Current Role",  accessor: "current_role",       width: 150 },
    { Header: "Fit Score",     accessor: "reskill_fit_score",  width: 90, Cell: ({ value }: any) => (
      <ObjectStatus state={value >= 0.8 ? "Positive" : value >= 0.6 ? "Critical" : "Negative"} showDefaultIcon>
        {Math.round(value * 100)}%
      </ObjectStatus>
    )},
    { Header: "Duration (wk)", accessor: "estimated_weeks",    width: 105, hAlign: "End", Cell: ({ value }: any) => (
      <span style={{ fontWeight: 700, color: value > 8 ? "#D26900" : "#198754" }}>{value}w</span>
    )},
    { Header: "Est. Cost",     accessor: "estimated_cost_usd", width: 100, hAlign: "End", Cell: ({ value }: any) => (
      <span style={{ fontWeight: 700, color: "#0F62FE" }}>${value?.toLocaleString()}</span>
    )},
    { Header: "Target Skills", accessor: "target_skills", width: 420, Cell: ({ value }: any) => value?.slice(0, 3).map((s: string) => (
      <Tag key={s} colorScheme="6" icon={<Icon name="trend-up" />} style={{ marginRight: 4 }}>{s}</Tag>
    ))},
  ];

  const totalCost = highFit.reduce((s, e) => s + (e.estimated_cost_usd || 0), 0);
  const avgWeeks  = highFit.length ? Math.round(highFit.reduce((s, e) => s + (e.estimated_weeks || 0), 0) / highFit.length) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <Title level="H3" style={{ color: "#1a376c" }}>UpSkilling Center</Title>

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
        {[
          { icon: "trend-up",          label: "High-Fit Candidates",  value: String(highFit.length),                color: "#6E32C9" },
          { icon: "money-bills",       label: "Est. Upskill Cost",    value: `$${(totalCost / 1000).toFixed(0)}K`, color: "#0F62FE" },
          { icon: "time-entry-request",label: "Avg Duration",         value: `${avgWeeks} wks`,                    color: "#D26900" },
          { icon: "education",         label: "Active Programs",      value: String(programs.length),              color: "#198754" },
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

      {/* Time vs Cost by category */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <Card header={<CardHeader titleText="Avg Cost by Skill Category" subtitleText="Investment per employee by area" avatar={<Icon name="money-bills" />} />}
          style={{ borderRadius: "10px", border: "1px solid #e4e8ed" }}>
          <div style={{ padding: "0.75rem 1rem", height: "200px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={catData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef0f5" />
                <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: any) => `$${v.toLocaleString()}`} />
                <Bar dataKey="Avg Cost ($)" radius={[4, 4, 0, 0]}>
                  {catData.map((d, i) => <Cell key={i} fill={CAT_COLORS[d.category] ?? "#0F62FE"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card header={<CardHeader titleText="Avg Duration by Skill Category (Weeks)" subtitleText="Time investment per area" avatar={<Icon name="time-entry-request" />} />}
          style={{ borderRadius: "10px", border: "1px solid #e4e8ed" }}>
          <div style={{ padding: "0.75rem 1rem", height: "200px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={catData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef0f5" />
                <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} unit="w" />
                <Tooltip formatter={(v: any) => `${v} weeks`} />
                <Bar dataKey="Avg Weeks" radius={[4, 4, 0, 0]}>
                  {catData.map((d, i) => <Cell key={i} fill={CAT_COLORS[d.category] ?? "#D26900"} opacity={0.8} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card header={<CardHeader titleText="High-Fit UpSkilling Candidates" subtitleText={`${highFit.length} employees with fit score ≥60% — sorted by fit`} avatar={<Icon name="trend-up" />} />}
        style={{ borderRadius: "10px", border: "1px solid #e4e8ed" }}>
        <AnalyticalTable columns={empCols} data={[...highFit].sort((a, b) => b.reskill_fit_score - a.reskill_fit_score)} filterable sortable rowHeight={40} visibleRows={10} scaleWidthMode="Smart" />
      </Card>

      <Card header={<CardHeader titleText="All UpSkilling Programs" subtitleText={`${programs.length} programs available`} avatar={<Icon name="education" />} />}
        style={{ borderRadius: "10px", border: "1px solid #e4e8ed" }}>
        <AnalyticalTable columns={progCols} data={programs} sortable rowHeight={40} visibleRows={8} scaleWidthMode="Smart" />
      </Card>
    </div>
  );
}
