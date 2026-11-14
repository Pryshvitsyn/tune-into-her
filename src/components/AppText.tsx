import { forwardRef } from 'react';
import { Platform, Text as NativeText, useWindowDimensions, type TextProps } from 'react-native';

/**
 * iOS RN 0.86 can retain stale paragraph metrics after a live Dynamic Type change.
 * Remount only the native Text host; surrounding controls and drafts keep identity.
 * Upstream reproduction/workaround: https://github.com/react/react-native/issues/57512
 */
export const AppText = forwardRef<NativeText, TextProps>(function AppText(props, ref) {
  const { fontScale } = useWindowDimensions();
  return <NativeText key={Platform.OS === 'ios' ? fontScale : undefined} {...props} ref={ref} />;
});
