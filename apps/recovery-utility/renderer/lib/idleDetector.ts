interface IIdleDetector {
  readonly userState: "active" | "idle" | null;
  readonly screenState: "locked" | "unlocked" | null;
  addEventListener: (event: "change", listener: EventListener) => void;
  start(options?: { threshold: number; signal: AbortSignal }): Promise<void>;
}

const IdleDetector =
  typeof window === "undefined"
    ? undefined
    : ((window as any).IdleDetector as {
        prototype: IIdleDetector;
        new (): IIdleDetector;
        requestPermission(): Promise<"granted" | "denied">;
      });

export const initIdleDetector = async (
  onIdle: VoidFunction,
  idleMinutes: number
) => {
  const abortController = new AbortController();

  try {
    if (!IdleDetector) {
      throw new Error("Idle detection not supported");
    }

    if (typeof idleMinutes !== "number") {
      throw new Error("Idle minutes not set");
    }

    const idleDetector = new IdleDetector();

    idleDetector.addEventListener("change", () => {
      const { userState } = idleDetector;
      const { screenState } = idleDetector;

      // console.info(`Idle change: ${userState}, ${screenState}`);

      if (userState === "idle" || screenState === "locked") {
        onIdle();
      }
    });

    await idleDetector.start({
      threshold: idleMinutes * 60 * 1000, // ms
      signal: abortController.signal,
    });

    // console.info("Started idle detector for", idleMinutes, "minutes");
  } catch (error) {
    console.error(error);
  }

  return abortController;
};
