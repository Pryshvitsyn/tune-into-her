import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text } from 'react-native';

import { Button } from '../src/components/Button';
import { Header } from '../src/components/Header';
import { Screen } from '../src/components/Screen';
import { useApp } from '../src/context/AppContext';
import { subscribeRedemption, takeRedemption } from '../src/domain/billing/redemptionInbox';
import { purchaseService } from '../src/services/purchases';
import type { RedemptionResult } from '../src/services/purchases/types';
import { useTheme } from '../src/theme/useTheme';

export default function RedeemScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { ready, refreshEntitlement } = useApp();
  const [status, setStatus] = useState<'waiting' | 'working' | 'redeemed' | 'failed'>('failed');
  const job = useRef<Promise<RedemptionResult> | null>(null);
  useEffect(() => {
    let mounted = true;
    let processing = false;
    const consume = async () => {
      if (!ready || processing) return;
      if (!job.current) {
        const url = takeRedemption();
        if (!url) return;
        job.current = purchaseService.redeemWebPurchase(url).then(async result => {
          await refreshEntitlement();
          return result;
        }).catch(() => 'error' as const);
      }
      const current = job.current;
      processing = true;
      if (mounted) setStatus('working');
      const result = await current;
      if (job.current === current) job.current = null;
      processing = false;
      if (mounted) {
        setStatus(result === 'redeemed' ? 'redeemed' : 'failed');
        void consume();
      }
    };
    const stop = subscribeRedemption(() => { void consume(); });
    void consume();
    return () => { mounted = false; stop(); };
  }, [ready, refreshEntitlement]);
  return <Screen>
    <Header title={t('subscription.title')} />
    {(status === 'working' || status === 'waiting') && <ActivityIndicator color={colors.primary} />}
    <Text accessibilityLiveRegion="polite" style={{ color: colors.text, fontSize: 17, lineHeight: 25, marginVertical: 24 }}>
      {t(status === 'redeemed' ? 'billing.redeemed' : status === 'failed' ? 'billing.redemptionFailed' : 'billing.redeemProcessing')}
    </Text>
    <Button label={t('common.continue')} onPress={() => router.replace('/')} />
  </Screen>;
}
