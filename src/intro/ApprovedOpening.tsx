import { Image, StyleSheet, View } from 'react-native';

import { INTRO_BACKGROUND_COLOR } from './brandBackground.generated';

/** The immutable Founder photograph, never reconstructed or layered with another logo. */
export const APPROVED_OPENING_SOURCE = require('../../assets/brand/reference/founder-approved-premium-v5-20261114.png');

export function ApprovedOpening({ onReady, onError }: { onReady?(): void; onError?(): void }) {
  return <View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants"
    style={[StyleSheet.absoluteFill, { backgroundColor: INTRO_BACKGROUND_COLOR, overflow: 'hidden' }]}>
    <Image source={APPROVED_OPENING_SOURCE} resizeMode="cover" fadeDuration={0}
      // Static require supplies intrinsic point dimensions. Override both: absolute
      // edges alone leave an 851x1847pt image cropped inside the phone viewport.
      style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
      onLoad={onReady} onError={onError} />
  </View>;
}
