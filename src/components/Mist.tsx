import { StyleSheet, View } from "react-native";
import Svg, { Defs, RadialGradient, Stop, Rect } from "react-native-svg";

import { useTheme } from "../theme/useTheme";
export function Mist() {
  const { dark } = useTheme();
  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      accessibilityElementsHidden
    >
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="mist" cx="50%" cy="45%" rx="70%" ry="55%">
            <Stop
              offset="0"
              stopColor={dark ? "#44474F" : "#D8DBE0"}
              stopOpacity=".13"
            />
            <Stop
              offset="1"
              stopColor={dark ? "#101113" : "#FFFFFF"}
              stopOpacity="0"
            />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#mist)" />
      </Svg>
    </View>
  );
}
