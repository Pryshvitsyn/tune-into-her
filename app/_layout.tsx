import "../src/i18n";

import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { prepareSphereResources } from "../TuneIntoHerSphereV4";
import { DemoNotificationNavigation } from "../src/components/DemoNotificationNavigation";
import { AppProvider } from "../src/context/AppContext";
import { GlobalLaunch } from "../src/intro/GlobalLaunch";
import { useLaunchPresentation } from "../src/intro/LaunchPresentation";
import { useTheme } from "../src/theme/useTheme";

// Keep the native static bridge until the first compatible RN/GPU frame is painted.
void SplashScreen.preventAutoHideAsync().catch(() => undefined);
SplashScreen.setOptions({ fade: false, duration: 0 });

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Start decoding the exact phase-zero poster and renderer texture before the
// Today screen needs them. The component keeps the same module-level promise.
void prepareSphereResources().catch(() => undefined);

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <GlobalLaunch><Navigation /></GlobalLaunch>
      </AppProvider>
    </SafeAreaProvider>
  );
}

function Navigation() {
  const { colors, dark } = useTheme();
  const { blocking } = useLaunchPresentation();
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          statusBarStyle: blocking ? "dark" : dark ? "light" : "dark",
          contentStyle: { backgroundColor: colors.background },
          animation: "slide_from_right",
        }}
      />
      <DemoNotificationNavigation />
    </>
  );
}
