/**
 * Focus timer coordinator for the main process.
 *
 * Manages two cross-window concerns that need serialization:
 * 1. **Leadership claims** — TTL-based mutex so only one window instance
 *    owns the running timer at a time.
 * 2. **Cycle completion dedup** — prevents the same Pomodoro cycle from
 *    being recorded twice when multiple windows race.
 *
 * Created once at app startup and shared across all IPC handlers.
 */
export interface FocusTimerCoordinator {
  claimCycleCompletion: (cycleId: string) => boolean;
  claimLeadership: (instanceId: string, ttlMs: number) => boolean;
  releaseLeadership: (instanceId: string) => void;
}

interface FocusTimerLeader {
  expiresAt: number;
  instanceId: string;
}

const COMPLETED_CYCLE_RETENTION_MS = 24 * 60 * 60 * 1000;
const MAX_COMPLETED_CYCLES = 256;

export function createFocusTimerCoordinator(
  now: () => number = () => Date.now()
): FocusTimerCoordinator {
  let leader: FocusTimerLeader | null = null;
  const completedCycles = new Map<string, number>();

  function pruneCompletedCycles(currentTime: number) {
    for (const [cycleId, completedAt] of completedCycles) {
      if (currentTime - completedAt > COMPLETED_CYCLE_RETENTION_MS) {
        completedCycles.delete(cycleId);
      }
    }

    if (completedCycles.size <= MAX_COMPLETED_CYCLES) {
      return;
    }

    const oldestCycles = [...completedCycles.entries()]
      .toSorted((left, right) => left[1] - right[1])
      .slice(0, completedCycles.size - MAX_COMPLETED_CYCLES);

    for (const [cycleId] of oldestCycles) {
      completedCycles.delete(cycleId);
    }
  }

  return {
    claimCycleCompletion(cycleId) {
      const currentTime = now();
      pruneCompletedCycles(currentTime);

      if (completedCycles.has(cycleId)) {
        return false;
      }

      completedCycles.set(cycleId, currentTime);
      return true;
    },
    claimLeadership(instanceId, ttlMs) {
      const currentTime = now();

      if (
        leader &&
        leader.instanceId !== instanceId &&
        leader.expiresAt > currentTime
      ) {
        return false;
      }

      leader = {
        expiresAt: currentTime + ttlMs,
        instanceId,
      };
      return true;
    },
    releaseLeadership(instanceId) {
      if (leader?.instanceId === instanceId) {
        leader = null;
      }
    },
  };
}
