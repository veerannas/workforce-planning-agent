import { useEffect, useState } from "react";
import {
  Card, CardHeader, Title, Text, FlexBox,
  Icon, Avatar,
} from "@ui5/webcomponents-react";
import { useAuth } from "../auth/AuthContext";
import "@ui5/webcomponents-icons/dist/alert.js";
import "@ui5/webcomponents-icons/dist/positive.js";
import "@ui5/webcomponents-icons/dist/sys-minus.js";
import "@ui5/webcomponents-icons/dist/task.js";
import "@ui5/webcomponents-icons/dist/org-chart.js";
import "@ui5/webcomponents-icons/dist/employee.js";
import "@ui5/webcomponents-icons/dist/trend-up.js";
import "@ui5/webcomponents-icons/dist/accept.js";
import "@ui5/webcomponents-icons/dist/status-critical.js";
import "@ui5/webcomponents-icons/dist/education.js";
import "@ui5/webcomponents-icons/dist/status-error.js";
import "@ui5/webcomponents-icons/dist/status-positive.js";
import "@ui5/webcomponents-icons/dist/group.js";

const API = import.meta.env.DEV ? "http://localhost:8000" : "";

// ── Types ─────────────────────────────────────────────────────────────────────
interface PersonNode {
  id: string;
  name: string;
  role: string;
  grade: string;
  email: string;
  phone: string;
  location: string;
  department?: string;
  children?: PersonNode[];
  _isMe?: boolean;
  _isManager?: boolean;
  _isGrandparent?: boolean;
}

interface DeptInsight {
  department: string;
  vp: string;
  headcount: number;
  budget: number;
  cost_per_head: number;
  avg_tenure_years: number;
  vacancy_rate: number;
  attrition_rate: number;
  avg_performance: number;
  span_of_control: number;
  roles_count: number;
  health_score: number;
  headcount_trend_12m: number[];
  open_positions: number;
  critical_roles_unfilled: number;
}

interface InsightsData {
  departments: DeptInsight[];
  totals: { headcount: number; budget: number; avg_health: number; total_vacancies: number; avg_attrition: number };
}

// ── Grade colours (T-level prefix) ───────────────────────────────────────────
const GRADE_BG: Record<string, string> = {
  T5: "#1A376C", T4: "#0D47A1", T3: "#1565C0", T2: "#42A5F5", T1: "#90CAF9",
};
const GRADE_TEXT: Record<string, string> = {
  T5: "#fff", T4: "#fff", T3: "#fff", T2: "#fff", T1: "#1A376C",
};
const AVATAR_SCHEME: Record<string, string> = {
  T5: "Accent1", T4: "Accent2", T3: "Accent3", T2: "Accent5", T1: "Accent6",
};
function gradeLevel(grade: string) { return grade.split("-")[0]; }

// ── Constants ─────────────────────────────────────────────────────────────────
const CARD_W = 175;
const COL_GAP = 10;
const LINE = "#90A4AE";

