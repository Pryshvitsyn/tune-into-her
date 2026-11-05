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
  const candidate = demoNotificationCandidate(data);
  if (!candidate || !session || candidate.params.runId !== session.runId) return null;
  if (Number(candidate.params.day) > getDemoProgress(session.startedAt, now).day) return null;
  return candidate;
}

/** Retains a pending tap through a storage retry; the screen validates the run. */
export function demoNotificationCandidate(data: Record<string, unknown> | undefined) {
  if (data?.kind !== 'accelerated-demo' || typeof data.runId !== 'string' || !/^[a-zA-Z0-9_-]{1,120}$/.test(data.runId)) return null;
  const value = data.demoDay;
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;
  const day = Number(value);
  if (!Number.isInteger(day) || day < 1 || day > DEMO_DAY_COUNT) return null;
  // Never navigate to an arbitrary URL supplied by a notification payload.
  return { pathname: '/demo' as const, params: { runId: data.runId, day: String(day) } };
}
