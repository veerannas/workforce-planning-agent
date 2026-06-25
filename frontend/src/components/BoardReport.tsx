import { useEffect, useState, useRef } from "react";
import { Card, CardHeader, Title, Text, FlexBox, Tag, Icon, ObjectStatus, Button, BusyIndicator } from "@ui5/webcomponents-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import "@ui5/webcomponents-icons/dist/document-text.js";
import "@ui5/webcomponents-icons/dist/download.js";
import "@ui5/webcomponents-icons/dist/flag.js";
import "@ui5/webcomponents-icons/dist/print.js";

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
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetch(`${API}/api/executive/board-report`).then(r => r.json()).then(setReport); }, []);

  const exportPDF = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const imgW = canvas.width;
      const imgH = canvas.height;
      const ratio = Math.min(pdfW / imgW, pdfH / imgH);
      const scaledW = imgW * ratio;
      const scaledH = imgH * ratio;

      // Multi-page support for long reports
      const pageHeight = pdfH * (imgW / scaledW);
      let position = 0;
      let page = 0;

      while (position < imgH) {
        if (page > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, -(position * ratio), scaledW, scaledH);
        position += pageHeight;
        page++;
      }

      pdf.save(`Board_Report_${report?.period?.replace(/\s/g, "_") || "Q2_2026"}.pdf`);
    } catch (e) {
      console.error("PDF export failed:", e);
    } finally {
      setExporting(false);
    }
  };

  if (!report) return <BusyIndicator active size="L" style={{ display: "block", margin: "3rem auto" }} />;

  // ── Derived chart data ─────────────────────────────────────────────────────
  const compositionSection = report.sections.find(s => s.title.includes("Composition"));
  const successionSection  = report.sections.find(s => s.title.includes("Succession"));

  const deptData = [
    { name: "Technology", headcount: 57, budget: 12 },
    { name: "Operations", headcount: 45, budget: 5.5 },
    { name: "Finance", headcount: 48, budget: 4.2 },
  ];

  const successionPieData = successionSection ? [
    { name: "Strong", value: successionSection.metrics.strong || 3 },
    { name: "Adequate", value: successionSection.metrics.adequate || 2 },
    { name: "At Risk", value: successionSection.metrics.at_risk || 2 },
  ] : [];
  const successionColors = ["#198754", "#F0AB00", "#DA1E28"];

  const diversityPie = [
    { name: "Female", value: compositionSection?.metrics.diversity_female_pct || 42 },
    { name: "Male", value: 100 - (compositionSection?.metrics.diversity_female_pct || 42) },
  ];
  const diversityColors = ["#6E32C9", "#4589FF"];

  const investmentTrend = [
    { quarter: "Q3 2025", actual: 4.8, planned: 5.0 },
    { quarter: "Q4 2025", actual: 5.1, planned: 5.2 },
    { quarter: "Q1 2026", actual: 5.3, planned: 5.4 },
    { quarter: "Q2 2026", actual: 5.5, planned: 5.4 },
    { quarter: "Q3 2026 (proj)", actual: null, planned: 6.6 },
    { quarter: "Q4 2026 (proj)", actual: null, planned: 6.8 },
  ];

  const actionSummary = {
    high: report.key_actions.filter(a => a.priority === "High").length,
    medium: report.key_actions.filter(a => a.priority === "Medium").length,
    low: report.key_actions.filter(a => a.priority === "Low").length,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          <Title level="H3" style={{ fontSize: "18px" }}>Board Report</Title>
          <Text style={{ fontSize: "12px", color: "#556b82" }}>
            {report.period} • Generated {new Date(report.generated_at).toLocaleDateString()} {new Date(report.generated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </div>
        <FlexBox style={{ gap: "8px" }}>
          <Button icon="print" design="Default" onClick={() => window.print()} style={{ borderRadius: "6px" }}>
            Print
          </Button>
          <Button icon="download" design="Emphasized" onClick={exportPDF} disabled={exporting} style={{ borderRadius: "6px" }}>
            {exporting ? "Generating PDF…" : "Download PDF"}
          </Button>
        </FlexBox>
      </div>

      {/* ── Report content (captured for PDF) ──────────────────── */}
      <div ref={reportRef} style={{ background: "#fff", padding: "4px" }}>

        {/* Executive Summary */}
        <Card header={<CardHeader titleText="Executive Summary" avatar={<Icon name="document-text" />} />} style={{ marginBottom: "1rem", borderRadius: "10px", border: "1px solid #e4e8ed" }}>
          <div style={{ padding: "1.25rem" }}>
            <Text style={{ fontSize: "14px", lineHeight: "1.7", color: "#1a2027" }}>{report.executive_summary}</Text>
            <FlexBox style={{ gap: "12px", marginTop: "1rem", flexWrap: "wrap" }}>
              <Tag style={{ fontWeight: 600 }}>📊 {report.sections.length} sections</Tag>
              <Tag style={{ fontWeight: 600, color: "#DA1E28" }}>🔴 {actionSummary.high} high priority actions</Tag>
              <Tag style={{ fontWeight: 600, color: "#D26900" }}>🟡 {actionSummary.medium} medium</Tag>
              <Tag style={{ fontWeight: 600, color: "#198754" }}>🟢 {actionSummary.low} low</Tag>
            </FlexBox>
          </div>
        </Card>

        {/* ── Charts Row 1: Headcount + Diversity ─────────────── */}
        <FlexBox wrap="Wrap" style={{ gap: "1rem", marginBottom: "1rem" }}>
          <Card header={<CardHeader titleText="Headcount by Department" subtitleText="FTE distribution" />} style={{ flex: "1 1 400px", borderRadius: "10px", border: "1px solid #e4e8ed" }}>
            <div style={{ padding: "1rem", height: "220px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef0f5" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="headcount" fill="#0F62FE" radius={[4, 4, 0, 0]} name="Headcount" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card header={<CardHeader titleText="Gender Diversity" subtitleText={`${compositionSection?.metrics.diversity_female_pct || 42}% female`} />} style={{ flex: "0 0 280px", borderRadius: "10px", border: "1px solid #e4e8ed" }}>
            <div style={{ padding: "0.5rem", height: "220px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={diversityPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name} ${value}%`} labelLine={false}>
                    {diversityPie.map((_, i) => <Cell key={i} fill={diversityColors[i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </FlexBox>

        {/* ── Charts Row 2: Budget Trend + Succession Readiness ── */}
        <FlexBox wrap="Wrap" style={{ gap: "1rem", marginBottom: "1rem" }}>
          <Card header={<CardHeader titleText="HR Investment Trend ($M)" subtitleText="Actual vs. Planned spend" />} style={{ flex: "1 1 400px", borderRadius: "10px", border: "1px solid #e4e8ed" }}>
            <div style={{ padding: "1rem", height: "220px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={investmentTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef0f5" />
                  <XAxis dataKey="quarter" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} domain={[4, 7.5]} unit="M" />
                  <Tooltip formatter={(v: any) => `$${v}M`} />
                  <Legend />
                  <Area type="monotone" dataKey="planned" stroke="#6E32C9" fill="rgba(110,50,201,0.1)" name="Planned" strokeDasharray="5 5" />
                  <Area type="monotone" dataKey="actual" stroke="#0F62FE" fill="rgba(15,98,254,0.1)" name="Actual" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card header={<CardHeader titleText="Succession Readiness" subtitleText="Critical role coverage" />} style={{ flex: "0 0 280px", borderRadius: "10px", border: "1px solid #e4e8ed" }}>
            <div style={{ padding: "0.5rem", height: "220px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={successionPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {successionPieData.map((_, i) => <Cell key={i} fill={successionColors[i]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </FlexBox>

        {/* ── Charts Row 3: Budget by Dept (bar) ─────────────── */}
        <Card header={<CardHeader titleText="Annual Budget Allocation by Department ($M)" />} style={{ marginBottom: "1rem", borderRadius: "10px", border: "1px solid #e4e8ed" }}>
          <div style={{ padding: "1rem", height: "200px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef0f5" />
                <XAxis type="number" tick={{ fontSize: 12 }} unit="M" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: any) => `$${v}M`} />
                <Bar dataKey="budget" fill="#6E32C9" radius={[0, 4, 4, 0]} name="Budget ($M)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* ── Report Sections (narrative + metrics) ────────────── */}
        {report.sections.map((section, i) => (
          <Card key={i} header={<CardHeader titleText={section.title} />} style={{ marginBottom: "0.75rem", borderRadius: "10px", border: "1px solid #e4e8ed" }}>
            <div style={{ padding: "1rem" }}>
              <Text style={{ fontSize: "13px", lineHeight: "1.6", display: "block", marginBottom: "0.75rem", color: "#333" }}>
                {section.narrative}
              </Text>
              <FlexBox wrap="Wrap" style={{ gap: "10px" }}>
                {Object.entries(section.metrics).map(([key, val]) => (
                  <div key={key} style={{ background: "#F4F7FF", borderRadius: "8px", padding: "10px 14px", textAlign: "center", minWidth: "90px", border: "1px solid #e8ebf5" }}>
                    <div style={{ fontSize: "18px", fontWeight: 700, color: "#1A376C" }}>
                      {typeof val === "number" && val > 10000 ? `$${(val / 1e6).toFixed(1)}M` :
                       typeof val === "number" && val < 1 ? `${(val * 100).toFixed(0)}%` :
                       typeof val === "number" && val > 1000 ? `${(val / 1000).toFixed(0)}K` :
                       val}
                    </div>
                    <div style={{ fontSize: "10.5px", color: "#556b82", textTransform: "capitalize", marginTop: "2px", fontWeight: 500 }}>
                      {key.replace(/_/g, " ")}
                    </div>
                  </div>
                ))}
              </FlexBox>
            </div>
          </Card>
        ))}

        {/* ── Key Actions Table ────────────────────────────────── */}
        <Card header={<CardHeader titleText="Key Actions & Recommendations" subtitleText={`${report.key_actions.length} action items`} avatar={<Icon name="flag" />} />} style={{ marginBottom: "0.75rem", borderRadius: "10px", border: "1px solid #e4e8ed" }}>
          <div style={{ padding: "0.75rem 1rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f4f6f9", borderBottom: "1.5px solid #e4e8ed" }}>
                  <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#556b82", fontSize: "11px", textTransform: "uppercase" }}>Priority</th>
                  <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#556b82", fontSize: "11px", textTransform: "uppercase" }}>Action</th>
                  <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#556b82", fontSize: "11px", textTransform: "uppercase" }}>Owner</th>
                  <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#556b82", fontSize: "11px", textTransform: "uppercase" }}>Deadline</th>
                </tr>
              </thead>
              <tbody>
                {report.key_actions.map((action, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #eef0f5" }}>
                    <td style={{ padding: "10px 12px" }}><PriorityBadge priority={action.priority} /></td>
                    <td style={{ padding: "10px 12px", fontWeight: 500 }}>{action.action}</td>
                    <td style={{ padding: "10px 12px", color: "#556b82" }}>{action.owner}</td>
                    <td style={{ padding: "10px 12px" }}><Tag style={{ fontSize: "11px" }}>{action.deadline}</Tag></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* ── Footer ───────────────────────────────────────────── */}
        <div style={{ textAlign: "center", padding: "1rem 0 0.5rem", borderTop: "1px solid #eef0f5", marginTop: "0.5rem" }}>
          <Text style={{ fontSize: "11px", color: "#999" }}>
            SAP SuccessFactors · Workforce Planning Agent · Board Report · {report.period} · Confidential
          </Text>
        </div>
      </div>
    </div>
  );
}
