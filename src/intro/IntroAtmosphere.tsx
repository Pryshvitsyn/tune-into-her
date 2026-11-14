import { LinearGradient } from 'expo-linear-gradient';
import { Image, StyleSheet, View } from 'react-native';
import Animated, { runOnJS, type SharedValue, useAnimatedReaction, useAnimatedStyle } from 'react-native-reanimated';

import { INTRO_BACKGROUND_COLOR, INTRO_BACKGROUND_URI } from './brandBackground.generated';
import { introBackgroundOpacity } from './introPresentation';

/** Static native first frame, then a quiet blend into the existing destination palette. */
export function IntroAtmosphere({ elapsed, dark = false, onReady, onContrastChange }: {
  elapsed?: SharedValue<number>; dark?: boolean; onReady?(): void; onContrastChange?(darkContent: boolean): void;
}) {
  const edge = dark ? '#10171E' : '#DCE3E9', center = dark ? '#26313D' : '#F9FBFC';
  useAnimatedReaction(
    () => !dark || introBackgroundOpacity(elapsed?.value ?? 0) >= .5,
    (darkContent, previous) => {
      if (onContrastChange && darkContent !== previous) runOnJS(onContrastChange)(darkContent);
    },
    [dark, elapsed, onContrastChange],
  );
  const blend = useAnimatedStyle(() => ({ opacity: introBackgroundOpacity(elapsed?.value ?? 0) }));
  return <View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
    <LinearGradient colors={[edge, center, edge]} locations={[0, .5, 1]} start={{ x: 0, y: .5 }} end={{ x: 1, y: .5 }} style={StyleSheet.absoluteFill} />
    <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: INTRO_BACKGROUND_COLOR }, blend]}>
      <Image source={{ uri: INTRO_BACKGROUND_URI }} resizeMode="cover" fadeDuration={0} style={StyleSheet.absoluteFill}
        onLoad={onReady} onError={onReady} />
    </Animated.View>
  </View>;
}
