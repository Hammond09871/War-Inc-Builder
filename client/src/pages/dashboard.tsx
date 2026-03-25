import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Shield, Swords, Brain, ChevronRight, Zap, Trophy, Target } from "lucide-react";
import { RARITY_POWER_MULTIPLIER } from "@/lib/constants";
import type { Hero, RosterWithHero, Lineup } from "@shared/schema";

export default function Dashboard() {
  const { data: heroes, isLoading: heroesLoading } = useQuery<Hero[]>({
    queryKey: ["/api/heroes"],
  });

  const { data: roster, isLoading: rosterLoading } = useQuery<RosterWithHero[]>({
    queryKey: ["/api/roster"],
  });

  const { data: lineups, isLoading: lineupsLoading } = useQuery<Lineup[]>({
    queryKey: ["/api/lineups"],
  });

  const isLoading = heroesLoading || rosterLoading || lineupsLoading;

  // Calculate roster power
  const rosterPower = roster?.reduce((sum, entry) => {
    const multiplier = RARITY_POWER_MULTIPLIER[entry.hero?.rarity] || 1;
    return sum + (entry.mergeLevel * multiplier * 100) + (entry.starLevel * 50);
  }, 0) || 0;

  const quickLinks = [
    { href: "/heroes", label: "Heroes Database", desc: "Browse all 63 heroes", icon: Users, color: "#3498DB" },
    { href: "/roster", label: "My Roster", desc: "Manage your collection", icon: Shield, color: "#2ECC71" },
    { href: "/builder", label: "Lineup Builder", desc: "Build battle formations", icon: Swords, color: "#D4A843" },
    { href: "/optimizer", label: "Optimizer", desc: "AI-powered lineups", icon: Brain, color: "#9B59B6" },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Hero banner */}
        <div className="relative rounded-xl overflow-hidden border border-border/30" style={{ background: "linear-gradient(135deg, #161924 0%, #1E2233 50%, #161924 100%)" }}>
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 50% 50%, #D4A843 0%, transparent 70%)" }} />
          <div className="relative p-6 md:p-8">
            <h1 className="text-xl font-bold mb-1" style={{ color: "#D4A843" }} data-testid="text-welcome">
              Command Center
            </h1>
            <p className="text-sm text-muted-foreground max-w-lg">
              Build optimized lineups for War Inc Rising. Manage your roster, analyze formations, and dominate the battlefield.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-border/50" style={{ background: "#161924" }}>
            <CardContent className="p-4">
              {isLoading ? (
                <Skeleton className="h-16" />
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(52, 152, 219, 0.15)" }}>
                    <Users className="w-5 h-5" style={{ color: "#3498DB" }} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold" data-testid="text-heroes-owned">{roster?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Heroes Owned</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50" style={{ background: "#161924" }}>
            <CardContent className="p-4">
              {isLoading ? (
                <Skeleton className="h-16" />
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(212, 168, 67, 0.15)" }}>
                    <Trophy className="w-5 h-5" style={{ color: "#D4A843" }} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold" data-testid="text-lineups-saved">{lineups?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Lineups Saved</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50" style={{ background: "#161924" }}>
            <CardContent className="p-4">
              {isLoading ? (
                <Skeleton className="h-16" />
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(155, 89, 182, 0.15)" }}>
                    <Zap className="w-5 h-5" style={{ color: "#9B59B6" }} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold" data-testid="text-roster-power">{rosterPower.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Roster Power</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Quick Access</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.href} href={link.href} className="no-underline" data-testid={`link-${link.label.toLowerCase().replace(/\s/g, "-")}`}>
                  <Card className="border-border/50 hover:border-primary/30 transition-all cursor-pointer group" style={{ background: "#161924" }}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${link.color}15` }}>
                        <Icon className="w-5 h-5" style={{ color: link.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{link.label}</p>
                        <p className="text-xs text-muted-foreground">{link.desc}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent roster heroes */}
        {roster && roster.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Top Roster Heroes</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {roster.slice(0, 5).map((entry) => (
                <Card key={entry.id} className="border-border/50" style={{ background: "#161924" }}>
                  <CardContent className="p-3 text-center">
                    <p className="text-xs font-semibold truncate" data-testid={`text-roster-hero-${entry.id}`}>
                      {entry.hero.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Merge {entry.mergeLevel} · ★{entry.starLevel}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
