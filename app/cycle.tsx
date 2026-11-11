import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Screen } from "../src/components/Screen";
import { useApp } from "../src/context/AppContext";
import { cycleUpdateDateRange, isValidCycleUpdateDate } from "../src/domain/cycle/cycleUpdateDateRange";
import { toDateOnly } from "../src/domain/cycle/dateOnly";

export default function CycleScreen() {
  const { t } = useTranslation();
  const { cycleSettings, setCycleSettings } = useApp();
  const [choosing, setChoosing] = useState(false);
  const [date, setDate] = useState(new Date());
  const range = cycleUpdateDateRange();
  const returnToToday = () => router.canGoBack() ? router.back() : router.replace("/today");
  const apply = async (value: Date) => {
    if (!cycleSettings || !isValidCycleUpdateDate(value)) return;
    await setCycleSettings({ ...cycleSettings, lastKnownPeriodStart: toDateOnly(value) });
    returnToToday();
  };
  return <Screen scroll={false}><View style={styles.page}>
    <Text style={styles.question}>{t("cycleFlow.title")}</Text>
    <Pressable accessibilityRole="button" style={styles.primary} onPress={() => void apply(new Date())}><Text style={styles.today}>{t("cycleFlow.yesToday")}</Text></Pressable>
    <Pressable accessibilityRole="button" style={styles.action} onPress={() => setChoosing((value) => !value)}><Text style={styles.actionText}>{t("cycleFlow.chooseDate")}</Text></Pressable>
    {choosing ? <View style={styles.picker}><DateTimePicker value={date} mode="date" display="spinner" minimumDate={range.minimumDate} maximumDate={range.maximumDate} onChange={(_, value) => value && setDate(value)} /><Pressable accessibilityRole="button" style={styles.primary} onPress={() => void apply(date)}><Text style={styles.today}>{t("common.save")}</Text></Pressable></View> : null}
    <Pressable accessibilityRole="button" style={styles.notYet} onPress={returnToToday}><Text style={styles.notYetText}>{t("cycleFlow.notYet")}</Text></Pressable>
  </View></Screen>;
}
const styles = StyleSheet.create({ page: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }, question: { color: "#4E6A80", fontSize: 12, lineHeight: 16, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", textAlign: "center", marginBottom: 42 }, primary: { minHeight: 48, minWidth: 150, alignItems: "center", justifyContent: "center" }, today: { color: "#355D7A", fontSize: 16, lineHeight: 21, fontWeight: "600", letterSpacing: 0.2 }, action: { minHeight: 48, alignItems: "center", justifyContent: "center", marginTop: 18 }, actionText: { color: "#597487", fontSize: 13, lineHeight: 18, fontWeight: "600", letterSpacing: 0.45 }, picker: { alignItems: "center", marginTop: 16 }, notYet: { minHeight: 48, alignItems: "center", justifyContent: "center", marginTop: 18 }, notYetText: { color: "#70899B", fontSize: 13, lineHeight: 18, fontWeight: "600", letterSpacing: 0.45 } });
