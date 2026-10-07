---
'@fireblocks/extended-key-recovery': patch
---

Mobile key share decryption now uses strict PKCS#7 padding and validates the decrypted share, so a wrong passphrase reports a passphrase error instead of failing the metadata check; the passphrase is encoded as UTF-8 (with a legacy raw-char-code fallback) so non-ASCII passphrases work
