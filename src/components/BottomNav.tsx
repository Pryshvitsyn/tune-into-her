import { router, usePathname } from "expo-router";
import { Pressable, useWindowDimensions, View } from 'react-native';


import { useInterface } from "../i18n/useInterface";
import { useTheme } from "../theme/useTheme";

import { AppText as Text } from './AppText';
export function BottomNav() {
  const { colors } = useTheme();
  const path = usePathname();
  const c = useInterface();
  const { fontScale } = useWindowDimensions();
  const stacked = fontScale > 1.35;
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: stacked ? "column" : "row",
        paddingBottom: 6,
        backgroundColor: colors.background,
      }}
    >
      {[
        { route: "/today", label: c.advice, icon: "✧" },
        { route: "/cycle", label: c.cycle, icon: "▦" },
        { route: "/settings", label: c.settings, icon: "⚙" },
      ].map((item) => (
        <Pressable
          key={item.route}
          accessibilityRole="tab"
          accessibilityState={{ selected: path === item.route }}
          onPress={() =>
            router.replace(item.route as "/today" | "/cycle" | "/settings")
          }
          style={{
            flex: stacked ? undefined : 1,
            width: stacked ? "100%" : undefined,
            flexDirection: stacked ? "row" : "column",
            minHeight: 60,
            alignItems: "center",
            justifyContent: stacked ? "flex-start" : "center",
            gap: stacked ? 10 : 4,
            paddingHorizontal: stacked ? 12 : 0,
            paddingVertical: stacked ? 8 : 6,
          }}
        >
          <Text systemFont accessible={false} allowFontScaling={false}
            style={{
              fontSize: 25,
              color: path === item.route ? colors.primary : colors.secondary,
            }}
          >
            {item.icon}
          </Text>
          <Text
            style={{
              fontSize: 14, lineHeight: 20,
              flex: stacked ? 1 : undefined,
              flexShrink: stacked ? 1 : undefined,
              textAlign: stacked ? "left" : undefined,
              color: path === item.route ? colors.primary : colors.secondary,
            }}
          >
            {item.label}
          </Text>
          {path === item.route ? (
            <View
              accessible={false}
              style={{
                position: stacked ? "absolute" : "relative",
                left: stacked ? 47 : undefined,
                bottom: stacked ? 2 : undefined,
                height: 3,
                width: 28,
                borderRadius: 3,
                backgroundColor: colors.primary,
              }}
            />
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}
