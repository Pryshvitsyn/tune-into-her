import { useTranslation } from "react-i18next";
import { Linking, StyleSheet } from "react-native";

import { AppText as Text } from "../src/components/AppText";
import { Button } from "../src/components/Button";
import { Header } from "../src/components/Header";
import { Screen } from "../src/components/Screen";
import brand from "../src/config/brand.json";
import type { SupportedLanguage } from "../src/config/constants";
import { useApp } from "../src/context/AppContext";
import releaseCopy from "../src/i18n/releaseCopy.json";
import { spacing } from "../src/theme";
import type { Palette } from "../src/theme";
import { typographyForLanguage } from "../src/theme/typography";
import { useTheme } from "../src/theme/useTheme";
export default function PrivacyScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { preferences } = useApp();
  const styles = makeStyles(colors, preferences.language);
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
const makeStyles = (colors: Palette, language: SupportedLanguage) =>
  StyleSheet.create({
    body: {
      ...typographyForLanguage(language),
      fontSize: 17,
      lineHeight: 26,
      color: colors.text,
      marginBottom: spacing.lg,
    },
  });
