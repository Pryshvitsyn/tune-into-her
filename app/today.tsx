import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  AppState,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { TuneIntoHerSphereV4 } from "../TuneIntoHerSphereV4";
import { AdviceBlocks } from "../src/components/AdviceBlocks";
import { Button } from "../src/components/Button";
import { FeedbackControl } from "../src/components/FeedbackControl";
import { Screen } from "../src/components/Screen";
import { useApp } from "../src/context/AppContext";
import { getLocalizedCue } from "../src/domain/content/contentRepository";
import { selectDailyCue } from "../src/domain/content/dailyCueService";
import { guidanceDate } from "../src/domain/content/guidanceDate";
import { estimateCycle } from "../src/domain/cycle/cycleEngine";
import { useInterface } from "../src/i18n/useInterface";
import { useMockBilling } from "../src/services/purchases";
import { AsyncSelectionStore } from "../src/storage/AsyncSelectionStore";
import { useTheme } from "../src/theme/useTheme";
const selectionStore = new AsyncSelectionStore();
export default function TodayScreen() {
  const { t } = useTranslation();
  const c = useInterface();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const { cycleSettings, preferences, entitlement } = useApp();
  const [clockDate, setClockDate] = useState(() => guidanceDate(new Date()));
  const today = cycleSettings && cycleSettings.lastKnownPeriodStart > clockDate
    ? guidanceDate(new Date(), cycleSettings.lastKnownPeriodStart)
    : clockDate;
  const [selection, setSelection] = useState<{
    key: string;
    id: string | null;
    failed: boolean;
  } | null>(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const update = () => setClockDate(guidanceDate(new Date()));
    const timer = setInterval(update, 30000);
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") update();
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, []);
  const estimate = useMemo(
    () =>
      cycleSettings
        ? estimateCycle({ ...cycleSettings, currentLocalDate: today })
        : null,
    [cycleSettings, today],
  );
  const guidancePhase = estimate
    ? estimate.requiresPeriodConfirmation ? "unconfirmed" : estimate.estimatedPhase
    : null;
  const selectionKey = JSON.stringify([today, cycleSettings, retry]);
  useEffect(() => {
    let active = true;
    if (cycleSettings && guidancePhase)
      void selectDailyCue({
        date: today,
        phase: guidancePhase,
        settings: cycleSettings,
        store: selectionStore,
      })
        .then((id) => {
          if (active) setSelection({ key: selectionKey, id, failed: false });
        })
        .catch(() => {
          if (active)
            setSelection({ key: selectionKey, id: null, failed: true });
        });
    return () => {
      active = false;
    };
  }, [cycleSettings, guidancePhase, today, retry, selectionKey]);
  useEffect(() => {
    if (!cycleSettings) router.replace("/onboarding");
  }, [cycleSettings]);
  if (!estimate)
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  const current = selection?.key === selectionKey ? selection : null;
  const failed = current?.failed;
  const cue = current?.id
    ? getLocalizedCue(preferences.language, current.id)
    : null;
  const sphereSize = Math.max(216, Math.min(280, width - 56));
  return (
    <Screen>
      {useMockBilling ? (
        <Text
          accessibilityRole="text"
          style={{
            color: colors.danger,
            fontSize: 12,
            fontWeight: "800",
            letterSpacing: 0.4,
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          {t("paywall.mock")}
        </Text>
      ) : null}
      <View style={{ alignItems: "center", marginTop: 12, marginBottom: 28 }}>
        <Text style={{ color: colors.text, fontSize: 18, lineHeight: 24, textAlign: "center", fontWeight: "700" }}>
          {estimate.requiresPeriodConfirmation
            ? c.wellbeing
            : cycleSettings && cycleSettings.typicalCycleLength - estimate.estimatedCycleDay < 5
              ? c.before : c[estimate.estimatedPhase]}
        </Text>
        {estimate.requiresPeriodConfirmation ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/cycle")}
            style={{ minHeight: 36, justifyContent: "center" }}
          >
            <Text style={{ color: colors.primary, textAlign: "center" }}>
              {t("today.update")}
            </Text>
          </Pressable>
        ) : (
          <Text
            style={{ color: colors.secondary, marginTop: 8, textAlign: "center" }}
          >
            {t("today.day", { day: estimate.estimatedCycleDay })} ·{" "}
            {t("today.estimated")}
          </Text>
        )}
      </View>
      {!entitlement.isActive ? (
        <View style={{ gap: 20, paddingVertical: 30 }}>
          <Text
            style={{ color: colors.text, fontSize: 20, textAlign: "center" }}
          >
            {t("today.lockedBody")}
          </Text>
          <Button
            label={t("today.unlock")}
            onPress={() => router.push("/paywall")}
          />
        </View>
      ) : failed ? (
        <Button
          label={t("common.retry", { defaultValue: "Try again" })}
          onPress={() => setRetry((n) => n + 1)}
        />
      ) : cue && current?.id ? (
        <>
          <AdviceBlocks
            advice={cue}
            date={today}
            sphere={<TuneIntoHerSphereV4 size={sphereSize} />}
          />
          <FeedbackControl date={today} cueId={current.id} />
        </>
      ) : (
        <ActivityIndicator color={colors.primary} />
      )}
      {!estimate.requiresPeriodConfirmation ? (
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.push({
              pathname: "/learn/[phase]",
              params: { phase: estimate.estimatedPhase },
            })
          }
          style={{ minHeight: 48, justifyContent: "center" }}
        >
          <Text style={{ textAlign: "center", color: colors.primary }}>
            {t("today.learnMore")} →
          </Text>
        </Pressable>
      ) : null}
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push("/history")}
        style={{ minHeight: 44, justifyContent: "center" }}
      >
        <Text style={{ textAlign: "center", color: colors.secondary, fontSize: 13 }}>
          {c.history}
        </Text>
      </Pressable>
    </Screen>
  );
}
