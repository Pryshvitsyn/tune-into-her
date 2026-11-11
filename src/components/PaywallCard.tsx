import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { TuneIntoHerSphereV4 } from "../../TuneIntoHerSphereV4";
import { useApp } from "../context/AppContext";
import { purchaseService, type StoreOffer, useMockBilling } from "../services/purchases";
import { colors, spacing } from "../theme";

import { Button } from "./Button";

export function PaywallCard({ onUnlocked }: { onUnlocked?(): void }) {
  const { t } = useTranslation();
  const { entitlement, refreshEntitlement } = useApp();
  const { width } = useWindowDimensions();
  const [offer, setOffer] = useState<StoreOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState(false);
  const sphereSize = Math.min(174, Math.max(150, Math.round(width * 0.42)));
  const leavePaywall = onUnlocked ?? (() => router.replace("/today"));

  const loadOffer = async () => {
    setLoading(true);
    setError(false);
    try {
      const value = await purchaseService.getOffer();
      setOffer(value);
      setError(!value);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    void purchaseService.getOffer()
      .then((value) => { if (mounted) { setOffer(value); setError(!value); } })
      .catch(() => { if (mounted) setError(true); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const purchase = async () => {
    if (!offer) return;
    setWorking(true);
    try {
      const result = await purchaseService.purchase(offer);
      if (result === "cancelled") Alert.alert(t("paywallV2.cancelled"));
      else {
        await refreshEntitlement();
        leavePaywall();
      }
    } catch {
      Alert.alert(t("paywallV2.purchaseError"));
    } finally {
      setWorking(false);
    }
  };

  const restore = async () => {
    setWorking(true);
    try {
      const state = await purchaseService.restore();
      await refreshEntitlement();
      Alert.alert(state.isActive ? t("paywallV2.restored") : t("paywallV2.nothingToRestore"));
      if (state.isActive) leavePaywall();
    } catch {
      Alert.alert(t("paywallV2.purchaseError"));
    } finally {
      setWorking(false);
    }
  };

  const price = offer?.localizedPrice ?? "$3.99";
  const canStartTrial = Boolean(offer?.trialEligible && offer.trialDuration === "P14D");

  return <View style={styles.content}>
    <View pointerEvents="none" style={[styles.sphere, { width: sphereSize, height: sphereSize }]}>
      <TuneIntoHerSphereV4 size={sphereSize} />
    </View>
    {useMockBilling ? <Text style={styles.mock}>{t("paywallV2.mock")}</Text> : null}
    <Text style={styles.title}>{t("paywallV2.title")}</Text>
    {canStartTrial ? <Text style={styles.trial}>{t("paywallV2.trial")}</Text> : null}
    <Text style={styles.price}>{t("paywallV2.price", { price })}</Text>
    <Text style={styles.disclosure}>{t("paywallV2.afterTrial", { price })}</Text>
    {loading ? <ActivityIndicator color={colors.primary} /> : null}
    {error ? <Pressable accessibilityRole="button" onPress={() => void loadOffer()}><Text style={styles.retry}>{t("paywallV2.unavailable")}</Text></Pressable> : null}
    {entitlement.isActive ? <Button label={t("paywallV2.continue")} onPress={leavePaywall} /> : <Button disabled={working || !offer} label={canStartTrial ? t("paywallV2.startTrial") : t("paywallV2.buy")} onPress={() => void purchase()} />}
    {!entitlement.isActive ? <Pressable accessibilityRole="button" disabled={working} onPress={() => void restore()} hitSlop={10}><Text style={styles.restore}>{t("paywallV2.restore")}</Text></Pressable> : null}
    <View style={styles.links}>
      <Pressable accessibilityRole="link" onPress={() => router.push("/disclaimer")}><Text style={styles.link}>{t("paywallV2.terms")}</Text></Pressable>
      <Pressable accessibilityRole="link" onPress={() => router.push("/privacy")}><Text style={styles.link}>{t("paywallV2.privacy")}</Text></Pressable>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  content: { flex: 1, width: "100%", alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: 13 },
  sphere: { alignItems: "center", justifyContent: "center", marginBottom: 2 },
  mock: { color: "#7D5865", fontSize: 9, fontWeight: "700", letterSpacing: 0.8, textAlign: "center" },
  title: { color: "#29465D", fontSize: 25, lineHeight: 31, fontWeight: "700", textAlign: "center", marginTop: -2 },
  trial: { color: "#53718A", fontSize: 12, fontWeight: "700", letterSpacing: 0.65, textTransform: "uppercase", textAlign: "center", marginTop: 3 },
  price: { color: "#29465D", fontSize: 19, lineHeight: 24, fontWeight: "700", textAlign: "center", marginTop: 1 },
  disclosure: { maxWidth: 310, color: "#637C90", fontSize: 12, lineHeight: 17, textAlign: "center", marginTop: -5 },
  restore: { color: "#496A84", fontSize: 13, lineHeight: 18, fontWeight: "600", paddingVertical: 4 },
  retry: { color: "#8A5C68", fontSize: 12, lineHeight: 17, textAlign: "center", textDecorationLine: "underline" },
  links: { flexDirection: "row", gap: spacing.lg, marginTop: 2 },
  link: { color: "#61798C", fontSize: 12, textDecorationLine: "underline" },
});
