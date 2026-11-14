import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';

import { useTheme } from '../theme/useTheme';

/** Silver Chrome surface shared by the existing screens; no decorative rings/cards. */
export function Mist() {
  const { colors } = useTheme();
  return <LinearGradient pointerEvents="none" accessible={false} accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants"
    colors={[colors.gradientTop, colors.gradientCenter, colors.gradientBottom]}
    locations={[0, .48, 1]} start={{ x: .5, y: 0 }} end={{ x: .5, y: 1 }}
    style={StyleSheet.absoluteFill} />;
}
