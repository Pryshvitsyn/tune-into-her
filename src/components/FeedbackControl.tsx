import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';


import type { FeedbackStatus } from '../domain/content/feedback';
import type { DateOnly } from '../domain/cycle/dateOnly';
import { useInterface } from '../i18n/useInterface';
import { AsyncFeedbackStore } from '../storage/AsyncFeedbackStore';
import { useTheme } from '../theme/useTheme';

import { AppText as Text } from './AppText';

const feedbackStore = new AsyncFeedbackStore();

export function FeedbackControl({ date, cueId }: { date: DateOnly; cueId: string }) {
  const copy = useInterface();
  const { colors } = useTheme();
  const [selected, setSelected] = useState<FeedbackStatus | null>(null);

  useEffect(() => {
    let mounted = true;
    void feedbackStore.read(date, cueId).then((entry) => {
      if (mounted) setSelected(entry?.status ?? null);
    });
    return () => { mounted = false; };
  }, [date, cueId]);

  const choices: { status: FeedbackStatus; label: string }[] = [
    { status: 'helpful', label: copy.feedbackHelpful },
    { status: 'not_helpful', label: copy.feedbackNotHelpful },
    { status: 'not_tried', label: copy.feedbackNotTried },
  ];

  const choose = (status: FeedbackStatus) => {
    setSelected(status);
    void feedbackStore.set(date, cueId, status);
  };

  return (
    <View accessibilityRole="radiogroup" style={{ alignItems: 'center', marginTop: 12, marginBottom: 12 }}>
      <Text style={{ color: colors.secondary, fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 10 }}>
        {copy.feedbackPrompt}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
        {choices.map((choice) => {
          const active = selected === choice.status;
          return (
            <Pressable
              key={choice.status}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              onPress={() => choose(choice.status)}
              style={{
                minHeight: 44,
                justifyContent: 'center',
                paddingHorizontal: 12,
                borderRadius: 19,
                backgroundColor: active ? colors.primary : colors.card,
              }}
            >
              <Text style={{ color: active ? colors.background : colors.text, fontSize: 14, lineHeight: 20, fontWeight: '400', textAlign: 'center' }}>
                {choice.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
