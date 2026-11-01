import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useApp } from "../src/context/AppContext";
import type { Palette } from "../src/theme";
import { useTheme } from "../src/theme/useTheme";

export default function Index() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { ready, preferences, cycleSettings } = useApp();
  if (!ready)
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  return (
    <Redirect
      href={
        preferences.onboardingComplete && cycleSettings
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
