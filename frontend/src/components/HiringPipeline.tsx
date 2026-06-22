import { useEffect, useState } from "react";
import { Card, CardHeader, Title, FlexBox, Text } from "@ui5/webcomponents-react";
import { AnalyticalTable } from "@ui5/webcomponents-react";

const API = import.meta.env.DEV ? "http://localhost:8000" : "";

export function HiringPipeline() {
  const [pipeline, setPipeline] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    fetch(`${API}/api/hiring/pipeline`).then(r => r.json()).then(setPipeline);
    fetch(`${API}/api/hiring/metrics`).then(r => r.json()).then(setMetrics);
  }, []);

  const statusColors: Record<string, { bg: string; color: string }> = {
    Open: { bg: "#fce4ec", color: "#c62828" },
    Screening: { bg: "#fff3e0", color: "#e65100" },
    Interview: { bg: "#e3f2fd", color: "#1565c0" },
    Offer: { bg: "#f3e5f5", color: "#6a1b9a" },
    Filled: { bg: "#e8f5e9", color: "#2e7d32" },
  };

  const columns: any[] = [
    { Header: "Req ID", accessor: "id", width: 130 },
    { Header: "Role", accessor: "role", width: 160 },
    { Header: "Department", accessor: "department", width: 110 },
    { Header: "Status", accessor: "status", width: 110, Cell: ({ value }: any) => {
      const s = statusColors[value] || { bg: "#f5f5f5", color: "#333" };
      return <span style={{ padding: "2px 8px", borderRadius: "10px", background: s.bg, color: s.color, fontSize: "0.8rem", fontWeight: "500" }}>{value}</span>;
    }},
    { Header: "Candidates", accessor: "candidates", width: 95 },
    { Header: "Days Open", accessor: "days_open", width: 90 },
    { Header: "Priority", accessor: "priority", width: 95, Cell: ({ value }: any) => {
      const p = value === "critical" ? { bg: "#fce4ec", color: "#c62828" } : value === "high" ? { bg: "#fff3e0", color: "#e65100" } : { bg: "#f5f5f5", color: "#555" };
      return <span style={{ padding: "2px 8px", borderRadius: "10px", background: p.bg, color: p.color, fontSize: "0.8rem", fontWeight: "500" }}>{value}</span>;
    }},
    { Header: "Salary Range", accessor: "salary_range", width: 140 },
    { Header: "Cost to Fill", accessor: "cost_to_fill_usd", width: 110, Cell: ({ value }: any) => <Text style={{ fontWeight: "600", color: "#1565c0" }}>${value?.toLocaleString()}</Text> },
  ];

  return (
    <div>
      <Title level="H3" style={{ color: "#1a376c", marginBottom: "1rem" }}>Hiring Pipeline</Title>

      {metrics && (
        <FlexBox wrap="Wrap" style={{ gap: "0.75rem", marginBottom: "1.25rem" }}>
          {[
            { label: "Open Requisitions", value: metrics.open_requisitions, bg: "#fce4ec", color: "#c62828" },
            { label: "Avg Time to Fill", value: `${metrics.avg_time_to_fill_days} days`, bg: "#fff3e0", color: "#e65100" },
            { label: "Avg Cost/Hire", value: `$${metrics.avg_cost_per_hire_usd.toLocaleString()}`, bg: "#e3f2fd", color: "#1565c0" },
            { label: "Offer Accept Rate", value: `${Math.round(metrics.offer_acceptance_rate * 100)}%`, bg: "#e8f5e9", color: "#2e7d32" },
          ].map(m => (
            <div key={m.label} style={{ width: "190px", background: "#fff", borderRadius: "10px", padding: "0.85rem", border: "1px solid #eef2f7" }}>
              <Text style={{ fontSize: "0.75rem", color: "#7a8ca8" }}>{m.label}</Text>
              <div style={{ marginTop: "0.3rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: m.color }} />
                <Title level="H3" style={{ color: m.color }}>{m.value}</Title>
              </div>
            </div>
          ))}
        </FlexBox>
      )}

      {/* Pipeline stages */}
      {metrics && (
        <Card header={<CardHeader titleText="Pipeline by Stage" />} style={{ marginBottom: "1rem" }}>
          <div style={{ padding: "1rem" }}>
            <FlexBox style={{ gap: "0.5rem", alignItems: "flex-end", height: "120px" }}>
              {Object.entries(metrics.pipeline_by_stage).map(([stage, count]) => {
                const s = statusColors[stage] || { bg: "#e0e0e0", color: "#333" };
                return (
                  <div key={stage} style={{ flex: 1, textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%" }}>
                    <div style={{ background: s.bg, border: `1px solid ${s.color}20`, borderRadius: "6px 6px 0 0", height: `${Math.max(24, (count as number) * 18)}px`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ color: s.color, fontWeight: "600", fontSize: "0.9rem" }}>{count as number}</Text>
                    </div>
                    <Text style={{ fontSize: "0.72rem", color: "#666", marginTop: "4px" }}>{stage}</Text>
                  </div>
                );
              })}
            </FlexBox>
          </div>
        </Card>
      )}

      <Card header={<CardHeader titleText="Active Requisitions" subtitleText={`${pipeline.length} open positions`} />}>
        <AnalyticalTable columns={columns} data={pipeline} filterable sortable groupable rowHeight={42} visibleRows={12} scaleWidthMode="Smart" />
      </Card>
    </div>
  );
}
