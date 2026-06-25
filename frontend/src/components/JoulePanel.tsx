import { useState, useRef } from "react";
import {
  Button,
  TextArea,
  Icon,
  FlexBox,
  Text,
} from "@ui5/webcomponents-react";
import "@ui5/webcomponents-icons/dist/ai.js";
import "@ui5/webcomponents-icons/dist/alert.js";
import "@ui5/webcomponents-icons/dist/education.js";
import "@ui5/webcomponents-icons/dist/money-bills.js";
import "@ui5/webcomponents-icons/dist/approvals.js";
import "@ui5/webcomponents-icons/dist/forward.js";
import "@ui5/webcomponents-icons/dist/decline.js";

const API_BASE = import.meta.env.DEV ? "http://localhost:8000" : "";

interface JouleSuggestion {
  label: string;
  icon: string;
  prompt: string;
  scenarioType: string;
}

const JOULE_SUGGESTIONS: JouleSuggestion[] = [
  {
    label: "Attrition Risk",
    icon: "alert",
    scenarioType: "attrition_risk",
    prompt: "Identify the top attrition risks across the entire organisation. For each at-risk employee flag flight-risk signals, recommend retention actions (compensation review, career pathing, redeployment), and estimate the cost of inaction vs. intervention. Prioritise by impact to critical roles.",
  },
  {
    label: "Skills Gap",
    icon: "education",
    scenarioType: "skills_gap",
    prompt: "Perform a comprehensive skills gap analysis across all 150 employees. Identify the top 10 critical skill shortfalls versus the organisation's 3-year technology roadmap. For each gap show: current coverage %, target %, build vs. buy trade-off, reskilling cost, and time-to-close.",
  },
  {
    label: "Succession",
    icon: "approvals",
    scenarioType: "succession_planning",
    prompt: "Map succession risks for all Tier-1 and Tier-2 leadership and specialist roles. Identify single points of failure, bench depth per role, and recommend whether to develop an internal successor, redeploy from another team, or open an external search — with 12-month timelines.",
  },
  {
    label: "Cost Forecast",
    icon: "money-bills",
    scenarioType: "cost_forecast",
    prompt: "Model total workforce cost trajectory over the next 24 months under three scenarios: (1) status quo, (2) 15% cost reduction via automation and redeployment, (3) growth investment in AI/ML roles. Show cost-by-department breakdown, headcount delta, and ROI timeline for each path.",
  },
];

interface JouleChatMessage {
  role: "user" | "joule";
  text: string;
  timestamp: string;
}

interface Props {
  onInjectScenario: (text: string, scenarioType: string) => void;
  onClose: () => void;
}

