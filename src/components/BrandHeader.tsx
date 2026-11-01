import { router } from "expo-router";
import { Pressable, View } from "react-native";

import { useApp } from "../context/AppContext";
import thea from "../i18n/thea.json";
import { useTheme } from "../theme/useTheme";

import { BrandMark } from "./BrandMark";
export function BrandHeader() {
  const { colors } = useTheme();
  const { preferences } = useApp();
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={thea[preferences.language][0]}
        onPress={() => router.push("/thea")}
        style={{ width: 44, height: 44, justifyContent: "center" }}
      >
        <BrandMark corporate size={24} color={colors.secondary} />
      </Pressable>
      <BrandMark color={colors.primary} size={36} />
    </View>
  );
}
