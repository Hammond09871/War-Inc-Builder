import { Switch, Route, Router, Redirect } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import HeroesDatabase from "@/pages/heroes";
import MyRoster from "@/pages/roster";
import LineupBuilder from "@/pages/builder";
import Optimizer from "@/pages/optimizer";
import SettingsPage from "@/pages/settings";
import AuthPage from "@/pages/auth";

function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Always dark mode for this gaming app
    document.documentElement.classList.add("dark");
  }, []);
  return <>{children}</>;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0F1118" }}>
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: "#D4A843", borderTopColor: "transparent" }} />
        <p className="text-sm text-muted-foreground tracking-wider uppercase">Loading...</p>
      </div>
    </div>
  );
}

function AppRouter() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <Route><Redirect to="/auth" /></Route>
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/heroes" component={HeroesDatabase} />
      <Route path="/roster" component={MyRoster} />
      <Route path="/builder" component={LineupBuilder} />
      <Route path="/optimizer" component={Optimizer} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/auth"><Redirect to="/" /></Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <Toaster />
          <AuthProvider>
            <Router hook={useHashLocation}>
              <AppRouter />
            </Router>
          </AuthProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
