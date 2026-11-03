import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useApp } from "../src/context/AppContext";
import { acceleratedDemoEnabled } from "../src/config/acceleratedDemo";
import { getDemoProgress } from "../src/domain/demo/acceleratedDemo";
import { loadDemoSession } from "../src/services/notifications/acceleratedDemo";
import type { Palette } from "../src/theme";
import { useTheme } from "../src/theme/useTheme";

export default function Index() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { ready, preferences, cycleSettings } = useApp();
  const [demoState, setDemoState] = useState<'loading' | 'active' | 'empty' | 'failed'>(acceleratedDemoEnabled ? 'loading' : 'empty');
  useEffect(() => {
    if (!acceleratedDemoEnabled) return;
    let active = true;
    void loadDemoSession().then(session => {
      if (active) setDemoState(session && !getDemoProgress(session.startedAt, Date.now()).completed ? 'active' : 'empty');
    }).catch(() => { if (active) setDemoState('failed'); });
    return () => { active = false; };
  }, []);
  if (!ready || demoState === 'loading')
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  return (
    <Redirect
      href={
        acceleratedDemoEnabled && (!preferences.onboardingComplete || demoState === 'active' || demoState === 'failed')
          ? '/demo'
          : preferences.onboardingComplete && cycleSettings
          ? "/today"
          : "/onboarding"
      }
    />
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    loading: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.background,
    },
  });
