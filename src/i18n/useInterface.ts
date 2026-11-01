import { useApp } from "../context/AppContext";

import copy from "./interface.json";
export function useInterface() {
  const { preferences } = useApp();
  return copy[preferences.language];
}
