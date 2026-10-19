import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { Header } from '../../src/components/Header';
import { Screen } from '../../src/components/Screen';
import { SettingsRow } from '../../src/components/SettingsRow';
import { SUPPORTED_LANGUAGES } from '../../src/config/constants';
import { useApp } from '../../src/context/AppContext';
import releaseCopy from '../../src/i18n/releaseCopy.json';
import { colors, radius, spacing } from '../../src/theme';

export default function LanguageScreen() {
  const { t } = useTranslation();
  const { preferences, updatePreferences } = useApp();
  return <Screen><Header title={t('language.title')} />{preferences.language === 'mbf' ? <Text>{releaseCopy.mbf.beta}</Text> : null}<View style={styles.card}>{SUPPORTED_LANGUAGES.map((language) => <SettingsRow key={language} label={t(`language.${language}`)} value={preferences.language === language ? '✓' : undefined} onPress={() => void updatePreferences({ language }, true)} />)}</View><Text style={styles.note}>{t('today.estimated')}</Text></Screen>;
}
const styles = StyleSheet.create({ card: { backgroundColor: colors.card, borderRadius: radius.md, paddingHorizontal: spacing.md }, note: { color: colors.secondary, fontSize: 13, marginTop: spacing.lg } });

