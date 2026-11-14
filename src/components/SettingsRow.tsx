import { Pressable, StyleSheet, View } from 'react-native';


import type { SupportedLanguage } from "../config/constants";
import { spacing } from "../theme";
import type { Palette } from "../theme";
import { useTheme } from "../theme/useTheme";

import { AppText as Text } from './AppText';

export function SettingsRow({
  label,
  value,
  onPress,
  language,
}: {
  label: string;
  value?: string;
  onPress(): void;
  language?: SupportedLanguage;
}) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const selectedLanguage = value === "✓";
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: selectedLanguage ? true : undefined }} onPress={onPress} style={styles.row}>
      <View style={styles.copy}>
        <Text language={language} style={styles.label}>{label}</Text>
        {value ? <Text systemFont={selectedLanguage} accessible={!selectedLanguage} allowFontScaling={!selectedLanguage} style={styles.value}>{value}</Text> : null}
      </View>
      <Text accessible={false} allowFontScaling={false} style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    row: {
      minHeight: 64,
      paddingVertical: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      borderBottomWidth: 0,
      borderBottomColor: colors.border,
    },
    copy: { flex: 1 },
    label: { color: colors.text, fontSize: 18, lineHeight: 26 },
    value: { color: colors.secondary, fontSize: 14, lineHeight: 21, marginTop: 3 },
    chevron: { color: colors.secondary, fontSize: 27 },
  });
