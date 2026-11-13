import { useTranslation } from 'react-i18next';

import { Header } from '../../src/components/Header';
import { PaywallCard } from '../../src/components/PaywallCard';
import { Screen } from '../../src/components/Screen';

export default function SubscriptionScreen() {
  const { t } = useTranslation();
  return <Screen><Header title={t('subscription.title')} /><PaywallCard /></Screen>;
}
