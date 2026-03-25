import { Link, useLocation } from "wouter";
import { Shield, Users, Swords, Brain, Home, Menu, X, Settings, LogOut } from "lucide-react";
import { PerplexityAttribution } from "./PerplexityAttribution";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/heroes", label: "Heroes", icon: Users },
  { href: "/roster", label: "My Roster", icon: Shield },
  { href: "/builder", label: "Builder", icon: Swords },
  { href: "/optimizer", label: "Optimizer", icon: Brain },
  { href: "/settings", label: "Data", icon: Settings },
];

function WarIncLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-label="War Inc Rising Logo" className="shrink-0">
      {/* Shield outline */}
      <path d="M16 2L4 8v8c0 7.18 5.12 13.88 12 16 6.88-2.12 12-8.82 12-16V8L16 2z"
        stroke="#D4A843" strokeWidth="1.5" fill="none"/>
      {/* Inner chevron */}
      <path d="M16 7L8 11v6c0 4.84 3.45 9.35 8 10.78V7z" fill="#D4A843" opacity="0.2"/>
      <path d="M16 7l8 4v6c0 4.84-3.45 9.35-8 10.78V7z" fill="#D4A843" opacity="0.35"/>
      {/* Crosshair center */}
      <circle cx="16" cy="15" r="3" stroke="#D4A843" strokeWidth="1.2" fill="none"/>
      <line x1="16" y1="10" x2="16" y2="13" stroke="#D4A843" strokeWidth="1"/>
      <line x1="16" y1="17" x2="16" y2="20" stroke="#D4A843" strokeWidth="1"/>
      <line x1="11" y1="15" x2="13" y2="15" stroke="#D4A843" strokeWidth="1"/>
      <line x1="19" y1="15" x2="21" y2="15" stroke="#D4A843" strokeWidth="1"/>
    </svg>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0F1118" }}>
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-border/50" style={{ background: "rgba(22, 25, 36, 0.95)", backdropFilter: "blur(12px)" }}>
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 no-underline" data-testid="link-home-logo">
            <WarIncLogo />
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-wide" style={{ color: "#D4A843" }}>
                WAR INC
              </span>
              <span className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
                Rising Builder
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, "-")}`}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors no-underline ${
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop User Info + Mobile Menu Button */}
          <div className="flex items-center gap-2">
            {/* Desktop user display */}
            {user && (
              <div className="hidden md:flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Commander: <span className="font-semibold" style={{ color: "#D4A843" }}>{user.username}</span>
                </span>
                <button
                  onClick={logout}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  title="Logout"
                  data-testid="button-logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/50 px-4 py-2" style={{ background: "rgba(22, 25, 36, 0.98)" }}>
            {navItems.map((item) => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-testid={`mobile-nav-${item.label.toLowerCase().replace(/\s/g, "-")}`}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium no-underline ${
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
            {/* Mobile user info + logout */}
            {user && (
              <div className="border-t border-border/50 mt-2 pt-2">
                <div className="flex items-center justify-between px-3 py-2.5">
                  <span className="text-xs text-muted-foreground">
                    Commander: <span className="font-semibold" style={{ color: "#D4A843" }}>{user.username}</span>
                  </span>
                  <button
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    data-testid="button-mobile-logout"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <PerplexityAttribution />
    </div>
  );
}
