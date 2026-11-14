import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, View } from 'react-native';

import type { SupportedLanguage } from '../config/constants';
import { useApp } from '../context/AppContext';
import { type StoreOffer } from '../services/purchases';
import { spacing, type Palette } from '../theme';
import { typographyForLanguage } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

import { AppText as Text } from './AppText';
import { Button } from './Button';

export function PaywallCard(props: { onUnlocked?(): void }) {
  const { dataScope } = useApp();
  return <ScopedPaywallCard key={dataScope} {...props} />;
}

function ScopedPaywallCard({ onUnlocked }: { onUnlocked?(): void }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { entitlement, appTrial, startAppTrial, refreshEntitlement, preferences, purchases } = useApp();
  const styles = makeStyles(colors, preferences.language);
  const [offers, setOffers] = useState<StoreOffer[]>([]);
  const [selected, setSelected] = useState<'monthly' | 'annual'>('annual');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState(false);
  const locked = useRef(false);
  const mounted = useRef(true);
  const offerRequest = useRef(0);
  const proceed = () => onUnlocked ? onUnlocked() : router.replace('/today');
  const date = (value: string) => new Date(value).toLocaleString(preferences.language === 'mbf' ? 'ms' : preferences.language);
  const source = entitlement.source === 'web' ? 'RevenueCat' : entitlement.source === 'apple' ? 'Apple' : entitlement.source === 'google' ? 'Google Play' : t('common.notSet');

  const loadOffers = useCallback(async () => {
    const request = ++offerRequest.current;
    setLoading(true);
    setError(false);
    // An earlier price must not remain purchasable after a failed reload.
    setOffers([]);
    try {
      const result = await purchases.getOffer();
      if (mounted.current && request === offerRequest.current) {
        setOffers(result);
        setError(result.length === 0);
        setSelected(previous => result.some(offer => offer.plan === previous) ? previous : result[0]?.plan ?? previous);
      }
    } catch { if (mounted.current && request === offerRequest.current) setError(true); }
    finally { if (mounted.current && request === offerRequest.current) setLoading(false); }
  }, [purchases]);
  useEffect(() => {
    mounted.current = true;
    void Promise.resolve().then(loadOffers);
    return () => { mounted.current = false; };
  }, [loadOffers]);

  // A ref closes the gap before React re-renders a disabled button.
  const act = async (action: () => Promise<void>) => {
    if (locked.current) return;
    locked.current = true;
    setWorking(true);
    try { await action(); }
    catch (error) { if (mounted.current) Alert.alert(t(error instanceof Error && error.message === 'WEB_PORTAL_EMAIL_REQUIRED' ? 'billing.webPortalHelp' : 'paywall.purchaseError')); }
    finally { locked.current = false; if (mounted.current) setWorking(false); }
  };
  const buy = async () => {
    const offer = offers.find(item => item.plan === selected);
    if (!offer) return;
    const result = await purchases.purchase(offer);
    if (!mounted.current) return;
    await refreshEntitlement();
    if (!mounted.current) return;
    if (result === 'purchased') proceed();
    if (result === 'already_active') await purchases.manageSubscription();
    if (result === 'pending') Alert.alert(t('billing.pending'));
    // A cancelled native purchase is a normal dismissal.
  };
  const restore = async () => {
    const state = await purchases.restore();
    if (!mounted.current) return;
    await refreshEntitlement();
    if (!mounted.current) return;
    Alert.alert(t(state.isActive ? 'paywall.restored' : 'paywall.nothingToRestore'));
    if (state.isActive && onUnlocked) onUnlocked();
  };
  const begin = async () => {
    const state = await startAppTrial();
    if (!mounted.current) return;
    if (state.isActive) proceed();
    else Alert.alert(t('billing.trialUnavailable'));
  };
  const changeable = entitlement.isActive && entitlement.source === 'google' && Platform.OS === 'android';
  const planChoices = offers.map(offer => <Pressable key={offer.plan} accessibilityRole="radio" accessibilityState={{ checked: selected === offer.plan, disabled: working }} disabled={working} onPress={() => setSelected(offer.plan)} style={[styles.plan, selected === offer.plan && { borderColor: colors.primary }]}>
    <View style={styles.planIdentity}>
      <View style={styles.radio} accessible={false}>
        {selected === offer.plan ? <View style={styles.radioDot} /> : null}
      </View>
      <Text style={styles.planLabel}>{t(`billing.${offer.plan}`)}</Text>
    </View>
    <Text style={[styles.price, styles.planPrice]}>{offer.localizedPrice} / {t(`billing.${offer.plan}`)}</Text>
  </Pressable>);
  const changePlan = async () => {
    const offer = offers.find(item => item.plan === selected);
    if (!offer) return;
    const result = await purchases.changePlan(offer);
    if (!mounted.current) return;
    await refreshEntitlement();
    if (!mounted.current) return;
    if (result === 'pending') Alert.alert(t('billing.pending'));
    else if (result !== 'cancelled') Alert.alert(t('billing.changeTerms'));
  };
  const retry = async () => { await Promise.all([loadOffers(), refreshEntitlement()]); };
  const offeringStatus = <>
    {loading && <ActivityIndicator color={colors.primary} accessibilityLabel={t('paywall.loading')} />}
    {error && <>
      <Text style={styles.meta}>{t('paywall.unavailable')}</Text>
    </>}
    {(error || (!entitlement.isActive && appTrial.status === 'unavailable')) && <Button testID="billing-retry" label={t('common.retry')} disabled={working} variant="secondary" onPress={() => void act(retry)} />}
  </>;
  const status = entitlement.status === 'active_ending' ? 'activeEnding' : entitlement.status === 'billing_issue' ? 'billingIssue' : entitlement.status === 'active_trial' ? 'activeTrial' : 'activePaid';

  return <View style={styles.card}>
    {entitlement.isMock && <Text style={styles.mock}>{t('paywall.mock')}</Text>}
    <Text style={styles.title}>{t('paywall.title')}</Text>
    <Text style={styles.body}>{t('paywall.body')}</Text>
    {entitlement.isActive ? <>
      <Text style={styles.price}>{t(`subscription.${status}`, { date: entitlement.expirationDate ? date(entitlement.expirationDate) : '' })}</Text>
      {entitlement.expirationDate && <Text style={styles.meta}>{t('billing.paidUntil', { date: date(entitlement.expirationDate) })}</Text>}
      <Text style={styles.meta}>{t('billing.source', { source })}</Text>
      {entitlement.verification === 'cached' && <Text style={styles.meta}>{t('billing.cached')}</Text>}
      <Button disabled={working} label={t('subscription.manage')} onPress={() => void act(() => purchases.manageSubscription())} />
      <Text style={styles.meta}>{t('billing.renewal', { source })}</Text>
      {changeable && offeringStatus}
      {changeable && offers.length > 0 && <>
        {planChoices}
        <Text style={styles.meta}>{t('billing.changeTerms')}</Text>
        <Button disabled={working || !offers.some(offer => offer.plan === selected)} label={t('billing.changePlan')} variant="secondary" onPress={() => void act(changePlan)} />
      </>}
      <Button disabled={working} label={t('common.continue')} variant="secondary" onPress={proceed} />
    </> : <>
      <Text style={styles.body}>{t('billing.trialPolicy')}</Text>
      {appTrial.isActive && appTrial.expiresAt ? <>
        <Text style={styles.price}>{t('billing.trialActive', { date: date(appTrial.expiresAt) })}</Text>
        {appTrial.verification === 'cached' && <Text style={styles.meta}>{t('billing.cached')}</Text>}
        <Button disabled={working} label={t('common.continue')} onPress={proceed} />
      </> : appTrial.status === 'expired' ? <Text style={styles.body}>{t('billing.trialExpired')}</Text> : <>
        {appTrial.status === 'unavailable' && <>
          <Text style={styles.meta}>{t('billing.trialUnavailable')}</Text>
        </>}
        <Button testID="billing-start-trial" disabled={working || !preferences.onboardingComplete} label={t('billing.start')} onPress={() => void act(begin)} />
      </>}
      {offeringStatus}
      {planChoices}
      {offers.length > 0 && <>
        <Text style={styles.meta}>{t('billing.chargeNow')}</Text>
        <Text style={styles.meta}>{t('billing.renewal', { source: Platform.OS === 'ios' ? 'Apple' : 'Google Play' })}</Text>
        <Button label={t('paywall.continue')} disabled={working || !offers.some(offer => offer.plan === selected)} onPress={() => void act(buy)} />
      </>}
    </>}
    <Button testID="billing-restore" disabled={working} label={t('paywall.restore')} variant="ghost" onPress={() => void act(restore)} />
    <Text style={styles.meta}>{t('billing.restoreWeb')}</Text>
    <View style={styles.links}>
      <Pressable accessibilityRole="link" style={styles.legalHit} onPress={() => router.push('/terms')}><Text style={styles.link}>{t('paywall.terms')}</Text></Pressable>
      <Pressable accessibilityRole="link" style={styles.legalHit} onPress={() => router.push('/privacy')}><Text style={styles.link}>{t('paywall.privacy')}</Text></Pressable>
    </View>
  </View>;
}
const makeStyles = (colors: Palette, language: SupportedLanguage) => {
  const typography = typographyForLanguage(language);
  return StyleSheet.create({
    card: { alignSelf: 'stretch', backgroundColor: 'transparent', paddingTop: spacing.sm, paddingBottom: spacing.lg, gap: 20 },
    mock: { ...typography, color: colors.danger, fontSize: 12, lineHeight: 18, letterSpacing: 0.5, textAlign: 'center' },
    title: { ...typography, color: colors.text, fontSize: 32, lineHeight: 39, textAlign: 'center', marginBottom: 2 },
    body: { ...typography, color: colors.secondary, fontSize: 17, lineHeight: 25, textAlign: 'center' },
    price: { ...typography, color: colors.text, fontSize: 20, lineHeight: 27, textAlign: 'center' },
    meta: { ...typography, color: colors.secondary, fontSize: 14, lineHeight: 21, textAlign: 'center' },
    plan: { minHeight: 88, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border, paddingVertical: spacing.md, gap: 12, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
    planIdentity: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
    planLabel: { ...typography, color: colors.text, fontSize: 18, lineHeight: 25, flexShrink: 1 },
    planPrice: { flexGrow: 1, flexShrink: 1, flexBasis: 150, textAlign: 'right' },
    radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
    links: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: spacing.lg, rowGap: spacing.xs },
    legalHit: { minHeight: 44, minWidth: 88, maxWidth: '100%', flexShrink: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
    link: { ...typography, color: colors.primary, fontSize: 16, lineHeight: 23, textDecorationLine: 'underline', textAlign: 'center' },
  });
};
