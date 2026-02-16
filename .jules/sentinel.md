## 2024-05-23 - Hardcoded PBKDF2 Salt in Password Manager

**Vulnerability:** Found a hardcoded salt ('shogun-pass-salt') used for PBKDF2 key derivation in `pass.html`. This exposes all users' encrypted vaults to rainbow table attacks if the database is leaked, as the same salt is used for everyone.

**Learning:** Client-side encryption often tempts developers to use static values for salts when they lack a clear per-user storage mechanism before encryption. The developer likely prioritized simplicity (one string constant) over security (random salt management). The fix required implementing a versioned storage format (`V2-`) to handle the migration from the hardcoded salt to a random per-vault salt without breaking existing users.

**Prevention:** Always generate a random salt (at least 16 bytes) for each user/entity when using PBKDF2 or similar KDFs. Store the salt alongside the ciphertext (it is not secret). Design storage formats to be versioned from the start to allow for cryptographic algorithm upgrades.
