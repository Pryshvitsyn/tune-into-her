import { usePathname } from "expo-router";
import type { PropsWithChildren, ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { spacing } from "../theme";
import type { Palette } from "../theme";
import { useTheme } from "../theme/useTheme";

import { BottomNav } from "./BottomNav";
import { BrandHeader } from "./BrandHeader";
import { Mist } from "./Mist";

export function Screen({
  children,
  footer,
  scroll = true,
}: PropsWithChildren<{ footer?: ReactNode; scroll?: boolean }>) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const path = usePathname();
  const tabs = ["/today", "/cycle", "/settings"].includes(path);
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <BrandHeader />
      {children}
    </ScrollView>
  ) : (
    <View style={styles.content}>
      <BrandHeader />
      {children}
    </View>
  );
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <Mist />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {content}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
        {tabs ? <BottomNav /> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    content: { flexGrow: 1, padding: spacing.lg },
    footer: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
      gap: spacing.sm,
    },
  });
