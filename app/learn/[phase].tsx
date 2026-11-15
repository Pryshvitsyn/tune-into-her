import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { AppText as Text } from '../../src/components/AppText';
import { Header } from '../../src/components/Header';
import { Screen } from '../../src/components/Screen';
import { useApp } from '../../src/context/AppContext';
import type { CyclePhase } from '../../src/domain/cycle/cycleEngine';
import { EDUCATION_PHASES, EDUCATION_SOURCES, getCycleEducation } from '../../src/education/cycleEducation';
import { radius, spacing, type Palette } from '../../src/theme';
import { useTheme } from '../../src/theme/useTheme';

export default function LearnScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { preferences } = useApp();
  const copy = getCycleEducation(preferences.language);
  const params = useLocalSearchParams<{ phase?: string }>();
  const phase: CyclePhase = EDUCATION_PHASES.includes(params.phase as CyclePhase)
    ? params.phase as CyclePhase : 'menstrual';
  const page = copy.phases[phase];
  const [linkError, setLinkError] = useState(false);
  const openSource = async (url: (typeof EDUCATION_SOURCES)[number]['url']) => {
    setLinkError(false);
    try { await Linking.openURL(url); } catch { setLinkError(true); }
  };
  return <Screen>
    <Header title={copy.title} />
    <View accessibilityRole="tablist" style={styles.phases}>
      {EDUCATION_PHASES.map(item => <Pressable key={item} testID={`learn-phase-${item}`}
        accessibilityRole="tab" accessibilityState={{ selected: item === phase }}
        onPress={() => { setLinkError(false); router.replace({ pathname: '/learn/[phase]', params: { phase: item } }); }}
        style={[styles.phase, item === phase && styles.selected]}>
        <Text style={styles.phaseLabel}>{copy.phases[item].title}</Text>
      </Pressable>)}
    </View>
    <Text testID="learn-general-caveat" style={styles.context}>{copy.intro}</Text>
    <View testID={`learn-content-${phase}`} style={styles.card}>
      <Text accessibilityRole="header" style={styles.heading}>{page.title}</Text>
      {(['timing', 'physical', 'energy', 'support'] as const).map(section => <View key={section} style={styles.section}>
        <Text accessibilityRole="header" style={styles.label}>{copy[section]}</Text>
        <Text style={styles.body}>{page[section]}</Text>
      </View>)}
      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.label}>{copy.variation}</Text>
        <Text style={styles.body}>{copy.variationBody}</Text>
      </View>
    </View>
    <View style={styles.sources}>
      <Text accessibilityRole="header" style={styles.label}>{copy.sources}</Text>
      <Text style={styles.context}>{copy.sourceLanguage}</Text>
      {EDUCATION_SOURCES.map((source, index) => <Pressable key={source.url} accessibilityRole="link"
        testID={`learn-source-${index}`} onPress={() => { void openSource(source.url); }} style={styles.sourceLink}>
        <Text style={styles.link}>{source.provider} · {copy.sourceNames[index]} ↗</Text>
      </Pressable>)}
      {linkError ? <Text accessibilityRole="alert" style={styles.context}>{copy.sourceError}</Text> : null}
    </View>
  </Screen>;
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  phases: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  phase: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
  selected: { backgroundColor: colors.card, borderColor: colors.primary },
  phaseLabel: { color: colors.primary, fontSize: 16, lineHeight: 23 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.lg, marginTop: spacing.lg },
  section: { gap: spacing.xs },
  heading: { color: colors.text, fontSize: 28, lineHeight: 36 },
  label: { color: colors.text, fontSize: 20, lineHeight: 28 },
  body: { color: colors.text, fontSize: 17, lineHeight: 27 },
  context: { color: colors.secondary, fontSize: 15, lineHeight: 23 },
  sources: { marginTop: spacing.lg, gap: spacing.xs },
  sourceLink: { minHeight: 44, justifyContent: 'center', paddingVertical: spacing.sm },
  link: { color: colors.primary, fontSize: 16, lineHeight: 24, textDecorationLine: 'underline' },
});
