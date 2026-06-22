import { useEffect, useState } from "react";
import { Card, CardHeader, Title, Text, FlexBox, Tag, Icon, ObjectStatus, Button } from "@ui5/webcomponents-react";
import "@ui5/webcomponents-icons/dist/document-text.js";
import "@ui5/webcomponents-icons/dist/download.js";
import "@ui5/webcomponents-icons/dist/flag.js";

const API = import.meta.env.DEV ? "http://localhost:8000" : "";

interface ReportSection {
  title: string;
  narrative: string;
  metrics: Record<string, number>;
}
interface KeyAction {
  priority: string;
  action: string;
  owner: string;
  deadline: string;
}
interface BoardReportData {
  generated_at: string;
  period: string;
  executive_summary: string;
  sections: ReportSection[];
  key_actions: KeyAction[];
}

function PriorityBadge({ priority }: { priority: string }) {
  if (priority === "High") return <ObjectStatus state="Negative" showDefaultIcon>{priority}</ObjectStatus>;
  if (priority === "Medium") return <ObjectStatus state="Critical" showDefaultIcon>{priority}</ObjectStatus>;
  return <ObjectStatus state="Positive" showDefaultIcon>{priority}</ObjectStatus>;
}

export function BoardReport() {
  const [report, setReport] = useState<BoardReportData | null>(null);
  useEffect(() => { fetch(`${API}/api/executive/board-report`).then(r => r.json()).then(setReport); }, []);

  if (!report) return <Text>Generating board report...</Text>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <Title level="H3">Board Report</Title>
          <Text style={{ fontSize: "0.8rem", color: "#666" }}>
            {report.period} • Generated {new Date(report.generated_at).toLocaleDateString()}
          </Text>
        </div>
        <Button icon="download" design="Emphasized" onClick={() => alert("PDF export coming soon")}>
          Export PDF
        </Button>
      </div>

      {/* Executive Summary */}
      <Card header={<CardHeader titleText="Executive Summary" avatar={<Icon name="document-text" />} />}>
        <div style={{ padding: "1.25rem" }}>
          <Text style={{ fontSize: "0.95rem", lineHeight: "1.6" }}>{report.executive_summary}</Text>
        </div>
      </Card>

      {/* Report Sections */}
      {report.sections.map((section, i) => (
        <Card key={i} header={<CardHeader titleText={section.title} />}>
          <div style={{ padding: "1rem" }}>
            <Text style={{ fontSize: "0.88rem", lineHeight: "1.5", display: "block", marginBottom: "0.75rem" }}>
              {section.narrative}
            </Text>
            <FlexBox wrap="Wrap" style={{ gap: "0.75rem" }}>
              {Object.entries(section.metrics).map(([key, val]) => (
                <div key={key} style={{ background: "#F4F7FF", borderRadius: "6px", padding: "0.4rem 0.75rem", textAlign: "center" }}>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1A376C" }}>
                    {typeof val === "number" && val > 1000 ? `${(val / 1000).toFixed(0)}K` :
                     typeof val === "number" && val < 1 ? `${(val * 100).toFixed(0)}%` :
                     val}
                  </div>
                  <div style={{ fontSize: "0.65rem", color: "#888", textTransform: "capitalize" }}>
                    {key.replace(/_/g, " ")}
                  </div>
                </div>
              ))}
            </FlexBox>
          </div>
        </Card>
      ))}

      {/* Key Actions */}
      <Card header={<CardHeader titleText="Key Actions & Recommendations" avatar={<Icon name="flag" />} />}>
        <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {report.key_actions.map((action, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: "0.75rem",
              padding: "0.6rem 0.75rem", background: i % 2 === 0 ? "#FAFBFF" : "#fff",
              borderRadius: "6px", borderLeft: `3px solid ${action.priority === "High" ? "#B71C1C" : action.priority === "Medium" ? "#F57F17" : "#2E7D32"}`
            }}>
              <PriorityBadge priority={action.priority} />
              <div style={{ flex: 1 }}>
                <Text style={{ fontWeight: 600, fontSize: "0.85rem" }}>{action.action}</Text>
                <Text style={{ fontSize: "0.75rem", color: "#666", display: "block" }}>
                  Owner: {action.owner} • Deadline: {action.deadline}
                </Text>
              </div>
              <Tag>{action.deadline}</Tag>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
