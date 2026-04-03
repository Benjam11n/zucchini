import { createFocusTimerCoordinator } from "@/main/features/focus/timer-coordinator";

describe("focus timer coordinator", () => {
  describe("claimLeadership", () => {
    it("grants leadership to the first claimant", () => {
      const coordinator = createFocusTimerCoordinator(() => 1000);

      expect(coordinator.claimLeadership("instance-1", 5000)).toBe(true);
    });

    it("denies leadership when another instance holds a valid lease", () => {
      const coordinator = createFocusTimerCoordinator(() => 1000);

      coordinator.claimLeadership("instance-1", 5000);

      expect(coordinator.claimLeadership("instance-2", 5000)).toBe(false);
    });

    it("grants leadership when the previous lease has expired", () => {
      let currentTime = 1000;
      const coordinator = createFocusTimerCoordinator(() => currentTime);

      coordinator.claimLeadership("instance-1", 5000);

      currentTime = 7000;

      expect(coordinator.claimLeadership("instance-2", 5000)).toBe(true);
    });

    it("allows the current leader to renew their lease", () => {
      let currentTime = 1000;
      const coordinator = createFocusTimerCoordinator(() => currentTime);

      coordinator.claimLeadership("instance-1", 5000);

      currentTime = 4000;

      expect(coordinator.claimLeadership("instance-1", 5000)).toBe(true);
    });
  });

  describe("releaseLeadership", () => {
    it("releases leadership when the correct instance releases", () => {
      const coordinator = createFocusTimerCoordinator(() => 1000);

      coordinator.claimLeadership("instance-1", 5000);
      coordinator.releaseLeadership("instance-1");

      expect(coordinator.claimLeadership("instance-2", 5000)).toBe(true);
    });

    it("does nothing when a non-leader instance releases", () => {
      const coordinator = createFocusTimerCoordinator(() => 1000);

      coordinator.claimLeadership("instance-1", 5000);
      coordinator.releaseLeadership("instance-2");

      expect(coordinator.claimLeadership("instance-2", 5000)).toBe(false);
    });
  });

  describe("claimCycleCompletion", () => {
    it("accepts the first claim for a cycle", () => {
      const coordinator = createFocusTimerCoordinator(() => 1000);

      expect(coordinator.claimCycleCompletion("cycle-1")).toBe(true);
    });

    it("rejects a duplicate cycle claim", () => {
      const coordinator = createFocusTimerCoordinator(() => 1000);

      coordinator.claimCycleCompletion("cycle-1");

      expect(coordinator.claimCycleCompletion("cycle-1")).toBe(false);
    });

    it("prunes expired cycle entries after the retention period", () => {
      const oneDay = 24 * 60 * 60 * 1000;
      let currentTime = 1000;
      const coordinator = createFocusTimerCoordinator(() => currentTime);

      coordinator.claimCycleCompletion("cycle-1");

      currentTime += oneDay + 1;

      expect(coordinator.claimCycleCompletion("cycle-1")).toBe(true);
    });

    it("prunes oldest entries when the cycle cache exceeds the max size", () => {
      let currentTime = 0;
      const coordinator = createFocusTimerCoordinator(() => currentTime);

      for (let i = 0; i < 257; i += 1) {
        coordinator.claimCycleCompletion(`cycle-${i}`);
        currentTime += 1000;
      }

      expect(coordinator.claimCycleCompletion("cycle-0")).toBe(true);
    });
  });
});
