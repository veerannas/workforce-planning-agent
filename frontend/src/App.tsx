import { ThemeProvider } from "@ui5/webcomponents-react";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { LoginPage } from "./components/LoginPage";
import { AppShell } from "./components/AppShell";
import "@ui5/webcomponents-react/dist/Assets.js";

function AppContent() {
  const { user } = useAuth();
  return user ? <AppShell /> : <LoginPage />;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
