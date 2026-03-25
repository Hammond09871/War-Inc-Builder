import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import HeroesDatabase from "@/pages/heroes";
import MyRoster from "@/pages/roster";
import LineupBuilder from "@/pages/builder";
import Optimizer from "@/pages/optimizer";

function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Always dark mode for this gaming app
    document.documentElement.classList.add("dark");
  }, []);
  return <>{children}</>;
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/heroes" component={HeroesDatabase} />
      <Route path="/roster" component={MyRoster} />
      <Route path="/builder" component={LineupBuilder} />
      <Route path="/optimizer" component={Optimizer} />
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
          <Router hook={useHashLocation}>
            <AppRouter />
          </Router>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
