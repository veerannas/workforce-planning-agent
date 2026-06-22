import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Card, CardHeader, Title, Tag, Text, ProgressIndicator, FlexBox, MessageStrip, Icon } from "@ui5/webcomponents-react";
import "@ui5/webcomponents-icons/dist/education.js";
import "@ui5/webcomponents-icons/dist/accept.js";
import "@ui5/webcomponents-icons/dist/status-error.js";
import "@ui5/webcomponents-icons/dist/alert.js";

const API = import.meta.env.DEV ? "http://localhost:8000" : "";

export function RedeploymentHub() {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API}/api/redeployment/opportunities`).then(r => r.json()).then(setOpportunities);
  }, []);

  // ── EMPLOYEE VIEW: only show roles THEY match for ──
  if (user?.role === "employee") {
    // Filter to only show opportunities where this employee is a candidate
    const myOpportunities = opportunities.map(opp => {
      const myMatch = opp.internal_candidates?.find((c: any) => c.employee_id === user.employee_id);
      if (myMatch) return { ...opp, myMatch };
      // Also show roles that match their department or have open positions
      return { ...opp, myMatch: null };
    }).filter(opp => opp.myMatch || opp.positions_available > 0);

    return (
      <div>
        <Title level="H3" style={{ color: "#1a376c", marginBottom: "1rem" }}>Internal Mobility Opportunities</Title>
        <MessageStrip design="Information" style={{ marginBottom: "1rem" }}>
          These are open roles that may match your skills. Matched roles show your compatibility score.
        </MessageStrip>

        <FlexBox wrap="Wrap" style={{ gap: "0.85rem" }}>
          {myOpportunities.map((opp) => (
            <Card key={opp.target_role} style={{ width: "360px", border: opp.myMatch ? "1px solid #c8e6c9" : "1px solid #eef2f7", borderRadius: "10px" }}>
              <div style={{ padding: "1.25rem" }}>
                <FlexBox justifyContent="SpaceBetween" alignItems="Center" style={{ marginBottom: "0.75rem" }}>
                  <div>
                    <Title level="H5" style={{ color: "#1a376c" }}>{opp.target_role}</Title>
                    <Text style={{ fontSize: "0.8rem", color: "#7a8ca8" }}>{opp.department} · {opp.positions_available} open</Text>
                  </div>
                  <Tag icon={<Icon name={opp.priority === "critical" ? "status-error" : "alert"} />} colorScheme={opp.priority === "critical" ? "1" : "2"}>
                    {opp.priority}
                  </Tag>
                </FlexBox>

                <Text style={{ fontSize: "0.8rem", color: "#555", display: "block", marginBottom: "0.5rem" }}>Required Skills:</Text>
                <FlexBox wrap="Wrap" style={{ gap: "0.3rem", marginBottom: "0.75rem" }}>
                  {opp.required_skills.map((s: string) => <Tag key={s} icon={<Icon name="education" />} style={{ background: "#f5f7fa", fontSize: "0.75rem" }}>{s}</Tag>)}
                </FlexBox>

                {opp.myMatch ? (
                  <div style={{ background: "#e8f5e9", borderRadius: "8px", padding: "0.75rem" }}>
                    <FlexBox justifyContent="SpaceBetween" alignItems="Center">
                      <Text style={{ fontWeight: "600", color: "#2e7d32", fontSize: "0.85rem" }}>You're a match!</Text>
                      <Text style={{ fontWeight: "700", color: "#2e7d32" }}>{Math.round(opp.myMatch.skill_match * 100)}% fit</Text>
                    </FlexBox>
                    <FlexBox wrap="Wrap" style={{ gap: "0.3rem", marginTop: "0.4rem" }}>
                      {opp.myMatch.matching_skills?.map((s: string) => <Tag key={s} icon={<Icon name="accept" />} style={{ background: "#c8e6c9", color: "#1b5e20", fontSize: "0.7rem" }}>{s}</Tag>)}
                    </FlexBox>
                  </div>
                ) : (
                  <div style={{ background: "#f5f7fa", borderRadius: "8px", padding: "0.6rem", textAlign: "center" }}>
                    <Text style={{ fontSize: "0.82rem", color: "#888" }}>Develop required skills to qualify</Text>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </FlexBox>
      </div>
    );
  }

  // ── MANAGER / EXECUTIVE VIEW: full view with all candidates ──
  return (
    <div>
      <Title level="H3" style={{ color: "#1a376c", marginBottom: "1rem" }}>Redeployment Hub — Internal Mobility</Title>
      <FlexBox wrap="Wrap" style={{ gap: "0.85rem" }}>
        {opportunities.map((opp) => (
          <Card key={opp.target_role} header={<CardHeader titleText={opp.target_role} subtitleText={`${opp.department} · ${opp.positions_available} positions`} />} style={{ width: "420px" }}>
            <div style={{ padding: "1rem" }}>
              <div style={{ marginBottom: "0.5rem" }}>
                <Text style={{ fontSize: "0.8rem", color: "#666" }}>Required: </Text>
                <FlexBox wrap="Wrap" style={{ gap: "0.3rem", marginTop: "0.3rem" }}>
                  {opp.required_skills.map((s: string) => <Tag key={s} icon={<Icon name="education" />} style={{ background: "#f5f7fa" }}>{s}</Tag>)}
                </FlexBox>
              </div>
              <Tag icon={<Icon name={opp.priority === "critical" ? "status-error" : "alert"} />} colorScheme={opp.priority === "critical" ? "1" : "2"}>{opp.priority}</Tag>

              <div style={{ marginTop: "0.75rem" }}>
                <Text style={{ fontWeight: "600", fontSize: "0.85rem", color: "#444" }}>Internal Candidates ({opp.internal_candidates.length})</Text>
                {opp.internal_candidates.map((c: any) => (
                  <div key={c.employee_id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem", padding: "0.5rem", background: "#f8faff", borderRadius: "6px" }}>
                    <div style={{ flex: 1 }}>
                      <Text style={{ fontWeight: "600", fontSize: "0.85rem" }}>{c.name}</Text>
                      <Text style={{ fontSize: "0.75rem", color: "#666", display: "block" }}>{c.current_role} · {c.department}</Text>
                    </div>
                    <ProgressIndicator value={Math.round(c.skill_match * 100)} valueState={c.skill_match >= 0.7 ? "Positive" : "Critical"} style={{ width: "65px" }} />
                    <Text style={{ fontSize: "0.82rem", fontWeight: "600", color: c.skill_match >= 0.7 ? "#2e7d32" : "#e65100" }}>{Math.round(c.skill_match * 100)}%</Text>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </FlexBox>
    </div>
  );
}
