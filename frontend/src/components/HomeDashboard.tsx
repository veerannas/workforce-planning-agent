import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Card, CardHeader, Title, FlexBox, Icon, Text, Tag, MessageStrip, ProgressIndicator, AnalyticalTable } from "@ui5/webcomponents-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import "@ui5/webcomponents-icons/dist/employee.js";
import "@ui5/webcomponents-icons/dist/money-bills.js";
import "@ui5/webcomponents-icons/dist/add-employee.js";
import "@ui5/webcomponents-icons/dist/alert.js";
import "@ui5/webcomponents-icons/dist/education.js";
import "@ui5/webcomponents-icons/dist/target-group.js";
import "@ui5/webcomponents-icons/dist/status-error.js";
import "@ui5/webcomponents-icons/dist/status-positive.js";
import "@ui5/webcomponents-icons/dist/group.js";
import "@ui5/webcomponents-icons/dist/trend-up.js";
import "@ui5/webcomponents-icons/dist/accept.js";
import "@ui5/webcomponents-icons/dist/sys-minus.js";
import "@ui5/webcomponents-icons/dist/status-critical.js";

const API = import.meta.env.DEV ? "http://localhost:8000" : "";
const DEPT_COLORS: Record<string, string> = { Technology: "#0F62FE", Operations: "#198754", Finance: "#6E32C9" };

