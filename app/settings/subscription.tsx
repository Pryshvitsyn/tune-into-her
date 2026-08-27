import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../src/components/Button';
import { Header } from '../../src/components/Header';
import { PaywallCard } from '../../src/components/PaywallCard';
import { Screen } from '../../src/components/Screen';
import { useApp } from '../../src/context/AppContext';
import { purchaseService } from '../../src/services/purchases';
import { colors, radius, spacing } from '../../src/theme';

export default function SubscriptionScreen() {
  const { t } = useTranslation();
  const { entitlement, refreshEntitlement } = useApp();
  const statusKey = entitlement.status === 'active_trial' ? 'activeTrial' : entitlement.status === 'active_paid' ? 'activePaid' : entitlement.status === 'active_ending' ? 'activeEnding' : entitlement.status === 'billing_issue' ? 'billingIssue' : entitlement.status === 'expired' ? 'expired' : entitlement.status === 'loading' ? 'unknown' : 'inactive';
  const restore = async () => { try { const state = await purchaseService.restore(); await refreshEntitlement(); Alert.alert(state.isActive ? t('paywall.restored') : t('paywall.nothingToRestore')); } catch { Alert.alert(t('paywall.purchaseError')); } };
  const manage = async () => { try { await purchaseService.manageSubscription(); } catch { Alert.alert(t('subscription.manageError')); } };
  return <Screen><Header title={t('subscription.title')} />{entitlement.isActive ? <View style={styles.card}><Text style={styles.status}>{t(`subscription.${statusKey}`, { date: entitlement.expirationDate ? new Date(entitlement.expirationDate).toLocaleDateString() : '' })}</Text>{entitlement.isMock ? <Text style={styles.mock}>{t('paywall.mock')}</Text> : null}<Button label={t('subscription.manage')} onPress={() => void manage()} /><Button label={t('subscription.restore')} variant="secondary" onPress={() => void restore()} /></View> : <PaywallCard />}</Screen>;
}
const styles = StyleSheet.create({ card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md }, status: { color: colors.text, fontSize: 24, fontWeight: '800' }, mock: { color: colors.danger, fontSize: 12, fontWeight: '800' } });
