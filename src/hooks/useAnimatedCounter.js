import { useState, useEffect, useRef } from 'react';

/**
 * Animates a number from 0 → target over `duration` ms.
 * Uses easeOutExpo for a satisfying deceleration effect.
 */
export function useAnimatedCounter(target, duration = 1200, enabled = true) {
  const [value, setValue] = useState(0);
  const startRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!enabled || target === 0) { setValue(target); return; }

    const startValue = 0;
    const diff = target - startValue;

    const easeOutExpo = t => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

    const animate = (timestamp) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutExpo(progress);
      setValue(Math.round(startValue + diff * eased));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    startRef.current = null;
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, enabled]);

  return value;
}

export default useAnimatedCounter;
