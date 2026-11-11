import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PaywallCard } from "../src/components/PaywallCard";

export default function PaywallScreen() {
  return <LinearGradient colors={["#B7CAD8", "#EDF4F8", "#F8FBFD", "#D7E5EF"]} locations={[0, 0.32, 0.66, 1]} style={styles.background}>
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.page}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" hitSlop={12} onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable>
        <PaywallCard onUnlocked={() => router.canGoBack() ? router.back() : router.replace("/today")} />
      </View>
    </SafeAreaView>
  </LinearGradient>;
}
const styles = StyleSheet.create({ background: { flex: 1 }, safe: { flex: 1 }, page: { flex: 1, paddingHorizontal: 20 }, back: { width: 44, height: 44, alignItems: "center", justifyContent: "center" }, backText: { color: "#44627A", fontSize: 34, lineHeight: 38, fontWeight: "400" } });
