import { useEffect, useRef, useState, useCallback } from 'react';

export type PlayerInputSource = 'mouse' | 'keyboard' | 'gamepad';

const MOVEMENT_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD']);
const KEYBOARD_MOVEMENT_SPEED = 1.65;
const GAMEPAD_MOVEMENT_SPEED = 1.8;
const GAMEPAD_DEAD_ZONE = 0.18;
const SWING_ANIMATION_MS = 260;
const SWING_INPUT_WINDOW_MS = 260;
const GAMEPAD_SWING_BUTTONS = [0, 7]; // A / Cross, or right trigger
const GAMEPAD_SPECIAL_BUTTONS = [3]; // Y / Triangle
const POINTER_MOUSE_COMPAT_BLOCK_MS = 450;

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
  const activePointerId = useRef<number | null>(null);
  const shouldBlockMouseEventsUntil = useRef(0);
  const pressedKeys = useRef(new Set<string>());
  const gamepadSwingWasPressed = useRef(false);
  const gamepadSpecialWasPressed = useRef(false);
  const animationFrameId = useRef<number | null>(null);
  const previousFrameTime = useRef<number | null>(null);
  const swingAnimationTimeout = useRef<number | null>(null);
  const swingInputTimeout = useRef<number | null>(null);
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

    if (swingInputTimeout.current !== null) {
      window.clearTimeout(swingInputTimeout.current);
    }

    swingInputTimeout.current = window.setTimeout(() => {
      setIsSwinging(false);
      swingInputTimeout.current = null;
    }, SWING_INPUT_WINDOW_MS);

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
    if (swingInputTimeout.current !== null) {
      window.clearTimeout(swingInputTimeout.current);
      swingInputTimeout.current = null;
    }

    setIsSwinging(false);
  }, []);

  const clearSpecialMoveInput = useCallback(() => {
    setIsSpecialMovePressed(false);
  }, []);

  useEffect(() => {
    const updateInputFromClientPoint = (clientX: number, clientY: number) => {
      mouseX.current = clampInputAxis((clientX / window.innerWidth) * 2 - 1);
      mouseY.current = clampInputAxis(-(clientY / window.innerHeight) * 2 + 1);
    };

    const blockMouseCompatEvents = () => {
      shouldBlockMouseEventsUntil.current = Date.now() + POINTER_MOUSE_COMPAT_BLOCK_MS;
    };

    const shouldIgnoreMouseEvent = () => Date.now() <= shouldBlockMouseEventsUntil.current;

    const handleMouseMove = (e: MouseEvent) => {
      if (shouldIgnoreMouseEvent()) {
        return;
      }

      updateInputFromClientPoint(e.clientX, e.clientY);
      setActiveInputSource('mouse');
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (shouldIgnoreMouseEvent()) {
        return;
      }

      if (isMenuOrFormTarget(e.target)) {
        return;
      }

      isMouseDown.current = true;
      triggerSwing('mouse');
    };

    const handleMouseUp = () => {
      if (shouldIgnoreMouseEvent()) {
        return;
      }

      isMouseDown.current = false;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (isMenuOrFormTarget(e.target)) {
        return;
      }

      updateInputFromClientPoint(e.clientX, e.clientY);
      setActiveInputSource('mouse');

      if (e.pointerType !== 'mouse') {
        e.preventDefault();
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (isMenuOrFormTarget(e.target)) {
        return;
      }

      activePointerId.current = e.pointerId;
      isMouseDown.current = true;
      updateInputFromClientPoint(e.clientX, e.clientY);
      setActiveInputSource('mouse');
      triggerSwing('mouse');

      if (e.pointerType !== 'mouse') {
        blockMouseCompatEvents();
        e.preventDefault();
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (activePointerId.current !== null && activePointerId.current !== e.pointerId) {
        return;
      }

      activePointerId.current = null;
      isMouseDown.current = false;

      if (e.pointerType !== 'mouse') {
        blockMouseCompatEvents();
        e.preventDefault();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isMenuOrFormTarget(e.target)) {
        return;
      }

      if (e.touches.length === 0) {
        return;
      }

      const primaryTouch = e.touches[0];
      updateInputFromClientPoint(primaryTouch.clientX, primaryTouch.clientY);
      setActiveInputSource('mouse');
      e.preventDefault();
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
    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerdown', handlePointerDown, { passive: false });
    window.addEventListener('pointerup', handlePointerUp, { passive: false });
    window.addEventListener('pointercancel', handlePointerUp, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    animationFrameId.current = window.requestAnimationFrame(pollGamepads);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);

      if (animationFrameId.current !== null) {
        window.cancelAnimationFrame(animationFrameId.current);
      }

      if (swingAnimationTimeout.current !== null) {
        window.clearTimeout(swingAnimationTimeout.current);
      }

      if (swingInputTimeout.current !== null) {
        window.clearTimeout(swingInputTimeout.current);
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
