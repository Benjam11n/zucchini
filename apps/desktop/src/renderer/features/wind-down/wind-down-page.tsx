import { LazyMotion, domAnimation, m } from "framer-motion";
import { MoonStar } from "lucide-react";

import { WindDownActionForm } from "@/renderer/features/wind-down/components/wind-down-action-form";
import { WindDownActionRows } from "@/renderer/features/wind-down/components/wind-down-action-rows";
import { useWindDownController } from "@/renderer/features/wind-down/hooks/use-wind-down-controller";
import type { WindDownPageActions } from "@/renderer/features/wind-down/wind-down.types";
import { HabitListCard } from "@/renderer/shared/components/ui/habit-list";
import {
  staggerContainerVariants,
  staggerItemVariants,
} from "@/renderer/shared/lib/motion";
import { buildEmptyWindDownState } from "@/shared/domain/wind-down";
import type { TodayState } from "@/shared/read-models/today-state";

interface WindDownPageViewModel {
  state: TodayState;
}

interface WindDownPageProps {
  actions: WindDownPageActions;
  viewModel: WindDownPageViewModel;
}

export function WindDownPage({ actions, viewModel }: WindDownPageProps) {
  const { actions: controllerActions, errorMessage } =
    useWindDownController(actions);
  const { state } = viewModel;
  const windDown = state.windDown ?? buildEmptyWindDownState(state.date);

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        animate="animate"
        className="grid gap-4"
        initial="initial"
        variants={staggerContainerVariants}
      >
        <m.section variants={staggerItemVariants}>
          <HabitListCard
            icon={MoonStar}
            progressLabel={`${windDown.completedCount}/${windDown.totalCount}`}
            progressValue={
              windDown.totalCount > 0
                ? Math.round(
                    (windDown.completedCount / windDown.totalCount) * 100
                  )
                : 0
            }
            title="Wind Down"
          >
            <div className="space-y-4">
              {errorMessage ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/8 px-3 py-2 text-sm text-destructive">
                  {errorMessage}
                </div>
              ) : null}
              <WindDownActionForm
                onCreateAction={controllerActions.windDown.createAction}
              />
              <WindDownActionRows
                actions={windDown.actions}
                onDeleteAction={controllerActions.windDown.deleteAction}
                onRenameAction={controllerActions.windDown.renameAction}
                onToggleAction={controllerActions.windDown.toggleAction}
              />
            </div>
          </HabitListCard>
        </m.section>
      </m.div>
    </LazyMotion>
  );
}
