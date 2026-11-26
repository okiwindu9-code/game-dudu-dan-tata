/**
 * Security test suite specification for Dudu & Tata Firestore rules.
 * Covers the Dirty Dozen adversarial payloads against /users/{userId} and /rooms/{roomCode}.
 */

export const DIRTY_DOZEN_TESTS = [
  {
    name: '01. Unauthenticated access to /users/u1 is denied',
    path: '/users/u1',
    operation: 'get',
    auth: null,
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '02. Unverified email user cannot create /users/u1',
    path: '/users/u1',
    operation: 'create',
    auth: { uid: 'u1', token: { email_verified: false } },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '03. Cross-user profile read is denied',
    path: '/users/userA',
    operation: 'get',
    auth: { uid: 'userB', token: { email_verified: true } },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '04. Profile UID spoofing is denied',
    path: '/users/userA',
    operation: 'create',
    auth: { uid: 'userA', token: { email_verified: true } },
    payload: { uid: 'userB' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '05. Shadow field injection (isAdmin: true) is denied',
    path: '/users/userA',
    operation: 'create',
    auth: { uid: 'userA', token: { email_verified: true } },
    payload: { uid: 'userA', isAdmin: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '06. Negative balance poisoning is denied',
    path: '/users/userA',
    operation: 'update',
    auth: { uid: 'userA', token: { email_verified: true } },
    payload: { rupiahBalance: -50000 },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '07. Collection list scraping on /rooms is denied',
    path: '/rooms',
    operation: 'list',
    auth: { uid: 'userA', token: { email_verified: true } },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '08. Invalid room code ID is denied',
    path: '/rooms/invalid_room_id',
    operation: 'create',
    auth: { uid: 'userA', token: { email_verified: true } },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '09. Creating a room already in finished status is denied',
    path: '/rooms/DT1234',
    operation: 'create',
    auth: { uid: 'userA', token: { email_verified: true } },
    payload: { status: 'finished' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '10. Player 2 cannot submit Player 1 turn result',
    path: '/rooms/DT1234',
    operation: 'update',
    auth: { uid: 'userB', token: { email_verified: true } },
    payload: { status: 'player2_turn', player1Result: { score: 999 } },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '11. Mutating room after status is finished is denied',
    path: '/rooms/DT1234',
    operation: 'update',
    auth: { uid: 'userA', token: { email_verified: true } },
    payload: { winnerUid: 'userA' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '12. Client-forged timestamp different from request.time is denied',
    path: '/rooms/DT1234',
    operation: 'create',
    auth: { uid: 'userA', token: { email_verified: true } },
    payload: { createdAt: '2020-01-01T00:00:00Z' },
    expected: 'PERMISSION_DENIED',
  },
] as const;
