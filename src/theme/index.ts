export const colors = {
  background: "#FFFFFF",
  text: "#17191B",
  secondary: "#626965",
  card: "#F3F3F5",
  primary: "#216A50",
  sage: "#7D9185",
  lavender: "#9B93AA",
  sand: "#D4C3A4",
  rose: "#B98684",
  border: "#DDD9D0",
  danger: "#9A4E49",
  overlay: "#EBECEF",
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;
export const radius = { sm: 10, md: 18, lg: 28, pill: 999 } as const;

export type Palette = typeof colors;
export const darkColors: Palette = {
  ...colors,
  background: "#101113",
  text: "#F2F3F5",
  secondary: "#B2B6BD",
  card: "#1C1E22",
  primary: "#A6D2B6",
  border: "#34373D",
  overlay: "#292C31",
  sage: "#A6D2B6",
  danger: "#F0A5A0",
};
