import { useTranslation } from "react-i18next";
import { Linking, Text, StyleSheet } from "react-native";

import { Button } from "../src/components/Button";
import { Header } from "../src/components/Header";
import { Screen } from "../src/components/Screen";
import brand from "../src/config/brand.json";
import { useApp } from "../src/context/AppContext";
import releaseCopy from "../src/i18n/releaseCopy.json";
import { spacing } from "../src/theme";
import type { Palette } from "../src/theme";
import { useTheme } from "../src/theme/useTheme";
export default function PrivacyScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { t } = useTranslation();
  const { preferences } = useApp();
  return (
    <Screen>
      <Header title={t("privacy.title")} />
      <Text style={styles.body}>{t("billing.privacyBody")}</Text>
      <Text style={styles.body}>{t("billing.guestLimit")}</Text>
      <Text style={styles.body}>
        {releaseCopy[preferences.language].deleteBody}
      </Text>
      {brand.privacyUrl ? (
        <Button
          label={t("today.learnMore")}
          onPress={() => {
            void Linking.openURL(brand.privacyUrl);
          }}
        />
      ) : null}
    </Screen>
  );
}
const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    body: {
      fontSize: 17,
      lineHeight: 26,
      color: colors.text,
      marginBottom: spacing.lg,
    },
  });
