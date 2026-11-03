import { DEMO_DAY_COUNT, getDemoProgress } from '../demo/acceleratedDemo';

interface DemoNotificationSession {
  runId: string;
  startedAt: number;
}

export function demoNotificationTarget(
  data: Record<string, unknown> | undefined,
  session: DemoNotificationSession | null,
  now: number,
) {
  if (data?.kind !== 'accelerated-demo' || !session || data.runId !== session.runId) return null;
  const value = data.demoDay;
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;
  const day = Number(value);
  if (!Number.isInteger(day) || day < 1 || day > DEMO_DAY_COUNT) return null;
  if (day > getDemoProgress(session.startedAt, now).day) return null;
  // Never navigate to an arbitrary URL supplied by a notification payload.
  return { pathname: '/demo' as const, params: { runId: session.runId, day: String(day) } };
}
