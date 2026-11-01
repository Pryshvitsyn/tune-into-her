import { Pressable, StyleSheet, Text, View } from "react-native";

import { spacing } from "../theme";
import type { Palette } from "../theme";
import { useTheme } from "../theme/useTheme";

export function SettingsRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value?: string;
  onPress(): void;
}) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.row}>
      <View style={styles.copy}>
        <Text style={styles.label}>{label}</Text>
        {value ? <Text style={styles.value}>{value}</Text> : null}
      </View>
      <Text style={styles.chevron}>›</Text>
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
    label: { color: colors.text, fontSize: 17 },
    value: { color: colors.secondary, fontSize: 13, marginTop: 3 },
    chevron: { color: colors.secondary, fontSize: 27 },
  });
