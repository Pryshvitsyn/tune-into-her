import { useTranslation } from "react-i18next";
import { Linking, StyleSheet, View } from "react-native";

import fontLicense from "../assets/fonts/license.generated.json";
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

export default function TermsScreen() {
  const { colors } = useTheme();
  const { preferences } = useApp();
  const styles = makeStyles(colors, preferences.language);
  const { t } = useTranslation();
  const copy = releaseCopy[preferences.language];
  return (
    <Screen>
      <Header title={copy.termsTitle} />
      <Text style={styles.body}>{t("billing.trialPolicy")}</Text>
      <Text style={styles.body}>{t("billing.chargeNow")}</Text>
      <Text style={styles.body}>{t("billing.renewal", { source: "Apple / Google Play / RevenueCat" })}</Text>
      <Text style={styles.body}>{t("disclaimer.body")}</Text>
      {brand.termsUrl ? (
        <Button
          label={copy.openTerms}
          onPress={() => {
            void Linking.openURL(brand.termsUrl);
          }}
        />
      ) : null}
      <View style={styles.fontLicense}>
        <Text selectable accessibilityRole="header" style={styles.licenseTitle}>Linux Libertine O — SIL Open Font License</Text>
        <Text selectable style={styles.licenseText}>{fontLicense.ofl}</Text>
        <Text selectable style={styles.licenseText}>{fontLicense.originalDistributionNotice}</Text>
      </View>
    </Screen>
  );
}
const makeStyles = (colors: Palette, language: SupportedLanguage) =>
  StyleSheet.create({
    fontLicense: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      marginTop: spacing.xl,
      paddingTop: spacing.lg,
      gap: spacing.md,
    },
    licenseTitle: {
      ...typographyForLanguage(language),
      color: colors.text,
      fontSize: 20,
      lineHeight: 27,
    },
    licenseText: {
      ...typographyForLanguage(language),
      color: colors.secondary,
      fontSize: 14,
      lineHeight: 21,
    },
    body: {
      ...typographyForLanguage(language),
      color: colors.text,
      fontSize: 17,
      lineHeight: 26,
      marginBottom: spacing.lg,
    },
  });
