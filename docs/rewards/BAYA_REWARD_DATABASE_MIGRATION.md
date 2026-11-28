# Migration 007

The existing migration runner applies `007_star_wallet` transactionally after achievement migration 006. The migration creates the ledger and hint-usage tables, indexes and constraints. It adds nullable reward metadata to achievement rows and installs the unlock credit trigger. Both the standalone SQL source and the bundled migration are included for runtime compatibility.

Existing profile, curriculum, attempt, synchronization and achievement records stay in their original tables. Version-6 achievement rows keep their recorded unlock dates, evidence and notification state. Reconciliation records the new credit with its actual issuance timestamp. A unique learner/kind/source key handles interrupted backfills and repeat visits. Only currently available catalog definitions with existing unlock evidence qualify.

Fresh installation and upgrades use the same migration runner. The database suite covers preserved historical learners and repeated migration. There is no historical reconstruction of topic rewards or conversion of XP. The database and ledger are local to this installation.
