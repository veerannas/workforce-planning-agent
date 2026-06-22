import { useEffect, useState } from "react";
import { Card, CardHeader, Title, Text, Tag, FlexBox, MessageStrip, Icon } from "@ui5/webcomponents-react";
import "@ui5/webcomponents-icons/dist/status-error.js";
import "@ui5/webcomponents-icons/dist/alert.js";

const API = import.meta.env.DEV ? "http://localhost:8000" : "";

export function RiskDashboard() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { fetch(`${API}/api/executive/risk`).then(r => r.json()).then(setData); }, []);
  if (!data) return <Text>Loading risk data...</Text>;

  const riskColor = data.risk_level === "High" ? "#c62828" : data.risk_level === "Medium" ? "#e65100" : "#2e7d32";
  const riskBg = data.risk_level === "High" ? "#fce4ec" : data.risk_level === "Medium" ? "#fff3e0" : "#e8f5e9";

  return (
    <div>
      <Title level="H3" style={{ color: "#1a376c", marginBottom: "1rem" }}>Strategic Risk Dashboard</Title>

      {/* Overall risk */}
      <FlexBox wrap="Wrap" style={{ gap: "0.85rem", marginBottom: "1.25rem" }}>
        <div style={{ width: "220px", background: riskBg, borderRadius: "12px", padding: "1.25rem", textAlign: "center" }}>
          <Text style={{ fontSize: "0.8rem", color: riskColor }}>Overall Risk Score</Text>
          <Title level="H1" style={{ color: riskColor }}>{data.overall_risk_score}</Title>
          <span style={{ padding: "3px 12px", borderRadius: "12px", background: "#fff", color: riskColor, fontWeight: "700", fontSize: "0.85rem" }}>{data.risk_level}</span>
        </div>
        <div style={{ width: "160px", background: "#fff", borderRadius: "10px", padding: "1rem", border: "1px solid #eef2f7" }}>
          <Text style={{ fontSize: "0.75rem", color: "#7a8ca8" }}>Open Positions</Text>
          <Title level="H2" style={{ color: "#1565c0" }}>{data.total_open_positions}</Title>
        </div>
        <div style={{ width: "160px", background: "#fff", borderRadius: "10px", padding: "1rem", border: "1px solid #eef2f7" }}>
          <Text style={{ fontSize: "0.75rem", color: "#7a8ca8" }}>Retention Risks</Text>
          <Title level="H2" style={{ color: "#c62828" }}>{data.total_retention_risk}</Title>
        </div>
        <div style={{ width: "160px", background: "#fff", borderRadius: "10px", padding: "1rem", border: "1px solid #eef2f7" }}>
          <Text style={{ fontSize: "0.75rem", color: "#7a8ca8" }}>Workforce Readiness</Text>
          <Title level="H2" style={{ color: "#2e7d32" }}>{data.workforce_readiness_pct}%</Title>
        </div>
      </FlexBox>

      {/* Department risks */}
      <Card header={<CardHeader titleText="Department Risk Overview" subtitleText="Aggregated metrics — no individual employee data" />} style={{ marginBottom: "1rem" }}>
        <div style={{ padding: "1rem" }}>
          {Object.entries(data.department_risks).map(([dept, risk]: [string, any]) => (
            <div key={dept} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.75rem 0", borderBottom: "1px solid #f5f7fa" }}>
              <Tag style={{ minWidth: "100px" }}>{dept}</Tag>
              <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <Text style={{ fontSize: "0.72rem", color: "#888" }}>Headcount</Text>
                  <Text style={{ fontWeight: "600" }}>{risk.headcount}</Text>
                </div>
                <div>
                  <Text style={{ fontSize: "0.72rem", color: "#888" }}>Missing Skills %</Text>
                  <Text style={{ fontWeight: "600", color: risk.missing_skills_pct > 10 ? "#c62828" : "#333" }}>{risk.missing_skills_pct}%</Text>
                </div>
                <div>
                  <Text style={{ fontSize: "0.72rem", color: "#888" }}>Retention Risk</Text>
                  <Text style={{ fontWeight: "600", color: risk.retention_risk_count > 10 ? "#c62828" : "#333" }}>{risk.retention_risk_count}</Text>
                </div>
                <div>
                  <Text style={{ fontSize: "0.72rem", color: "#888" }}>Avg Perf</Text>
                  <Text style={{ fontWeight: "600" }}>{risk.avg_performance}/5</Text>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Critical gaps */}
      <Card header={<CardHeader titleText="Critical Skill Gaps" subtitleText="Roles with highest hiring urgency" />}>
        <div style={{ padding: "1rem" }}>
          {data.critical_skill_gaps.map((gap: any) => (
            <div key={gap.role} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0", borderBottom: "1px solid #f8f9fb" }}>
              <Tag icon={<Icon name={gap.priority === "critical" ? "status-error" : "alert"} />} colorScheme={gap.priority === "critical" ? "1" : "2"}>{gap.priority}</Tag>
              <Text style={{ flex: 1, fontWeight: "500" }}>{gap.role}</Text>
              <Tag>{gap.department}</Tag>
              <Text style={{ fontWeight: "700", color: "#c62828" }}>+{gap.gap} needed</Text>
            </div>
          ))}
        </div>
      </Card>

      <MessageStrip design="Information" style={{ marginTop: "1rem" }}>
        All data is aggregated. No individual employee information is shown at the Executive level.
      </MessageStrip>
    </div>
  );
}
