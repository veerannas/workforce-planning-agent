import { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import {
  Button, MessageStrip, Text,
} from "@ui5/webcomponents-react";

export function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    const ok = await login(username, password);
    if (!ok) setError("Invalid credentials");
    setLoading(false);
  };

  const quickLogin = async (u: string, p: string) => {
    setLoading(true);
    setError("");
    const ok = await login(u, p);
    if (!ok) setError("Login failed");
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#E8ECF0"
    }}>
      <div style={{
        display: "flex", width: "85vw", maxWidth: "1300px", minHeight: "75vh",
        borderRadius: "20px", overflow: "hidden",
        boxShadow: "0 30px 80px rgba(0,0,0,0.12)", border: "1px solid rgba(0,0,0,0.06)"
      }}>
        {/* Left Panel — White form */}
        <div style={{
          flex: 1, background: "#fff", display: "flex", flexDirection: "column",
          justifyContent: "center", padding: "4rem 4.5rem"
        }}>
          {/* Logos + Title */}
          <div style={{ marginBottom: "2.5rem" }}>
            {/* Line 1: SAP SuccessFactors inline logo — text + gold heart */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "1rem" }}>
              <span style={{
                fontSize: "1.55rem", fontWeight: 800, color: "#007CC2",
                fontFamily: "'Segoe UI', Arial, Helvetica, sans-serif",
                letterSpacing: "-0.01em", lineHeight: 1,
              }}>
                SAP SuccessFactors
              </span>
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M18 31C18 31 3.5 21 3.5 11.5C3.5 6.5 7.5 3 12.5 3C15.2 3 17.4 4.6 18 6.5C18.6 4.6 20.8 3 23.5 3C28.5 3 32.5 6.5 32.5 11.5C32.5 21 18 31 18 31Z"
                  fill="none" stroke="#F0AB00" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round"
                />
              </svg>
            </div>
            {/* Line 2: SAP logo + Workforce Planning Agent */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <img src="/sap-logo.svg" alt="SAP" style={{ height: "28px", display: "block" }} />
              <span style={{ fontSize: "1.15rem", fontWeight: 700, color: "#1A376C", letterSpacing: "0.01em" }}>
                Workforce Planning Agent
              </span>
            </div>
          </div>

          {/* Form */}
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "0.75rem",
              border: "1.5px solid #E0E0E0", borderRadius: "30px",
              padding: "0.85rem 1.25rem", background: "#FAFAFA",
              transition: "border-color 0.2s"
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#BDBDBD" strokeWidth="1.8">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                style={{
                  border: "none", outline: "none", background: "transparent",
                  fontSize: "0.95rem", color: "#333", width: "100%",
                  fontFamily: "'Segoe UI', Arial, sans-serif"
                }}
              />
            </div>
          </div>
          <div style={{ marginBottom: "2.5rem" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "0.75rem",
              border: "1.5px solid #E0E0E0", borderRadius: "30px",
              padding: "0.85rem 1.25rem", background: "#FAFAFA",
              transition: "border-color 0.2s"
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#BDBDBD" strokeWidth="1.8">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="Password"
                style={{
                  border: "none", outline: "none", background: "transparent",
                  fontSize: "0.95rem", color: "#333", width: "100%",
                  fontFamily: "'Segoe UI', Arial, sans-serif"
                }}
              />
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#BDBDBD" strokeWidth="1.8" style={{ cursor: "pointer", flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
          </div>

          {error && <MessageStrip design="Negative" style={{ marginBottom: "1rem" }}>{error}</MessageStrip>}

          <Button
            design="Emphasized"
            onClick={handleLogin}
            disabled={loading || !username || !password}
            style={{
              width: "100%", height: "3rem", fontSize: "1rem",
              borderRadius: "8px", letterSpacing: "0.5px"
            }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>

          {/* Quick access */}
          <div style={{ marginTop: "2.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: "1.25rem" }}>
              <div style={{ flex: 1, height: "1px", background: "#E8E8E8" }} />
              <span style={{ padding: "0 1rem", fontSize: "0.75rem", color: "#aaa", textTransform: "uppercase", letterSpacing: "1.5px" }}>Demo Access</span>
              <div style={{ flex: 1, height: "1px", background: "#E8E8E8" }} />
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={() => quickLogin("employee", "emp123")} style={{
                flex: 1, border: "none", borderRadius: "8px", padding: "0.85rem 1rem",
                background: "#C8E6C9", cursor: "pointer", fontSize: "0.9rem",
                fontWeight: 600, color: "#2E7D32", transition: "all 0.2s",
                boxShadow: "0 2px 8px rgba(46,125,50,0.15)"
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(46,125,50,0.25)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(46,125,50,0.15)"; }}
              >
                Employee
              </button>
              <button onClick={() => quickLogin("manager", "man123")} style={{
                flex: 1, border: "none", borderRadius: "8px", padding: "0.85rem 1rem",
                background: "#BBDEFB", cursor: "pointer", fontSize: "0.9rem",
                fontWeight: 600, color: "#1565C0", transition: "all 0.2s",
                boxShadow: "0 2px 8px rgba(21,101,192,0.15)"
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(21,101,192,0.25)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(21,101,192,0.15)"; }}
              >
                Manager
              </button>
              <button onClick={() => quickLogin("executive", "exe123")} style={{
                flex: 1, border: "none", borderRadius: "8px", padding: "0.85rem 1rem",
                background: "#E1BEE7", cursor: "pointer", fontSize: "0.9rem",
                fontWeight: 600, color: "#6A1B9A", transition: "all 0.2s",
                boxShadow: "0 2px 8px rgba(106,27,154,0.15)"
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(106,27,154,0.25)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(106,27,154,0.15)"; }}
              >
                Executive
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel — Auto-scrolling carousel */}
        <RightPanelCarousel />
      </div>
    </div>
  );
}

/* Carousel slides for right panel */
const SLIDES = [
  {
    title: "Plan Workforce",
    subtitle: "",
    mockup: (
      <div style={{ background: "#fff", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 15px 45px rgba(0,0,0,0.3)", width: "420px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#E8758A" }} />
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#F5A623" }} />
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#4CAF50" }} />
          <span style={{ fontSize: "0.85rem", color: "#999", marginLeft: "auto" }}>Dashboard</span>
        </div>
        <div style={{ display: "flex", gap: "0.6rem" }}>
          <div style={{ flex: 1, background: "#E3F2FD", borderRadius: "8px", padding: "1.25rem", textAlign: "center" }}>
            <div style={{ fontWeight: 700, color: "#1565C0", fontSize: "1.7rem" }}>150</div>
            <div style={{ color: "#555", fontSize: "0.75rem", marginTop: "0.25rem" }}>Employees</div>
          </div>
          <div style={{ flex: 1, background: "#E8F5E9", borderRadius: "8px", padding: "1.25rem", textAlign: "center" }}>
            <div style={{ fontWeight: 700, color: "#2E7D32", fontSize: "1.7rem" }}>24</div>
            <div style={{ color: "#555", fontSize: "0.75rem", marginTop: "0.25rem" }}>Open Roles</div>
          </div>
          <div style={{ flex: 1, background: "#FFF3E0", borderRadius: "8px", padding: "1.25rem", textAlign: "center" }}>
            <div style={{ fontWeight: 700, color: "#E65100", fontSize: "1.7rem" }}>89%</div>
            <div style={{ color: "#555", fontSize: "0.75rem", marginTop: "0.25rem" }}>Readiness</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "BBRA Decision Engine",
    subtitle: "",
    mockup: (
      <div style={{ background: "#fff", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 15px 45px rgba(0,0,0,0.3)", width: "420px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#E8758A" }} />
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#F5A623" }} />
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#4CAF50" }} />
          <span style={{ fontSize: "0.85rem", color: "#999", marginLeft: "auto" }}>Agent</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
          <div style={{ background: "#198754", borderRadius: "8px", padding: "1.25rem", textAlign: "center" }}>
            <div style={{ color: "#fff", fontSize: "1.3rem", fontWeight: 700 }}>Build</div>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.8rem" }}>35%</div>
          </div>
          <div style={{ background: "#0F62FE", borderRadius: "8px", padding: "1.25rem", textAlign: "center" }}>
            <div style={{ color: "#fff", fontSize: "1.3rem", fontWeight: 700 }}>Buy</div>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.8rem" }}>25%</div>
          </div>
          <div style={{ background: "#6E32C9", borderRadius: "8px", padding: "1.25rem", textAlign: "center" }}>
            <div style={{ color: "#fff", fontSize: "1.3rem", fontWeight: 700 }}>Redeploy</div>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.8rem" }}>22%</div>
          </div>
          <div style={{ background: "#D26900", borderRadius: "8px", padding: "1.25rem", textAlign: "center" }}>
            <div style={{ color: "#fff", fontSize: "1.3rem", fontWeight: 700 }}>Automate</div>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.8rem" }}>18%</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Org Structure & Grades",
    subtitle: "",
    mockup: (
      <div style={{ background: "#fff", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 15px 45px rgba(0,0,0,0.3)", width: "420px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#E8758A" }} />
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#F5A623" }} />
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#4CAF50" }} />
          <span style={{ fontSize: "0.85rem", color: "#999", marginLeft: "auto" }}>Org Design</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ background: "#1A376C", color: "#fff", borderRadius: "8px", padding: "0.6rem 2rem", fontSize: "1.1rem", fontWeight: 700 }}>CEO · T5</div>
          <div style={{ width: "2px", height: "14px", background: "#999" }} />
          <div style={{ display: "flex", gap: "0.6rem" }}>
            <div style={{ background: "#E3F2FD", border: "2px solid #1565C0", borderRadius: "8px", padding: "0.5rem 1rem", fontSize: "0.95rem", color: "#1565C0", fontWeight: 600 }}>VP Tech · T4</div>
            <div style={{ background: "#E8F5E9", border: "2px solid #2E7D32", borderRadius: "8px", padding: "0.5rem 1rem", fontSize: "0.95rem", color: "#2E7D32", fontWeight: 600 }}>VP Ops · T4</div>
            <div style={{ background: "#FFF8E1", border: "2px solid #F57F17", borderRadius: "8px", padding: "0.5rem 1rem", fontSize: "0.95rem", color: "#F57F17", fontWeight: 600 }}>VP Fin · T4</div>
          </div>
        </div>
      </div>
    ),
  },
];

function RightPanelCarousel() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive(p => (p + 1) % SLIDES.length), 4000);
    return () => clearInterval(t);
  }, []);
  const slide = SLIDES[active];

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
      background: "#2C4A7C", position: "relative", overflow: "hidden", padding: "2.5rem"
    }}>
      {/* Geometric decorations */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 460 620" preserveAspectRatio="none">
        <circle cx="120" cy="200" r="80" fill="#E8758A" opacity="0.7"/>
        <polygon points="350,20 460,20 460,140" fill="#F4A6B8" opacity="0.8"/>
        <polygon points="200,80 380,200 200,320" fill="#1A376C" opacity="0.6"/>
        <polygon points="40,420 140,480 40,540" fill="#F4A6B8" opacity="0.6"/>
        <circle cx="380" cy="460" r="50" fill="#E8758A" opacity="0.5"/>
        <polygon points="380,350 420,390 340,390" fill="#F4A6B8" opacity="0.5"/>
        <g fill="#E8758A" opacity="0.6">
          <circle cx="360" cy="40" r="3"/><circle cx="375" cy="40" r="3"/><circle cx="390" cy="40" r="3"/><circle cx="405" cy="40" r="3"/><circle cx="420" cy="40" r="3"/>
          <circle cx="360" cy="55" r="3"/><circle cx="375" cy="55" r="3"/><circle cx="390" cy="55" r="3"/><circle cx="405" cy="55" r="3"/><circle cx="420" cy="55" r="3"/>
          <circle cx="360" cy="70" r="3"/><circle cx="375" cy="70" r="3"/><circle cx="390" cy="70" r="3"/><circle cx="405" cy="70" r="3"/><circle cx="420" cy="70" r="3"/>
        </g>
        <g fill="#E8758A" opacity="0.5">
          <circle cx="370" cy="480" r="3"/><circle cx="385" cy="480" r="3"/><circle cx="400" cy="480" r="3"/><circle cx="415" cy="480" r="3"/>
          <circle cx="370" cy="495" r="3"/><circle cx="385" cy="495" r="3"/><circle cx="400" cy="495" r="3"/><circle cx="415" cy="495" r="3"/>
        </g>
      </svg>

      <div style={{ position: "relative", zIndex: 1, textAlign: "center", transition: "opacity 0.5s", opacity: 1 }}>
        {/* Mockup */}
        <div style={{ marginBottom: "2.5rem", display: "flex", justifyContent: "center" }}>
          {slide.mockup}
        </div>

        {/* Text */}
        <Text style={{ color: "#fff", fontSize: "1.6rem", fontWeight: 700, display: "block", marginBottom: "0.75rem" }}>
          {slide.title}
        </Text>
        {slide.subtitle && <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.95rem", display: "block", maxWidth: "340px", margin: "0 auto", lineHeight: "1.6" }}>
          {slide.subtitle}</Text>}

        {/* Carousel dots */}
        <div style={{ marginTop: "2rem", display: "flex", justifyContent: "center", gap: "10px" }}>
          {SLIDES.map((_, i) => (
            <div
              key={i}
              onClick={() => setActive(i)}
              style={{
                width: active === i ? "24px" : "10px", height: "10px",
                borderRadius: "5px", cursor: "pointer", transition: "all 0.3s",
                background: active === i ? "#fff" : "rgba(255,255,255,0.35)"
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
