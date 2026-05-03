import { MASCOTS } from "@/renderer/assets/mascots";
import { Button } from "@/renderer/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/renderer/shared/components/ui/card";

import type { getBootErrorDisplay } from "./boot/boot-errors";

export function BootErrorScreen({
  errorDisplay,
  onRetry,
}: {
  errorDisplay: ReturnType<typeof getBootErrorDisplay>;
  onRetry: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center gap-6 px-6 pt-10 pb-0">
          <img
            alt="Sad Zucchini mascot"
            className="size-28 object-contain"
            src={MASCOTS.sad}
          />
        </CardContent>
        <CardHeader className="items-center text-center">
          <CardTitle>{errorDisplay.title}</CardTitle>
          <CardDescription>{errorDisplay.description}</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pt-0 pb-6">
          <Button className="w-full" onClick={onRetry}>
            Retry
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
