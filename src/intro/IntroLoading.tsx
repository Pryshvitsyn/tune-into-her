import { View } from 'react-native';

import { ApprovedOpening } from './ApprovedOpening';
import { INTRO_BACKGROUND_COLOR } from './brandBackground.generated';

/** Byte-exact native/RN opening artwork, independent of saved application appearance. */
export function IntroLoading(_: { dark: boolean }) {
  return <View style={{ flex: 1, backgroundColor: INTRO_BACKGROUND_COLOR }} accessible accessibilityLabel="Tune Into Her">
    <ApprovedOpening />
  </View>;
}
