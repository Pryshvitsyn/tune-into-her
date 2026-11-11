import { useTranslation } from "react-i18next";
import { Alert, StyleSheet, Text, View } from "react-native";

import { Button } from "../../src/components/Button";
import { Header } from "../../src/components/Header";
import { PaywallCard } from "../../src/components/PaywallCard";
import { Screen } from "../../src/components/Screen";
import { useApp } from "../../src/context/AppContext";
import { purchaseService } from "../../src/services/purchases";
import { colors, radius, spacing } from "../../src/theme";

export default function AccessScreen() {
  const { t } = useTranslation();
  const { entitlement, refreshEntitlement } = useApp();
  const date = entitlement.expirationDate ? new Date(entitlement.expirationDate).toLocaleDateString() : "";
  const status = entitlement.isTrial ? t("accessV2.trialEnds", { date }) : entitlement.willRenew ? t("accessV2.renewsOn", { date }) : t("accessV2.accessUntil", { date });
  const restore = async () => { try { const state = await purchaseService.restore(); await refreshEntitlement(); Alert.alert(state.isActive ? t("paywallV2.restored") : t("paywallV2.nothingToRestore")); } catch { Alert.alert(t("paywallV2.purchaseError")); } };
  const manage = async () => { try { await purchaseService.manageSubscription(); } catch { Alert.alert(t("accessV2.manageError")); } };
  return <Screen><Header title={t("accessV2.title")} />{entitlement.isActive ? <View style={styles.card}><Text style={styles.status}>{status}</Text>{entitlement.isMock ? <Text style={styles.mock}>{t("paywallV2.mock")}</Text> : null}<Button label={t("accessV2.manage")} onPress={() => void manage()} /><Button label={t("accessV2.restore")} variant="secondary" onPress={() => void restore()} /></View> : <PaywallCard />}</Screen>;
}
const styles = StyleSheet.create({ card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md }, status: { color: colors.text, fontSize: 18, fontWeight: "600", textAlign: "center" }, mock: { color: colors.danger, fontSize: 12, fontWeight: "800", textAlign: "center" } });
