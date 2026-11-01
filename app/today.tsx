import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  AppState,
  Pressable,
  Text,
  View,
} from "react-native";

import { AdviceBlocks } from "../src/components/AdviceBlocks";
import { Button } from "../src/components/Button";
import { Screen } from "../src/components/Screen";
import { useApp } from "../src/context/AppContext";
import { getLocalizedCue } from "../src/domain/content/contentRepository";
import { selectDailyCue } from "../src/domain/content/dailyCueService";
import { estimateCycle } from "../src/domain/cycle/cycleEngine";
import { toDateOnly } from "../src/domain/cycle/dateOnly";
import { useInterface } from "../src/i18n/useInterface";
import { AsyncSelectionStore } from "../src/storage/AsyncSelectionStore";
import { useTheme } from "../src/theme/useTheme";
const selectionStore = new AsyncSelectionStore();
export default function TodayScreen() {
  const { t } = useTranslation();
  const c = useInterface();
  const { colors } = useTheme();
  const { cycleSettings, preferences, entitlement } = useApp();
  const [today, setToday] = useState(() => toDateOnly(new Date()));
  const [selection, setSelection] = useState<{
    key: string;
    id: string | null;
    failed: boolean;
  } | null>(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const update = () => setToday(toDateOnly(new Date()));
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
  const selectionKey = JSON.stringify([today, cycleSettings, retry]);
  useEffect(() => {
    let active = true;
    if (cycleSettings && estimate)
      void selectDailyCue({
        date: today,
        phase: estimate.estimatedPhase,
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
  }, [cycleSettings, estimate, today, retry, selectionKey]);
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
  return (
    <Screen>
      <View style={{ alignItems: "center", marginTop: 12, marginBottom: 28 }}>
        <Text
          style={{
            color: colors.text,
            fontSize: 25,
            lineHeight: 34,
            textAlign: "center",
            fontWeight: "600",
          }}
        >
          {cycleSettings && cycleSettings.typicalCycleLength - estimate.estimatedCycleDay < 5
            ? c.before : c[estimate.estimatedPhase]}
        </Text>
        <Text
          style={{ color: colors.secondary, marginTop: 8, textAlign: "center" }}
        >
          {t("today.day", { day: estimate.estimatedCycleDay })} ·{" "}
          {t("today.estimated")}
        </Text>
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
      ) : cue ? (
        <AdviceBlocks physical={cue.cue} date={today} />
      ) : (
        <ActivityIndicator color={colors.primary} />
      )}
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
    </Screen>
  );
}
