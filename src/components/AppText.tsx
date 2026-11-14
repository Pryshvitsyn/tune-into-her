import { forwardRef } from 'react';
import { Platform, Text as NativeText, useWindowDimensions, type TextProps } from 'react-native';

import type { SupportedLanguage } from '../config/constants';
import { useApp } from '../context/AppContext';
import { typographyForLanguage } from '../theme/typography';

export interface AppTextProps extends TextProps {
  /** A language option uses its own script rather than the currently selected UI locale. */
  language?: SupportedLanguage;
  /** Decorative emoji/system symbols keep the platform glyph, not a substitute serif. */
  systemFont?: boolean;
}

/**
 * Shared app typography; the original OTF is registered by the root before route text mounts.
 * iOS RN 0.86 can retain stale paragraph metrics after a live Dynamic Type change.
 * Remount only the native Text host; surrounding controls and drafts keep identity.
 * Upstream reproduction/workaround: https://github.com/react/react-native/issues/57512
 */
export const AppText = forwardRef<NativeText, AppTextProps>(function AppText({
  language, systemFont = false, style, ...props
}, ref) {
  const { preferences } = useApp();
  const { fontScale } = useWindowDimensions();
  const typography = typographyForLanguage(language ?? preferences.language);
  return <NativeText key={Platform.OS === 'ios' ? fontScale : undefined} {...props} ref={ref}
    style={[style, systemFont ? { fontFamily: undefined, fontWeight: '400' } : typography]} />;
});
