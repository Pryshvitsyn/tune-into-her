import { router, useFocusEffect, useNavigation } from 'expo-router';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { BackHandler, Pressable, View } from 'react-native';

import { hasValidPreviousDestination } from '../navigation/screenNavigation';
import { useTheme } from '../theme/useTheme';

import { AppText as Text } from './AppText';

/** One safe-area footer for documents/details, independent of their scroll position. */
export function SecondaryNav() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const back = useCallback(() => {
    // Expo's generated root contains the app stack as a child. Read the owning
    // screen stack at gesture time, including any navigation since the last render.
    if (navigation.canGoBack() && hasValidPreviousDestination(navigation.getState())) router.back();
    else router.replace('/today');
  }, [navigation]);
  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { back(); return true; });
    return () => subscription.remove();
  }, [back]));
  return <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingVertical: 8, backgroundColor: colors.background }}>
    <Pressable testID="secondary-back" accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={back}
      style={{ flex: 1, minHeight: 48, minWidth: 48, justifyContent: 'center', alignItems: 'flex-start' }}>
      <Text systemFont accessible={false} allowFontScaling={false} style={{ color: colors.primary, fontSize: 28, lineHeight: 34 }}>←</Text>
    </Pressable>
    <Pressable testID="secondary-settings" accessibilityRole="button" accessibilityLabel={t('settings.title')} onPress={() => router.dismissTo('/settings')}
      style={{ flex: 1, minHeight: 48, minWidth: 48, justifyContent: 'center', alignItems: 'flex-end' }}>
      <Text systemFont accessible={false} allowFontScaling={false} style={{ color: colors.primary, fontSize: 25, lineHeight: 34 }}>⚙</Text>
    </Pressable>
  </View>;
}
