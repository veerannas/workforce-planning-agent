import { useState } from "react";
import { Title, SegmentedButton, SegmentedButtonItem } from "@ui5/webcomponents-react";
import { RiskDashboard } from "./RiskDashboard";
import { InvestmentCalc } from "./InvestmentCalc";
import { ScenarioComparison } from "./ScenarioComparison";

export function StrategicDashboard() {
  const [tab, setTab] = useState("risk");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
        <Title level="H3">Strategic Dashboard</Title>
        <SegmentedButton onSelectionChange={(e: any) => {
          const selected = e.detail.selectedItems?.[0];
          if (selected) setTab(selected.dataset.key);
        }}>
          <SegmentedButtonItem data-key="risk" selected={tab === "risk"}>Risk Analysis</SegmentedButtonItem>
          <SegmentedButtonItem data-key="investment" selected={tab === "investment"}>Investment & ROI</SegmentedButtonItem>
          <SegmentedButtonItem data-key="scenarios" selected={tab === "scenarios"}>Scenarios</SegmentedButtonItem>
        </SegmentedButton>
      </div>

      {tab === "risk" && <RiskDashboard />}
      {tab === "investment" && <InvestmentCalc />}
      {tab === "scenarios" && <ScenarioComparison />}
    </div>
  );
}
