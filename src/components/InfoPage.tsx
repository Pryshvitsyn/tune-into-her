import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../theme';

import { Header } from './Header';
import { Screen } from './Screen';

export function InfoPage({ title, body, footer }: { title: string; body: string; footer?: string }) {
  return <Screen><Header title={title} /><View style={styles.card}><Text style={styles.body}>{body}</Text>{footer ? <Text style={styles.footer}>{footer}</Text> : null}</View></Screen>;
}
const styles = StyleSheet.create({ card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg }, body: { color: colors.text, fontSize: 17, lineHeight: 27 }, footer: { color: colors.secondary, fontSize: 13, lineHeight: 20, marginTop: spacing.xl } });
