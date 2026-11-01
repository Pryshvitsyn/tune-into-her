import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, StyleSheet, Text, View } from "react-native";

import { Button } from "../src/components/Button";
import { CycleCalendar } from "../src/components/CycleCalendar";
import { Header } from "../src/components/Header";
import { NumberStepper } from "../src/components/NumberStepper";
import { Screen } from "../src/components/Screen";
import { useApp } from "../src/context/AppContext";
import { dateOnlyToLocalDate, toDateOnly } from "../src/domain/cycle/dateOnly";
import { useInterface } from "../src/i18n/useInterface";
import { radius, spacing } from "../src/theme";
import type { Palette } from "../src/theme";
import { useTheme } from "../src/theme/useTheme";

export default function CycleScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { t } = useTranslation();
  const ui = useInterface();
  const [editing, setEditing] = useState(false);
  const { cycleSettings, setCycleSettings } = useApp();
  const [date, setDate] = useState(
    cycleSettings
      ? dateOnlyToLocalDate(cycleSettings.lastKnownPeriodStart)
      : new Date(),
  );
  const [cycleLength, setCycleLength] = useState(
    cycleSettings?.typicalCycleLength ?? 28,
  );
  const [periodLength, setPeriodLength] = useState(
    cycleSettings?.typicalPeriodLength ?? 5,
  );
  const save = async () => {
    try {
      await setCycleSettings({
        lastKnownPeriodStart: toDateOnly(date),
        typicalCycleLength: cycleLength,
        typicalPeriodLength: periodLength,
      });
      Alert.alert(t("cycle.saved"));
      setEditing(false);
    } catch {
      Alert.alert(t("cycle.saveError"));
    }
  };
  if (!editing)
    return (
      <Screen>
        <Header title={ui.cycle} back={false} />
        <CycleCalendar onEdit={() => setEditing(true)} />
      </Screen>
    );
  return (
    <Screen
      footer={<Button label={t("common.save")} onPress={() => void save()} />}
    >
      <Header title={t("cycle.title")} onBack={() => setEditing(false)} />
      <Text style={styles.label}>{t("cycle.lastPeriod")}</Text>
      <View style={styles.picker}>
        <DateTimePicker
          themeVariant={colors.background === "#FFFFFF" ? "light" : "dark"}
          value={date}
          mode="date"
          display="spinner"
          maximumDate={new Date()}
          onChange={(_, value) => value && setDate(value)}
        />
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
      fontWeight: "700",
      marginBottom: spacing.sm,
    },
    picker: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      padding: spacing.sm,
    },
    gap: { height: spacing.lg },
  });
