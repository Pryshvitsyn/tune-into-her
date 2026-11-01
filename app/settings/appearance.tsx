import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, Text } from "react-native";

import { Header } from "../../src/components/Header";
import { Screen } from "../../src/components/Screen";
import { useApp } from "../../src/context/AppContext";
import { useInterface } from "../../src/i18n/useInterface";
import { useTheme } from "../../src/theme/useTheme";
export default function AppearanceScreen() {
  const { preferences, updatePreferences } = useApp();
  const { colors } = useTheme();
  const c = useInterface();
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  return (
    <Screen>
      <Header title={c.appearance} />
      {(["light", "dark"] as const).map((theme) => (
        <Pressable
          key={theme}
          accessibilityRole="radio"
          accessibilityState={{
            checked: preferences.theme === theme,
            disabled: busy,
          }}
          disabled={busy}
          onPress={async () => {
            setBusy(true);
            try {
              await updatePreferences({ theme });
            } catch {
              Alert.alert(t("cycle.saveError"));
            } finally {
              setBusy(false);
            }
          }}
          style={{
            padding: 24,
            borderRadius: 20,
            marginBottom: 16,
            backgroundColor: colors.card,
          }}
        >
          <Text style={{ color: colors.text, fontSize: 18 }}>
            {preferences.theme === theme ? "●" : "○"} {c[theme]}
          </Text>
        </Pressable>
      ))}
    </Screen>
  );
}
