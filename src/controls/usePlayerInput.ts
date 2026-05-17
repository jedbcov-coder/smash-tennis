import { useEffect, useRef, useState, useCallback } from 'react';

export type PlayerInputSource = 'mouse' | 'keyboard' | 'gamepad';

const MOVEMENT_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD']);
const KEYBOARD_MOVEMENT_SPEED = 1.65;
const GAMEPAD_MOVEMENT_SPEED = 1.8;
const GAMEPAD_DEAD_ZONE = 0.18;
const SWING_ANIMATION_MS = 260;
const GAMEPAD_SWING_BUTTONS = [0, 7]; // A / Cross, or right trigger
const GAMEPAD_SPECIAL_BUTTONS = [3]; // Y / Triangle

function isMenuOrFormTarget(target: EventTarget | null) {
  return target instanceof Element && target.closest('button, a, input, select, textarea, [role="button"]');
}

function clampInputAxis(value: number) {
  return Math.max(-1, Math.min(1, value));
}

function applyDeadZone(value: number) {
  if (Math.abs(value) < GAMEPAD_DEAD_ZONE) return 0;
  return value;
}

function isGamepadButtonPressed(gamepad: Gamepad, buttonIndexes: number[]) {
  return buttonIndexes.some((buttonIndex) => gamepad.buttons[buttonIndex]?.pressed);
}

export function usePlayerInput() {
  const mouseX = useRef(0);
  const mouseY = useRef(0);
  const isMouseDown = useRef(false);
  const pressedKeys = useRef(new Set<string>());
  const gamepadSwingWasPressed = useRef(false);
  const gamepadSpecialWasPressed = useRef(false);
  const animationFrameId = useRef<number | null>(null);
  const previousFrameTime = useRef<number | null>(null);
  const swingAnimationTimeout = useRef<number | null>(null);
  const inputSourceRef = useRef<PlayerInputSource>('mouse');

  const [inputSource, setInputSource] = useState<PlayerInputSource>('mouse');
  const [isSwinging, setIsSwinging] = useState(false);
  const [isVisualSwinging, setIsVisualSwinging] = useState(false);
  const [isSpecialMovePressed, setIsSpecialMovePressed] = useState(false);

  const setActiveInputSource = useCallback((source: PlayerInputSource) => {
    if (inputSourceRef.current === source) return;

    inputSourceRef.current = source;
    setInputSource(source);
  }, []);

  const triggerSwing = useCallback((source?: PlayerInputSource) => {
    if (source) {
      setActiveInputSource(source);
    }

    setIsSwinging(true);
    setIsVisualSwinging(true);

    if (swingAnimationTimeout.current !== null) {
      window.clearTimeout(swingAnimationTimeout.current);
    }

    swingAnimationTimeout.current = window.setTimeout(() => {
      setIsVisualSwinging(false);
      swingAnimationTimeout.current = null;
    }, SWING_ANIMATION_MS);
  }, [setActiveInputSource]);

  const clearSwingInput = useCallback(() => {
    setIsSwinging(false);
  }, []);

  const clearSpecialMoveInput = useCallback(() => {
    setIsSpecialMovePressed(false);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.current = clampInputAxis((e.clientX / window.innerWidth) * 2 - 1);
      mouseY.current = clampInputAxis(-(e.clientY / window.innerHeight) * 2 + 1);
      setActiveInputSource('mouse');
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (isMenuOrFormTarget(e.target)) {
        return;
      }

      isMouseDown.current = true;
      triggerSwing('mouse');
    };

    const handleMouseUp = () => {
      isMouseDown.current = false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isMenuOrFormTarget(e.target)) {
        return;
      }

      if (MOVEMENT_KEYS.has(e.code)) {
        e.preventDefault();
        pressedKeys.current.add(e.code);
        setActiveInputSource('keyboard');
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (!e.repeat) {
          triggerSwing('keyboard');
        }
      }

      if (e.code === 'KeyE') {
        e.preventDefault();
        if (!e.repeat) {
          setActiveInputSource('keyboard');
          setIsSpecialMovePressed(true);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!MOVEMENT_KEYS.has(e.code)) return;

      e.preventDefault();
      pressedKeys.current.delete(e.code);
    };

    const pollGamepads = (frameTime: number) => {
      const previousTime = previousFrameTime.current ?? frameTime;
      const deltaSeconds = Math.min((frameTime - previousTime) / 1000, 0.05);
      previousFrameTime.current = frameTime;

      const leftPressed = pressedKeys.current.has('ArrowLeft') || pressedKeys.current.has('KeyA');
      const rightPressed = pressedKeys.current.has('ArrowRight') || pressedKeys.current.has('KeyD');
      const upPressed = pressedKeys.current.has('ArrowUp') || pressedKeys.current.has('KeyW');
      const downPressed = pressedKeys.current.has('ArrowDown') || pressedKeys.current.has('KeyS');
      const keyboardX = Number(rightPressed) - Number(leftPressed);
      const keyboardY = Number(upPressed) - Number(downPressed);

      if (keyboardX !== 0 || keyboardY !== 0) {
        mouseX.current = clampInputAxis(mouseX.current + keyboardX * KEYBOARD_MOVEMENT_SPEED * deltaSeconds);
        mouseY.current = clampInputAxis(mouseY.current + keyboardY * KEYBOARD_MOVEMENT_SPEED * deltaSeconds);
      }

      const gamepads = navigator.getGamepads?.() ?? [];
      const gamepad = Array.from(gamepads).find((connectedGamepad) => connectedGamepad?.connected);

      if (gamepad) {
        const stickX = applyDeadZone(gamepad.axes[0] ?? 0);
        const stickY = applyDeadZone(gamepad.axes[1] ?? 0);
        const isStickMoving = stickX !== 0 || stickY !== 0;

        if (isStickMoving) {
          setActiveInputSource('gamepad');
          mouseX.current = clampInputAxis(mouseX.current + stickX * GAMEPAD_MOVEMENT_SPEED * deltaSeconds);
          mouseY.current = clampInputAxis(mouseY.current - stickY * GAMEPAD_MOVEMENT_SPEED * deltaSeconds);
        }

        const swingPressed = isGamepadButtonPressed(gamepad, GAMEPAD_SWING_BUTTONS);
        const specialPressed = isGamepadButtonPressed(gamepad, GAMEPAD_SPECIAL_BUTTONS);

        if (swingPressed && !gamepadSwingWasPressed.current) {
          triggerSwing('gamepad');
        }

        if (specialPressed && !gamepadSpecialWasPressed.current) {
          setActiveInputSource('gamepad');
          setIsSpecialMovePressed(true);
        }

        gamepadSwingWasPressed.current = swingPressed;
        gamepadSpecialWasPressed.current = specialPressed;
      } else {
        gamepadSwingWasPressed.current = false;
        gamepadSpecialWasPressed.current = false;
      }

      animationFrameId.current = window.requestAnimationFrame(pollGamepads);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    animationFrameId.current = window.requestAnimationFrame(pollGamepads);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);

      if (animationFrameId.current !== null) {
        window.cancelAnimationFrame(animationFrameId.current);
      }

      if (swingAnimationTimeout.current !== null) {
        window.clearTimeout(swingAnimationTimeout.current);
      }
    };
  }, [setActiveInputSource, triggerSwing]);

  return {
    mouseX,
    mouseY,
    isMouseDown,
    inputSource,
    isSwinging,
    isVisualSwinging,
    isSpecialMovePressed,
    clearSwingInput,
    clearSpecialMoveInput,
    handleSwing: () => triggerSwing()
  };
}
