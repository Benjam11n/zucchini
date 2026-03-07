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
    <Card>
      <CardHeader className="pb-0">
        <CardDescription>Freezes</CardDescription>
      </CardHeader>
      <CardContent>
        <CardTitle>{availableFreezes}</CardTitle>
        <p className="mt-2 text-sm text-muted-foreground">
          Earn +1 every 15 streak days
        </p>
      </CardContent>
    </Card>
  );
}
