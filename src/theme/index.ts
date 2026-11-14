/** Shared Silver Chrome palette; the approved V4/WebGL material has its own immutable colors. */
export const colors = {
  background: '#F5F8FA',
  text: '#263A49',
  secondary: '#657A89',
  card: '#F7FAFC',
  primary: '#536D80',
  sage: '#91A89F',
  lavender: '#9CA9B8',
  sand: '#DCE6EC',
  rose: '#A88F91',
  border: '#C5D2DB',
  danger: '#9A4E49',
  overlay: '#E7EEF3',
  button: '#405D71',
  buttonPressed: '#304A5D',
  buttonDisabled: '#ADBCC6',
  buttonText: '#FFFFFF',
  gradientTop: '#E4ECF1',
  gradientCenter: '#FCFDFE',
  gradientBottom: '#DCE6EC',
  pickerSelection: '#E7EEF3',
};

export const spacing = {
  xs: 6, sm: 10, md: 16, lg: 24, xl: 32, xxl: 48,
} as const;
export const radius = { sm: 10, md: 18, lg: 28, pill: 999 } as const;

export type Palette = typeof colors;
export const darkColors: Palette = {
  ...colors,
  background: '#10171E',
  text: '#E6EEF4',
  secondary: '#A9BAC8',
  card: '#18232D',
  primary: '#AFC3D2',
  border: '#3E515F',
  overlay: '#23343F',
  sage: '#91A89F',
  danger: '#E5A7A3',
  button: '#536F84',
  buttonPressed: '#405C70',
  buttonDisabled: '#45545F',
  gradientTop: '#121D26',
  gradientCenter: '#23333F',
  gradientBottom: '#111C24',
  pickerSelection: '#2A3D4B',
};
