import Constants from 'expo-constants';

// Explicit preview-build feature; production does not enable it.
export const acceleratedDemoEnabled = Constants.expoConfig?.extra?.acceleratedDemo === true;
