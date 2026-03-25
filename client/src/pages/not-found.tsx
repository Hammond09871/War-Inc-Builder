import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center" style={{ background: "#0F1118" }}>
      <Card className="w-full max-w-md mx-4 border-border/50" style={{ background: "#161924" }}>
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <h1 className="text-xl font-bold">404 — Page Not Found</h1>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            The page you're looking for doesn't exist.
          </p>
          <Link href="/">
            <Button variant="outline" size="sm" className="mt-4" data-testid="button-go-home">
              Return to Command Center
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
