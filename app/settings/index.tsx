import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Alert, StyleSheet, Text, View } from "react-native";

import { Header } from "../../src/components/Header";
import { Screen } from "../../src/components/Screen";
import { SettingsRow } from "../../src/components/SettingsRow";
import { useApp } from "../../src/context/AppContext";
import { colors, radius, spacing } from "../../src/theme";

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { preferences, entitlement, resetAllData } = useApp();
  const access = entitlement.isActive ? (entitlement.expirationDate ? t(entitlement.isTrial ? "accessV2.trialEnds" : entitlement.willRenew ? "accessV2.renewsOn" : "accessV2.accessUntil", { date: new Date(entitlement.expirationDate).toLocaleDateString() }) : t("accessV2.active")) : t("accessV2.inactive", { defaultValue: "Inactive" });
  const reset = () => Alert.alert(t("settingsV2.resetTitle"), t("settingsV2.resetBody"), [{ text: t("common.cancel"), style: "cancel" }, { text: t("settingsV2.reset"), style: "destructive", onPress: () => void resetAllData().then(() => router.replace("/onboarding")) }]);
  return <Screen><Header title={t("settings.title")} /><Section title={t("settings.cycle")}><SettingsRow label={t("settingsV2.partnerCycle")} onPress={() => router.push("/settings/cycle")} /><SettingsRow label={t("settings.reminder")} value={preferences.reminderEnabled ? t("settings.enabledAt", { time: formatTime(preferences.reminderHour, preferences.reminderMinute) }) : t("settings.disabled")} onPress={() => router.push("/settings/reminder")} /></Section><Section title={t("settings.language")}><SettingsRow label={t("languageNames." + preferences.language)} onPress={() => router.push("/settings/language")} /></Section><Section title={t("accessV2.title")}><SettingsRow label={t("accessV2.title")} value={access} onPress={() => router.push("/settings/subscription")} /></Section><Section title={t("settings.information")}><SettingsRow label={t("accessV2.privacyTitle")} onPress={() => router.push("/privacy")} /><SettingsRow label={t("settingsV2.terms")} onPress={() => router.push("/disclaimer")} /><SettingsRow label={t("settingsV2.about")} onPress={() => router.push("/about")} /><SettingsRow label={t("settingsV2.reset")} onPress={reset} danger /></Section></Screen>;
}
function Section({ title, children }: React.PropsWithChildren<{ title: string }>) { return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text><View style={styles.card}>{children}</View></View>; }
function formatTime(hour: number, minute: number) { return String(hour).padStart(2, "0") + ":" + String(minute).padStart(2, "0"); }
const styles = StyleSheet.create({ section: { marginBottom: spacing.lg }, sectionTitle: { color: colors.secondary, fontSize: 12, fontWeight: "800", letterSpacing: 1.1, textTransform: "uppercase", marginBottom: spacing.sm, marginLeft: spacing.sm }, card: { backgroundColor: colors.card, borderRadius: radius.md, paddingHorizontal: spacing.md, overflow: "hidden" } });
