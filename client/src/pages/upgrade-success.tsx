import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/AppLayout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Crown, CheckCircle } from "lucide-react";

export default function UpgradeSuccess() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.split("?")[1] || "");
    const sessionId = params.get("session_id");

    if (!sessionId) {
      setStatus("error");
      setErrorMsg("No payment session found.");
      return;
    }

    apiRequest("POST", "/api/verify-payment", { sessionId })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || "Verification failed");
        }
        return res.json();
      })
      .then((data) => {
        queryClient.setQueryData(["/api/auth/me"], data);
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        setStatus("success");
        setTimeout(() => navigate("/"), 3000);
      })
      .catch((err) => {
        setStatus("error");
        setErrorMsg(err.message || "Could not verify payment.");
      });
  }, [navigate]);

  return (
    <AppLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-6 max-w-sm">
          {status === "verifying" && (
            <>
              <div className="w-16 h-16 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: "#D4A843", borderTopColor: "transparent" }} />
              <p className="text-sm text-muted-foreground">Verifying your payment...</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center" style={{ background: "rgba(212, 168, 67, 0.15)" }}>
                <Crown className="w-10 h-10" style={{ color: "#D4A843" }} />
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ color: "#D4A843" }}>Welcome to PRO!</h1>
                <p className="text-sm text-muted-foreground mt-2">Unlimited generations, unlimited saves, no ads.</p>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                Payment confirmed — redirecting to dashboard...
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center" style={{ background: "rgba(239, 68, 68, 0.15)" }}>
                <Crown className="w-10 h-10 text-red-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-red-400">Verification Failed</h1>
                <p className="text-sm text-muted-foreground mt-2">{errorMsg}</p>
                <p className="text-xs text-muted-foreground mt-1">If you were charged, please contact support.</p>
              </div>
              <button
                onClick={() => navigate("/")}
                className="text-xs underline text-muted-foreground hover:text-foreground"
              >
                Return to dashboard
              </button>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