export function JoulePanel({ onInjectScenario }: Props) {
  const [input, setInput]       = useState("");
  const [messages, setMessages] = useState<JouleChatMessage[]>([
    {
      role: "joule",
      text: "👋 Hi! I'm **Joule** — your AI workforce copilot.\n\nPick a strategic prompt below or ask me anything about your workforce data. I'll analyse and pre-fill the scenario for you.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const scrollToBottom = () => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const sendMessage = async (text: string, scenarioType?: string) => {
    if (!text.trim()) return;
    const userMsg: JouleChatMessage = { role: "user", text, timestamp: now() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    scrollToBottom();

    try {
      // Build history from prior messages (last 6)
      const history = messages.slice(-6).map(m => ({ role: m.role === "joule" ? "assistant" : "user", text: m.text }));

      const res = await fetch(`${API_BASE}/api/joule/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      setMessages(prev => [
        ...prev,
        { role: "joule", text: data.response, timestamp: now() },
      ]);

      // If this was a scenario prompt, inject into parent textarea
      if (scenarioType) {
        onInjectScenario(text, scenarioType);
      }
    } catch (e: any) {
      setMessages(prev => [
        ...prev,
        { role: "joule", text: `⚠️ Connection error: ${e.message}. Try again or use the Scenario Strategies tab directly.`, timestamp: now() },
      ]);
      if (scenarioType) onInjectScenario(text, scenarioType);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const handleSuggestion = (s: JouleSuggestion) => sendMessage(s.prompt, s.scenarioType);
  const handleFreeInput = () => sendMessage(input);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#fafbfd", overflow: "hidden" }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{
        padding: "16px 18px",
        background: "linear-gradient(135deg, #2D1252 0%, #6B3FA0 50%, #9B5FCF 100%)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0,
        boxShadow: "0 4px 16px rgba(107,63,160,0.35)",
      }}>
        <FlexBox alignItems="Center" style={{ gap: "12px" }}>
          <div style={{
            width: "38px", height: "38px", borderRadius: "12px",
            background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "1px solid rgba(255,255,255,0.15)",
          }}>
            <Icon name="ai" style={{ color: "#fff", fontSize: "20px" }} />
          </div>
          <div>
            <Text style={{ color: "#fff", fontWeight: 700, fontSize: "15px", display: "block", letterSpacing: "0.2px" }}>
              AI Assistant
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: "12px" }}>
              Joule-style · Workforce Copilot
            </Text>
          </div>
        </FlexBox>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#4ADE80", boxShadow: "0 0 8px #4ADE80" }} />
          <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: "11px", fontWeight: 500 }}>Active</Text>
        </div>
      </div>

      {/* ── Quick prompts ───────────────────────────────────────── */}
      <div style={{
        padding: "14px 16px 12px",
        borderBottom: "1px solid #eef0f5",
        background: "#fff",
        flexShrink: 0,
      }}>
        <Text style={{ fontSize: "11px", fontWeight: 700, color: "#7c8aa0", textTransform: "uppercase", letterSpacing: "0.6px", display: "block", marginBottom: "10px" }}>
          Strategic Prompts
        </Text>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {JOULE_SUGGESTIONS.map(s => (
            <button
              key={s.scenarioType}
              onClick={() => handleSuggestion(s)}
              disabled={loading}
              title={s.prompt.slice(0, 80) + "…"}
              style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                padding: "7px 13px", borderRadius: "18px",
                border: "1.5px solid #e4e8ed",
                background: "#fafbfd", cursor: loading ? "not-allowed" : "pointer",
                fontSize: "12.5px", fontWeight: 500, color: "#1a2027",
                transition: "all .2s", fontFamily: "inherit",
              }}
              onMouseEnter={e => { if (!loading) { (e.currentTarget).style.borderColor = "#6B3FA0"; (e.currentTarget).style.background = "#f4eeff"; (e.currentTarget).style.transform = "translateY(-1px)"; }}}
              onMouseLeave={e => { (e.currentTarget).style.borderColor = "#e4e8ed"; (e.currentTarget).style.background = "#fafbfd"; (e.currentTarget).style.transform = "none"; }}
            >
              <Icon name={s.icon} style={{ fontSize: "14px", color: "#6B3FA0" }} />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Chat messages ───────────────────────────────────────── */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "14px",
        display: "flex", flexDirection: "column", gap: "12px",
      }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            display: "flex",
            flexDirection: m.role === "user" ? "row-reverse" : "row",
            alignItems: "flex-start", gap: "8px",
            animation: "fadeSlideIn 0.3s ease",
          }}>
            {/* Avatar */}
            <div style={{
              width: "30px", height: "30px", borderRadius: "10px", flexShrink: 0,
              background: m.role === "joule"
                ? "linear-gradient(135deg, #6B3FA0, #9B5FCF)"
                : "linear-gradient(135deg, #0059c1, #0070f2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "12px", fontWeight: 700, color: "#fff",
              boxShadow: m.role === "joule" ? "0 2px 8px rgba(107,63,160,0.3)" : "0 2px 8px rgba(0,112,242,0.3)",
            }}>
              {m.role === "joule" ? "J" : "A"}
            </div>

            {/* Bubble */}
            <div style={{
              maxWidth: "75%",
              background: m.role === "joule"
                ? "rgba(255,255,255,0.85)"
                : "rgba(0,112,242,0.08)",
              backdropFilter: "blur(6px)",
              border: `1px solid ${m.role === "joule" ? "rgba(107,63,160,0.12)" : "rgba(0,112,242,0.15)"}`,
              borderRadius: m.role === "joule" ? "2px 14px 14px 14px" : "14px 2px 14px 14px",
              padding: "10px 12px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}>
              <Text style={{
                fontSize: "13px", lineHeight: "1.7", color: "#1a2027",
                whiteSpace: "pre-line", display: "block",
              }}>
                {m.text}
              </Text>
              <Text style={{ fontSize: "10.5px", color: "#999", marginTop: "5px", display: "block" }}>
                {m.timestamp}
              </Text>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "30px", height: "30px", borderRadius: "10px",
              background: "linear-gradient(135deg, #6B3FA0, #9B5FCF)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "12px", fontWeight: 700, color: "#fff",
            }}>J</div>
            <div style={{
              background: "rgba(255,255,255,0.85)", backdropFilter: "blur(6px)",
              border: "1px solid rgba(107,63,160,0.12)",
              borderRadius: "2px 14px 14px 14px", padding: "10px 14px",
              display: "flex", gap: "4px", alignItems: "center",
            }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#6B3FA0", animation: "bounce 1.4s infinite", animationDelay: "0s" }} />
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#6B3FA0", animation: "bounce 1.4s infinite", animationDelay: "0.2s" }} />
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#6B3FA0", animation: "bounce 1.4s infinite", animationDelay: "0.4s" }} />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* ── Input bar ───────────────────────────────────────────── */}
      <div style={{
        padding: "14px 16px",
        borderTop: "1px solid #eef0f5",
        display: "flex", gap: "10px", alignItems: "flex-end",
        flexShrink: 0, background: "#fff",
        boxShadow: "0 -2px 8px rgba(0,0,0,0.04)",
      }}>
        <TextArea
          value={input}
          onInput={(e: any) => setInput(e.target.value)}
          placeholder="Ask Joule about your workforce…"
          rows={2}
          style={{ flex: 1, fontSize: "13px", borderRadius: "12px" }}
          onKeyDown={(e: any) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleFreeInput();
            }
          }}
        />
        <Button
          design="Emphasized"
          icon="forward"
          onClick={handleFreeInput}
          disabled={loading || !input.trim()}
          tooltip="Send"
          style={{ borderRadius: "12px", height: "40px", width: "40px", minWidth: "40px" }}
        />
      </div>

      {/* ── Animations (injected via style tag) ──────────────── */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
