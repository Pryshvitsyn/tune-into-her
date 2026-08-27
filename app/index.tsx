import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useApp } from '../src/context/AppContext';
import { colors } from '../src/theme';

export default function Index() {
  const { ready, preferences, cycleSettings } = useApp();
  if (!ready) return <View style={styles.loading}><ActivityIndicator color={colors.primary} /></View>;
  return <Redirect href={preferences.onboardingComplete && cycleSettings ? '/today' : '/onboarding'} />;
}

const styles = StyleSheet.create({ loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background } });
