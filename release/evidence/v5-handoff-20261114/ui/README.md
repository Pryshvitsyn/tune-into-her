# Native UI — associated-alpha / ownership checkpoint

Six explicitly selected XCUITest cases passed **one at a time** on the owned Simulator's
installed standalone Release. This checkpoint precedes the subsequent exact-photo artwork
build; it does not claim that later artwork was installed or tested by these runs.
[Sanitized results and PNG hashes](results.json).

| Selected case | Actual case duration | Verified behavior |
| --- | ---: | --- |
| Dark → Home → cold → restore Light |69.272s | Saved Dark survives Home/cold; initial steel uses dark clock, Graphite uses white clock; Light and locked Today restored. |
| Single/double Home |44.889s | Single13.9561s / double15.1996s; same process, one transition, locked access retained. |
| Reduced Motion Home from Privacy |33.356s | Home1.92177s, same process/locked Today; native OFF +UIKit OFF cleanup passed. |
| Confirm native Reduce Motion ON |35.917s | Actual switch ON and UIKit true asserted. |
| Reduced Motion cold entry |10.888s | UIKit ON, cold launch reaches locked Today. Begin→locked observation9.55065s includes XCTest launch synchronization. |
| Restore native Reduce Motion OFF |7.561s | Actual switch0 and UIKit false asserted. |

Case durations include UI automation. Gesture observations are not a standalone animation
or startup benchmark. Final app foreground is [Light/locked Today](final-light-locked-foreground.png).
The final body pixels below the status bar equal the independently verified initial Light
locked screen. Reduce Motion is [visibly OFF](14-qa-reduce-motion-restored-off.png).

Selected native images:

- [Steel Home / readable dark clock](57-v5-steel-home-cover-dark-clock.png),
  [same Home cover faded to Graphite / white clock](57a-v5-home-faded-dark-white-clock.png).
- [Dark after Home](58-dark-theme-preserved-after-home.png),
  [Dark after cold launch](59-dark-theme-persisted-after-cold-launch.png),
  [Light restored](60-light-theme-restored-after-dark-cold-test.png).
- [Single Home cover](45-home-single-tap-cover.png), [single locked return](46-home-single-tap-returned-locked-today.png),
  [double Home / one cover](47-home-double-tap-one-cover.png), [double locked return](48-home-double-tap-returned-locked-today.png).
- [Reduced Motion Home](91-reduced-motion-home-quick-locked-today.png),
  [native ON](13-qa-reduce-motion-enabled.png), [cold locked entry](42-reduced-motion-cold-locked-entry-no-full-intro.png).

The first Dark attempt **failed103.759s**: its semantic Settings tap did not navigate,
then the Appearance lookup failed before theme selection. It is preserved privately as
`ui-dark-home-cold.xcresult` and excluded from accepted passes. A harness-only destination
assertion and one bounded frame-center retry were added; the rerun and remaining cases
passed. No center retry was needed in the accepted runs. Production navigation was not changed.

Installed app JS SHA-256:
`4033e04a8b767c8aefc52c79b354c7153ef2f666b1334f2c80eb7301b8bb8c1f`.
Native executable SHA-256:
`7ee2f6d3ceb4d25a4fe9842bab65ef4683844de7ef0e1731fed0b5c597981246`.

Only safe app/Motion screenshots and sanitized outcomes are published. PNG text/EXIF/time
metadata and generated attachment identifiers are removed; original IDAT pixel bytes and
color metadata are preserved. Raw xcresults, logs, hierarchy/IDs and recordings remain in
private temporary storage. No purchase, trial activation, data reset or device-clock change occurred.
