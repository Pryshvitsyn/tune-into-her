import * as Notifications from 'expo-notifications';
import { router, useRootNavigationState } from 'expo-router';
import { useEffect, useRef } from 'react';

import { acceleratedDemoEnabled } from '../config/acceleratedDemo';
import { useApp } from '../context/AppContext';
import { demoNotificationTarget } from '../domain/navigation/demoNotificationTarget';
import { loadDemoSession } from '../services/notifications/acceleratedDemo';

export function DemoNotificationNavigation() {
  const { ready } = useApp();
  const navigation = useRootNavigationState();
  const response = Notifications.useLastNotificationResponse();
  const handled = useRef<string | null>(null);

  useEffect(() => {
    if (!acceleratedDemoEnabled || !ready || !navigation?.key || !response) return;
    const request = response.notification.request;
    if (request.content.data?.kind !== 'accelerated-demo' || handled.current === request.identifier) return;
    let active = true;
    void loadDemoSession().then(session => {
      if (!active) return;
      const target = demoNotificationTarget(request.content.data, session, Date.now());
      handled.current = request.identifier;
      if (target) router.push(target);
      void Notifications.clearLastNotificationResponseAsync().catch(() => undefined);
    }).catch(() => {
      // The screen provides a visible retry when local storage cannot be read.
      if (active) router.push('/demo');
    });
    return () => { active = false; };
  }, [navigation?.key, ready, response]);

  return null;
}
