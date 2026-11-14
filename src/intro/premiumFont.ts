import * as Font from 'expo-font';

let loading: Promise<void> | null = null;
/** Bundled original OTF; no remote font fetch and no disguised system fallback. */
export function loadPremiumTypeface(): Promise<void> {
  if (Font.isLoaded('LinuxLibertineO')) return Promise.resolve();
  loading ??= Font.loadAsync({
    LinuxLibertineO: require('../../assets/fonts/LinuxLibertineO-Regular.otf'),
  }).catch(error => { loading = null; throw error; });
  return loading;
}
