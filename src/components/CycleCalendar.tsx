import { useState } from "react";
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';


import { useApp } from "../context/AppContext";
import { estimateCycle } from "../domain/cycle/cycleEngine";
import { toDateOnly } from "../domain/cycle/dateOnly";
import { useInterface } from "../i18n/useInterface";
import { useTheme } from "../theme/useTheme";

import { AppText as Text } from './AppText';
export function CycleCalendar({ onEdit }: { onEdit(): void }) {
  const { cycleSettings, preferences } = useApp();
  const { colors } = useTheme();
  const c = useInterface();
  const { width, fontScale } = useWindowDimensions();
  const gridWidth = Math.max(width - 48, (width - 48) * fontScale);
  const [offset, setOffset] = useState(0);
  const now = new Date();
  const month = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const locale =
    preferences.language === "mbf"
      ? "ms"
      : preferences.language === "zh-Hans"
        ? "zh-CN"
        : preferences.language;
  const cells = (() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const monday = (first.getDay() + 6) % 7;
    return Array.from(
      { length: 42 },
      (_, i) => new Date(first.getFullYear(), first.getMonth(), 1 - monday + i),
    );
  })();
  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={c.previousMonth}
          onPress={() => setOffset((n) => n - 1)}
          style={{ padding: 15 }}
        >
          <Text accessible={false} allowFontScaling={false} style={{ color: colors.text, fontSize: 28 }}>‹</Text>
        </Pressable>
        <Text style={{ color: colors.text, fontSize: 20, lineHeight: 28, flex: 1, textAlign: "center" }}>
          {month.toLocaleDateString(locale, { month: "long", year: "numeric" })}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={c.nextMonth}
          onPress={() => setOffset((n) => n + 1)}
          style={{ padding: 15 }}
        >
          <Text accessible={false} allowFontScaling={false} style={{ color: colors.text, fontSize: 28 }}>›</Text>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={fontScale > 1}
        contentContainerStyle={{ minWidth: gridWidth }}>
      <View style={{ width: gridWidth, flexDirection: "row", flexWrap: "wrap" }}>
        {Array.from({ length: 7 }, (_, i) => (
          <Text
            key={i}
            style={{
              width: "14.2857%",
              textAlign: "center",
              color: colors.secondary,
              paddingVertical: 10,
            }}
          >
            {new Date(2026, 10, 2 + i).toLocaleDateString(locale, {
              weekday: "short",
            })}
          </Text>
        ))}
        {cells.map((date) => {
          const key = toDateOnly(date);
          const estimate =
            cycleSettings && key >= cycleSettings.lastKnownPeriodStart
              ? estimateCycle({ ...cycleSettings, currentLocalDate: key })
              : null;
          const phase = estimate && !estimate.requiresPeriodConfirmation
            ? estimate.estimatedPhase
            : null;
          return (
            <View
              key={key}
              style={{
                width: "14.2857%",
                minHeight: 46,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                accessibilityLabel={`${date.toLocaleDateString(locale)}${phase === "menstrual" ? `, ${c.estimatedPeriod}` : ""}`}
                style={{
                  color:
                    date.getMonth() !== month.getMonth()
                      ? colors.secondary
                      : colors.text,
                  textAlign: "center",
                  borderRadius: 18,
                  padding: 9,
                  backgroundColor:
                    phase === "menstrual" ? colors.overlay : "transparent",
                  fontWeight: "400",
                  textDecorationLine: key === toDateOnly(now) ? "underline" : "none",
                }}
              >
                {date.getDate()}
              </Text>
            </View>
          );
        })}
      </View>
      </ScrollView>
      <Text
        style={{
          color: colors.secondary,
          fontSize: 14,
          lineHeight: 22,
          marginVertical: 24,
        }}
      >
        {c.estimatedPeriod} · {c.wellbeing}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={onEdit}
        style={{
          minHeight: 52,
          backgroundColor: colors.primary,
          borderRadius: 26,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ color: colors.background, fontWeight: '400' }}>
          {c.editCycle}
        </Text>
      </Pressable>
    </View>
  );
}
