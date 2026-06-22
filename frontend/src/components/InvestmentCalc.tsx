import { useEffect, useState } from "react";
import { Card, CardHeader, Title, Text, Tag, FlexBox } from "@ui5/webcomponents-react";

const API = import.meta.env.DEV ? "http://localhost:8000" : "";

export function InvestmentCalc() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { fetch(`${API}/api/executive/investment`).then(r => r.json()).then(setData); }, []);
  if (!data) return <Text>Loading investment data...</Text>;

  const actionColors: Record<string, { bg: string; color: string }> = {
    BUILD: { bg: "#e8f5e9", color: "#2e7d32" },
    BUY: { bg: "#e3f2fd", color: "#1565c0" },
    REDEPLOY: { bg: "#f3e5f5", color: "#6a1b9a" },
    AUTOMATE: { bg: "#fff3e0", color: "#e65100" },
    REVIEW: { bg: "#fce4ec", color: "#c62828" },
  };

  return (
    <div>
      <Title level="H3" style={{ color: "#1a376c", marginBottom: "1rem" }}>Workforce Investment Calculator</Title>

      {/* Top KPIs */}
      <FlexBox wrap="Wrap" style={{ gap: "0.85rem", marginBottom: "1.25rem" }}>
        <div style={{ width: "220px", background: "#e3f2fd", borderRadius: "12px", padding: "1.25rem" }}>
          <Text style={{ fontSize: "0.8rem", color: "#1565c0" }}>Total Investment Required</Text>
          <Title level="H2" style={{ color: "#1565c0" }}>${data.total_investment_usd?.toLocaleString()}</Title>
          <Text style={{ fontSize: "0.75rem", color: "#666" }}>{data.investment_as_pct_of_budget}% of HR budget</Text>
        </div>
        <div style={{ width: "220px", background: "#e8f5e9", borderRadius: "12px", padding: "1.25rem" }}>
          <Text style={{ fontSize: "0.8rem", color: "#2e7d32" }}>Estimated Annual Savings</Text>
          <Title level="H2" style={{ color: "#2e7d32" }}>${(data.roi_estimate?.automation_annual_savings + data.roi_estimate?.redeployment_savings + data.roi_estimate?.reskill_vs_hire_savings)?.toLocaleString()}</Title>
          <Text style={{ fontSize: "0.75rem", color: "#666" }}>From reskill + redeploy + automate</Text>
        </div>
        <div style={{ width: "180px", background: "#fff", borderRadius: "10px", padding: "1rem", border: "1px solid #eef2f7" }}>
          <Text style={{ fontSize: "0.75rem", color: "#7a8ca8" }}>Budget Available</Text>
          <Title level="H3" style={{ color: "#333" }}>${(data.total_budget_usd / 1000000)?.toFixed(1)}M</Title>
        </div>
      </FlexBox>

      {/* Cost breakdown by action */}
      <Card header={<CardHeader titleText="Investment by Action Type" subtitleText="BBRA cost allocation" />} style={{ marginBottom: "1rem" }}>
        <div style={{ padding: "1.25rem" }}>
          {Object.entries(data.cost_by_action || {}).map(([action, cost]) => {
            const ac = actionColors[action] || { bg: "#f5f5f5", color: "#333" };
            const count = data.count_by_action?.[action] || 0;
            const pct = Math.round(((cost as number) / data.total_investment_usd) * 100);
            return (
              <div key={action} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.7rem 0", borderBottom: "1px solid #f5f7fa" }}>
                <span style={{ padding: "3px 10px", borderRadius: "8px", background: ac.bg, color: ac.color, fontWeight: "600", fontSize: "0.82rem", minWidth: "80px", textAlign: "center" }}>{action}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ background: "#f0f4fa", borderRadius: "4px", height: "14px", overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, background: ac.bg, height: "100%", border: `1px solid ${ac.color}30` }} />
                  </div>
                </div>
                <Text style={{ fontWeight: "600", color: ac.color, minWidth: "90px", textAlign: "right" }}>${(cost as number)?.toLocaleString()}</Text>
                <Text style={{ fontSize: "0.8rem", color: "#888", minWidth: "60px" }}>{count} people</Text>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ROI breakdown */}
      <Card header={<CardHeader titleText="ROI Estimate" subtitleText="Projected savings vs. external hiring baseline" />} style={{ marginBottom: "1rem" }}>
        <div style={{ padding: "1.25rem", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
          <div style={{ background: "#e8f5e9", borderRadius: "8px", padding: "1rem" }}>
            <Text style={{ fontSize: "0.78rem", color: "#2e7d32" }}>Reskill vs. Hire Savings</Text>
            <Title level="H4" style={{ color: "#2e7d32" }}>${data.roi_estimate?.reskill_vs_hire_savings?.toLocaleString()}</Title>
            <Text style={{ fontSize: "0.72rem", color: "#666" }}>60% cheaper than external hires</Text>
          </div>
          <div style={{ background: "#f3e5f5", borderRadius: "8px", padding: "1rem" }}>
            <Text style={{ fontSize: "0.78rem", color: "#6a1b9a" }}>Redeployment Savings</Text>
            <Title level="H4" style={{ color: "#6a1b9a" }}>${data.roi_estimate?.redeployment_savings?.toLocaleString()}</Title>
            <Text style={{ fontSize: "0.72rem", color: "#666" }}>Avoided recruitment costs</Text>
          </div>
          <div style={{ background: "#fff3e0", borderRadius: "8px", padding: "1rem" }}>
            <Text style={{ fontSize: "0.78rem", color: "#e65100" }}>Automation Annual Savings</Text>
            <Title level="H4" style={{ color: "#e65100" }}>${data.roi_estimate?.automation_annual_savings?.toLocaleString()}</Title>
            <Text style={{ fontSize: "0.72rem", color: "#666" }}>Per year, ongoing</Text>
          </div>
        </div>
      </Card>

      {/* Timeline */}
      <Card header={<CardHeader titleText="Investment Timeline" subtitleText="Phased over 3 years" />}>
        <div style={{ padding: "1.25rem" }}>
          <FlexBox style={{ gap: "1rem" }}>
            {[
              { label: "Year 1", value: data.timeline?.year_1, pct: 50 },
              { label: "Year 2", value: data.timeline?.year_2, pct: 35 },
              { label: "Year 3", value: data.timeline?.year_3, pct: 15 },
            ].map(y => (
              <div key={y.label} style={{ flex: 1, textAlign: "center", background: "#f8faff", borderRadius: "8px", padding: "1rem" }}>
                <Text style={{ fontWeight: "600", color: "#1a376c" }}>{y.label}</Text>
                <Title level="H4" style={{ color: "#1565c0", margin: "0.3rem 0" }}>${y.value?.toLocaleString()}</Title>
                <Tag style={{ background: "#e3f2fd", color: "#1565c0" }}>{y.pct}% of total</Tag>
              </div>
            ))}
          </FlexBox>
        </div>
      </Card>
    </div>
  );
}
