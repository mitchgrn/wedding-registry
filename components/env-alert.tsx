import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function EnvAlert() {
  return (
    <Card className="border-warning/20 bg-warning/5">
      <CardHeader>
        <CardTitle className="text-xl">Setup required</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>Add the Supabase and Google env vars from the README before using the live registry.</p>
        <p>
          The UI is ready, but item data, reservations, admin access, and price refresh require a configured
          backend.
        </p>
      </CardContent>
    </Card>
  );
}
