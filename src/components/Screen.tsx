import { useRoute } from "expo-router";
import type { PropsWithChildren, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useApp } from "../context/AppContext";
import { ScreenNavigationContext } from "../navigation/ScreenNavigationContext";
import { navigationForRoute } from "../navigation/screenNavigation";
import { spacing } from "../theme";
import type { Palette } from "../theme";
import { useTheme } from "../theme/useTheme";

import { AppText } from "./AppText";
import { BottomNav } from "./BottomNav";
import { BrandHeader } from "./BrandHeader";
import { Mist } from "./Mist";
import { SecondaryNav } from "./SecondaryNav";

export function Screen({
  children,
  footer,
  scroll = true,
}: PropsWithChildren<{ footer?: ReactNode; scroll?: boolean }>) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const route = useRoute();
  const navigation = navigationForRoute(route.name);
  const { qaActive } = useApp();
  const { t } = useTranslation();
  const disclosure = qaActive ? <AppText style={{ color: colors.danger, fontSize: 13, lineHeight: 19, textAlign: "center", marginBottom: 12 }}>{t("paywall.mock")}</AppText> : null;
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <BrandHeader />
      {disclosure}
      {children}
    </ScrollView>
  ) : (
    <View style={styles.content}>
      <BrandHeader />
      {disclosure}
      {children}
    </View>
  );
  return (
    <ScreenNavigationContext.Provider value={navigation}><SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <Mist />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {content}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
        {navigation === "primary" ? <BottomNav ownerPath={'/' + route.name.replace(/\/index$/, '')} /> : navigation === "secondary" ? <SecondaryNav /> : null}
      </KeyboardAvoidingView>
    </SafeAreaView></ScreenNavigationContext.Provider>
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
