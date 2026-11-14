import { router } from "expo-router";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  AppState,
  Pressable,
  useWindowDimensions,
  View,
} from 'react-native';


import { TuneIntoHerSphereV4 } from "../TuneIntoHerSphereV4";
import { AdviceBlocks } from "../src/components/AdviceBlocks";
import { AppText as Text } from '../src/components/AppText';
import { Button } from "../src/components/Button";
import { FeedbackControl } from "../src/components/FeedbackControl";
import { Screen } from "../src/components/Screen";
import { useApp } from "../src/context/AppContext";
import { getLocalizedCue } from "../src/domain/content/contentRepository";
import { selectDailyCue } from "../src/domain/content/dailyCueService";
import { dailyReminders as introDailyReminders } from "../src/domain/content/dailyGuidance";
import { cycleToday } from "../src/domain/cycle/cycleToday";
import { todayEntry } from "../src/domain/navigation/todayEntry";
import { useInterface } from "../src/i18n/useInterface";
import { AnimatedToday } from "../src/intro/AnimatedToday";
import { IntroLoading } from "../src/intro/IntroLoading";
import { useLaunchPresentation } from "../src/intro/LaunchPresentation";
import { introDateLabel } from "../src/intro/formatDate";
import { useTheme } from "../src/theme/useTheme";
export default function TodayScreenRoute() {
  const { dataScope } = useApp();
  return <TodayScreen key={dataScope} />;
}

function TodayScreen() {
  const { t } = useTranslation();
  const c = useInterface();
  const { colors, dark } = useTheme();
  const { reportScreenReady, reportScreenNotReady } = useLaunchPresentation();
  const { width } = useWindowDimensions();
  const { ready, cycleSettings, preferences, hasAccess, entitlement, qaActive, dataScope, now, selectionStore } = useApp();
  const entry = todayEntry({ ready, onboardingComplete: preferences.onboardingComplete, hasCycleSettings: Boolean(cycleSettings), hasAccess });
  const guidanceAllowed = entry === 'guidance';
  const [wallClock, setWallClock] = useState(now);
  const clock = useMemo(() => qaActive ? now() : wallClock, [now, qaActive, wallClock]);
  const { localDate, adviceDate: today, estimate, guidanceEstimate } = useMemo(
    () => cycleToday(cycleSettings, clock), [cycleSettings, clock],
  );
  const [selection, setSelection] = useState<{
    key: string;
    id: string | null;
    failed: boolean;
  } | null>(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (qaActive) return;
    const update = () => setWallClock(now());
    const timer = setInterval(update, 30000);
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") update();
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [qaActive, now]);
  const guidancePhase = guidanceEstimate
    ? guidanceEstimate.requiresPeriodConfirmation ? "unconfirmed" : guidanceEstimate.estimatedPhase
    : null;
  const selectionKey = JSON.stringify([dataScope, today, cycleSettings, retry]);
  useEffect(() => {
    let active = true;
    if (guidanceAllowed && cycleSettings && guidancePhase)
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
  }, [guidanceAllowed, cycleSettings, guidancePhase, today, retry, selectionKey, selectionStore]);
  const selectionFailed = selection?.key === selectionKey && selection.failed;
  const selectionPending = guidanceAllowed && Boolean(estimate) && (selection?.key !== selectionKey || (!selection.id && !selection.failed));
  useLayoutEffect(() => {
    if (!ready) return;
    if (!estimate || entry === 'setup') { reportScreenReady('/today'); return; }
    // Midnight/cycle changes can replace the selected day without changing the route.
    if (selectionPending) reportScreenNotReady('/today');
    else if (!hasAccess || selectionFailed) reportScreenReady('/today');
  }, [ready, estimate, entry, hasAccess, selectionFailed, selectionPending, reportScreenReady, reportScreenNotReady]);
  if (!estimate || entry === "setup" || entry === "loading")
    return (
      <Screen>
        {ready ? <View style={{ gap: 20, paddingVertical: 30 }}>
          <Text style={{ color: colors.text, fontSize: 24, lineHeight: 32, textAlign: "center" }}>{c.wellbeing}</Text>
          <Text style={{ color: colors.secondary, fontSize: 17, lineHeight: 25, textAlign: "center" }}>{t("cycle.lastPeriod")}: {cycleSettings?.lastKnownPeriodStart ?? t("common.notSet")}</Text>
          <Text style={{ color: colors.secondary, fontSize: 17, lineHeight: 25, textAlign: "center" }}>{t(cycleSettings ? "onboarding.contextBody" : "onboarding.dateBody")}</Text>
          <Button label={t(preferences.onboardingComplete ? "cycle.title" : "common.continue")} onPress={() => router.push(preferences.onboardingComplete ? "/cycle" : "/onboarding")} />
        </View> : <ActivityIndicator color={colors.primary} />}
      </Screen>
    );
  const current = selection?.key === selectionKey ? selection : null;
  const failed = current?.failed;
  const cue = current?.id
    ? getLocalizedCue(preferences.language, current.id)
    : null;
  const sphereSize = Math.max(216, Math.min(280, width - 56));

  // INTRO_V1: presentation only. Preserve the existing entitlement and cycle gates.
  if (hasAccess && !failed && !cue) return <IntroLoading dark={dark}/>;
  if (hasAccess && cue && current?.id && !failed) {
    const notes = introDailyReminders(today, preferences.language);
    const russian = preferences.language === "ru";
    return <AnimatedToday
      dark={dark}
      dateLine={[
        introDateLabel(localDate, preferences.language),
        estimate.requiresPeriodConfirmation ? "" : t("today.day", { day: estimate.estimatedCycleDay }),
      ].filter(Boolean).join(" · ")}
      phaseTitle={estimate.requiresPeriodConfirmation
        ? c.wellbeing
        : cycleSettings && cycleSettings.typicalCycleLength - estimate.estimatedCycleDay < 5
          ? c.before : c[estimate.estimatedPhase]}
      phaseDescription={t("today.estimated")}
      mind={{label:c.mind,text:cue.context,note:notes[0]?.text ?? ""}}
      support={{label:c.support,text:cue.support,note:notes[1]?.text ?? ""}}
      action={{label:c.do,text:cue.cue,note:notes[2]?.text ?? ""}}
      disclosure={(qaActive || entitlement.isMock) ? t("paywall.mock") : undefined}
      labels={{
        info:russian ? "Больше о фазе" : t("today.learnMore"),
        update:russian ? "Изменить фазу" : t("today.update"),
        settings:t("today.settings",{defaultValue:"Settings"}),
        skip:russian ? "Пропустить заставку" : "Skip intro",
        close:t("common.back",{defaultValue:russian ? "Назад" : "Back"}),
      }}
      onInfo={() => estimate.requiresPeriodConfirmation
        ? router.push("/cycle")
        : router.push({pathname:"/learn/[phase]",params:{phase:estimate.estimatedPhase}})}
      onUpdate={() => router.push("/cycle")}
      onSettings={() => router.dismissTo("/settings")}
      onAbout={() => router.push("/thea")}
    />;
  }
  return (
    <Screen>
      <View style={{ alignItems: "center", marginTop: 12, marginBottom: 28 }}>
        <Text style={{ color: colors.text, fontSize: 18, lineHeight: 24, textAlign: "center", fontWeight: '400' }}>
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
      {!hasAccess ? (
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
          <FeedbackControl key={dataScope} date={today} cueId={current.id} />
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
