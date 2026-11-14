import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, View } from 'react-native';

import { useApp } from '../context/AppContext';
import { dateOnlyToLocalDate, toDateOnly, type DateOnly } from '../domain/cycle/dateOnly';
import { useTheme } from '../theme/useTheme';

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
  const locale = preferences.language === 'mbf' ? 'ms' : preferences.language === 'zh-Hans' ? 'zh-CN' : preferences.language;
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
    {candidate ? <>
      <DateTimePicker themeVariant={dark ? 'dark' : 'light'} value={candidate} mode="date" display="spinner"
        maximumDate={maximumDate} onChange={(event, selected) => {
          if (Platform.OS === 'android') {
            if (event.type === 'set' && selected) confirm(selected);
            else setCandidate(null);
          } else if (selected) setCandidate(selected);
        }} />
      {Platform.OS !== 'android' ? <View style={{ gap: 4 }}>
        <Button label={t('common.done')} onPress={() => confirm(candidate)} />
        <Button variant="ghost" label={t('common.cancel')} onPress={() => setCandidate(null)} />
      </View> : null}
    </> : null}
  </View>;
}
