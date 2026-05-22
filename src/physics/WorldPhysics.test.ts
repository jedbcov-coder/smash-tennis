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
});
