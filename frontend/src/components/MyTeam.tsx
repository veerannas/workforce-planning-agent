import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Card, CardHeader, Title, Text, Tag, FlexBox, ProgressIndicator, Icon } from "@ui5/webcomponents-react";
import { AnalyticalTable } from "@ui5/webcomponents-react";
import "@ui5/webcomponents-icons/dist/education.js";
import "@ui5/webcomponents-icons/dist/status-error.js";
import "@ui5/webcomponents-icons/dist/status-positive.js";

const API = import.meta.env.DEV ? "http://localhost:8000" : "";

export function MyTeam() {
  const { user } = useAuth();
  const [team, setTeam] = useState<any>(null);

  useEffect(() => {
    if (user?.department) {
      fetch(`${API}/api/team/${user.department}`).then(r => r.json()).then(setTeam);
    }
  }, [user]);

  if (!team) return <Text>Loading team...</Text>;

  const columns: any[] = [
    { Header: "Name", accessor: "name", width: 150 },
    { Header: "Role", accessor: "role", width: 150 },
    { Header: "Grade", accessor: "grade", width: 70 },
    { Header: "Tenure", accessor: "tenure_years", width: 80, Cell: ({ value }: any) => `${value} yrs` },
    { Header: "Performance", accessor: "performance_rating", width: 100, Cell: ({ value }: any) => value ? <ProgressIndicator value={value * 20} valueState={value >= 4 ? "Positive" : value <= 2 ? "Negative" : "None"} style={{ width: "60px" }} /> : <Text style={{ color: "#999" }}>N/A</Text> },
    { Header: "Skills", accessor: "skills", width: 363, Cell: ({ value }: any) => <FlexBox wrap="Wrap" style={{ gap: "2px" }}>{value?.slice(0, 3).map((s: string) => <Tag key={s} colorScheme="8" icon={<Icon name="education" />} style={{ fontSize: "0.7rem" }}>{s}</Tag>)}{value?.length > 3 && <Tag style={{ fontSize: "0.7rem" }}>+{value.length - 3}</Tag>}</FlexBox> },
    { Header: "Risk", accessor: "retention_risk", width: 80, Cell: ({ value }: any) => <Tag colorScheme={value === "high" ? "1" : "8"} icon={<Icon name={value === "high" ? "status-error" : "status-positive"} />} style={{ fontSize: "0.75rem" }}>{value}</Tag> },
  ];

  return (
    <div>
      <Title level="H3" style={{ color: "#1a376c", marginBottom: "1rem" }}>My Team — {team.department}</Title>

      {/* Team stats */}
      <FlexBox wrap="Wrap" style={{ gap: "0.75rem", marginBottom: "1.25rem" }}>
        {[
          { label: "Team Size", value: team.headcount, bg: "#e3f2fd", color: "#1565c0" },
          { label: "Avg Tenure", value: `${team.stats.avg_tenure} yrs`, bg: "#e8f5e9", color: "#2e7d32" },
          { label: "Avg Performance", value: `${team.stats.avg_performance}/5`, bg: "#f3e5f5", color: "#6a1b9a" },
          { label: "High Performers", value: team.stats.high_performers, bg: "#fff3e0", color: "#e65100" },
          { label: "Missing Skills", value: team.stats.missing_skills, bg: "#fce4ec", color: "#c62828" },
        ].map(m => (
          <div key={m.label} style={{ width: "160px", background: "#fff", borderRadius: "10px", padding: "0.85rem", border: "1px solid #eef2f7" }}>
            <Text style={{ fontSize: "0.75rem", color: "#7a8ca8" }}>{m.label}</Text>
            <div style={{ marginTop: "0.2rem" }}>
              <Title level="H3" style={{ color: m.color }}>{m.value}</Title>
            </div>
          </div>
        ))}
      </FlexBox>

      {/* Team table */}
      <Card header={<CardHeader titleText="Team Members" subtitleText={`${team.headcount} direct reports`} />}>
        <AnalyticalTable columns={columns} data={team.members} filterable sortable rowHeight={44} visibleRows={15} scaleWidthMode="Smart" />
      </Card>
    </div>
  );
}
