/**
 * Dirty Dozen Firestore Security Rules Verification Matrix
 * Documents adversarial payloads asserted to return PERMISSION_DENIED.
 */

export interface SecurityAssertion {
  id: number;
  name: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  actor: { uid: string | null; emailVerified: boolean };
  payload?: Record<string, unknown>;
  expected: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: SecurityAssertion[] = [
  {
    id: 1,
    name: 'Unauthenticated read on private user profile',
    operation: 'get',
    path: '/users/user_a',
    actor: { uid: null, emailVerified: false },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Cross-user read on private user profile',
    operation: 'get',
    path: '/users/user_a',
    actor: { uid: 'user_b', emailVerified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Mutation of immutable playerCode once assigned',
    operation: 'update',
    path: '/users/user_a',
    actor: { uid: 'user_a', emailVerified: true },
    payload: { playerCode: '999999' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Directory scraping via list query on playerDirectory',
    operation: 'list',
    path: '/playerDirectory',
    actor: { uid: 'user_a', emailVerified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Identity spoofing in playerDirectory entry',
    operation: 'create',
    path: '/playerDirectory/654321',
    actor: { uid: 'user_b', emailVerified: true },
    payload: { playerCode: '654321', uid: 'user_a' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Non-participant reading private match document',
    operation: 'get',
    path: '/matches/M_TEST_01',
    actor: { uid: 'user_c', emailVerified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Unscoped list query on matches collection',
    operation: 'list',
    path: '/matches',
    actor: { uid: 'user_a', emailVerified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'State shortcutting from invited straight to finished',
    operation: 'update',
    path: '/matches/M_TEST_01',
    actor: { uid: 'user_a', emailVerified: true },
    payload: { status: 'finished' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Player 2 hijacking Player 1 liveState stream',
    operation: 'update',
    path: '/matches/M_TEST_01',
    actor: { uid: 'user_b', emailVerified: true },
    payload: { liveState: { turnUid: 'user_b', score: 9999 } },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Shadow ghost field injection on TurnMatch update',
    operation: 'update',
    path: '/matches/M_TEST_01',
    actor: { uid: 'user_a', emailVerified: true },
    payload: { adminBonus: 9999 },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Client-forged timestamp on TurnMatch update',
    operation: 'update',
    path: '/matches/M_TEST_01',
    actor: { uid: 'user_a', emailVerified: true },
    payload: { updatedAt: '2026-01-01T00:00:00Z' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Post-terminal modification of finished match',
    operation: 'update',
    path: '/matches/M_TEST_FINISHED',
    actor: { uid: 'user_b', emailVerified: true },
    payload: { winnerUid: 'user_b' },
    expected: 'PERMISSION_DENIED',
  },
];
