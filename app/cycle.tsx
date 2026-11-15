import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, StyleSheet, View } from 'react-native';

import { AppText as Text } from '../src/components/AppText';
import { Button } from "../src/components/Button";
import { CycleCalendar } from "../src/components/CycleCalendar";
import { CycleDateField } from "../src/components/CycleDateField";
import { Header } from "../src/components/Header";
import { NumberStepper } from "../src/components/NumberStepper";
import { Screen } from "../src/components/Screen";
import { useApp } from "../src/context/AppContext";
import { cycleDraftFromSaved, cycleSettingsFromDraft } from "../src/domain/cycle/cycleDraft";
import { toDateOnly, type DateOnly } from "../src/domain/cycle/dateOnly";
import { useInterface } from "../src/i18n/useInterface";
import { radius } from "../src/theme";
import type { Palette } from "../src/theme";
import { useTheme } from "../src/theme/useTheme";

export default function CycleScreenRoute() {
  const { dataScope } = useApp();
  return <CycleScreen key={dataScope} />;
}

function CycleScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { t } = useTranslation();
  const ui = useInterface();
  const [editing, setEditing] = useState(false);
  const { cycleSettings, setCycleSettings, now } = useApp();
  const initialDraft = cycleDraftFromSaved(cycleSettings);
  const [date, setDate] = useState<DateOnly | null>(initialDraft.lastKnownPeriodStart);
  const [cycleLength, setCycleLength] = useState(initialDraft.typicalCycleLength);
  const [periodLength, setPeriodLength] = useState(initialDraft.typicalPeriodLength);
  const [working, setWorking] = useState(false);
  const busy = useRef(false);
  const edit = () => {
    // Read the latest saved record when opening, including after async startup/save.
    const saved = cycleDraftFromSaved(cycleSettings);
    setDate(saved.lastKnownPeriodStart);
    setCycleLength(saved.typicalCycleLength);
    setPeriodLength(saved.typicalPeriodLength);
    setEditing(true);
  };
  const save = async () => {
    if (busy.current || !date) return;
    busy.current = true;
    setWorking(true);
    try {
      await setCycleSettings(cycleSettingsFromDraft({
        lastKnownPeriodStart: date,
        typicalCycleLength: cycleLength,
        typicalPeriodLength: periodLength,
      }, toDateOnly(now())));
      Alert.alert(t("cycle.saved"));
      setEditing(false);
    } catch {
      Alert.alert(t("cycle.saveError"));
    } finally {
      busy.current = false;
      setWorking(false);
    }
  };
  if (!editing)
    return (
      <Screen compact footer={<Button label={ui.editCycle} onPress={edit} />}>
        <CycleCalendar compact />
      </Screen>
    );
  return (
    <Screen compact
      footer={<Button label={t(working ? "common.loading" : "common.save")} disabled={!date || working} onPress={() => void save()} />}
    >
      <Header title={t("cycle.title")} onBack={() => { if (!working) setEditing(false); }} />
      <Text style={styles.label}>{t("cycle.lastPeriod")}</Text>
      <View style={styles.picker}>
        <CycleDateField value={date} onChange={setDate} maximumDate={now()} disabled={working} />
      </View>
      <View style={styles.gap} />
      <NumberStepper
        label={t("onboarding.cycleLength")}
        value={cycleLength}
        min={15}
        max={90}
        onChange={(value) => {
          setCycleLength(value);
          setPeriodLength((old) => Math.min(old, value - 1));
        }}
      />
      <NumberStepper
        label={t("onboarding.periodLength")}
        value={periodLength}
        min={1}
        max={Math.min(20, cycleLength - 1)}
        onChange={setPeriodLength}
      />
    </Screen>
  );
}
const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    label: {
      color: colors.secondary,
      fontSize: 13,
      fontWeight: '400',
      marginBottom: 4,
    },
    picker: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      padding: 4,
    },
    gap: { height: 8 },
  });
