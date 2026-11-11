# Founder comment audit — Russian phrases

Updated: 2026-11-11
Scope: read-only comparison of the live `ФРАЗЫ RU` sheet's column G with the
current local editorial source and generated catalog.

## Result

No Founder comment has been applied to the runtime content.  There is no change in
`content/editorial`, `content/locales`, or `content/catalog.json` for this audit.
The mapping is deterministic: `DO_NNN` maps to `actions[NNN - 1]`, which is emitted
as runtime `action_<NNN - 1>` in every locale.

The 11-locale identity check passes: for each affected ID, the generated catalog
matches its locale editorial source.  That is an integrity result, **not** a
translation approval.  Every affected translation remains pending editorial and
native-language review (and `mbf` additionally needs community review).

## Live-comment ledger

| Phrase ID | Runtime identity | Column-G comment | Current disposition |
| --- | --- | --- | --- |
| DO_001 | `action_0` | `and buy products for it` | Rewrite direction; current source remains active pending approved Russian wording and 10 localized reviews. |
| DO_003 | `action_2` | `all laundry, first ask about coloring things` | Rewrite direction; current source remains active pending approved Russian wording and 10 localized reviews. |
| DO_007 | `action_6` | `always ...` | Rewrite direction; current source remains active pending approved Russian wording and 10 localized reviews. |
| DO_010 | `action_9` | `???` | Unresolved; neither the current text nor a replacement is approved. |
| DO_013 | `action_12` | `yours part? so her part will be?` | Rewrite direction; current source remains active pending approved Russian wording and 10 localized reviews. |
| DO_017 | `action_16` | `for all things must be - first get agreement` | Rewrite direction; current source remains active pending approved Russian wording and 10 localized reviews. |
| DO_026 | `action_25` | `and oter things with calcare using citric acid` | Rewrite direction; current source remains active pending approved Russian wording and 10 localized reviews. |
| DO_027 | `action_26` | `no` | Founder rejection; source remains active only until an approved replacement is supplied. `no` is not an approved phrase. |
| DO_042 | `action_41` | `???` | Unresolved; neither the current text nor a replacement is approved. |
| DO_043 | `action_42` | `clean all after food and wash plates` | Rewrite direction; current source remains active pending approved Russian wording and 10 localized reviews. |
| DO_046 | `action_45` | `no` | Founder rejection; source remains active only until an approved replacement is supplied. `no` is not an approved phrase. |
| DO_047 | `action_46` | `no` | Founder rejection; source remains active only until an approved replacement is supplied. `no` is not an approved phrase. |
| DO_049 | `action_48` | `no` | Founder rejection; source remains active only until an approved replacement is supplied. `no` is not an approved phrase. |
| DO_053 | `action_52` | `no` | Founder rejection; source remains active only until an approved replacement is supplied. `no` is not an approved phrase. |
| DO_055 | `action_54` | `no` | Founder rejection; source remains active only until an approved replacement is supplied. `no` is not an approved phrase. |
| DO_057 | `action_56` | `check anything with liquid` | Rewrite direction; current source remains active pending approved Russian wording and 10 localized reviews. |
| DO_063 | `action_62` | `no` | Founder rejection; source remains active only until an approved replacement is supplied. `no` is not an approved phrase. |
| DO_064 | `action_63` | `no` | Founder rejection; source remains active only until an approved replacement is supplied. `no` is not an approved phrase. |
| DO_068 | `action_67` | `just cean all drains` | Rewrite direction; current source remains active pending approved Russian wording and 10 localized reviews. |
| DO_070 | `action_69` | `if you have it` | Rewrite direction; current source remains active pending approved Russian wording and 10 localized reviews. |
| DO_071 | `action_70` | `no` | Founder rejection; source remains active only until an approved replacement is supplied. `no` is not an approved phrase. |
| DO_073 | `action_72` | `no` | Founder rejection; source remains active only until an approved replacement is supplied. `no` is not an approved phrase. |
| DO_077 | `action_76` | `all cups and glasses around the house and clean them` | Rewrite direction; current source remains active pending approved Russian wording and 10 localized reviews. |
| DO_080 | `action_79` | `not propose - just check always before she think even` | Rewrite direction; current source remains active pending approved Russian wording and 10 localized reviews. |
| DO_083 | `action_82` | `no` | Founder rejection; source remains active only until an approved replacement is supplied. `no` is not an approved phrase. |
| DO_084 | `action_83` | `not only yours psrt - it is usual thing to do YOUR part. it must be for all such things - her part` | Rewrite direction; current source remains active pending approved Russian wording and 10 localized reviews. |
| DO_085 | `action_84` | `remember about it and prepear all` | Rewrite direction; current source remains active pending approved Russian wording and 10 localized reviews. |
| DO_086 | `action_85` | `no` | Founder rejection; source remains active only until an approved replacement is supplied. `no` is not an approved phrase. |
| DO_087 | `action_86` | `what to do` | Unresolved; neither the current text nor a replacement is approved. |
| DO_088 | `action_87` | `propose this habbit` | Rewrite direction; current source remains active pending approved Russian wording and 10 localized reviews. |

The specifically requested items `DO_001`, `DO_003`, `DO_013`, `DO_043`, `DO_077`,
and `DO_080` are all in the rewrite-direction category: their original Russian
runtime wording is still active and none has an approved replacement.

## Required editorial path

1. Approve exact Russian replacement wording (or an explicit removal plus a
   replacement that preserves the necessary content reserve).
2. Review the meaning and naturalness of each affected translation individually;
   do not copy an English gloss into locale source.
3. Regenerate the catalog and run content validation, typecheck, lint, and tests.
4. Preserve selected IDs and historical `DailySelection.contentVersion` readability.

The full source-context draft register remains in
[`CONTENT_AUDIT.md`](./CONTENT_AUDIT.md). This document intentionally records status
rather than treating an ambiguous comment, `???`, or `no` as approval.
