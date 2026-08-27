import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';

import { InfoPage } from '../src/components/InfoPage';
import brand from '../src/config/brand.json';
export default function AboutScreen() { const { t } = useTranslation(); return <InfoPage title={`${t('about.title')} ${brand.displayName}`} body={t('about.description')} footer={`${t('about.version', { version: Constants.expoConfig?.version ?? '1.0.0' })}\n${t('about.support')}`} />; }