// ── PersonCard ────────────────────────────────────────────────────────────────
function PersonCard({
  node, open, onToggle, hasKids,
}: {
  node: PersonNode; open: boolean; onToggle: () => void; hasKids: boolean;
}) {
  const level = gradeLevel(node.grade);
  const initials = node.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const headerBg = node._isMe
    ? "#0b6e4f"                         // teal-green = logged-in user
    : node._isGrandparent
      ? "#7a8a9a"                       // greyed = grandparent
      : node.id === "CEO"
        ? "#1A376C"
        : "#3d4a5c";
  const cardBorder = node._isMe ? "2px solid #0b6e4f" : "1px solid #dde3ed";

  return (
    <div style={{
      width: CARD_W,
      border: cardBorder,
      borderRadius: 8,
      overflow: "hidden",
      boxShadow: node._isMe ? "0 0 12px rgba(11,110,79,0.35)" : "0 2px 8px rgba(0,0,0,0.09)",
      background: "#fff",
      flexShrink: 0,
    }}>
      {/* Clickable header: name + role + chevron */}
      <div
        onClick={hasKids ? onToggle : undefined}
        style={{
          background: headerBg,
          padding: "7px 10px 6px",
          cursor: hasKids ? "pointer" : "default",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 4,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: "0.78rem", color: "#fff", lineHeight: 1.25, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {node.name}
          </div>
          <div style={{ fontSize: "0.64rem", color: "#b0c4d8", marginTop: 2, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {node.role}
          </div>
        </div>
        {hasKids && (
          <span style={{
            color: "#b0c4d8",
            fontSize: "0.6rem",
            marginTop: 3,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 2,
            transition: "transform 0.15s",
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
          }}>
            ▶ {node.children?.length}
          </span>
        )}
      </div>

      {/* Body: avatar + contact details */}
      <div style={{ padding: "8px 10px 6px", display: "flex", gap: 8, alignItems: "flex-start" }}>
        <Avatar
          initials={initials}
          size="XS"
          colorScheme={AVATAR_SCHEME[level] as any || "Accent6"}
          style={{ flexShrink: 0, marginTop: 2 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "0.58rem", color: "#5a6880", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {node.email}
          </div>
          <div style={{ fontSize: "0.58rem", color: "#5a6880", marginBottom: 2 }}>
            {node.phone}
          </div>
          <div style={{ fontSize: "0.58rem", color: "#7a8ca8" }}>
            {node.location}
          </div>
        </div>
      </div>

      {/* Footer: grade badge only */}
      <div style={{
        padding: "3px 10px 5px",
        borderTop: "1px solid #f0f4f8",
      }}>
        <span style={{
          fontSize: "0.56rem", fontWeight: 700,
          background: GRADE_BG[level] || "#90CAF9",
          color: GRADE_TEXT[level] || "#1A376C",
          padding: "1px 6px", borderRadius: 4, letterSpacing: "0.3px",
        }}>
          {node.grade}
        </span>
      </div>
    </div>
  );
}

// ── Vertical connector ────────────────────────────────────────────────────────
function VLine({ h = 16 }: { h?: number }) {
  return <div style={{ width: 2, height: h, background: LINE, flexShrink: 0 }} />;
}

// ── Recursive tree node ───────────────────────────────────────────────────────
function OrgNode({ node, depth = 0 }: { node: PersonNode; depth?: number }) {
  // CEO + direct reports (depth 0, 1) start expanded; rest collapsed
  const [open, setOpen] = useState(depth < 1);
  const kids = node.children ?? [];
  const hasKids = kids.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <PersonCard
        node={node}
        open={open}
        onToggle={() => setOpen(o => !o)}
        hasKids={hasKids}
      />

      {open && hasKids && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <VLine />
          {/* Children row */}
          <div
            style={{
              display: "flex",
              gap: COL_GAP,
              alignItems: "flex-start",
              position: "relative",
            }}
          >
            {/* Horizontal bar: left = center of col 0, right = center of last col */}
            {kids.length > 1 && (
              <div style={{
                position: "absolute",
                top: 0,
                left: CARD_W / 2,
                right: CARD_W / 2,
                height: 2,
                background: LINE,
                zIndex: 0,
              }} />
            )}

            {kids.map(child => (
              <div key={child.id} style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                minWidth: CARD_W,
              }}>
                <VLine />
                <OrgNode node={child} depth={depth + 1} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Grade legend ──────────────────────────────────────────────────────────────
function GradeLegend() {
  const levels = [
    { grade: "T5", label: "C-Suite / Principal" },
    { grade: "T4", label: "VP / Staff" },
    { grade: "T3", label: "Director / Manager" },
    { grade: "T2", label: "Senior IC" },
    { grade: "T1", label: "Individual Contributor" },
  ];
  return (
    <FlexBox wrap="Wrap" style={{ gap: "0.5rem", marginBottom: "0.75rem" }}>
      {levels.map(({ grade, label }) => (
        <FlexBox key={grade} alignItems="Center" style={{ gap: 4 }}>
          <span style={{
            fontSize: "0.6rem", fontWeight: 700, padding: "1px 7px",
            borderRadius: 4, background: GRADE_BG[grade], color: GRADE_TEXT[grade],
          }}>
            {grade}-1/2/3
          </span>
          <Text style={{ fontSize: "0.68rem", color: "#666" }}>{label}</Text>
        </FlexBox>
      ))}
    </FlexBox>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function OrgDesign() {
  const [tree, setTree]               = useState<PersonNode | null>(null);
  const [insights, setInsights]       = useState<InsightsData | null>(null);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const { user } = useAuth();
  const role       = user?.role        || "employee";
  const employeeId = user?.employee_id || "";
  const dept       = user?.department  || "";
  const isExec     = role === "executive";

  useEffect(() => {
    const params = new URLSearchParams({ role, employee_id: employeeId });
    fetch(`${API}/api/org/tree?${params}`).then(r => r.json()).then(setTree);
    if (isExec) {
      Promise.all([
        fetch(`${API}/api/org/executive-insights`).then(r => r.json()),
        fetch(`${API}/api/employees`).then(r => r.json()),
      ]).then(([ins, emps]) => {
        setInsights(ins); setAllEmployees(emps);
      }).catch(() => {});
    }
    if (role === "manager" && dept) {
      fetch(`${API}/api/org/executive-insights`).then(r => r.json()).then(setInsights).catch(() => {});
    }
  }, [role, employeeId, dept]);

  if (!tree) return <Text>Loading org structure...</Text>;

  // ── Build synthetic dept-grouped tree for executive ───────────────────────
  // Maps VP info from insights (Sarah Chen, Michael Brown, David Patel)
  const execTree: PersonNode | null = isExec && insights && allEmployees.length > 0 ? (() => {
    const deptConfig = [
      { department: "Technology", icon: "T" },
      { department: "Operations", icon: "O" },
      { department: "Finance",    icon: "F" },
    ];
    const vpNodes: PersonNode[] = deptConfig.map(({ department }) => {
      const insightDept = insights.departments.find(d => d.department === department);
      const vpName  = insightDept?.vp ?? `${department} Lead`;
      const deptEmps = allEmployees.filter((e: any) => e.department === department);
      // Build employee PersonNodes (leaf level — no sub-children for perf)
      const empNodes: PersonNode[] = deptEmps.map((e: any) => ({
        id: e.employee_id,
        name: `${e.first_name} ${e.last_name}`,
        role: e.role,
        grade: e.grade ?? "",
        email: `${e.first_name.toLowerCase()}.${e.last_name.toLowerCase()}@company.com`,
        phone: "(555) 000-0000",
        location: e.location ?? "",
        department,
        children: [],
      }));
      return {
        id: `VP-${department}`,
        name: vpName,
        role: `VP ${department}`,
        grade: "T5-1",
        email: `${vpName.toLowerCase().replace(" ", ".")}@company.com`,
        phone: "(555) 000-0000",
        location: "",
        department,
        children: empNodes,
      } as PersonNode;
    });
    return {
      id: "CEO",
      name: "Alex Morgan",
      role: "Chief Executive Officer",
      grade: "T5-2",
      email: "alex.morgan@company.com",
      phone: "(555) 000-0001",
      location: "New York",
      department: "Executive",
      children: vpNodes,
    } as PersonNode;
  })() : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <Title level="H3">Org Structure</Title>

      {/* ── Org chart (top 2 levels default) ─────────────────────────────── */}
      <Card
        header={<CardHeader titleText="Organizational Structure" subtitleText={isExec ? `Alex Morgan → 3 departments → ${allEmployees.filter(e => e.department !== 'Executive').length} employees. Click any VP to expand.` : "Click a card header to expand or collapse its reports."} avatar={<Icon name="org-chart" />} />}
        style={{ borderRadius: "10px", border: "1px solid #e4e8ed" }}
      >
        <div style={{ padding: "0.75rem 0.5rem 0.5rem" }}>
          <GradeLegend />
        </div>
        <div style={{ padding: "1rem 2rem 2rem", overflowX: "auto" }}>
          <OrgNode node={isExec && execTree ? execTree : tree} depth={0} />
        </div>
      </Card>
    </div>
  );
}
