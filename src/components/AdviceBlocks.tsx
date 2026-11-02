import { useState } from "react";
import { Text, View } from "react-native";

import { useApp } from "../context/AppContext";
import { dailyReminders } from "../domain/content/dailyGuidance";
import type { LocalizedCue } from "../domain/content/types";
import type { DateOnly } from "../domain/cycle/dateOnly";
import { useInterface } from "../i18n/useInterface";
import { useTheme } from "../theme/useTheme";
export function AdviceBlocks({
  advice,
  date,
}: {
  advice: LocalizedCue;
  date: DateOnly;
}) {
  const c = useInterface();
  const { preferences } = useApp();
  const { colors } = useTheme();
  const [heights, setHeights] = useState<Record<string, number>>({});
  const minHeight = Math.max(140, ...Object.values(heights).map(height => height + 40));
  const blocks = [
    { title: c.do, body: advice.cue },
    { title: c.support, body: advice.support },
    { title: c.mind, body: advice.context },
  ];
  const reminders = dailyReminders(date, preferences.language);
  return (
    <View>
      {blocks.map((b, i) => (
        <View key={b.title}>
          <View
            style={{ minHeight, justifyContent: "center", paddingVertical: 20 }}
          >
            <View
              onLayout={(e) => {
                const h = e.nativeEvent.layout.height;
                setHeights((old) =>
                  old[b.title] === h ? old : { ...old, [b.title]: h },
                );
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  fontSize: 21,
                  lineHeight: 29,
                  fontWeight: "700",
                  color: colors.text,
                  marginBottom: 12,
                }}
              >
                {b.title}
              </Text>
              <Text
                style={{
                  textAlign: "center",
                  fontSize: 18,
                  lineHeight: 28,
                  color: colors.text,
                }}
              >
                {b.body}
              </Text>
            </View>
          </View>
          <Text
            style={{
              textAlign: "center",
              fontSize: 14,
              lineHeight: 21,
              color: colors.secondary,
              marginBottom: 22,
            }}
          >
            {reminders[i]!.text}
          </Text>
        </View>
      ))}
    </View>
  );
}
