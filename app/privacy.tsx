import { useTranslation } from 'react-i18next';
import { Linking, Text, StyleSheet } from 'react-native';

import { Button } from '../src/components/Button';
import { Header } from '../src/components/Header';
import { Screen } from '../src/components/Screen';
import brand from '../src/config/brand.json';
import { useApp } from '../src/context/AppContext';
import releaseCopy from '../src/i18n/releaseCopy.json';
import { colors, spacing } from '../src/theme';
export default function PrivacyScreen() {
 const { t } = useTranslation();const {preferences}=useApp();
 return <Screen><Header title={t('privacy.title')}/><Text style={styles.body}>{t('privacy.body')}</Text><Text style={styles.body}>{releaseCopy[preferences.language].deleteBody}</Text>{brand.privacyUrl?<Button label={t('today.learnMore')} onPress={()=>{void Linking.openURL(brand.privacyUrl);}}/>:null}</Screen>;
}
const styles=StyleSheet.create({body:{fontSize:17,lineHeight:26,color:colors.text,marginBottom:spacing.lg}});
