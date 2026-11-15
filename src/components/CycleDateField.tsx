import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, View } from 'react-native';

import { useApp } from '../context/AppContext';
import { dateOnlyToLocalDate, toDateOnly, type DateOnly } from '../domain/cycle/dateOnly';
import { localeForLanguage } from '../i18n/locale';
import { useTheme } from '../theme/useTheme';

import { AndroidDateTimePicker } from './AndroidDateTimePicker';
import { Button } from './Button';

/** The picker candidate is transient until the user explicitly confirms it. */
export function CycleDateField({ value, onChange, maximumDate, disabled = false }: {
  value: DateOnly | null;
  onChange(value: DateOnly): void;
  maximumDate: Date;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const { dark } = useTheme();
  const { preferences } = useApp();
  const [candidate, setCandidate] = useState<Date | null>(null);
  const locale = localeForLanguage(preferences.language);
  const label = value ? dateOnlyToLocalDate(value).toLocaleDateString(locale, {
    day: 'numeric', month: 'long', year: 'numeric',
  }) : t('common.notSet');
  const confirm = (date: Date) => {
    onChange(toDateOnly(date));
    setCandidate(null);
  };
  return <View style={{ alignSelf: 'stretch', gap: 8 }}>
    <Button variant="secondary" label={label} disabled={disabled || candidate !== null}
      accessibilityLabel={`${t('cycle.lastPeriod')}: ${label}`}
      onPress={() => setCandidate(value ? dateOnlyToLocalDate(value) : new Date(maximumDate))} />
    {candidate && Platform.OS === 'android' ? <AndroidDateTimePicker mode="date" value={candidate} maximumDate={maximumDate}
      language={preferences.language} onConfirm={confirm} onCancel={() => setCandidate(null)} /> : null}
    {candidate && Platform.OS !== 'android' ? <>
      <DateTimePicker themeVariant={dark ? 'dark' : 'light'} value={candidate} mode="date" display="spinner"
        locale={Platform.OS === 'ios' ? locale : undefined}
        maximumDate={maximumDate} onChange={(_, selected) => {
          if (selected) setCandidate(selected);
        }} />
      <View style={{ gap: 4 }}>
        <Button label={t('common.done')} onPress={() => confirm(candidate)} />
        <Button variant="ghost" label={t('common.cancel')} onPress={() => setCandidate(null)} />
      </View>
    </> : null}
  </View>;
}