export function HomeDashboard() {
  const { user } = useAuth();
  const [kpis, setKpis]           = useState<any>(null);
  const [profile, setProfile]     = useState<any>(null);
  const [teamData, setTeamData]   = useState<any>(null);
  const [execInsights, setExecInsights] = useState<any>(null);
  const [futureRoles, setFutureRoles]   = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API}/api/dashboard/kpis`).then(r => r.json()).then(setKpis);
    if (user?.role === "employee" && user?.employee_id) {
      fetch(`${API}/api/employees`).then(r => r.json()).then(emps => {
        setProfile(emps.find((e: any) => e.employee_id === user.employee_id));
      });
    }
    if (user?.role === "manager" && user?.department && user?.employee_id) {
      fetch(`${API}/api/team/${user.department}?manager_id=${user.employee_id}`)
        .then(r => r.json()).then(setTeamData).catch(() => {});
    }
    if (user?.role === "executive") {
      Promise.all([
        fetch(`${API}/api/org/executive-insights`).then(r => r.json()),
        fetch(`${API}/api/future-roles`).then(r => r.json()),
      ]).then(([ins, fr]) => { setExecInsights(ins); setFutureRoles(fr); }).catch(() => {});
    }
  }, [user]);

  if (!kpis) return <Text>Loading dashboard...</Text>;

  // ── EMPLOYEE VIEW: Personal profile ──
  if (user?.role === "employee") {
    return (
      <div>
        <div style={{ background: "#ffffff", borderRadius: "10px", padding: "1.25rem 1.5rem", marginBottom: "1.25rem", border: "1px solid #eef2f7" }}>
          <Title level="H3" style={{ color: "#1a376c", marginBottom: "0.25rem" }}>
            Welcome back, {user?.name?.split(" ")[0]}
          </Title>
          <Text style={{ color: "#7a8ca8", fontSize: "0.9rem" }}>
            Your career development dashboard
          </Text>
        </div>

        {/* Personal Profile Card */}
        {profile ? (
          <Card header={<CardHeader titleText="My Profile" subtitleText={`Employee ID: ${profile.employee_id}`} />} style={{ marginBottom: "1rem" }}>
            <div style={{ padding: "1.25rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
                <div style={{ background: "#f8faff", borderRadius: "8px", padding: "0.75rem" }}>
                  <Text style={{ fontSize: "0.75rem", color: "#7a8ca8" }}>Department</Text>
                  <Title level="H5" style={{ color: "#1a376c" }}>{profile.department}</Title>
                </div>
                <div style={{ background: "#f8faff", borderRadius: "8px", padding: "0.75rem" }}>
                  <Text style={{ fontSize: "0.75rem", color: "#7a8ca8" }}>Role</Text>
                  <Title level="H5" style={{ color: "#1a376c" }}>{profile.role}</Title>
                </div>
                <div style={{ background: "#f8faff", borderRadius: "8px", padding: "0.75rem" }}>
                  <Text style={{ fontSize: "0.75rem", color: "#7a8ca8" }}>Grade</Text>
                  <Title level="H5" style={{ color: "#1a376c" }}>{profile.grade}</Title>
                </div>
                <div style={{ background: "#f8faff", borderRadius: "8px", padding: "0.75rem" }}>
                  <Text style={{ fontSize: "0.75rem", color: "#7a8ca8" }}>Tenure</Text>
                  <Title level="H5" style={{ color: "#1a376c" }}>{profile.tenure_years} years</Title>
                </div>
                <div style={{ background: "#f8faff", borderRadius: "8px", padding: "0.75rem" }}>
                  <Text style={{ fontSize: "0.75rem", color: "#7a8ca8" }}>Performance Rating</Text>
                  <Title level="H5" style={{ color: "#1a376c" }}>{profile.performance_rating ? `${profile.performance_rating}/5` : "Not rated"}</Title>
                </div>
                <div style={{ background: "#f8faff", borderRadius: "8px", padding: "0.75rem" }}>
                  <Text style={{ fontSize: "0.75rem", color: "#7a8ca8" }}>Location</Text>
                  <Title level="H5" style={{ color: "#1a376c" }}>{profile.location}</Title>
                </div>
              </div>

              {/* Skills */}
              <Text style={{ fontWeight: "600", fontSize: "0.85rem", color: "#444", marginBottom: "0.5rem", display: "block" }}>My Skills</Text>
              {profile.skills && profile.skills.length > 0 ? (
                <FlexBox wrap="Wrap" style={{ gap: "0.4rem" }}>
                  {profile.skills.map((s: string) => (
                    <Tag key={s} icon={<Icon name="education" />} style={{ background: "#e8f5e9", color: "#2e7d32" }}>{s}</Tag>
                  ))}
                </FlexBox>
              ) : (
                <MessageStrip design="Information">Your skills profile is not yet updated. Please update your SuccessFactors profile.</MessageStrip>
              )}
            </div>
          </Card>
        ) : (
          <Card><div style={{ padding: "1rem" }}><Text>Loading your profile...</Text></div></Card>
        )}

        {/* Quick actions for employee */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div style={{ background: "#e8f5e9", borderRadius: "8px", padding: "1rem" }}>
            <FlexBox alignItems="Center" style={{ gap: "0.5rem", marginBottom: "0.3rem" }}>
              <Icon name="education" style={{ color: "#2e7d32" }} />
              <Text style={{ fontWeight: "600", color: "#2e7d32" }}>Reskilling</Text>
            </FlexBox>
            <Text style={{ fontSize: "0.82rem", color: "#555" }}>Explore programs to grow your skills and advance your career</Text>
          </div>
          <div style={{ background: "#e3f2fd", borderRadius: "8px", padding: "1rem" }}>
            <FlexBox alignItems="Center" style={{ gap: "0.5rem", marginBottom: "0.3rem" }}>
              <Icon name="target-group" style={{ color: "#1565c0" }} />
              <Text style={{ fontWeight: "600", color: "#1565c0" }}>Internal Mobility</Text>
            </FlexBox>
            <Text style={{ fontSize: "0.82rem", color: "#555" }}>See internal roles that match your current skills</Text>
          </div>
        </div>
      </div>
    );
  }

  // ── MANAGER / EXECUTIVE VIEW ──
  const cards = [
    { title: "Total Employees", value: kpis.total_employees, icon: "employee", accent: "#e3f2fd", color: "#1565c0" },
    { title: "Open Positions", value: kpis.open_positions, icon: "add-employee", accent: "#e8f5e9", color: "#2e7d32" },
    { title: "HR Budget", value: `$${(kpis.total_budget_usd / 1000000).toFixed(1)}M`, icon: "money-bills", accent: "#e8eaf6", color: "#283593" },
    { title: "Retention Risk", value: kpis.high_retention_risk, icon: "alert", accent: "#fce4ec", color: "#c62828" },
    { title: "Skills Gap Roles", value: kpis.skills_gap_roles, icon: "education", accent: "#fff3e0", color: "#e65100" },
    { title: "Incomplete Profiles", value: kpis.missing_skills_profiles, icon: "target-group", accent: "#f3e5f5", color: "#6a1b9a" },
  ];

  return (
    <div>
      <div style={{ background: "#ffffff", borderRadius: "10px", padding: "1.25rem 1.5rem", marginBottom: "1.25rem", border: "1px solid #eef2f7" }}>
        <Title level="H3" style={{ color: "#1a376c", marginBottom: "0.25rem" }}>
          Welcome back, {user?.name?.split(" ")[0]}
        </Title>
        <Text style={{ color: "#7a8ca8", fontSize: "0.9rem" }}>
          {user?.role === "executive" ? "Strategic workforce overview across all departments" : "Your team's workforce planning dashboard"}
        </Text>
      </div>

      <FlexBox wrap="Wrap" style={{ gap: "0.75rem", marginBottom: "1.5rem" }}>
        {cards.map(c => (
          <div key={c.title} style={{ width: "190px", background: "#fff", borderRadius: "10px", padding: "1rem", border: "1px solid #eef2f7" }}>
            <FlexBox alignItems="Center" style={{ gap: "0.4rem", marginBottom: "0.6rem" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: c.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={c.icon} style={{ color: c.color, fontSize: "0.9rem" }} />
              </div>
              <Text style={{ fontSize: "0.75rem", color: "#7a8ca8" }}>{c.title}</Text>
            </FlexBox>
            <Title level="H2" style={{ color: c.color }}>{c.value}</Title>
          </div>
        ))}
      </FlexBox>

      {/* ── MANAGER: My Team ────────────────────────────────────────────── */}
      {user?.role === "manager" && teamData && (
        <>
          {/* Team KPI strip */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px", marginBottom: "1rem" }}>
            {[
              { label: "Team Size",       value: teamData.headcount,                    color: "#0F62FE" },
              { label: "Avg Tenure",      value: `${teamData.stats.avg_tenure} yrs`,   color: "#198754" },
              { label: "Avg Performance", value: `${teamData.stats.avg_performance}/5`, color: "#6E32C9" },
              { label: "High Performers", value: teamData.stats.high_performers,        color: "#D26900" },
              { label: "Missing Skills",  value: teamData.stats.missing_skills,         color: "#DA1E28" },
            ].map(m => (
              <div key={m.label} style={{ background: "#fff", border: "1px solid #e8ebef", borderRadius: "10px", padding: "14px 16px", borderTop: `3px solid ${m.color}`, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                <Text style={{ fontSize: "11px", color: "#556b82", fontWeight: 500, display: "block" }}>{m.label}</Text>
                <Text style={{ fontSize: "22px", fontWeight: 700, color: m.color, display: "block" }}>{m.value}</Text>
              </div>
            ))}
          </div>

          <Card
            header={<CardHeader titleText={`My Team — ${teamData.department}`} subtitleText={`${teamData.headcount} direct reports`} avatar={<Icon name="group" />} />}
            style={{ marginBottom: "1rem", borderRadius: "10px", border: "1px solid #e4e8ed" }}
          >
            <AnalyticalTable
              columns={[
                { Header: "Name",        accessor: "name",              width: 150 },
                { Header: "Role",        accessor: "role",              width: 155 },
                { Header: "Grade",       accessor: "grade",             width: 70 },
                { Header: "Tenure",      accessor: "tenure_years",      width: 85,  Cell: ({ value }: any) => `${value} yrs` },
                { Header: "Performance", accessor: "performance_rating", width: 105, Cell: ({ value }: any) =>
                  value ? <ProgressIndicator value={value * 20} valueState={value >= 4 ? "Positive" : value <= 2 ? "Negative" : "None"} style={{ width: "60px" }} />
                        : <Text style={{ color: "#999" }}>N/A</Text> },
                { Header: "Skills",      accessor: "skills",            width: 340, Cell: ({ value }: any) => (
                  <FlexBox wrap="Wrap" style={{ gap: "2px" }}>
                    {value?.slice(0, 3).map((s: string) => <Tag key={s} colorScheme="8" icon={<Icon name="education" />} style={{ fontSize: "0.7rem" }}>{s}</Tag>)}
                    {value?.length > 3 && <Tag style={{ fontSize: "0.7rem" }}>+{value.length - 3}</Tag>}
                  </FlexBox>
                )},
                { Header: "Risk", accessor: "retention_risk", width: 80, Cell: ({ value }: any) => (
                  <Tag colorScheme={value === "high" ? "1" : "8"} icon={<Icon name={value === "high" ? "status-error" : "status-positive"} />} style={{ fontSize: "0.75rem" }}>{value}</Tag>
                )},
              ] as any[]}
              data={teamData.members}
              filterable sortable rowHeight={44} visibleRows={15} scaleWidthMode="Smart"
            />
          </Card>
        </>
      )}

      <Card header={<CardHeader titleText="Department Overview" />} style={{ marginBottom: "1rem" }}>
        <div style={{ padding: "1rem" }}>
          {kpis.departments.map((d: any) => (
            <div key={d.name} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.65rem 0", borderBottom: "1px solid #f5f7fa" }}>
              <Tag style={{ minWidth: "90px" }}>{d.name}</Tag>
              <div style={{ flex: 1 }}>
                <ProgressIndicator value={Math.round((d.headcount / kpis.total_employees) * 100)} valueState="None" style={{ marginBottom: "3px" }} />
                <Text style={{ fontSize: "0.75rem", color: "#888" }}>{d.headcount} employees</Text>
              </div>
              <Text style={{ fontWeight: "600", color: "#1565c0", fontSize: "0.9rem" }}>${(d.budget / 1000000).toFixed(1)}M</Text>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.75rem" }}>
        {[
          { label: "Avg Time to Fill", value: "42 days", bg: "#e3f2fd" },
          { label: "Reskilling Programs", value: "8 active", bg: "#e8f5e9" },
          { label: "Internal Candidates", value: "23 matched", bg: "#fff3e0" },
          { label: "Agent Confidence", value: "53% avg", bg: "#f3e5f5" },
        ].map(m => (
          <div key={m.label} style={{ background: m.bg, borderRadius: "8px", padding: "0.85rem" }}>
            <Text style={{ fontSize: "0.75rem", color: "#555" }}>{m.label}</Text>
            <Title level="H4" style={{ marginTop: "0.25rem", color: "#333" }}>{m.value}</Title>
          </div>
        ))}
      </div>

      {/* ── EXECUTIVE: Department Leadership Cards ────────────────────── */}
      {user?.role === "executive" && execInsights && (
        <>
          <div style={{ marginTop: "1.25rem", marginBottom: "0.5rem" }}>
            <Text style={{ fontSize: "11px", fontWeight: 700, color: "#556b82", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Department Leadership
            </Text>
          </div>
          <FlexBox wrap="Wrap" style={{ gap: "1rem", marginBottom: "1.25rem" }}>
            {execInsights.departments.filter((d: any) => d.department !== "Executive").map((d: any) => {
              const color = DEPT_COLORS[d.department] ?? "#0F62FE";
              return (
                <div key={d.department} style={{ flex: "1 1 240px", background: "#fff", border: "1px solid #e4e8ed", borderRadius: "12px", borderTop: `4px solid ${color}`, padding: "16px 18px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                  <FlexBox alignItems="Center" style={{ gap: "10px", marginBottom: "12px" }}>
                    <div style={{ width: "34px", height: "34px", borderRadius: "8px", background: `${color}12`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon name="employee" style={{ fontSize: "16px", color }} />
                    </div>
                    <div>
                      <Text style={{ fontWeight: 700, fontSize: "14px", color, display: "block" }}>{d.department}</Text>
                      <Text style={{ fontSize: "11px", color: "#556b82" }}>VP: {d.vp}</Text>
                    </div>
                  </FlexBox>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    {[
                      { label: "Headcount",  value: String(d.headcount),                                color },
                      { label: "Health",     value: `${d.health_score}/100`,                            vcolor: d.health_score >= 75 ? "#198754" : "#D26900" },
                      { label: "Attrition",  value: `${(d.attrition_rate * 100).toFixed(1)}%`,          vcolor: d.attrition_rate > 0.12 ? "#DA1E28" : "#198754" },
                      { label: "Vacancies",  value: `${d.open_positions} open`,                         vcolor: d.open_positions > 5 ? "#DA1E28" : "#556b82" },
                      { label: "Avg Perf",   value: `${d.avg_performance.toFixed(1)}/5`,                vcolor: d.avg_performance >= 4 ? "#198754" : "#556b82" },
                      { label: "Avg Tenure", value: `${d.avg_tenure_years}y`,                           vcolor: "#556b82" },
                    ].map((m: any) => (
                      <div key={m.label} style={{ background: "#f9fafb", borderRadius: "6px", padding: "6px 8px" }}>
                        <Text style={{ fontSize: "10px", color: "#888", display: "block" }}>{m.label}</Text>
                        <Text style={{ fontSize: "14px", fontWeight: 700, color: m.vcolor ?? m.color }}>{m.value}</Text>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </FlexBox>

          {/* Headcount: Actual vs Needed */}
          {(() => {
            const hcData = execInsights.departments
              .filter((d: any) => d.department !== "Executive")
              .map((d: any) => ({ dept: d.department, Actual: d.headcount, Needed: d.headcount + d.open_positions }));
            return (
              <Card header={<CardHeader titleText="Headcount: Actual vs. Needed" subtitleText="Current headcount vs. fully-staffed target (incl. open positions)" avatar={<Icon name="employee" />} />}
                style={{ marginBottom: "1.25rem", borderRadius: "10px", border: "1px solid #e4e8ed" }}>
                <div style={{ padding: "0.75rem 1rem", height: "220px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hcData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eef0f5" />
                      <XAxis dataKey="dept" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="Actual" radius={[4,4,0,0]}>
                        {hcData.map((_: any, i: number) => <Cell key={i} fill={Object.values(DEPT_COLORS)[i] ?? "#0F62FE"} />)}
                      </Bar>
                      <Bar dataKey="Needed" fill="#e0e0e0" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ padding: "0 1rem 1rem", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {execInsights.departments.filter((d: any) => d.department !== "Executive").map((d: any) => (
                    <div key={d.department} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: d.open_positions > 0 ? "#fff3e0" : "#e8f5e9", borderRadius: "8px", fontSize: "12px" }}>
                      <Icon name={d.open_positions > 0 ? "alert" : "accept"} style={{ fontSize: "13px", color: d.open_positions > 0 ? "#D26900" : "#198754" }} />
                      <Text style={{ fontWeight: 600 }}>{d.department}:</Text>
                      <Text>{d.open_positions > 0 ? `${d.open_positions} open positions` : "Fully staffed"}</Text>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })()}

          {/* Role Coverage Map */}
          {futureRoles.length > 0 && (() => {
            const DEPTS = ["Technology", "Operations", "Finance"];
            const coverageByDept: Record<string, { critical: number; high: number; covered: number; gap: number }> = {};
            futureRoles.forEach((r: any) => {
              const d = r.department;
              if (!coverageByDept[d]) coverageByDept[d] = { critical: 0, high: 0, covered: 0, gap: 0 };
              if (r.priority === "critical") coverageByDept[d].critical++;
              if (r.priority === "high")     coverageByDept[d].high++;
              if (r.current_headcount >= r.target_y1) coverageByDept[d].covered++;
              else coverageByDept[d].gap++;
            });
            const criticalHighRoles = futureRoles.filter((r: any) => r.priority === "critical" || r.priority === "high")
              .sort((a: any) => (a.priority === "critical" ? -1 : 1));
            return (
              <Card header={<CardHeader titleText="Role Coverage Map" subtitleText="Critical & high-priority future roles: Y1 target vs. current headcount" avatar={<Icon name="trend-up" />} />}
                style={{ marginBottom: "1.25rem", borderRadius: "10px", border: "1px solid #e4e8ed" }}>
                <div style={{ padding: "1rem" }}>
                  {/* Dept summary chips */}
                  <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                    {DEPTS.map(dept => {
                      const s = coverageByDept[dept] ?? { critical: 0, high: 0, covered: 0, gap: 0 };
                      const color = DEPT_COLORS[dept];
                      return (
                        <div key={dept} style={{ flex: "1 1 200px", padding: "10px 14px", background: "#fafbfd", border: "1px solid #e4e8ed", borderRadius: "10px", borderLeft: `4px solid ${color}` }}>
                          <Text style={{ fontWeight: 700, fontSize: "13px", color, display: "block", marginBottom: "6px" }}>{dept}</Text>
                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                            {s.critical > 0 && <Tag design="Negative" icon={<Icon name="alert" />} style={{ fontSize: "11px" }}>{s.critical} Critical</Tag>}
                            {s.high > 0     && <Tag design="Critical" icon={<Icon name="status-critical" />} style={{ fontSize: "11px" }}>{s.high} High</Tag>}
                            <Tag design="Positive" icon={<Icon name="accept" />} style={{ fontSize: "11px" }}>{s.covered} On-track</Tag>
                            {s.gap > 0      && <Tag design="Negative" icon={<Icon name="sys-minus" />} style={{ fontSize: "11px" }}>{s.gap} Gap</Tag>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Role table */}
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
                    <thead>
                      <tr style={{ background: "#f4f6f9", borderBottom: "1.5px solid #e4e8ed" }}>
                        {["Role","Dept","Priority","Now","Y1 Target","Y2 Target","Gap (Y1)","Status"].map(h => (
                          <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, color: "#556b82", fontSize: "11px", textTransform: "uppercase" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {criticalHighRoles.map((r: any, i: number) => {
                        const gap     = r.target_y1 - r.current_headcount;
                        const onTrack = gap <= 0;
                        return (
                          <tr key={i} style={{ borderBottom: "1px solid #eef0f5" }}>
                            <td style={{ padding: "8px 10px", fontWeight: 500 }}>{r.role}</td>
                            <td style={{ padding: "8px 10px", color: DEPT_COLORS[r.department] ?? "#333", fontWeight: 600 }}>{r.department}</td>
                            <td style={{ padding: "8px 10px" }}>
                              {r.priority === "critical"
                                ? <Tag design="Negative" icon={<Icon name="alert" />} style={{ fontSize: "11px" }}>Critical</Tag>
                                : <Tag design="Critical" icon={<Icon name="status-critical" />} style={{ fontSize: "11px" }}>High</Tag>}
                            </td>
                            <td style={{ padding: "8px 10px", fontWeight: 700, color: "#0F62FE" }}>{r.current_headcount}</td>
                            <td style={{ padding: "8px 10px" }}>{r.target_y1}</td>
                            <td style={{ padding: "8px 10px", color: "#556b82" }}>{r.target_y2}</td>
                            <td style={{ padding: "8px 10px" }}>
                              {gap > 0
                                ? <span style={{ color: "#DA1E28", fontWeight: 700 }}>+{gap} needed</span>
                                : <span style={{ color: "#198754", fontWeight: 700 }}>✓ Met</span>}
                            </td>
                            <td style={{ padding: "8px 10px" }}>
                              <div style={{ height: "6px", background: "#eef0f5", borderRadius: "3px", width: "80px", overflow: "hidden" }}>
                                <div style={{ height: "100%", borderRadius: "3px", background: onTrack ? "#198754" : "#DA1E28", width: `${Math.min(100, Math.round((r.current_headcount / r.target_y1) * 100))}%` }} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            );
          })()}
        </>
      )}
    </div>
  );
}
