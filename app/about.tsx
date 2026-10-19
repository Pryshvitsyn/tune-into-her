import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';
import { Linking, Text, StyleSheet } from 'react-native';

import { Button } from '../src/components/Button';
import { Header } from '../src/components/Header';
import { Screen } from '../src/components/Screen';
import brand from '../src/config/brand.json';
import { useApp } from '../src/context/AppContext';
import releaseCopy from '../src/i18n/releaseCopy.json';
import { colors, spacing } from '../src/theme';
export default function AboutScreen() {
 const { t } = useTranslation(); const { preferences } = useApp();
 return <Screen><Header title={brand.displayName} /><Text style={styles.body}>{t('about.description')}</Text><Text style={styles.body}>{t('about.version', {version:Constants.expoConfig?.version ?? '1.0.0'})}</Text>{brand.supportEmail ? <Button label={releaseCopy[preferences.language].support} onPress={()=>{void Linking.openURL(`mailto:${brand.supportEmail}`);}}/> : <Text style={styles.body}>{t('about.support')}</Text>}</Screen>;
}
const styles=StyleSheet.create({body:{fontSize:17,lineHeight:26,color:colors.text,marginBottom:spacing.lg}});
