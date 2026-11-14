import type { ReactNode } from "react";
import { View } from "react-native";

import { useApp } from "../context/AppContext";
import { dailyReminders } from "../domain/content/dailyGuidance";
import type { LocalizedCue } from "../domain/content/types";
import type { DateOnly } from "../domain/cycle/dateOnly";
import { useInterface } from "../i18n/useInterface";
import { typographyForLanguage } from "../theme/typography";
import { useTheme } from "../theme/useTheme";

import { AppText as Text } from "./AppText";

export function AdviceBlocks({
  advice,
  date,
  sphere,
  presentation,
}: {
  advice: LocalizedCue;
  date: DateOnly;
  sphere?: ReactNode;
  presentation?: "onboarding";
}) {
  const c = useInterface();
  const { preferences } = useApp();
  const { colors } = useTheme();
  const blocks = [
    { title: c.mind, body: advice.context },
    { title: c.support, body: advice.support },
    { title: c.do, body: advice.cue },
  ];
  const reminders = dailyReminders(date, preferences.language);
  const premium = presentation === "onboarding" ? typographyForLanguage(preferences.language) : undefined;
  return (
    <View>
      {blocks.map((b, i) => (
        <View key={b.title}>
          <View style={{ paddingTop: i === 0 ? 4 : 28, paddingBottom: 10 }}>
            <Text
              style={{
                textAlign: "center",
                fontSize: 18,
                lineHeight: 24,
                fontWeight: premium ? "400" : "700",
                fontFamily: premium?.fontFamily,
                color: colors.text,
                marginBottom: 8,
              }}
            >
              {b.title}
            </Text>
            <Text
              style={{
                textAlign: "center",
                fontSize: 16,
                lineHeight: premium ? 24 : 23,
                fontFamily: premium?.fontFamily,
                color: colors.text,
              }}
            >
              {b.body}
            </Text>
          </View>
          <Text
            style={{
              textAlign: "center",
              fontSize: 13,
              lineHeight: premium ? 20 : 19,
              fontFamily: premium?.fontFamily,
              color: colors.secondary,
              marginBottom: i === 0 && sphere ? 8 : 4,
            }}
          >
            ↳ {reminders[i]!.text}
          </Text>
          {i === 0 && sphere ? (
            <View accessible={false} style={{ alignItems: "center", marginVertical: 2 }}>
              {sphere}
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}
