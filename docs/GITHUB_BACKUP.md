# GitHub recovery backup — 23 November 2026

The Founder authorized a separate backup branch and an encrypted backup of builds,
archives and keys before future Mac cleanup. This permission does not authorize store
submission, production changes, merge or deletion of original project/data/key files.

The source backup branch is `codex/backup/tune-into-her-20261123`, based on verified
`ca62e70`. The main repository is **public**. Plaintext signing material, environment files,
local databases and native deliverables remain excluded from Git. Original development
and preservation branches are retained.

Verified backups:

- [Public source branch](https://github.com/Pryshvitsyn/tune-into-her/tree/codex/backup/tune-into-her-20261123).
- [Private encrypted recovery storage](https://github.com/Pryshvitsyn/tune-into-her-private-backup/releases),
  draft tag `backup-20261123`. This is backup storage, not an application-store release.

The uploaded `TuneIntoHer-core-20261123.tar.gz.age` contains:

- A self-contained Git bundle with all local refs, including preserved older V4/intro refs.
- The accepted IPA files, native archive, signed Development app and build provenance.
- The app's existing exported credential files and two matching provisioning profiles.
- The accepted/current Simulator applications and preserved Android native artifacts.

The core ciphertext is 722,098,094 bytes, SHA-256
`5b3d6e6df8713ff7f6bac696cebbcac9ee4b709fe3b50a579eb72ef308fe26c8`.
An independent GitHub download passed age authentication, compressed-stream and manifest
checks, and every member hash: 991 entries / 678 files / 1,104,434,557 payload bytes.
The Git bundle has complete history and 36 refs; a fresh clone restored the expected
checkpoint and older V4/intro/context commits. Two already unavailable worktrees had no
accessible uncommitted contents to back up; their committed refs are preserved.

The additional `TuneIntoHer-audit-key-20261123.tar.gz.age` preserves the separately found
Android internal-audit keystore. Its independent download and stream verification passed;
it is not a verified Google Play upload key, and its keystore-passphrase recovery was not
established. The private release also contains the reviewed verification helper, matching
receipts and a recovery guide. The helper requires Python 3.11+ and age v1.3.2; run
`--verify-only` with explicit `--age`, `--identity`, `--output` and `--receipt` paths before
extracting anything. It never prints the recovery identity or archive member contents.

**The complete backup remains pending.** The existing Development private key held only
in macOS Keychain still needs the owner's scoped system-authorized encrypted export.
Project-local databases, environment configuration and the sandbox identity/token require
the separately requested scope approval and have not been copied. The owner has not yet
confirmed saving the recovery key outside this Mac. Do not delete original files on the
basis of the core copy alone.

Installed dependencies, downloaded Pods, generated build caches, unrelated Mac files and
whole system Keychains are excluded. Device/Simulator data is not a project Git backup.
The receipt distinguishes available exported key files from the pending OS-only key.

Encrypt before upload. Upload only ciphertext to the private recovery repository; never
commit a decryption key or plaintext credentials. Verify downloaded ciphertext and a local
decryption/restore test before claiming remote recovery coverage.

The separate recovery-key file must be saved by the owner outside this Mac, for example
in an existing password manager or an external encrypted drive. Keeping the only key on
this Mac does not protect against losing the Mac. The key must not be pasted into chat.

Authenticate/decrypt each part as a stream and verify its manifest before extracting anything.
Extract each part into a **different new empty private directory**. For exact all-ref preservation, clone
the Git bundle with `--mirror`, then clone the backup branch into a new working directory.
The bundle checkpoint predates later backup-receipt documentation commits. Restore app signing
material only to the appropriate protected local storage. Do not overwrite existing data,
reset app identities or accept store readiness based on a backup alone.

Actual coverage and remaining owner steps are recorded in
[the backup receipt](../release/evidence/github-backup-20261123/source-backup.json).
