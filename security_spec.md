# Security Specification — Dudu & Tata 2.5D

## 1. Data Invariants
1. **UserProfile (`/users/{userId}`)**:
   - Can only be read (`get`), created, or updated by the verified authenticated owner (`request.auth.uid == userId && request.auth.token.email_verified == true`).
   - Collection listing (`list`) and deletion (`delete`) are strictly denied.
   - `uid` and `createdAt` are immutable; `updatedAt` must equal `request.time`.
   - All numeric scores, point balances, Rupiah balances, and booster counts are non-negative integers within strict bounds.
2. **TurnRoom (`/rooms/{roomCode}`)**:
   - `roomCode` must be an exact 6-character uppercase alphanumeric ID (`^[A-Z0-9]{6}$`).
   - Collection listing (`list`) is strictly denied; rooms are fetched directly by exact `roomCode`.
   - Room creation requires `status == 'waiting'`, `player1Uid == request.auth.uid`, and `null` for `player2*`, results, and `winnerUid`.
   - State transitions are strictly linear: `waiting` -> `player1_turn` (only on `joinRoom`) -> `player2_turn` (only by `player1Uid`) -> `finished` (only by `player2Uid`).
   - Terminal State Locking: Once `status == 'finished'`, no further updates are permitted.

## 2. The "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. **Unauthenticated read/write** on `/users/u1` or `/rooms/ABC123`.
2. **Unverified email** (`email_verified: false`) attempting to create `/users/u1`.
3. **Cross-user profile read/write**: User B reading or writing `/users/userA`.
4. **Profile UID spoofing**: User A creating `/users/userA` with `uid: "userB"`.
5. **Shadow field injection**: Creating `/users/userA` with an extra `isAdmin: true` field.
6. **Negative Rupiah / Points poisoning**: Updating `/users/userA` with `rupiahBalance: -50000`.
7. **Collection scraping**: Calling `list` (`getDocs(collection(db, 'users'))` or `collection(db, 'rooms')`).
8. **Invalid room ID poisoning**: Creating `/rooms/invalid_long_id_123456`.
9. **State shortcutting**: Creating `/rooms/ABC123` directly with `status: 'finished'`.
10. **Turn hijacking**: User B submitting `player1Result` while `status == 'player1_turn'` and `player1Uid == userA`.
11. **Post-finished mutation**: Modifying `player1Result` or `winnerUid` after `status == 'finished'`.
12. **Client timestamp forgery**: Creating or updating a document with a backdated `updatedAt` instead of `serverTimestamp()`.
