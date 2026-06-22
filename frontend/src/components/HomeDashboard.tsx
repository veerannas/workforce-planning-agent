import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Card, CardHeader, Title, FlexBox, Icon, Text, Tag, MessageStrip, ProgressIndicator } from "@ui5/webcomponents-react";
import "@ui5/webcomponents-icons/dist/employee.js";
import "@ui5/webcomponents-icons/dist/money-bills.js";
import "@ui5/webcomponents-icons/dist/add-employee.js";
import "@ui5/webcomponents-icons/dist/alert.js";
import "@ui5/webcomponents-icons/dist/education.js";
import "@ui5/webcomponents-icons/dist/target-group.js";

const API = import.meta.env.DEV ? "http://localhost:8000" : "";

export function HomeDashboard() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetch(`${API}/api/dashboard/kpis`).then(r => r.json()).then(setKpis);
    // Load employee's own profile for employee role
    if (user?.role === "employee" && user?.employee_id) {
      fetch(`${API}/api/employees`).then(r => r.json()).then(emps => {
        const me = emps.find((e: any) => e.employee_id === user.employee_id);
        setProfile(me);
      });
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
    </div>
  );
}
