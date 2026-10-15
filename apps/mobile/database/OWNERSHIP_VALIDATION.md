# OPFS ownership validation

This change must be validated on the installed Android Chrome PWA at its HTTPS
origin. Desktop results do not establish Android success.

## Expected console sequence

Filter the Android remote debugging console for `[BAYA`. Each page/PWA context
has a different `session=` value.

On a single instance, expect:

1. `ACQUIRING_OWNERSHIP` → `owner` → `OPENING` → `openDatabaseAsync` → `READY`.
2. The `locks` JSON after `READY` includes `baya_sqlite_opfs` in `held`.
3. On close or handoff: `CLOSING` → `[BAYA SQLite Worker] VFS disposed` →
   `releasing` → `CLOSED`.

With two instances, the second session must log `waiting` and a `pending`
lock. It must not log `openDatabaseAsync` until it logs `owner`. The first
session must log `VFS disposed` before `releasing`. Normal contention must
produce no `createSyncAccessHandle` or `Invalid VFS state` error.

## Device procedure

1. Close every BAYA Chrome tab and installed PWA window. Force-stop Chrome.
2. Open only the installed PWA. Create a learner profile, then kill and reopen
   the PWA. Confirm the name persists. Repeat the close/reopen sequence 20
   times and save the `[BAYA` console log for any failure.
3. Complete topics `topic-1-1` through `topic-1-5`, closing and reopening
   between some topics. Confirm all five completion states persist.
4. Keep the PWA open, then open the same HTTPS origin in a Chrome tab. Record
   both session IDs and confirm the handoff ordering above. Repeat with two
   Chrome tabs. Background the PWA while opening Chrome and foreground it
   again. Confirm the active instance still saves progress.
5. With an owner tab and a waiting tab, close the owner. Confirm the waiter
   becomes `owner` and opens SQLite. Repeat after swiping away the PWA.
6. Background and foreground the PWA in under 3.5 seconds; confirm the hidden
   close is cancelled. Then background it longer and confirm reopening waits
   for the prior close rather than overlapping it.

For a failure, capture the full console from both contexts and state whether
the failing context was a Chrome tab or installed PWA. Keep the `session=`
values, lock snapshots, worker lines, and the first OPFS error together.
