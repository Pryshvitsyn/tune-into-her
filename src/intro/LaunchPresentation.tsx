import { createContext, type PropsWithChildren, useContext, useEffect } from 'react';
import { Animated, useAnimatedValue, type StyleProp, type ViewStyle } from 'react-native';

interface LaunchPresentationValue {
  blocking: boolean;
  destinationSpheresVisible: boolean;
  prepareDestinationSpheres: boolean;
  reducedMotion: boolean;
  reportScreenReady(pathname?: string): void;
  reportScreenNotReady(pathname?: string): void;
}
const defaults: LaunchPresentationValue = {
  blocking: false,
  destinationSpheresVisible: true,
  prepareDestinationSpheres: true,
  reducedMotion: false,
  reportScreenReady() {},
  reportScreenNotReady() {},
};
export const LaunchPresentationContext = createContext<LaunchPresentationValue>(defaults);
export function useLaunchPresentation(): LaunchPresentationValue { return useContext(LaunchPresentationContext); }

/** Reserve the destination layout while avoiding two visible spheres in the crossfade. */
export function DestinationSphere({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const { destinationSpheresVisible, prepareDestinationSpheres, reducedMotion } = useLaunchPresentation();
  const opacity = useAnimatedValue(destinationSpheresVisible ? 1 : 0);
  useEffect(() => {
    const animation = Animated.timing(opacity, {
      toValue: destinationSpheresVisible ? 1 : 0,
      duration: destinationSpheresVisible && !reducedMotion ? 180 : 0,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [destinationSpheresVisible, opacity, reducedMotion]);
  return <Animated.View pointerEvents="none" accessible={false} accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants" style={[style, { opacity }]}>{prepareDestinationSpheres ? children : null}</Animated.View>;
}
