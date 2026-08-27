import { useTranslation } from 'react-i18next';

import { InfoPage } from '../src/components/InfoPage';
export default function DisclaimerScreen() { const { t } = useTranslation(); return <InfoPage title={t('disclaimer.title')} body={t('disclaimer.body')} />; }
