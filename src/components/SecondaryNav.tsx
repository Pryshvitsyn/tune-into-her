import { router, useFocusEffect, useNavigation } from 'expo-router';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { BackHandler, Pressable, useWindowDimensions, View } from 'react-native';

import { hasValidPreviousDestination } from '../navigation/screenNavigation';
import { useTheme } from '../theme/useTheme';

import { AppText as Text } from './AppText';

/** One safe-area footer for documents/details, independent of their scroll position. */
export function SecondaryNav() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const stacked = useWindowDimensions().fontScale > 1.35;
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
  return <View style={{ flexDirection: stacked ? 'column' : 'row', gap: 12, paddingHorizontal: 20, paddingVertical: 8, backgroundColor: colors.background }}>
    <Pressable testID="secondary-back" accessibilityRole="button" onPress={back}
      style={{ flex: stacked ? undefined : 1, minHeight: 48, justifyContent: 'center', alignItems: 'flex-start' }}>
      <Text style={{ color: colors.primary, fontSize: 17, lineHeight: 24 }}>{t('common.back')}</Text>
    </Pressable>
    <Pressable testID="secondary-settings" accessibilityRole="button" onPress={() => router.dismissTo('/settings')}
      style={{ flex: stacked ? undefined : 1, minHeight: 48, justifyContent: 'center', alignItems: 'flex-end' }}>
      <Text style={{ color: colors.primary, fontSize: 17, lineHeight: 24, textAlign: 'right' }}>{t('settings.title')}</Text>
    </Pressable>
  </View>;
}
