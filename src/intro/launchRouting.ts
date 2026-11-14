export interface LaunchRouteInput {
  localReady: boolean;
  accessReady: boolean;
  onboardingComplete: boolean;
  hasCycleSettings: boolean;
  pathname: string;
}
/** Presentation readiness only; the existing Today service gate decides paid/trial access. */
export function launchRouteState(input: LaunchRouteInput): 'loading' | 'onboarding' | 'ready' {
  if (!input.localReady) return 'loading';
  const setup = input.onboardingComplete && input.hasCycleSettings;
  if (!setup && ['/today', '/history'].includes(input.pathname)) return 'onboarding';
  if (setup && !input.accessReady) return 'loading';
  if (input.pathname === '/') return 'loading';
  return 'ready';
}

/** Today changes screen shape when verified access changes, even on the same route. */
export function launchDestinationKey(attempt: number, pathname: string, hasAccess: boolean): string {
  return JSON.stringify([attempt, pathname, pathname === '/today' ? hasAccess : null]);
}
