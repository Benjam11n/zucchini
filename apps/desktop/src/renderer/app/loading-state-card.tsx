import { MASCOTS } from "@/renderer/assets/mascots";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/renderer/shared/components/ui/card";
import { Spinner } from "@/renderer/shared/components/ui/spinner";

interface LoadingStateCardProps {
  description: string;
  fullscreen?: boolean;
  title: string;
}

export function LoadingStateCard({
  description,
  fullscreen = false,
  title,
}: LoadingStateCardProps) {
  return (
    <div
      aria-busy="true"
      className={
        fullscreen
          ? "flex min-h-screen items-center justify-center bg-background px-6 text-foreground"
          : "flex min-h-[320px] items-center justify-center px-6 py-10 text-foreground"
      }
    >
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center gap-6 px-6 pt-10 pb-0">
          <Spinner className="size-8 text-primary/60" />
          <img
            alt="Loading Zucchini mascot"
            className="size-28 object-contain"
            src={MASCOTS.loading}
          />
        </CardContent>
        <CardHeader className="items-center text-center">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
