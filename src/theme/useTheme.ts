import { useApp } from "../context/AppContext";

import { colors, darkColors } from "./index";
export function useTheme() {
  const { preferences } = useApp();
  const dark = preferences.theme === "dark";
  return { colors: dark ? darkColors : colors, dark };
}
