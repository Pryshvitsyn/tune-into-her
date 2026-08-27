import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { Header } from '../../src/components/Header';
import { Screen } from '../../src/components/Screen';
import { SettingsRow } from '../../src/components/SettingsRow';
import { useApp } from '../../src/context/AppContext';
import { colors, radius, spacing } from '../../src/theme';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { preferences, entitlement } = useApp();
  const status = entitlement.isActive ? t(`subscription.${entitlement.status === 'active_trial' ? 'activeTrial' : 'activePaid'}`) : t('subscription.inactive');
  return <Screen><Header title={t('settings.title')} /><Section title={t('settings.cycle')}><SettingsRow label={t('settings.cycleDetails')} onPress={() => router.push('/cycle')} /><SettingsRow label={t('settings.reminder')} value={preferences.reminderEnabled ? t('settings.enabledAt', { time: formatTime(preferences.reminderHour, preferences.reminderMinute) }) : t('settings.disabled')} onPress={() => router.push('/settings/reminder')} /></Section><Section title={t('settings.language')}><SettingsRow label={t(`language.${preferences.language}`)} onPress={() => router.push('/settings/language')} /></Section><Section title={t('settings.subscription')}><SettingsRow label={t('settings.subscription')} value={status} onPress={() => router.push('/settings/subscription')} /></Section><Section title={t('settings.information')}><SettingsRow label={t('settings.privacy')} onPress={() => router.push('/privacy')} /><SettingsRow label={t('settings.disclaimer')} onPress={() => router.push('/disclaimer')} /><SettingsRow label={t('settings.about')} onPress={() => router.push('/about')} /></Section></Screen>;
}

function Section({ title, children }: React.PropsWithChildren<{ title: string }>) { return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text><View style={styles.card}>{children}</View></View>; }
function formatTime(hour: number, minute: number) { return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`; }
const styles = StyleSheet.create({ section: { marginBottom: spacing.lg }, sectionTitle: { color: colors.secondary, fontSize: 12, fontWeight: '800', letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: spacing.sm, marginLeft: spacing.sm }, card: { backgroundColor: colors.card, borderRadius: radius.md, paddingHorizontal: spacing.md, overflow: 'hidden' } });
