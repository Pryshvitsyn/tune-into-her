import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { useApp } from '../context/AppContext';
import { purchaseService, type StoreOffer, useMockBilling } from '../services/purchases';
import { colors, radius, spacing } from '../theme';

import { Button } from './Button';

export function PaywallCard({ onUnlocked }: { onUnlocked?(): void }) {
  const { t } = useTranslation();
  const { entitlement, refreshEntitlement } = useApp();
  const [offer, setOffer] = useState<StoreOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState(false);
  const formatPeriod = (period: string) => {
    if (period === 'P1M') return t('paywall.monthly');
    const match = /^P(\d+)([DWMY])$/.exec(period);
    if (!match) return period;
    const unit = { D: 'day', W: 'week', M: 'month', Y: 'year' }[match[2] as 'D' | 'W' | 'M' | 'Y'];
    return t(`paywall.duration.${unit}`, { count: Number(match[1]) });
  };

  const loadOffer = async () => {
    setLoading(true); setError(false);
    try { const value = await purchaseService.getOffer(); setOffer(value); setError(!value); }
    catch { setError(true); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    void purchaseService.getOffer().then((value) => { setOffer(value); setError(!value); }).catch(() => setError(true)).finally(() => setLoading(false));
  }, []);

  const purchase = async () => {
    if (!offer) return;
    setWorking(true);
    try {
      const result = await purchaseService.purchase(offer);
      if (result === 'cancelled') Alert.alert(t('paywall.cancelled'));
      else { await refreshEntitlement(); onUnlocked?.(); }
    } catch { Alert.alert(t('paywall.purchaseError')); }
    finally { setWorking(false); }
  };

  const restore = async () => {
    setWorking(true);
    try {
      const state = await purchaseService.restore();
      await refreshEntitlement();
      Alert.alert(state.isActive ? t('paywall.restored') : t('paywall.nothingToRestore'));
      if (state.isActive) onUnlocked?.();
    } catch { Alert.alert(t('paywall.purchaseError')); }
    finally { setWorking(false); }
  };

  if (entitlement.isActive) return <Button label={t('common.continue')} onPress={onUnlocked} />;
  return (
    <View style={styles.card}>
      {useMockBilling ? <Text style={styles.mock}>{t('paywall.mock')}</Text> : null}
      <Text style={styles.title}>{t('paywall.title')}</Text>
      <Text style={styles.body}>{t('paywall.body')}</Text>
      {loading ? <View style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={styles.meta}>{t('paywall.loading')}</Text></View> : null}
      {error ? <View style={styles.loading}><Text style={styles.meta}>{t('paywall.unavailable')}</Text><Button label={t('common.retry')} variant="secondary" onPress={() => void loadOffer()} /></View> : null}
      {offer ? <>
        {offer.trialEligible && offer.trialDuration ? <Text style={styles.offer}>{t('paywall.trial', { duration: formatPeriod(offer.trialDuration) })}</Text> : null}
        <Text style={styles.price}>{offer.trialEligible ? t('paywall.afterTrial', { price: offer.localizedPrice, period: formatPeriod(offer.billingPeriod) }) : t('paywall.regular', { price: offer.localizedPrice, period: formatPeriod(offer.billingPeriod) })}</Text>
        <Text style={styles.meta}>{t('paywall.automatic')}</Text>
        <Button disabled={working} label={offer.trialEligible ? t('paywall.startTrial') : t('paywall.continue')} onPress={() => void purchase()} />
      </> : null}
      <Button disabled={working} label={t('paywall.restore')} variant="ghost" onPress={() => void restore()} />
      <View style={styles.links}><Pressable onPress={() => router.push('/disclaimer')}><Text style={styles.link}>{t('paywall.terms')}</Text></Pressable><Pressable onPress={() => router.push('/privacy')}><Text style={styles.link}>{t('paywall.privacy')}</Text></Pressable></View>
    </View>
  );
}

const styles = StyleSheet.create({ card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md }, mock: { alignSelf: 'flex-start', color: colors.danger, backgroundColor: '#F8E8E5', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, fontSize: 11, fontWeight: '800' }, title: { color: colors.text, fontSize: 28, lineHeight: 34, fontWeight: '800' }, body: { color: colors.secondary, fontSize: 16, lineHeight: 24 }, loading: { gap: spacing.sm, alignItems: 'center', paddingVertical: spacing.md }, offer: { color: colors.primary, fontSize: 25, fontWeight: '800', textAlign: 'center' }, price: { color: colors.text, fontSize: 16, fontWeight: '600', textAlign: 'center' }, meta: { color: colors.secondary, fontSize: 13, lineHeight: 19, textAlign: 'center' }, links: { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg }, link: { color: colors.primary, textDecorationLine: 'underline' } });
