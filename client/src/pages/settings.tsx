import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Upload, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef } from "react";

export default function SettingsPage() {
  const { toast } = useToast();
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    try {
      const res = await apiRequest("GET", "/api/export");
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `war-inc-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Export complete", description: "Your data has been downloaded." });
    } catch (e: any) {
      toast({ title: "Export failed", description: e.message, variant: "destructive" });
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.roster || !data.lineups) {
        throw new Error("Invalid file format: missing roster or lineups data");
      }

      await apiRequest("POST", "/api/import", {
        roster: data.roster.map((r: any) => ({
          heroId: r.heroId,
          mergeLevel: r.mergeLevel,
          starLevel: r.starLevel,
        })),
        lineups: data.lineups.map((l: any) => ({
          name: l.name,
          mode: l.mode,
          formation: l.formation,
          heroSelections: l.heroSelections,
        })),
      });

      // Invalidate all data queries so the app refreshes
      queryClient.invalidateQueries({ queryKey: ["/api/roster"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lineups"] });

      toast({ title: "Import complete", description: "Your data has been restored." });
    } catch (e: any) {
      toast({ title: "Import failed", description: e.message, variant: "destructive" });
    } finally {
      setImporting(false);
      // Reset file input so the same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="relative rounded-xl overflow-hidden border border-border/30" style={{ background: "linear-gradient(135deg, #161924 0%, #1E2233 50%, #161924 100%)" }}>
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 50% 50%, #D4A843 0%, transparent 70%)" }} />
          <div className="relative p-6 md:p-8">
            <h1 className="text-xl font-bold mb-1" style={{ color: "#D4A843" }}>
              Data Management
            </h1>
            <p className="text-sm text-muted-foreground max-w-lg">
              Export your roster and lineups to a file, or import from a backup. Use this to transfer data between devices.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Export Card */}
          <Card className="border-border/30" style={{ background: "#161924" }}>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(46, 204, 113, 0.15)" }}>
                  <Download className="w-5 h-5" style={{ color: "#2ECC71" }} />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground">Export Data</h2>
                  <p className="text-xs text-muted-foreground">Download your roster and lineups</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Saves all your heroes, merge/star levels, and saved lineups as a JSON file. Keep this as a backup or use it to transfer your data to another device.
              </p>
              <Button
                onClick={handleExport}
                className="w-full"
                style={{ background: "#2ECC71", color: "#000" }}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
            </CardContent>
          </Card>

          {/* Import Card */}
          <Card className="border-border/30" style={{ background: "#161924" }}>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(52, 152, 219, 0.15)" }}>
                  <Upload className="w-5 h-5" style={{ color: "#3498DB" }} />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground">Import Data</h2>
                  <p className="text-xs text-muted-foreground">Restore from a backup file</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Upload a previously exported JSON file to restore your roster and lineups. This will replace your current data.
              </p>
              <div className="space-y-2">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                  variant="outline"
                  disabled={importing}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {importing ? "Importing..." : "Import Data"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="border-border/30" style={{ background: "#161924" }}>
          <CardContent className="p-6">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#D4A843" }} />
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">How Data Transfer Works</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Export creates a JSON file with your roster (heroes, merge levels, star levels) and all saved lineups.</li>
                  <li>Import replaces your current roster and lineups with the data from the file.</li>
                  <li>To move your data to a new device: export on the old device, then import the file on the new one.</li>
                  <li>Hero data is shared across all users and is not included in exports.</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
