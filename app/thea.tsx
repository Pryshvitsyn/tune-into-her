import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Linking, View } from 'react-native';

import { AppText as Text } from '../src/components/AppText';
import { BrandMark } from "../src/components/BrandMark";
import { Button } from "../src/components/Button";
import { Header } from "../src/components/Header";
import { Screen } from "../src/components/Screen";
import brand from "../src/config/brand.json";
import { useApp } from "../src/context/AppContext";
import copy from "../src/i18n/thea.json";
import { useTheme } from "../src/theme/useTheme";
export default function TheaScreen() {
  const { colors } = useTheme();
  const { preferences } = useApp();
  const { t } = useTranslation();
  const c = copy[preferences.language];
  const body = {
    color: colors.secondary,
    fontSize: 17,
    lineHeight: 27,
    marginBottom: 24,
  };
  const website = (brand as typeof brand & { theaUrl?: string }).theaUrl;
  return (
    <Screen>
      <Header title={c[0]!} />
      <View style={{ alignItems: "center", gap: 16, marginBottom: 30 }}>
        <BrandMark corporate size={60} color={colors.secondary} />
        <Text style={{ color: colors.text, fontSize: 26, letterSpacing: 5 }}>
          THEA
        </Text>
        <Text
          style={{ color: colors.primary, fontSize: 16, textAlign: "center" }}
        >
          Thoughtful Hearts Empower All
        </Text>
      </View>
      <Text style={body}>{c[1]}</Text>
      <Text style={body}>{c[2]}</Text>
      <Text style={{ color: colors.text, fontSize: 22, marginBottom: 18 }}>
        {c[3]}
      </Text>
      <Text style={{ color: colors.text, fontSize: 19 }}>Tune Into Her</Text>
      <Text style={body}>{c[4]}</Text>
      <Text style={{ color: colors.text, fontSize: 19 }}>TRUTHBACK</Text>
      <Text style={body}>{c[5]}</Text>
      {website?.startsWith("https://") ? (
        <>
          <Button
            label={c[6]!}
            onPress={() => void Linking.openURL(website).catch(() => {})}
          />
          <Text style={body}>{c[7]}</Text>
        </>
      ) : null}
      <Button
        label={t("common.back")}
        variant="ghost"
        onPress={() => router.back()}
      />
    </Screen>
  );
}
