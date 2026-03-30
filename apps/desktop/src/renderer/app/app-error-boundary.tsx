/**
 * React error boundary for the desktop app.
 *
 * Catches unhandled rendering errors in the main app or focus widget and
 * displays a fallback UI with a reload button. Prevents the entire app
 * from crashing due to unexpected component errors.
 */
import { Component } from "react";
import type { ReactNode } from "react";

import { MASCOTS } from "@/renderer/assets/mascots";
import { Button } from "@/renderer/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/renderer/shared/components/ui/card";

interface AppErrorBoundaryProps {
  children: ReactNode;
  description: string;
  title: string;
  onReload?: () => void;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
    };
  }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return {
      hasError: true,
    };
  }

  override componentDidCatch(error: unknown): void {
    if (!this.state.hasError) {
      return;
    }

    console.error("Renderer error boundary caught an error.", error);
  }

  private handleReload = () => {
    (this.props.onReload ?? (() => window.location.reload()))();
  };

  override render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

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
            <CardTitle>{this.props.title}</CardTitle>
            <CardDescription>{this.props.description}</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pt-0 pb-6">
            <Button className="w-full" onClick={this.handleReload}>
              Reload app
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }
}
