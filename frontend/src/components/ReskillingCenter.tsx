import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Card, CardHeader, Title, Tag, Text, ProgressIndicator, FlexBox, MessageStrip, Icon } from "@ui5/webcomponents-react";
import { AnalyticalTable } from "@ui5/webcomponents-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import "@ui5/webcomponents-icons/dist/education.js";
import "@ui5/webcomponents-icons/dist/status-in-process.js";
import "@ui5/webcomponents-icons/dist/accept.js";
import "@ui5/webcomponents-icons/dist/positive.js";
import "@ui5/webcomponents-icons/dist/employee.js";
import "@ui5/webcomponents-icons/dist/circle-task.js";
import "@ui5/webcomponents-icons/dist/money-bills.js";
import "@ui5/webcomponents-icons/dist/time-entry-request.js";

const STATUS_ICON: Record<string, string> = {
  "In Progress": "status-in-process", "Enrolled": "accept",
  "Completed": "positive", "Eligible": "employee",
};
const STATUS_COLOR: Record<string, string> = {
  "In Progress": "6", "Enrolled": "5", "Completed": "8", "Eligible": "3",
};
const API = import.meta.env.DEV ? "http://localhost:8000" : "";

export function ReskillingCenter() {
  const { user } = useAuth();
  const [programs, setPrograms]   = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [myProfile, setMyProfile] = useState<any>(null);

  useEffect(() => {
    fetch(`${API}/api/reskilling/programs`).then(r => r.json()).then(setPrograms);
    if (user?.role !== "employee") {
      fetch(`${API}/api/reskilling/employees`).then(r => r.json()).then(setEmployees);
    }
    if (user?.role === "employee" && user?.employee_id) {
      fetch(`${API}/api/employees`).then(r => r.json()).then(emps => {
        setMyProfile(emps.find((e: any) => e.employee_id === user.employee_id));
      });
    }
  }, [user]);

  const progCols: any[] = [
    { Header: "Skill",         accessor: "skill",                 width: 180 },
    { Header: "Category",      accessor: "category",              width: 100 },
    { Header: "Duration",      accessor: "duration_weeks",        width: 80, Cell: ({ value }: any) => (
      <span style={{ fontWeight: 700, color: value > 8 ? "#D26900" : "#198754" }}>{value} wks</span>
    )},
    { Header: "Cost/Employee", accessor: "cost_per_employee_usd", width: 115, Cell: ({ value }: any) => (
      <span style={{ fontWeight: 700, color: "#0F62FE" }}>${value?.toLocaleString()}</span>
    )},
    ...(user?.role !== "employee" ? [
      { Header: "Enrolled", accessor: "enrolled", width: 80, hAlign: "End" },
      { Header: "Completion", accessor: "completion_rate", width: 120, Cell: ({ value }: any) => (
        <ProgressIndicator value={Math.round(value * 100)} valueState={value >= 0.7 ? "Positive" : "Critical"} style={{ width: "90px" }} />
      )},
    ] : []),
  ];

  const empCols: any[] = [
    { Header: "Name",          accessor: "name",               width: 140 },
    { Header: "Department",    accessor: "department",         width: 110 },
    { Header: "Current Role",  accessor: "current_role",       width: 150 },
    { Header: "Target Skills", accessor: "target_skills",      width: 360, Cell: ({ value }: any) => value?.map((s: string) => <Tag key={s} colorScheme="8" icon={<Icon name="education" />} style={{ marginRight: 4 }}>{s}</Tag>) },
    { Header: "Status",        accessor: "status",             width: 120, Cell: ({ value }: any) => <Tag colorScheme={STATUS_COLOR[value] || "1"} icon={<Icon name={STATUS_ICON[value] || "circle-task"} />}>{value}</Tag> },
    { Header: "Fit Score",     accessor: "reskill_fit_score",  width: 85,  Cell: ({ value }: any) => `${Math.round(value * 100)}%` },
    { Header: "Duration (wk)", accessor: "estimated_weeks",    width: 105, hAlign: "End", Cell: ({ value }: any) => (
      <span style={{ fontWeight: 700, color: value > 8 ? "#D26900" : "#198754" }}>{value}w</span>
    )},
    { Header: "Est. Cost",     accessor: "estimated_cost_usd", width: 100, Cell: ({ value }: any) => (
      <span style={{ fontWeight: 700, color: "#0F62FE" }}>${value?.toLocaleString()}</span>
    )},
  ];

  if (user?.role === "employee") {
    const mySkills    = myProfile?.skills || [];
    const targetSkills = new Set(["Machine Learning", "Python", "Cloud Architecture", "Kubernetes", "Data Pipelines"]);
    const myMissing   = [...targetSkills].filter(s => !mySkills.includes(s));
    const myMatching  = mySkills.filter((s: string) => targetSkills.has(s));
    const relevant    = programs.filter(p => myMissing.includes(p.skill) || myMatching.includes(p.skill));
    return (
      <div>
        <Title level="H3" style={{ color: "#1a376c", marginBottom: "1rem" }}>My ReSkilling Opportunities</Title>
        <Card header={<CardHeader titleText="My Skills Assessment" subtitleText="Current profile vs. target growth areas" />} style={{ marginBottom: "1rem" }}>
          <div style={{ padding: "1.25rem" }}>
            <div style={{ marginBottom: "1rem" }}>
              <Text style={{ fontWeight: "600", fontSize: "0.85rem", color: "#2e7d32", display: "block", marginBottom: "0.4rem" }}>Skills You Have</Text>
              <FlexBox wrap="Wrap" style={{ gap: "0.4rem" }}>
                {myMatching.length > 0 ? myMatching.map((s: string) => <Tag key={s} colorScheme="8" icon={<Icon name="education" />}>{s}</Tag>) : <Text style={{ color: "#888" }}>No matching skills yet</Text>}
              </FlexBox>
            </div>
            <div>
              <Text style={{ fontWeight: "600", fontSize: "0.85rem", color: "#e65100", display: "block", marginBottom: "0.4rem" }}>Recommended Skills to Learn</Text>
              <FlexBox wrap="Wrap" style={{ gap: "0.4rem" }}>
                {myMissing.map(s => <Tag key={s} colorScheme="2" icon={<Icon name="education" />}>{s}</Tag>)}
              </FlexBox>
            </div>
          </div>
        </Card>
        <Card header={<CardHeader titleText="Available Programs" subtitleText={`${relevant.length} match your development needs`} />}>
          <div style={{ padding: "0.5rem" }}>
            {relevant.length > 0 ? relevant.map(p => (
              <div key={p.skill} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.75rem 1rem", borderBottom: "1px solid #f5f7fa" }}>
                <div style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "600", color: "#333" }}>{p.skill}</Text>
                  <Text style={{ fontSize: "0.8rem", color: "#888", display: "block" }}>{p.category} · {p.duration_weeks} weeks · ${p.cost_per_employee_usd.toLocaleString()}</Text>
                </div>
                <Tag icon={<Icon name={myMissing.includes(p.skill) ? "education" : "accept"} />} colorScheme={myMissing.includes(p.skill) ? "2" : "8"}>
                  {myMissing.includes(p.skill) ? "Recommended" : "Enrolled"}
                </Tag>
              </div>
            )) : <MessageStrip design="Information" style={{ margin: "1rem" }}>No programs currently available.</MessageStrip>}
          </div>
        </Card>
      </div>
    );
  }

  // ── Manager view with time vs cost ──────────────────────────────────────
  const totalCost = employees.reduce((s, e) => s + (e.estimated_cost_usd || 0), 0);
  const avgWeeks  = employees.length ? Math.round(employees.reduce((s, e) => s + (e.estimated_weeks || 0), 0) / employees.length) : 0;
  const enrolled  = employees.filter(e => e.status === "In Progress" || e.status === "Enrolled").length;
  const completed = employees.filter(e => e.status === "Completed").length;
  const chartData = programs.slice(0, 8).map(p => ({
    skill: p.skill.length > 14 ? p.skill.slice(0, 14) + "…" : p.skill,
    "Weeks": p.duration_weeks,
    "Total Cost ($K)": Math.round(p.cost_per_employee_usd * p.enrolled / 1000),
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <Title level="H3" style={{ color: "#1a376c" }}>ReSkilling Center</Title>

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
        {[
          { icon: "money-bills",       label: "Total Cost",       value: `$${(totalCost / 1000).toFixed(0)}K`, color: "#0F62FE" },
          { icon: "time-entry-request",label: "Avg Duration",     value: `${avgWeeks} wks`,                    color: "#D26900" },
          { icon: "status-in-process", label: "Active",           value: String(enrolled),                     color: "#6E32C9" },
          { icon: "positive",          label: "Completed",        value: String(completed),                    color: "#198754" },
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

      {/* Time vs Cost charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <Card header={<CardHeader titleText="Cost per Program ($K)" subtitleText="Enrolled × cost/employee" avatar={<Icon name="money-bills" />} />}
          style={{ borderRadius: "10px", border: "1px solid #e4e8ed" }}>
          <div style={{ padding: "0.75rem 1rem", height: "200px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef0f5" />
                <XAxis type="number" tick={{ fontSize: 10 }} unit="K" />
                <YAxis type="category" dataKey="skill" tick={{ fontSize: 10 }} width={100} />
                <Tooltip formatter={(v: any) => `$${v}K`} />
                <Bar dataKey="Total Cost ($K)" fill="#0F62FE" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card header={<CardHeader titleText="Duration per Program (Weeks)" subtitleText="Time investment per skill" avatar={<Icon name="time-entry-request" />} />}
          style={{ borderRadius: "10px", border: "1px solid #e4e8ed" }}>
          <div style={{ padding: "0.75rem 1rem", height: "200px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef0f5" />
                <XAxis type="number" tick={{ fontSize: 10 }} unit="w" />
                <YAxis type="category" dataKey="skill" tick={{ fontSize: 10 }} width={100} />
                <Tooltip formatter={(v: any) => `${v} weeks`} />
                <Bar dataKey="Weeks" fill="#D26900" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card header={<CardHeader titleText="Active Programs" subtitleText={`${programs.length} programs`} />}
        style={{ borderRadius: "10px", border: "1px solid #e4e8ed" }}>
        <AnalyticalTable columns={progCols} data={[...programs].sort((a, b) => b.cost_per_employee_usd - a.cost_per_employee_usd)} sortable rowHeight={40} visibleRows={8} scaleWidthMode="Smart" />
      </Card>

      <Card header={<CardHeader titleText="ReSkilling Candidates" subtitleText={`${employees.length} identified`} />}
        style={{ borderRadius: "10px", border: "1px solid #e4e8ed" }}>
        <AnalyticalTable columns={empCols} data={[...employees].sort((a, b) => b.estimated_cost_usd - a.estimated_cost_usd)} filterable sortable rowHeight={40} visibleRows={12} scaleWidthMode="Smart" />
      </Card>
    </div>
  );
}
