import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, LogIn, UserPlus } from "lucide-react";

export default function AuthPage() {
  const { login, register } = useAuth();
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        await login(username, password);
      } else {
        await register(username, password);
      }
      setLocation("/");
    } catch (err: any) {
      const msg = err.message || "Authentication failed";
      // Strip HTTP status prefix if present (e.g. "409: ...")
      const cleaned = msg.replace(/^\d+:\s*/, "");
      try {
        const parsed = JSON.parse(cleaned);
        setError(parsed.message || cleaned);
      } catch {
        setError(cleaned);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0F1118" }}>
      <div className="w-full max-w-md space-y-6">
        {/* Logo / Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center border-2" style={{ borderColor: "#D4A843", background: "rgba(212, 168, 67, 0.1)" }}>
              <Shield className="w-8 h-8" style={{ color: "#D4A843" }} />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-wide" style={{ color: "#D4A843" }}>
            WAR INC RISING
          </h1>
          <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground">
            Tactical Lineup Builder
          </p>
        </div>

        {/* Auth Card */}
        <Card className="border-border/30" style={{ background: "#161924" }}>
          <CardContent className="p-6 space-y-5">
            {/* Mode Toggle */}
            <div className="flex rounded-lg overflow-hidden border border-border/50">
              <button
                type="button"
                onClick={() => { setMode("login"); setError(""); }}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  mode === "login"
                    ? "text-black"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                style={mode === "login" ? { background: "#D4A843" } : { background: "transparent" }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode("register"); setError(""); }}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  mode === "register"
                    ? "text-black"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                style={mode === "register" ? { background: "#D4A843" } : { background: "transparent" }}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Callsign
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your callsign"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength={3}
                  autoComplete="username"
                  className="bg-background/50 border-border/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Access Code
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={mode === "register" ? "Min. 6 characters" : "Enter your access code"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className="bg-background/50 border-border/50"
                />
              </div>

              {error && (
                <div className="rounded-md px-3 py-2 text-sm border" style={{ background: "rgba(231, 76, 60, 0.1)", borderColor: "rgba(231, 76, 60, 0.3)", color: "#E74C3C" }}>
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full font-semibold tracking-wide"
                disabled={loading}
                style={{ background: "#D4A843", color: "#000" }}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    {mode === "login" ? "Authenticating..." : "Creating Account..."}
                  </span>
                ) : mode === "login" ? (
                  <span className="flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    ACCESS GRANTED
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    ENLIST NOW
                  </span>
                )}
              </Button>
            </form>

            <p className="text-xs text-center text-muted-foreground">
              {mode === "login"
                ? "Don't have an account? Switch to Create Account above."
                : "Already enlisted? Switch to Sign In above."}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
