import * as THREE from 'three';
import { isFirstBounceOut } from './WorldPhysics';

describe('WorldPhysics first-bounce court checks', () => {
  test('calls a wide shot out on first bounce', () => {
    const bounce = new THREE.Vector3(6.5, 0.1, -5);
    expect(isFirstBounceOut(bounce, 'AI')).toBe(true);
  });

  test('calls a deep shot out on first bounce', () => {
    const bounce = new THREE.Vector3(0, 0.1, -13.5);
    expect(isFirstBounceOut(bounce, 'AI')).toBe(true);
  });

  test('keeps a legal shot in', () => {
    const bounce = new THREE.Vector3(2, 0.1, -7);
    expect(isFirstBounceOut(bounce, 'AI')).toBe(false);
  });

  test('calls player deuce serve out when it lands in the wrong service box', () => {
    const wrongDiagonalBounce = new THREE.Vector3(-1.2, 0.1, -4.8);
    expect(isFirstBounceOut(wrongDiagonalBounce, 'AI', { isServe: true, serveSide: 'DEUCE', hitter: 'PLAYER' })).toBe(true);
  });

  test('keeps player ad serve in when it lands in the correct service box', () => {
    const legalBounce = new THREE.Vector3(-2.3, 0.1, -4.9);
    expect(isFirstBounceOut(legalBounce, 'AI', { isServe: true, serveSide: 'AD', hitter: 'PLAYER' })).toBe(false);
  });

  test('calls AI deuce serve out when it lands in the wrong service box', () => {
    const wrongDiagonalBounce = new THREE.Vector3(1.1, 0.1, 4.6);
    expect(isFirstBounceOut(wrongDiagonalBounce, 'PLAYER', { isServe: true, serveSide: 'DEUCE', hitter: 'AI' })).toBe(true);
  });

  test('keeps AI ad serve in when it lands in the correct service box', () => {
    const legalBounce = new THREE.Vector3(2.1, 0.1, 4.8);
    expect(isFirstBounceOut(legalBounce, 'PLAYER', { isServe: true, serveSide: 'AD', hitter: 'AI' })).toBe(false);
  });
});
