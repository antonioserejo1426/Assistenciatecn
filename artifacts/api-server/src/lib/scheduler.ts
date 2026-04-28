import { logger } from "./logger";

export interface DailyJob {
  name: string;
  hourUtc: number;
  minuteUtc: number;
  run: () => Promise<unknown>;
}

function msUntilNext(hourUtc: number, minuteUtc: number): number {
  const now = new Date();
  const next = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      hourUtc,
      minuteUtc,
      0,
      0,
    ),
  );
  if (next.getTime() <= now.getTime()) {
    next.setUTCDate(next.getUTCDate() + 1);
  }
  return next.getTime() - now.getTime();
}

export function scheduleDaily(job: DailyJob): { stop: () => void } {
  let timer: NodeJS.Timeout | null = null;
  let stopped = false;

  const tick = async () => {
    if (stopped) return;
    try {
      logger.info({ job: job.name }, "scheduler executando job diario");
      await job.run();
    } catch (err) {
      logger.error({ err, job: job.name }, "job diario falhou");
    } finally {
      schedule();
    }
  };

  const schedule = () => {
    if (stopped) return;
    const delay = msUntilNext(job.hourUtc, job.minuteUtc);
    timer = setTimeout(tick, delay);
    logger.info(
      { job: job.name, nextRunMs: delay, nextRunISO: new Date(Date.now() + delay).toISOString() },
      "proximo job agendado",
    );
  };

  schedule();

  return {
    stop: () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    },
  };
}
