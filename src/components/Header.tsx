import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";

import type { SupportedLanguage } from "../config/constants";
import { useApp } from "../context/AppContext";
import { spacing } from "../theme";
import type { Palette } from "../theme";
import { typographyForLanguage } from "../theme/typography";
import { useTheme } from "../theme/useTheme";

import { AppText as Text } from "./AppText";

export function Header({
  title,
  back = true,
  onBack,
}: {
  title: string;
  back?: boolean;
  onBack?: () => void;
}) {
  const { colors } = useTheme();
  const { preferences } = useApp();
  const styles = makeStyles(colors, preferences.language);
  const { t } = useTranslation();
  return (
    <View style={styles.row}>
      {back ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("common.back")}
          hitSlop={10}
          onPress={onBack ?? (() => router.canGoBack() ? router.back() : router.replace("/today"))}
          style={styles.back}
        >
          <Text allowFontScaling={false} style={styles.backText}>‹</Text>
        </Pressable>
      ) : (
        <View style={styles.back} />
      )}
      <Text style={styles.title}>{title}</Text>
      <View style={styles.back} />
    </View>
  );
}

const makeStyles = (colors: Palette, language: SupportedLanguage) =>
  StyleSheet.create({
    row: {
      minHeight: 54,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.lg,
    },
    back: {
      width: 48,
      minHeight: 48,
      alignItems: "center",
      justifyContent: "center",
    },
    backText: { ...typographyForLanguage(language), fontSize: 38, lineHeight: 42, color: colors.primary },
    title: {
      ...typographyForLanguage(language),
      flex: 1,
      textAlign: "center",
      fontSize: 20,
      lineHeight: 27,
      color: colors.text,
    },
  });
