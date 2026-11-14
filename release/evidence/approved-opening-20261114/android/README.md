# Approved-opening Android source/resource verification

The isolated offline Expo prebuild passed with the installed `expo/template.tgz`,
`--platform android --no-install`, existing dependencies and no copied environment
files. No Android directory was created in the working repository.

All ten generated PNGs (five densities, Light/Dark) are byte-identical to independent
reproduction with the installed official Expo image utilities using only the exact
approved photograph, `contain` fit and the existing 288 dp canvas. No reconstructed
SVG/logo overlay is present. Dimensions, file hashes, input hash, SDK versions and
source checksums are in [source-resource-proof.json](source-resource-proof.json).
The density outputs are intentionally resized native resources; their PNG bytes are
not claimed to equal the full-resolution source photograph.

Android 12+ supplies an OS-managed icon and solid background. Its documented icon
canvas is 288 dp with a 192 dp safe circle without an icon background. This does not
provide a full-bleed native photographic splash. The existing shared RN opening
owns the full-screen artwork after its runtime is ready; source equality alone
cannot verify the actual system mask or the native-to-RN transition. See the
[Android splash-screen guide](https://developer.android.com/develop/ui/views/launch/splash-screen)
and [AndroidX API](https://developer.android.com/reference/androidx/core/splashscreen/SplashScreen).

No JDK, default Android SDK or `adb` was found. No Gradle build, installation,
emulator/device test or Android native visual acceptance is claimed. No dependency,
SDK, account, permission or production configuration was changed.
