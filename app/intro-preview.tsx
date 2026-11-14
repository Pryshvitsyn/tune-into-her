import { Redirect, router } from 'expo-router';

import { AnimatedToday } from '../src/intro/AnimatedToday';
import { useTheme } from '../src/theme/useTheme';

/** Synthetic animation preview. It does not read/write cycle dates or purchases. */
export default function IntroPreview() {
  const {dark}=useTheme();
  if (!__DEV__) return <Redirect href="/today"/>;
  return <AnimatedToday
    replay dark={dark}
    dateLine="ДЕМО · 12 ноября · День 14"
    phaseTitle="Возможное окно овуляции"
    phaseDescription="Тестовый пример, не расчёт вашего цикла."
    mind={{label:'УЧТИ',text:'Самочувствие важнее календаря.',note:'Уточни, что ей сейчас важно.'}}
    support={{label:'ПОДДЕРЖИ',text:'Спроси: выслушать или помочь делом?',note:'Поблагодари за замеченный поступок.'}}
    action={{label:'СДЕЛАЙ',text:'Возьми на себя ужин, покупки или уборку.',note:'Выбери только нужное сегодня.'}}
    labels={{info:'Больше о фазе',update:'Изменить фазу',settings:'Настройки',skip:'Пропустить заставку',close:'Закрыть'}}
    onInfo={()=>router.push('/today')}
    onUpdate={()=>router.push('/cycle')}
    onSettings={()=>router.push('/settings')}
    onAbout={()=>router.push('/thea')}
  />;
}
