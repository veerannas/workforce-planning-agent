import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Card, CardHeader, Title, Tag, Text, ProgressIndicator, FlexBox, MessageStrip, Icon } from "@ui5/webcomponents-react";
import { AnalyticalTable } from "@ui5/webcomponents-react";
import "@ui5/webcomponents-icons/dist/education.js";
import "@ui5/webcomponents-icons/dist/status-in-process.js";
import "@ui5/webcomponents-icons/dist/accept.js";
import "@ui5/webcomponents-icons/dist/positive.js";
import "@ui5/webcomponents-icons/dist/employee.js";
import "@ui5/webcomponents-icons/dist/circle-task.js";

const STATUS_ICON: Record<string, string> = {
  "In Progress": "status-in-process",
  "Enrolled":    "accept",
  "Completed":   "positive",
  "Eligible":    "employee",
};

const STATUS_COLOR: Record<string, string> = {
  "In Progress": "6",
  "Enrolled":    "5",
  "Completed":   "8",
  "Eligible":    "3",
};

const API = import.meta.env.DEV ? "http://localhost:8000" : "";

export function ReskillingCenter() {
  const { user } = useAuth();
  const [programs, setPrograms] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [myProfile, setMyProfile] = useState<any>(null);

  useEffect(() => {
    fetch(`${API}/api/reskilling/programs`).then(r => r.json()).then(setPrograms);
    if (user?.role !== "employee") {
      fetch(`${API}/api/reskilling/employees`).then(r => r.json()).then(setEmployees);
    }
    // Load own profile for employee view
    if (user?.role === "employee" && user?.employee_id) {
      fetch(`${API}/api/employees`).then(r => r.json()).then(emps => {
        setMyProfile(emps.find((e: any) => e.employee_id === user.employee_id));
      });
    }
  }, [user]);

  const progCols: any[] = [
{ Header: "Skill",          accessor: "skill",                   width: 231 },
    { Header: "Category", accessor: "category", width: 100 },
    { Header: "Duration", accessor: "duration_weeks", width: 80, Cell: ({ value }: any) => `${value} wks` },
    { Header: "Cost/Employee", accessor: "cost_per_employee_usd", width: 110, Cell: ({ value }: any) => `$${value?.toLocaleString()}` },
    ...(user?.role !== "employee" ? [
      { Header: "Enrolled", accessor: "enrolled", width: 80 },
      { Header: "Completion", accessor: "completion_rate", width: 120, Cell: ({ value }: any) => <ProgressIndicator value={Math.round(value * 100)} valueState={value >= 0.7 ? "Positive" : "Critical"} style={{ width: "90px" }} /> },
    ] : []),
  ];

  const empCols: any[] = [
    { Header: "Name",         accessor: "name",              width: 140 },
    { Header: "Department",   accessor: "department",        width: 110 },
    { Header: "Current Role", accessor: "current_role",      width: 150 },
    { Header: "Target Skills", accessor: "target_skills",    width: 420, Cell: ({ value }: any) => value?.map((s: string) => <Tag key={s} colorScheme="8" icon={<Icon name="education" />} style={{ marginRight: 4 }}>{s}</Tag>) },
    { Header: "Status",        accessor: "status",           width: 130, Cell: ({ value }: any) => <Tag colorScheme={STATUS_COLOR[value] || "1"} icon={<Icon name={STATUS_ICON[value] || "circle-task"} />}>{value}</Tag> },
    { Header: "Fit Score",     accessor: "reskill_fit_score", width: 90, Cell: ({ value }: any) => `${Math.round(value * 100)}%` },
    { Header: "Weeks",         accessor: "estimated_weeks",  width: 80 },
    { Header: "Est. Cost",     accessor: "estimated_cost_usd", width: 100, Cell: ({ value }: any) => `$${value?.toLocaleString()}` },
  ];

  // ── EMPLOYEE VIEW ──
  if (user?.role === "employee") {
    const mySkills = myProfile?.skills || [];
    const targetSkills = new Set(["Machine Learning", "Python", "Cloud Architecture", "Kubernetes", "Data Pipelines"]);
    const myMissing = [...targetSkills].filter(s => !mySkills.includes(s));
    const myMatching = mySkills.filter((s: string) => targetSkills.has(s));
    const relevantPrograms = programs.filter(p => myMissing.includes(p.skill) || myMatching.includes(p.skill));

    return (
      <div>
        <Title level="H3" style={{ color: "#1a376c", marginBottom: "1rem" }}>My Reskilling Opportunities</Title>

        {/* My skill status */}
        <Card header={<CardHeader titleText="My Skills Assessment" subtitleText="Based on your current profile and target growth areas" />} style={{ marginBottom: "1rem" }}>
          <div style={{ padding: "1.25rem" }}>
            <div style={{ marginBottom: "1rem" }}>
              <Text style={{ fontWeight: "600", fontSize: "0.85rem", color: "#2e7d32", display: "block", marginBottom: "0.4rem" }}>Skills You Have (matched to growth areas)</Text>
              <FlexBox wrap="Wrap" style={{ gap: "0.4rem" }}>
                {myMatching.length > 0 ? myMatching.map((s: string) => <Tag key={s} colorScheme="8" icon={<Icon name="education" />}>{s}</Tag>) : <Text style={{ color: "#888", fontSize: "0.85rem" }}>No matching skills yet</Text>}
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

        {/* Programs available to me */}
        <Card header={<CardHeader titleText="Available Programs for You" subtitleText={`${relevantPrograms.length} programs match your development needs`} />}>
          <div style={{ padding: "0.5rem" }}>
            {relevantPrograms.length > 0 ? (
              relevantPrograms.map(p => (
                <div key={p.skill} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.75rem 1rem", borderBottom: "1px solid #f5f7fa" }}>
                  <div style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "600", color: "#333" }}>{p.skill}</Text>
                    <Text style={{ fontSize: "0.8rem", color: "#888", display: "block" }}>{p.category} · {p.duration_weeks} weeks</Text>
                  </div>
                   <Tag icon={<Icon name={myMissing.includes(p.skill) ? "education" : "accept"} />} colorScheme={myMissing.includes(p.skill) ? "2" : "8"}>
                    {myMissing.includes(p.skill) ? "Recommended" : "Enrolled"}
                  </Tag>
                </div>
              ))
            ) : (
              <MessageStrip design="Information" style={{ margin: "1rem" }}>No programs currently available. Check back later.</MessageStrip>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // ── MANAGER / EXECUTIVE VIEW ──
  return (
    <div>
      <Title level="H3" style={{ color: "#1a376c", marginBottom: "1rem" }}>Reskilling Center</Title>
      <Card header={<CardHeader titleText="Active Programs" subtitleText={`${programs.length} skill programs`} />} style={{ marginBottom: "1rem" }}>
        <AnalyticalTable columns={progCols} data={programs} sortable rowHeight={40} visibleRows={8} scaleWidthMode="Smart" />
      </Card>
      <Card header={<CardHeader titleText="Employee Reskilling Candidates" subtitleText={`${employees.length} candidates identified`} />}>
        <AnalyticalTable columns={empCols} data={employees} filterable sortable rowHeight={40} visibleRows={12} scaleWidthMode="Smart" />
      </Card>
    </div>
  );
}
