import { useState } from "react";
import { Card, CardHeader, Title, TextArea, Button, FlexBox, Text, Tag, Icon } from "@ui5/webcomponents-react";
import "@ui5/webcomponents-icons/dist/education.js";
import "@ui5/webcomponents-icons/dist/add-employee.js";
import "@ui5/webcomponents-icons/dist/switch-views.js";
import "@ui5/webcomponents-icons/dist/ai.js";
import "@ui5/webcomponents-icons/dist/task.js";

const ACTION_ICONS: Record<string, string> = {
  UPSKILL:    "education",
  HIRE:      "add-employee",
  RESKILL: "switch-views",
  AUTOMATE: "ai",
  REVIEW:   "task",
};

const API = import.meta.env.DEV ? "http://localhost:8000" : "";

const PRESET_SCENARIOS = [
  "Double AI and ML capacity while reducing back-office operations by 20% over 3 years",
  "Reduce operational costs by 30% through automation and workforce consolidation",
  "Expand into cloud and data engineering, maintain current operations headcount",
];

export function ScenarioComparison() {
  const [scenarios, setScenarios] = useState<string[]>(PRESET_SCENARIOS.slice(0, 2));
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const runComparison = async () => {
    setLoading(true);
    const res = await fetch(`${API}/api/scenarios/compare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(scenarios.filter(s => s.trim()).map(s => ({ scenario: s }))),
    });
    setResults(await res.json());
    setLoading(false);
  };

  return (
    <div>
      <Title level="H3" style={{ marginBottom: "1rem" }}>Scenario Comparison</Title>
      <Card header={<CardHeader titleText="Define Scenarios" subtitleText="Compare up to 3 strategic scenarios side-by-side" />} style={{ marginBottom: "1rem" }}>
        <div style={{ padding: "1rem" }}>
          {scenarios.map((s, i) => (
            <div key={i} style={{ marginBottom: "0.75rem" }}>
              <Text style={{ fontWeight: "bold", fontSize: "0.85rem" }}>Scenario {i + 1}</Text>
              <TextArea value={s} onInput={(e: any) => { const ns = [...scenarios]; ns[i] = e.target.value; setScenarios(ns); }} rows={2} style={{ width: "100%", marginTop: "4px" }} />
            </div>
          ))}
          <FlexBox style={{ gap: "0.5rem" }}>
            {scenarios.length < 3 && <Button onClick={() => setScenarios([...scenarios, ""])}>Add Scenario</Button>}
            <Button design="Emphasized" onClick={runComparison} disabled={loading}>
              {loading ? "Comparing..." : "Compare Scenarios"}
            </Button>
          </FlexBox>
        </div>
      </Card>

      {results.length > 0 && (
        <FlexBox wrap="Wrap" style={{ gap: "1rem" }}>
          {results.map((r, i) => (
            <Card key={i} header={<CardHeader titleText={`Scenario ${i + 1}`} subtitleText={r.scenario?.slice(0, 60)} />} style={{ width: "380px" }}>
              <div style={{ padding: "1rem" }}>
                <div style={{ marginBottom: "0.5rem" }}>
                  <Text style={{ fontWeight: "bold" }}>Total Cost: </Text>
                  <Text>${r.total_cost?.toLocaleString()}</Text>
                </div>
                <div style={{ marginBottom: "0.5rem" }}>
                  <Text style={{ fontWeight: "bold" }}>Confidence: </Text>
                  <Text>{Math.round((r.confidence || 0) * 100)}%</Text>
                </div>
                <div style={{ marginBottom: "0.5rem" }}>
                  <Text style={{ fontWeight: "bold" }}>HR Review: </Text>
                  <Text>{r.flagged} employees</Text>
                </div>
                <div>
                  {Object.entries(r.actions_breakdown || {}).map(([action, count]) => (
                    <Tag key={action} icon={<Icon name={ACTION_ICONS[action] || "task"} />} style={{ margin: "2px" }}>{action}: {count as number}</Tag>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </FlexBox>
      )}
    </div>
  );
}
