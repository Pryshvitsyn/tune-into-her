import { useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { SupportedLanguage } from '../config/constants';
import { dateOnlyToLocalDate, parseDateOnly, toDateOnly } from '../domain/cycle/dateOnly';
import { localeForLanguage } from '../i18n/locale';
import { spacing } from '../theme';
import { useTheme } from '../theme/useTheme';

import { AppText as Text } from './AppText';
import { Button } from './Button';

/** Android's system picker uses the OS language. This draft-only sheet uses the app language. */
export function AndroidDateTimePicker({ mode, value, maximumDate, language, onConfirm, onCancel }: {
  mode: 'date' | 'time'; value: Date; maximumDate?: Date; language: SupportedLanguage;
  onConfirm(value: Date): void; onCancel(): void;
}) {
  const { t } = useTranslation();
  const settled = useRef(false);
  const locale = localeForLanguage(language);
  const [date, setDate] = useState(() => {
    const selected = toDateOnly(value), maximum = maximumDate ? toDateOnly(maximumDate) : selected;
    return dateOnlyToLocalDate(selected > maximum ? maximum : selected);
  });
  const [hour, setHour] = useState(value.getHours());
  const [minute, setMinute] = useState(value.getMinutes());
  const parts = parseDateOnly(toDateOnly(date));
  const max = maximumDate ? parseDateOnly(toDateOnly(maximumDate)) : { year: 9999, month: 12, day: 31 };
  const maxMonth = parts.year === max.year ? max.month : 12;
  const maxDay = Math.min(new Date(parts.year, parts.month, 0).getDate(),
    parts.year === max.year && parts.month === max.month ? max.day : 31);
  const number = (value: number, padded = false) => new Intl.NumberFormat(locale, {
    useGrouping: false, minimumIntegerDigits: padded ? 2 : 1,
  }).format(value);
  const changeDate = (next: Partial<typeof parts>) => {
    const updated = { ...parts, ...next };
    updated.month = Math.min(updated.month, updated.year === max.year ? max.month : 12);
    updated.day = Math.min(updated.day, new Date(updated.year, updated.month, 0).getDate(),
      updated.year === max.year && updated.month === max.month ? max.day : 31);
    setDate(new Date(updated.year, updated.month - 1, updated.day, 12));
  };
  return <PickerSheet title={t(mode === 'date' ? 'cycle.lastPeriod' : 'onboarding.reminderTime')}
    onCancel={() => { if (!settled.current) { settled.current = true; onCancel(); } }}
    onConfirm={() => {
      if (settled.current) return;
      settled.current = true;
      // Only the time fields are consumed by reminder callers. A stable reference
      // day avoids normalizing a chosen hour through today's DST transition.
      onConfirm(mode === 'date' ? new Date(date) : new Date(2000, 0, 1, hour, minute));
    }}>
    {mode === 'date' ? <>
      <ValueControl id="day" label={t('picker.day')} value={parts.day} text={number(parts.day)} min={1} max={maxDay}
        onChange={day => changeDate({ day })} />
      <ValueControl id="month" label={t('picker.month')} value={parts.month}
        text={date.toLocaleDateString(locale, { month: 'long' })} min={1} max={maxMonth}
        onChange={month => changeDate({ month })} />
      <ValueControl id="year" label={t('picker.year')} value={parts.year} text={number(parts.year)} min={1900} max={max.year}
        onChange={year => changeDate({ year })} />
    </> : <>
      <ValueControl id="hour" label={t('picker.hour')} value={hour} text={number(hour, true)} min={0} max={23} onChange={setHour} />
      <ValueControl id="minute" label={t('picker.minute')} value={minute} text={number(minute, true)} min={0} max={59} onChange={setMinute} />
    </>}
  </PickerSheet>;
}

/** Shared by onboarding and Settings; opening/cancelling does not change the chosen time. */
export function AndroidTimeField({ value, language, onChange }: {
  value: Date; language: SupportedLanguage; onChange(value: Date): void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const label = value.toLocaleTimeString(localeForLanguage(language), { hour: '2-digit', minute: '2-digit', hour12: false });
  return <View>
    <Button testID="android-time-open" variant="secondary" label={label} accessibilityLabel={`${t('onboarding.reminderTime')}: ${label}`}
      onPress={() => setOpen(true)} />
    {open ? <AndroidDateTimePicker mode="time" value={value} language={language} onCancel={() => setOpen(false)}
      onConfirm={selected => { onChange(selected); setOpen(false); }} /> : null}
  </View>;
}

function PickerSheet({ title, children, onConfirm, onCancel }: {
  title: string; children: ReactNode; onConfirm(): void; onCancel(): void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return <Modal transparent animationType="none" visible onRequestClose={onCancel}>
    <View style={[styles.backdrop, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.md }]}>
      <View accessibilityViewIsModal importantForAccessibility="yes" style={[styles.sheet, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text accessibilityRole="header" style={{ color: colors.text, fontSize: 23, lineHeight: 31 }}>{title}</Text>
          {children}
          <Button testID="android-picker-confirm" label={t('common.done')} onPress={onConfirm} />
          <Button testID="android-picker-cancel" variant="ghost" label={t('common.cancel')} onPress={onCancel} />
        </ScrollView>
      </View>
    </View>
  </Modal>;
}

function ValueControl({ id, label, value, text, min, max, onChange }: {
  id: string; label: string; value: number; text: string; min: number; max: number; onChange(value: number): void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return <View style={[styles.row, { borderColor: colors.border }]}>
    <View style={{ flex: 1 }} accessible accessibilityRole="adjustable" accessibilityLabel={label}
      accessibilityValue={{ min, max, now: value, text }} accessibilityActions={[{ name: 'decrement' }, { name: 'increment' }]}
      onAccessibilityAction={event => onChange(Math.max(min, Math.min(max, value + (event.nativeEvent.actionName === 'increment' ? 1 : -1))))}>
      <Text style={{ color: colors.secondary, fontSize: 16, lineHeight: 23 }}>{label}</Text>
      <Text testID={`android-picker-${id}-value`} style={{ color: colors.text, fontSize: 23, lineHeight: 31 }}>{text}</Text>
    </View>
    {([-1, 1] as const).map(direction => {
      const disabled = direction < 0 ? value <= min : value >= max;
      return <Pressable key={direction} testID={`android-picker-${id}-${direction < 0 ? 'decrease' : 'increase'}`}
        disabled={disabled} accessibilityRole="button" accessibilityState={{ disabled }}
        accessibilityLabel={t(direction < 0 ? 'accessibility.decrease' : 'accessibility.increase', { label })}
        onPress={() => onChange(Math.max(min, Math.min(max, value + direction)))}
        style={[styles.control, { borderColor: colors.border, opacity: disabled ? 0.4 : 1 }]}>
        <Text accessible={false} allowFontScaling={false} style={{ color: colors.primary, fontSize: 27 }}>{direction < 0 ? '−' : '+'}</Text>
      </Pressable>;
    })}
  </View>;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(20,34,44,0.3)', paddingHorizontal: spacing.lg },
  sheet: { borderRadius: 24, maxHeight: '100%', overflow: 'hidden' },
  content: { padding: spacing.lg, gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  control: { width: 48, height: 48, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
});
