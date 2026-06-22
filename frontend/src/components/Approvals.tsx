import { useEffect, useState } from "react";
import { Card, CardHeader, Title, Text, FlexBox, Button, MessageStrip } from "@ui5/webcomponents-react";

const API = import.meta.env.DEV ? "http://localhost:8000" : "";

export function Approvals() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [actionMsg, setActionMsg] = useState("");

  useEffect(() => { fetch(`${API}/api/approvals`).then(r => r.json()).then(setApprovals); }, []);

  const handleAction = async (id: string, action: string) => {
    await fetch(`${API}/api/approvals/${id}/action`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: action === "approve" ? "Approved" : "Rejected" } : a));
    setActionMsg(`${id} ${action}d successfully`);
    setTimeout(() => setActionMsg(""), 3000);
  };

  const pending = approvals.filter(a => a.status === "Pending");
  const resolved = approvals.filter(a => a.status !== "Pending");

  const statusStyle = (s: string) => ({
    padding: "2px 8px", borderRadius: "10px", fontSize: "0.78rem", fontWeight: "600" as const,
    background: s === "Approved" ? "#e8f5e9" : s === "Rejected" ? "#fce4ec" : "#fff3e0",
    color: s === "Approved" ? "#2e7d32" : s === "Rejected" ? "#c62828" : "#e65100",
  });

  return (
    <div>
      <Title level="H3" style={{ color: "#1a376c", marginBottom: "1rem" }}>Approvals</Title>

      {actionMsg && <MessageStrip design="Positive" style={{ marginBottom: "1rem" }}>{actionMsg}</MessageStrip>}

      {/* Pending */}
      <Card header={<CardHeader titleText="Pending Approvals" subtitleText={`${pending.length} awaiting your decision`} />} style={{ marginBottom: "1rem" }}>
        {pending.length === 0 ? (
          <div style={{ padding: "1.5rem", textAlign: "center" }}><Text style={{ color: "#888" }}>No pending approvals</Text></div>
        ) : (
          <div style={{ padding: "0.5rem" }}>
            {pending.map(a => (
              <div key={a.id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.85rem 1rem", borderBottom: "1px solid #f5f7fa" }}>
                <div style={{ flex: 1 }}>
                  <FlexBox alignItems="Center" style={{ gap: "0.5rem", marginBottom: "0.3rem" }}>
                    <Text style={{ fontWeight: "600", color: "#333" }}>{a.type}</Text>
                    <span style={{ ...statusStyle("Pending") }}>Pending</span>
                    {a.priority === "high" && <span style={{ padding: "1px 6px", borderRadius: "8px", fontSize: "0.7rem", background: "#fce4ec", color: "#c62828" }}>urgent</span>}
                  </FlexBox>
                  <Text style={{ fontSize: "0.82rem", color: "#555" }}>{a.employee_name} — {a.description}</Text>
                  <Text style={{ fontSize: "0.75rem", color: "#999" }}>Submitted: {a.submitted_date} · Cost: ${a.cost_usd?.toLocaleString()}</Text>
                </div>
                <FlexBox style={{ gap: "0.4rem" }}>
                  <Button design="Positive" onClick={() => handleAction(a.id, "approve")} style={{ fontSize: "0.8rem" }}>Approve</Button>
                  <Button design="Negative" onClick={() => handleAction(a.id, "reject")} style={{ fontSize: "0.8rem" }}>Reject</Button>
                </FlexBox>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Resolved */}
      {resolved.length > 0 && (
        <Card header={<CardHeader titleText="Recent Decisions" subtitleText={`${resolved.length} resolved`} />}>
          <div style={{ padding: "0.5rem" }}>
            {resolved.map(a => (
              <div key={a.id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.65rem 1rem", borderBottom: "1px solid #f8f9fb" }}>
                <div style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "500", color: "#444" }}>{a.type} — {a.employee_name}</Text>
                  <Text style={{ fontSize: "0.78rem", color: "#888" }}>{a.description}</Text>
                </div>
                <span style={{ ...statusStyle(a.status) }}>{a.status}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
