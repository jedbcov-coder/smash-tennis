import { useEffect, useRef, useState, useCallback } from 'react';

export function usePlayerInput() {
  const mouseX = useRef(0);
  const mouseY = useRef(0);
  const isMouseDown = useRef(false);
  const [isSwinging, setIsSwinging] = useState(false);
  const [isVisualSwinging, setIsVisualSwinging] = useState(false);

  const clearSwingInput = useCallback(() => {
    setIsSwinging(false);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.current = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY.current = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const handleMouseDown = () => {
      isMouseDown.current = true;
      setIsSwinging(true);
      setIsVisualSwinging(true);
      setTimeout(() => setIsVisualSwinging(false), 260); // approx visual duration
    };

    const handleMouseUp = () => {
      isMouseDown.current = false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSwinging(true);
        setIsVisualSwinging(true);
        setTimeout(() => setIsVisualSwinging(false), 260);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return {
    mouseX,
    mouseY,
    isMouseDown,
    isSwinging,
    isVisualSwinging,
    clearSwingInput,
    handleSwing: () => setIsSwinging(true)
  };
}
