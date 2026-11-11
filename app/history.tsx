import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { Header } from '../src/components/Header';
import { Screen } from '../src/components/Screen';
import { useApp } from '../src/context/AppContext';
import { getLocalizedCue } from '../src/domain/content/contentRepository';
import type { GuidanceFeedback } from '../src/domain/content/feedback';
import type { DailySelection } from '../src/domain/content/types';
import { useInterface } from '../src/i18n/useInterface';
import { AsyncFeedbackStore } from '../src/storage/AsyncFeedbackStore';
import { AsyncSelectionStore } from '../src/storage/AsyncSelectionStore';
import { useTheme } from '../src/theme/useTheme';

const selections = new AsyncSelectionStore();
const feedback = new AsyncFeedbackStore();

type HistoryItem = DailySelection & { feedback: GuidanceFeedback | null };

export default function GuidanceHistoryScreen() {
  const { preferences } = useApp();
  const copy = useInterface();
  const { colors } = useTheme();
  const [items, setItems] = useState<HistoryItem[] | null>(null);

  useEffect(() => {
    let mounted = true;
    void Promise.all([selections.readAll(), feedback.readAll()]).then(([stored, ratings]) => {
      if (!mounted) return;
      const ratingByKey = new Map(ratings.map((entry) => [`${entry.date}:${entry.cueId}`, entry]));
      setItems(
        [...stored]
          .sort((a, b) => b.date.localeCompare(a.date))
          .map((entry) => ({ ...entry, feedback: ratingByKey.get(`${entry.date}:${entry.cueId}`) ?? null })),
      );
    });
    return () => { mounted = false; };
  }, []);

  const labelForFeedback = (entry: GuidanceFeedback | null) => {
    if (!entry) return null;
    if (entry.status === 'helpful') return copy.feedbackHelpful;
    if (entry.status === 'not_helpful') return copy.feedbackNotHelpful;
    return copy.feedbackNotTried;
  };

  return (
    <Screen>
      <Header title={copy.historyTitle} />
      {!items ? null : items.length === 0 ? (
        <Text style={{ color: colors.secondary, fontSize: 16, lineHeight: 23, textAlign: 'center', marginTop: 36 }}>
          {copy.historyEmpty}
        </Text>
      ) : (
        <View style={{ gap: 24 }}>
          {items.map((item) => {
            const cue = getLocalizedCue(preferences.language, item.cueId);
            const rating = labelForFeedback(item.feedback);
            return (
              <View key={`${item.date}:${item.cueId}`} style={{ paddingBottom: 20 }}>
                <Text style={{ color: colors.secondary, fontSize: 12, lineHeight: 17, fontWeight: '700', textAlign: 'center', marginBottom: 8 }}>
                  {item.date}
                </Text>
                <Text style={{ color: colors.text, fontSize: 16, lineHeight: 23, textAlign: 'center' }}>
                  {cue.context}
                </Text>
                <Text style={{ color: colors.text, fontSize: 16, lineHeight: 23, textAlign: 'center', marginTop: 10 }}>
                  {cue.support}
                </Text>
                <Text style={{ color: colors.text, fontSize: 16, lineHeight: 23, textAlign: 'center', marginTop: 10 }}>
                  {cue.cue}
                </Text>
                {rating ? (
                  <Text style={{ color: colors.secondary, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 12 }}>
                    {rating}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
