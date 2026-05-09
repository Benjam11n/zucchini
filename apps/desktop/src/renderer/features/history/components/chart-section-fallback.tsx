import { Card, CardContent } from "@/renderer/shared/components/ui/card";
import { Spinner } from "@/renderer/shared/components/ui/spinner";

export function ChartSectionFallback() {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 px-6 py-8 text-sm text-muted-foreground">
        <Spinner className="size-4 text-primary/70" />
        Loading chart…
      </CardContent>
    </Card>
  );
}
