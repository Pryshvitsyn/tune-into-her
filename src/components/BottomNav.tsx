import { router, usePathname } from "expo-router";
import { Pressable, View } from 'react-native';


import { useInterface } from "../i18n/useInterface";
import { useTheme } from "../theme/useTheme";

import { AppText as Text } from './AppText';
export function BottomNav() {
  const { colors } = useTheme();
  const path = usePathname();
  const c = useInterface();
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: "row",
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
            flex: 1,
            minHeight: 60,
            alignItems: "center",
            justifyContent: "center",
            gap: 4, paddingVertical: 6,
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
              color: path === item.route ? colors.primary : colors.secondary,
            }}
          >
            {item.label}
          </Text>
          {path === item.route ? (
            <View
              style={{
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
