# Security Specification — Dudu & Tata Cloud Profile, Player ID Directory & Live Turn-Based Mabar

## 1. Data Invariants
1. **Owner-Only Profile & Immutable Player ID**: Only the verified owner (`request.auth.uid == userId && email_verified == true`) can read/create/update `/users/{userId}` (including their bounded `friends` list of up to 30 entries). Once `playerCode` (`^[0-9]{6}$`) is assigned, it cannot be changed.
2. **PII Isolation via Split Public Directory**: Emails, Rupiah balances, friend lists, and item inventories stay strictly private inside `/users/{userId}`. `/playerDirectory/{playerCode}` exposes only public display cards (`playerCode`, `uid`, `displayName`, `photoURL`, `preferredChar`, `duduBest`, `tataBest`) and forbids `list` queries so players cannot scrape the full directory.
3. **Participant-Only Match Access & Safe Invite Inbox**: `/matches/{matchId}` `get` is strictly restricted to `player1Uid` or `player2Uid`. `list` is restricted to `resource.data.player2Uid == request.auth.uid` so invited players receive real-time invites without scraping other users' matches.
4. **Turn-Based Live Stream Authority & Cosmetic Sync**: Only `player1Uid` may write live spectator state (on `/matches/{matchId}/live/state` or legacy `liveState`) during `player1_turn` (and transition to `player2_turn` with `player1Result`), and only `player2Uid` may write live spectator state during `player2_turn` (and transition to `finished` with `player2Result` and `winnerUid`). `player1Loadout`/`player1Carpet` are set immutably at invite creation, and `player2Loadout`/`player2Carpet` are set once by `player2Uid` upon accepting the invite. All `/matches/{matchId}/live/{liveDocId}` access uses `get()` Master Gate verification on the parent match.
5. **Terminal State Locking**: Once a match reaches `finished` or `declined`, no further updates are permitted.
6. **Live Emote Channel Integrity**: `/matches/{matchId}/live/emote` may only be read or written by verified match participants (`player1Uid` or `player2Uid`) while the match is actively in `player1_turn` or `player2_turn`, and `senderUid` must equal `request.auth.uid` with strict allowlisted `emoteId` values.

## 2. "Dirty Dozen" Adversarial Payloads (Must All Return PERMISSION_DENIED)
1. Unauthenticated `get` on `/users/uid_A`.
2. Verified User B `get` or `update` on `/users/uid_A`.
3. Verified User A updating `playerCode` on `/users/uid_A` after it is already set.
4. Verified User A `list` on `/playerDirectory` to scrape all player IDs.
5. Verified User B creating `/playerDirectory/123456` with `uid: "uid_A"` (identity spoofing).
6. Verified User C `get` on `/matches/M_123` where C is neither `player1Uid` nor `player2Uid`.
7. Verified User A `list` on `/matches` without filtering `player2Uid == auth.uid`.
8. Verified User A (`player1`) updating `status: 'finished'` during `'invited'` (state shortcutting).
9. Verified User B (`player2`) writing `liveState` during `'player1_turn'` (turn hijacking).
10. Verified User A (`player1`) injecting a ghost field `adminBonus: 9999` during `liveState` stream (`affectedKeys().hasOnly(...)` guard).
11. Verified User A forging `updatedAt` with a client timestamp instead of `request.time`.
12. Verified User B updating a match after `status == 'finished'` (terminal state breach).
