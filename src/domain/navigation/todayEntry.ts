export type TodayEntry = 'loading' | 'setup' | 'locked' | 'guidance';
/** Warm Home stays on Today; it cannot replace onboarding consent or verified access. */
export function todayEntry(input: { ready: boolean; onboardingComplete: boolean; hasCycleSettings: boolean; hasAccess: boolean }): TodayEntry {
  if (!input.ready) return 'loading';
  if (!input.onboardingComplete || !input.hasCycleSettings) return 'setup';
  return input.hasAccess ? 'guidance' : 'locked';
}
