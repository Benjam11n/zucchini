import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface FreezeCardProps {
  availableFreezes: number;
}

export function FreezeCard({ availableFreezes }: FreezeCardProps) {
  return (
    <Card className="rounded-[2rem] shadow-sm">
      <CardHeader className="pb-0">
        <CardDescription className="text-xs font-medium tracking-[0.24em] uppercase">
          Freezes
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <CardTitle className="text-4xl font-semibold tracking-tight">
          {availableFreezes}
        </CardTitle>
        <p className="mt-2 text-sm text-muted-foreground">
          Earn +1 every 15 streak days
        </p>
      </CardContent>
    </Card>
  );
}
