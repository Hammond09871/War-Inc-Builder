import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Zap, Save, Brain, Film } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";

interface PaywallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: "optimize" | "save";
}

export function PaywallDialog({ open, onOpenChange, trigger }: PaywallDialogProps) {
  const { toast } = useToast();
  const [upgrading, setUpgrading] = useState(false);
  const [adState, setAdState] = useState<"idle" | "playing" | "complete">("idle");
  const [countdown, setCountdown] = useState(3);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset ad state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setAdState("idle");
      setCountdown(3);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [open]);

  const handleWatchAd = () => {
    setAdState("playing");
    setCountdown(3);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          setAdState("complete");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleClaimReward = async () => {
    try {
      const rewardType = trigger === "optimize" ? "generation" : "save";
      const res = await apiRequest("POST", "/api/reward-ad", { type: rewardType });
      const result = await res.json();
      queryClient.setQueryData(["/api/auth/me"], result);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: rewardType === "generation" ? "Earned 3 bonus generations!" : "Earned 1 bonus save!",
      });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const res = await apiRequest("POST", "/api/upgrade");
      const result = await res.json();
      queryClient.setQueryData(["/api/auth/me"], result);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Upgraded to PRO!", description: "Enjoy unlimited access." });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setUpgrading(false);
    }
  };

  // Ad playing/complete overlay
  if (adState === "playing" || adState === "complete") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xs border-border/50" style={{ background: "#161924" }}>
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            {adState === "playing" ? (
              <>
                <div className="w-16 h-16 rounded-full border-2 flex items-center justify-center" style={{ borderColor: "#D4A843" }}>
                  <span className="text-2xl font-bold" style={{ color: "#D4A843" }}>{countdown}</span>
                </div>
                <p className="text-sm text-muted-foreground">Ad playing...</p>
                <div className="w-48 h-2 rounded-full overflow-hidden" style={{ background: "#1E2233" }}>
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ background: "#D4A843", width: `${((3 - countdown) / 3) * 100}%` }}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(212, 168, 67, 0.15)" }}>
                  <Film className="w-7 h-7" style={{ color: "#D4A843" }} />
                </div>
                <p className="text-sm font-semibold" style={{ color: "#D4A843" }}>Ad complete!</p>
                <Button
                  className="gap-2"
                  onClick={handleClaimReward}
                  style={{ background: "#D4A843", color: "#0F1118" }}
                  data-testid="button-claim-reward"
                >
                  Claim {trigger === "optimize" ? "3 Generations" : "1 Save"}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border/50" style={{ background: "#161924" }}>
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {trigger === "optimize"
              ? "You've used all your free generations!"
              : trigger === "save"
              ? "You've reached your free save limit!"
              : "Unlock the full power of War Inc Rising Lineup Builder."}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Watch Ad option */}
          <div className="rounded-lg border border-border/50 p-4 space-y-3" style={{ background: "#1E2233" }}>
            <div className="flex items-center gap-2">
              <Film className="w-5 h-5 text-muted-foreground" />
              <h3 className="text-xs font-semibold">Watch Ad</h3>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Watch a short video to earn{" "}
              {trigger === "optimize" ? "3 more generations" : "1 more save"}.
            </p>
            <Button
              variant="outline"
              className="w-full text-xs gap-1.5"
              size="sm"
              onClick={handleWatchAd}
              data-testid="button-watch-ad"
            >
              <Film className="w-3.5 h-3.5" />
              Watch Ad
            </Button>
          </div>

          {/* Upgrade to PRO option */}
          <div className="rounded-lg border p-4 space-y-3" style={{ background: "rgba(212, 168, 67, 0.05)", borderColor: "rgba(212, 168, 67, 0.3)" }}>
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5" style={{ color: "#D4A843" }} />
              <h3 className="text-xs font-semibold" style={{ color: "#D4A843" }}>Upgrade to PRO</h3>
            </div>
            <div className="space-y-1">
              {[
                { icon: Brain, label: "Unlimited optimizations" },
                { icon: Save, label: "Unlimited saves" },
                { icon: Zap, label: "No ads" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <Icon className="w-3 h-3" style={{ color: "#D4A843" }} />
                  <span className="text-[10px] text-foreground">{label}</span>
                </div>
              ))}
            </div>
            <Button
              className="w-full text-xs gap-1.5"
              size="sm"
              onClick={handleUpgrade}
              disabled={upgrading}
              style={{ background: "#D4A843", color: "#0F1118" }}
              data-testid="button-upgrade-pro"
            >
              <Crown className="w-3.5 h-3.5" />
              {upgrading ? "Processing..." : "$5.99 — Upgrade"}
            </Button>
          </div>
        </div>

        <button
          onClick={() => onOpenChange(false)}
          className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
        >
          Maybe later
        </button>
      </DialogContent>
    </Dialog>
  );
}
