import { useEffect, useState } from "react";
import {
  Card, CardHeader, Title, Text, FlexBox, ObjectStatus, Icon,
  AnalyticalTable, ProgressIndicator
} from "@ui5/webcomponents-react";
import "@ui5/webcomponents-icons/dist/employee.js";
import "@ui5/webcomponents-icons/dist/education.js";
import "@ui5/webcomponents-icons/dist/chain-link.js";

const API = import.meta.env.DEV ? "http://localhost:8000" : "";

interface TalentData {
  pipeline: { stages: { stage: string; count: number }[]; by_department: any[] };
  reskilling: { programs: any[]; totals: { enrolled: number; completed: number }; roi: any };
  succession: { critical_roles: any[]; summary: any };
}

function FunnelBar({ stage, count, maxCount }: { stage: string; count: number; maxCount: number }) {
  const pct = (count / maxCount) * 100;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.4rem" }}>
      <Text style={{ width: "140px", fontSize: "0.8rem", textAlign: "right" }}>{stage}</Text>
      <div style={{ flex: 1, background: "#F0F4FF", borderRadius: "4px", height: "22px", position: "relative" }}>
        <div style={{
          width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, #275AA3, #4A90D9)",
          borderRadius: "4px", transition: "width 0.3s"
        }} />
      </div>
      <Text style={{ width: "40px", fontSize: "0.8rem", fontWeight: 700 }}>{count}</Text>
    </div>
  );
}

function CoverageTag({ coverage }: { coverage: string }) {
  if (coverage === "strong") return <ObjectStatus state="Positive" showDefaultIcon>Strong</ObjectStatus>;
  if (coverage === "adequate") return <ObjectStatus state="Critical" showDefaultIcon>Adequate</ObjectStatus>;
  return <ObjectStatus state="Negative" showDefaultIcon>At Risk</ObjectStatus>;
}

export function TalentHealth() {
  const [data, setData] = useState<TalentData | null>(null);
  useEffect(() => { fetch(`${API}/api/executive/talent-health`).then(r => r.json()).then(setData); }, []);

  if (!data) return <Text>Loading talent health...</Text>;

  const maxFunnel = Math.max(...data.pipeline.stages.map(s => s.count));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <Title level="H3">Talent Health</Title>

      {/* Hiring Pipeline Funnel */}
      <Card header={<CardHeader titleText="Hiring Pipeline Funnel" subtitleText="Org-wide acquisition stages" avatar={<Icon name="employee" />} />}>
        <div style={{ padding: "1rem" }}>
          {data.pipeline.stages.map(s => (
            <FunnelBar key={s.stage} stage={s.stage} count={s.count} maxCount={maxFunnel} />
          ))}
          <div style={{ marginTop: "1rem", display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            {data.pipeline.by_department.map(d => (
              <div key={d.department} style={{ background: "#F8FAFF", borderRadius: "6px", padding: "0.5rem 0.75rem", minWidth: "150px" }}>
                <Text style={{ fontWeight: 600, fontSize: "0.85rem" }}>{d.department}</Text>
                <div style={{ fontSize: "0.75rem", color: "#555", marginTop: "0.25rem" }}>
                  <div>{d.open_reqs} open reqs • {d.in_pipeline} in pipeline</div>
                  <div>Avg fill: {d.avg_time_to_fill_days}d • Accept: {(d.offer_acceptance_rate * 100).toFixed(0)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Reskilling Progress */}
      <Card header={<CardHeader titleText="Reskilling Progress" subtitleText={`${data.reskilling.totals.enrolled} enrolled, ${data.reskilling.totals.completed} completed`} avatar={<Icon name="education" />} />}>
        <div style={{ padding: "1rem" }}>
          <FlexBox wrap="Wrap" style={{ gap: "1rem", marginBottom: "1rem" }}>
            <MetricBox label="Total Investment" value={`$${(data.reskilling.roi.total_investment / 1000).toFixed(0)}K`} />
            <MetricBox label="Projected Savings" value={`$${(data.reskilling.roi.projected_savings / 1000).toFixed(0)}K`} />
            <MetricBox label="ROI" value={`${data.reskilling.roi.roi_percentage}%`} color="#2E7D32" />
            <MetricBox label="Avg Salary Uplift" value={`+${data.reskilling.roi.avg_salary_uplift_pct}%`} />
          </FlexBox>
          <AnalyticalTable
            columns={[
              { Header: "Program", accessor: "program", width: 180 },
              { Header: "Enrolled", accessor: "enrolled", width: 80, hAlign: "End" },
              { Header: "Completed", accessor: "completed", width: 90, hAlign: "End" },
              { Header: "In Progress", accessor: "in_progress", width: 100, hAlign: "End" },
              { Header: "Success Rate", accessor: "success_rate", width: 120, Cell: ({ value }: any) => (
                <ProgressIndicator value={value * 100} valueState={value >= 0.85 ? "Positive" : value >= 0.75 ? "Critical" : "Negative"} />
              )},
            ] as any[]}
            data={data.reskilling.programs}
            visibleRows={5}
            sortable
          />
        </div>
      </Card>

      {/* Succession Planning */}
      <Card header={<CardHeader titleText="Succession Planning" subtitleText="Critical role coverage (anonymized)" avatar={<Icon name="chain-link" />} />}>
        <div style={{ padding: "1rem" }}>
          <FlexBox wrap="Wrap" style={{ gap: "1rem", marginBottom: "1rem" }}>
            <MetricBox label="Critical Roles" value={data.succession.summary.total_critical_roles} />
            <MetricBox label="Strong Coverage" value={data.succession.summary.strong_coverage} color="#2E7D32" />
            <MetricBox label="Adequate" value={data.succession.summary.adequate_coverage} color="#F57F17" />
            <MetricBox label="At Risk" value={data.succession.summary.at_risk} color="#B71C1C" />
            <MetricBox label="Bench Strength" value={data.succession.summary.bench_strength_index} />
          </FlexBox>
          <AnalyticalTable
            columns={[
              { Header: "Critical Role", accessor: "role", width: 200 },
              { Header: "Department", accessor: "department", width: 130 },
              { Header: "Ready Now", accessor: "ready_now", width: 90, hAlign: "End" },
              { Header: "Ready 1yr", accessor: "ready_1yr", width: 90, hAlign: "End" },
              { Header: "Ready 2yr", accessor: "ready_2yr", width: 90, hAlign: "End" },
              { Header: "Coverage", accessor: "coverage", width: 110, Cell: ({ value }: any) => <CoverageTag coverage={value} /> },
            ] as any[]}
            data={data.succession.critical_roles}
            visibleRows={7}
            sortable
          />
        </div>
      </Card>
    </div>
  );
}

function MetricBox({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ background: "#F8FAFF", borderRadius: "8px", padding: "0.6rem 1rem", minWidth: "100px", textAlign: "center" }}>
      <div style={{ fontSize: "1.3rem", fontWeight: 700, color: color || "#1A376C" }}>{value}</div>
      <div style={{ fontSize: "0.7rem", color: "#666" }}>{label}</div>
    </div>
  );
}
