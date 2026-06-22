import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import {
  ShellBar, SideNavigation, SideNavigationItem, FlexBox, Avatar, Text, Icon,
} from "@ui5/webcomponents-react";
import "@ui5/webcomponents-icons/dist/home.js";
import "@ui5/webcomponents-icons/dist/ai.js";
import "@ui5/webcomponents-icons/dist/add-employee.js";
import "@ui5/webcomponents-icons/dist/education.js";
import "@ui5/webcomponents-icons/dist/switch-views.js";
import "@ui5/webcomponents-icons/dist/org-chart.js";
import "@ui5/webcomponents-icons/dist/compare.js";
import "@ui5/webcomponents-icons/dist/bar-chart.js";
import "@ui5/webcomponents-icons/dist/log.js";
import "@ui5/webcomponents-icons/dist/person-placeholder.js";
import "@ui5/webcomponents-icons/dist/group.js";
import "@ui5/webcomponents-icons/dist/task.js";
import "@ui5/webcomponents-icons/dist/warning.js";
import "@ui5/webcomponents-icons/dist/activities.js";
import "@ui5/webcomponents-icons/dist/wallet.js";
import "@ui5/webcomponents-icons/dist/employee.js";
import "@ui5/webcomponents-icons/dist/document-text.js";

import { HomeDashboard } from "./HomeDashboard";
import { Dashboard } from "./Dashboard";
import { HiringPipeline } from "./HiringPipeline";
import { ReskillingCenter } from "./ReskillingCenter";
import { RedeploymentHub } from "./RedeploymentHub";
import { OrgDesign } from "./OrgDesign";
import { MyTeam } from "./MyTeam";
import { Approvals } from "./Approvals";
import { WorkforceAnalytics } from "./WorkforceAnalytics";
import { TalentHealth } from "./TalentHealth";
import { StrategicDashboard } from "./StrategicDashboard";
import { BoardReport } from "./BoardReport";

const NAV_ITEMS = [
  { key: "home", text: "Home", icon: "home" },
  { key: "my-team", text: "My Team", icon: "group" },
  { key: "agent", text: "Workforce Agent", icon: "ai" },
  { key: "hiring", text: "Hiring Pipeline", icon: "add-employee" },
  { key: "reskilling", text: "Reskilling Center", icon: "education" },
  { key: "redeployment", text: "Redeployment Hub", icon: "switch-views" },
  { key: "approvals", text: "Approvals", icon: "task" },
  { key: "org", text: "Org Design", icon: "org-chart" },
  { key: "scenarios", text: "Scenarios", icon: "compare" },
  { key: "strategic", text: "Strategic", icon: "activities" },
  { key: "talent", text: "Talent Health", icon: "employee" },
  { key: "board-report", text: "Board Report", icon: "document-text" },
  { key: "analytics", text: "Analytics", icon: "bar-chart" },
];

const ROLE_NAV: Record<string, string[]> = {
  employee:  ["home", "agent", "reskilling", "redeployment"],
  manager:   ["home", "my-team", "agent", "hiring", "reskilling", "redeployment", "approvals", "org", "analytics"],
  executive: ["home", "agent", "strategic", "talent", "org", "analytics", "board-report"],
};

const ROLE_BADGE: Record<string, { bg: string; color: string }> = {
  employee: { bg: "#e8f5e9", color: "#2e7d32" },
  manager: { bg: "#e3f2fd", color: "#1565c0" },
  executive: { bg: "#f3e5f5", color: "#6a1b9a" },
};

export function AppShell() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("home");
  const allowedTabs = ROLE_NAV[user?.role || "employee"] || ROLE_NAV.employee;
  const visibleNav = NAV_ITEMS.filter((n) => allowedTabs.includes(n.key));

  const handleNavChange = (e: any) => {
    const item = e.detail?.item;
    const key = item?.dataset?.key;
    if (key) setActiveTab(key);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "home": return <HomeDashboard />;
      case "my-team": return <MyTeam />;
      case "agent": return <Dashboard />;
      case "hiring": return <HiringPipeline />;
      case "reskilling": return <ReskillingCenter />;
      case "redeployment": return <RedeploymentHub />;
      case "approvals": return <Approvals />;
      case "org": return <OrgDesign />;
      case "strategic": return <StrategicDashboard />;
      case "talent": return <TalentHealth />;
      case "board-report": return <BoardReport />;
      case "analytics": return <WorkforceAnalytics />;
      default: return <HomeDashboard />;
    }
  };

  const badge = ROLE_BADGE[user?.role || "employee"];

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
       <ShellBar
        logo={
          <div style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
            <img src="/sap-logo.svg" alt="SAP" style={{ height: "22px", display: "block" }} />
            <span style={{ fontSize: "1.1rem", fontWeight: "600", letterSpacing: "0.01em", whiteSpace: "nowrap" }}>
              Workforce Planning Agent
            </span>
          </div>
        }
        profile={
          <Avatar initials={user?.name?.split(" ").map(n => n[0]).join("") || "U"} size="XS" colorScheme="Accent6" />
        }
        onProfileClick={() => logout()}
      />

      <FlexBox style={{ flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <div style={{ width: "230px", minWidth: "230px", maxWidth: "230px", display: "flex", flexDirection: "column", background: "#ffffff", borderRight: "1px solid #eef2f7", overflow: "hidden" }}>
          {/* User card */}
          <div style={{ padding: "1rem", borderBottom: "1px solid #eef2f7" }}>
            <FlexBox alignItems="Center" style={{ gap: "0.6rem", marginBottom: "0.6rem" }}>
              <Avatar initials={user?.name?.split(" ").map(n => n[0]).join("") || "U"} size="S" colorScheme="Accent6" />
              <div>
                <Text style={{ fontWeight: "600", fontSize: "0.75rem", display: "block", color: "#1a376c" }}>{user?.name}</Text>
                <Text style={{ fontSize: "0.65rem", color: "#7a8ca8" }}>{user?.department}</Text>
              </div>
            </FlexBox>
            <span style={{ fontSize: "0.62rem", padding: "2px 8px", borderRadius: "10px", background: badge.bg, color: badge.color, fontWeight: "600", textTransform: "uppercase" }}>
              {user?.role}
            </span>
          </div>

          {/* Nav */}
          <SideNavigation style={{ flex: 1 }} onSelectionChange={handleNavChange}>
            {visibleNav.map((item) => (
              <SideNavigationItem key={item.key} text={item.text} icon={item.icon} selected={activeTab === item.key} data-key={item.key} />
            ))}
          </SideNavigation>

          {/* Sign out */}
          <div style={{ padding: "0.75rem", borderTop: "1px solid #eef2f7" }}>
            <button
              onClick={() => logout()}
              style={{ width: "100%", padding: "0.5rem 0.75rem", border: "1px solid #f0d4d4", borderRadius: "6px", background: "#fef5f5", cursor: "pointer", fontSize: "0.73rem", color: "#c62828", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}
            >
              <Icon name="log" style={{ fontSize: "0.9rem" }} /> Sign Out
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0, overflow: "auto", padding: "1.25rem", background: "#f7f9fc" }}>
          {renderContent()}
        </div>
      </FlexBox>
    </div>
  );
}
