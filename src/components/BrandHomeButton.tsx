import { Pressable, type StyleProp, type ViewStyle } from 'react-native';

import { useInterface } from '../i18n/useInterface';
import { useHomeTransition } from '../intro/HomeTransitionContext';

import { BrandMark } from './BrandMark';

export function BrandHomeButton({ color, size = 36, style }: { color: string; size?: number; style?: StyleProp<ViewStyle> }) {
  const { active, returnHome } = useHomeTransition();
  const copy = useInterface();
  return <Pressable pointerEvents="box-only" testID="brand-home" accessibilityRole="button" accessibilityLabel={`Tune Into Her · ${copy.advice}`}
    accessibilityState={{ disabled: active }} disabled={active} onPress={returnHome}
    style={[{ width: 44, height: 44, justifyContent: 'center', alignItems: 'center' }, style]}>
    <BrandMark color={color} size={size} />
  </Pressable>;
}
