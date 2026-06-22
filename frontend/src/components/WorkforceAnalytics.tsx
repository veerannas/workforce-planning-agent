import { useEffect, useState } from "react";
import { Card, CardHeader, Title, Text, Tag, ProgressIndicator } from "@ui5/webcomponents-react";

const API = import.meta.env.DEV ? "http://localhost:8000" : "";

export function WorkforceAnalytics() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { fetch(`${API}/api/analytics/workforce`).then(r => r.json()).then(setData); }, []);
  if (!data) return <Text>Loading analytics...</Text>;

  const maxSkillCount = data.top_skills?.[0]?.[1] || 1;

  return (
    <div>
      <Title level="H3" style={{ color: "#1a376c", marginBottom: "1rem" }}>Workforce Analytics</Title>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.85rem", marginBottom: "1rem" }}>
        {/* Performance */}
        <Card header={<CardHeader titleText="Performance Distribution" />}>
          <div style={{ padding: "1rem" }}>
            {Object.entries(data.performance_distribution).map(([rating, count]) => (
              <div key={rating} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <Text style={{ width: "50px", fontSize: "0.8rem", color: "#555" }}>{rating === "null" ? "N/A" : `${rating}/5`}</Text>
                <ProgressIndicator value={Math.round(((count as number) / data.total_employees) * 100)} style={{ flex: 1 }} valueState={Number(rating) >= 4 ? "Positive" : Number(rating) <= 2 ? "Negative" : "None"} />
                <Text style={{ width: "25px", textAlign: "right", fontSize: "0.8rem", color: "#666" }}>{count as number}</Text>
              </div>
            ))}
          </div>
        </Card>

        {/* Tenure */}
        <Card header={<CardHeader titleText="Tenure Distribution" />}>
          <div style={{ padding: "1rem" }}>
            {Object.entries(data.tenure_distribution).map(([bucket, count]) => (
              <div key={bucket} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid #f5f7fa" }}>
                <Tag style={{ background: "#e8f0fe" }}>{bucket}</Tag>
                <Text style={{ fontWeight: "600", color: "#1565c0" }}>{count as number}</Text>
              </div>
            ))}
          </div>
        </Card>

        {/* Location */}
        <Card header={<CardHeader titleText="By Location" />}>
          <div style={{ padding: "1rem" }}>
            {Object.entries(data.location_distribution).map(([loc, count]) => (
              <div key={loc} style={{ display: "flex", justifyContent: "space-between", padding: "0.45rem 0", borderBottom: "1px solid #f8f9fb" }}>
                <Text style={{ fontSize: "0.85rem", color: "#444" }}>{loc}</Text>
                <Text style={{ fontWeight: "600", color: "#333" }}>{count as number}</Text>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem", marginBottom: "1rem" }}>
        {/* Department & Grade */}
        <Card header={<CardHeader titleText="By Department" />}>
          <div style={{ padding: "1rem" }}>
            {Object.entries(data.department_headcount).map(([dept, count]) => (
              <div key={dept} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0", borderBottom: "1px solid #f5f7fa" }}>
                <Tag>{dept}</Tag>
                <Title level="H4" style={{ color: "#1565c0" }}>{count as number}</Title>
              </div>
            ))}
          </div>
        </Card>

        {/* Data Quality */}
        <Card header={<CardHeader titleText="Data Quality Summary" />}>
          <div style={{ padding: "1rem" }}>
            {[
              { label: "Missing Skills Profiles", value: data.data_quality.missing_skills, bg: "#fce4ec", color: "#c62828" },
              { label: "Null Performance Ratings", value: data.data_quality.null_performance, bg: "#fff3e0", color: "#e65100" },
              { label: "High Retention Risk", value: data.retention_risk_count, bg: "#fce4ec", color: "#c62828" },
              { label: "Total Employees", value: data.total_employees, bg: "#e8f5e9", color: "#2e7d32" },
            ].map(item => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.55rem 0", borderBottom: "1px solid #f8f9fb" }}>
                <Text style={{ fontSize: "0.85rem", color: "#555" }}>{item.label}</Text>
                <span style={{ padding: "2px 10px", borderRadius: "12px", background: item.bg, color: item.color, fontWeight: "600", fontSize: "0.85rem" }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Top Skills */}
      <Card header={<CardHeader titleText="Top 15 Skills in Workforce" subtitleText="Employee skill distribution" />}>
        <div style={{ padding: "1rem" }}>
          {data.top_skills?.map(([skill, count]: [string, number]) => (
            <div key={skill} style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.45rem" }}>
              <Text style={{ width: "150px", fontSize: "0.82rem", color: "#444" }}>{skill}</Text>
              <div style={{ flex: 1, background: "#f0f4fa", borderRadius: "4px", height: "16px", overflow: "hidden" }}>
                <div style={{ width: `${(count / maxSkillCount) * 100}%`, background: "linear-gradient(90deg, #bbdefb, #90caf9)", height: "100%", borderRadius: "4px" }} />
              </div>
              <Text style={{ width: "28px", textAlign: "right", fontSize: "0.8rem", color: "#666" }}>{count}</Text>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
