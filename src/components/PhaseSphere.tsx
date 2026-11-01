import { View } from "react-native";

import { useTheme } from "../theme/useTheme";

import { BrandMark } from "./BrandMark";
export function PhaseSphere({ small = false }: { small?: boolean }) {
  const { colors } = useTheme();
  return (
    <View accessible={false} style={{ alignSelf: "center", padding: 24 }}>
      <BrandMark size={small ? 92 : 130} color={colors.primary} />
    </View>
  );
}
