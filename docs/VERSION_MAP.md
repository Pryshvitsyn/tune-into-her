# Version map

Updated: 2026-11-11

This map records provenance without implying that any draft pull request is merged or
published.

| Layer | Branch / reference | Commit | State | Notes |
| --- | --- | --- | --- | --- |
| Remote main | `origin/main` | `1bf4713` | Remote baseline | Not the integration base. |
| PR #1 | `origin/pr/1` | `6367bd8` | Open draft | Earlier release/content scope. |
| PR #2 | `origin/pr/2` | `5b51a32` | Open | Bootstrap/documentation scope. |
| PR #3 | `origin/pr/3` | `a09ba11` | Open draft | Native-interface precursor. |
| PR #4 | `origin/pr/4` | `8c16c6a` | Open draft | Dependency/content precursor. |
| PR #5 | `origin/pr/5` | `c4cfb79` | Open draft | Accelerated-preview/content precursor. |
| PR #6 | `origin/pr/6` | `25c8505` | Open draft | Release-preparation base selected for this candidate. |
| Local remote-base pointer | `archive/github-release-baseline-20261111` | `25c8505` | Local | Exact recoverable pointer to the selected base. |
| Local V4 preservation | `archive/local-sphere-v4-20261111` | `1147292` | Local | Preserves the pre-consolidation working tree and approved V4 artifacts. |
| Integration candidate | `feat/sphere-v4-release-candidate` | starts at `25c8505` | Local working branch | Holds controlled consolidation changes; commit/push status must be checked at handoff. |

## Rule for recovery

Use the V4 preservation branch only to recover the approved renderer and its two image
assets. It is not a content, billing, or release baseline. Use the PR #6 pointer when
recovering the integration base. No destructive history operation is required for either
recovery path.

## Publication boundary

The project rules authorize an eventual feature-branch publication and PR proposal, but
not merge, deployment, store submission, or an unauthorized environment write. The
archive branch has not been treated as remotely published because the attempted push was
blocked by the execution environment.
