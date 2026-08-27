import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';

import { Button } from '../../src/components/Button';
import { Header } from '../../src/components/Header';
import { Screen } from '../../src/components/Screen';
import { notificationScheduler, useApp } from '../../src/context/AppContext';
import { colors, radius, spacing } from '../../src/theme';

export default function ReminderScreen() {
  const { t } = useTranslation();
  const { preferences, updatePreferences } = useApp();
  const [enabled, setEnabled] = useState(preferences.reminderEnabled);
  const [time, setTime] = useState(() => { const date = new Date(); date.setHours(preferences.reminderHour, preferences.reminderMinute, 0, 0); return date; });
  const [permission, setPermission] = useState('permissionUnknown');
  useEffect(() => { void notificationScheduler.permissionStatus().then((status) => setPermission(status === 'granted' ? 'permissionGranted' : status === 'denied' ? 'permissionDenied' : 'permissionUnknown')); }, []);
  const save = async () => {
    try {
      let nextEnabled = enabled;
      if (enabled) nextEnabled = await notificationScheduler.requestPermission();
      await updatePreferences({ reminderEnabled: nextEnabled, reminderHour: time.getHours(), reminderMinute: time.getMinutes() }, true);
      setEnabled(nextEnabled);
      setPermission(nextEnabled ? 'permissionGranted' : 'permissionDenied');
    } catch { Alert.alert(t('reminder.saveError')); }
  };
  return <Screen footer={<Button label={t('common.save')} onPress={() => void save()} />}><Header title={t('reminder.title')} /><Text style={styles.body}>{t('reminder.description')}</Text><View style={styles.row}><Text style={styles.label}>{t('onboarding.enableReminder')}</Text><Switch value={enabled} onValueChange={setEnabled} trackColor={{ true: colors.sage }} /></View>{enabled ? <View style={styles.picker}><Text style={styles.smallLabel}>{t('onboarding.reminderTime')}</Text><DateTimePicker value={time} mode="time" display="spinner" onChange={(_, value) => value && setTime(value)} /></View> : null}<View style={styles.permission}><Text style={styles.smallLabel}>{t('settings.permission')}</Text><Text style={styles.permissionValue}>{t(`reminder.${permission}`)}</Text>{permission === 'permissionDenied' ? <Text style={styles.help}>{t('reminder.deniedHelp')}</Text> : null}</View></Screen>;
}
const styles = StyleSheet.create({ body: { color: colors.secondary, fontSize: 16, lineHeight: 24, marginBottom: spacing.lg }, row: { minHeight: 64, backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, label: { color: colors.text, fontSize: 17, flex: 1 }, picker: { marginTop: spacing.md, backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md }, smallLabel: { color: colors.secondary, fontSize: 13, fontWeight: '700' }, permission: { marginTop: spacing.lg, padding: spacing.md }, permissionValue: { color: colors.text, fontSize: 17, marginTop: spacing.xs }, help: { color: colors.secondary, fontSize: 13, lineHeight: 19, marginTop: spacing.sm } });
