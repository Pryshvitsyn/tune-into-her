# GitHub recovery backup — 23 November 2026

The Founder authorized a separate backup branch and an encrypted backup of builds,
archives and keys before future Mac cleanup. This permission does not authorize store
submission, production changes, merge or deletion of original project/data/key files.

The source backup branch is `codex/backup/tune-into-her-20261123`, based on verified
`ca62e70`. The main repository is **public**. Plaintext signing material, environment files,
local databases and native deliverables remain excluded from Git. Original development
and preservation branches are retained.

The separate private recovery copy is intended to contain:

- A self-contained Git bundle with all local refs, including preserved older V4/intro refs.
- The accepted IPA files, native archive, signed Development app and build provenance.
- Project-local ignored configuration/data and the app's protected credential files.
- Available isolated sandbox test state needed to resume existing tests without resets.

Installed dependencies, downloaded Pods, generated build caches, unrelated Mac files and
whole system Keychains are excluded. Device/Simulator data is not a project Git backup.
The receipt must distinguish available exported key files from any unavailable OS-only key.

Encrypt before upload. Upload only ciphertext to the private recovery repository; never
commit a decryption key or plaintext credentials. Verify downloaded ciphertext and a local
decryption/restore test before claiming remote recovery coverage.

The separate recovery-key file must be saved by the owner outside this Mac, for example
in an existing password manager or an external encrypted drive. Keeping the only key on
this Mac does not protect against losing the Mac. The key must not be pasted into chat.

Restore into a **new empty directory**, decrypt with the recovery key, extract the archive,
verify the included manifest, then clone the bundled backup branch. Restore app signing
material only to the appropriate protected local storage. Do not overwrite existing data,
reset app identities or accept store readiness based on a backup alone.

Actual completion, ciphertext hashes and coverage are recorded separately after verification.
