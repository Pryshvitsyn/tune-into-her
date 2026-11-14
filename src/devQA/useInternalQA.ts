import { useSyncExternalStore } from 'react';

import { internalQASession } from './session';

export function useInternalQASession() {
  return useSyncExternalStore(internalQASession.subscribe, internalQASession.getSnapshot, internalQASession.getSnapshot);
}
