import { useTranslation } from 'react-i18next';
import { Linking, Text, StyleSheet } from 'react-native';

import { Button } from '../src/components/Button';
import { Header } from '../src/components/Header';
import { Screen } from '../src/components/Screen';
import brand from '../src/config/brand.json';
import { useApp } from '../src/context/AppContext';
import releaseCopy from '../src/i18n/releaseCopy.json';
import { colors, spacing } from '../src/theme';

export default function TermsScreen() {
  const { preferences } = useApp();
  const { t } = useTranslation();
  const copy = releaseCopy[preferences.language];
  return <Screen><Header title={copy.termsTitle} /><Text style={styles.body}>{copy.termsBody}</Text><Text style={styles.body}>{t('disclaimer.body')}</Text>{brand.termsUrl ? <Button label={copy.openTerms} onPress={() => { void Linking.openURL(brand.termsUrl); }} /> : null}</Screen>;
}
const styles = StyleSheet.create({body:{color:colors.text,fontSize:16,lineHeight:25,marginBottom:spacing.lg}});
