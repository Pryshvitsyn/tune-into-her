import { Redirect, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useApp } from '../src/context/AppContext';
import { getCatalog, getLocalizedCue } from '../src/domain/content/contentRepository';
import { dailyReminders } from '../src/domain/content/dailyGuidance';
import { useInterface } from '../src/i18n/useInterface';
import { AnimatedToday } from '../src/intro/AnimatedToday';
import { introDateLabel } from '../src/intro/formatDate';
import { useTheme } from '../src/theme/useTheme';

/** Synthetic animation preview. It never uses saved cycle dates or starts access. */
export default function IntroPreview() {
  const { dark } = useTheme();
  const { preferences } = useApp();
  const { t } = useTranslation();
  const copy = useInterface();
  if (!__DEV__) return <Redirect href="/today" />;
  const date = '2026-11-12';
  const sample = getCatalog().find(item => item.phases.includes('mid_cycle'));
  const cue = sample && getLocalizedCue(preferences.language, sample.id);
  if (!cue) return <Redirect href="/today" />;
  const notes = dailyReminders(date, preferences.language);
  return <AnimatedToday replay dark={dark}
    dateLine={`${introDateLabel(date, preferences.language)} · ${t('today.day', { day: 14 })}`}
    phaseTitle={copy.mid_cycle} phaseDescription={t('qa.disclosure')}
    disclosure={t('paywall.mock')}
    mind={{ label: copy.mind, text: cue.context, note: notes[0]!.text }}
    support={{ label: copy.support, text: cue.support, note: notes[1]!.text }}
    action={{ label: copy.do, text: cue.cue, note: notes[2]!.text }}
    labels={{ info: t('today.learnMore'), update: t('today.update'), settings: t('today.settings'), skip: t('today.skipIntro'), close: t('common.close') }}
    onInfo={() => router.push({ pathname: '/learn/[phase]', params: { phase: 'mid_cycle' } })}
    onUpdate={() => router.push('/cycle')} onSettings={() => router.push('/settings')} onAbout={() => router.push('/thea')}
  />;
}
