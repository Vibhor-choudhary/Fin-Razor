/**
 * useCountUp — Animate a numeric value from 0 to target on first appearance.
 *
 * Uses GSAP proxy object animation. Respects prefers-reduced-motion.
 * Returns the current display value as a number.
 */

import { useState, useRef, useEffect } from 'react';
import { gsap, DURATION, EASE, prefersReducedMotion } from '../lib/motion';

interface UseCountUpOptions {
  /** The target number to animate to. */
  value: number;
  /** Duration in seconds. Default: DURATION.countUp (1.0) */
  duration?: number;
  /** Number of decimal places. Default: 0 */
  decimals?: number;
}

export function useCountUp({ value, duration = DURATION.countUp, decimals = 0 }: UseCountUpOptions): number {
  const [displayValue, setDisplayValue] = useState(0);
  const hasAnimated = useRef(false);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    // Only animate on first appearance with a real value
    if (hasAnimated.current || value === 0 || value === undefined) {
      setDisplayValue(value || 0);
      return;
    }

    // Reduced motion: set final value immediately
    if (prefersReducedMotion()) {
      setDisplayValue(value);
      hasAnimated.current = true;
      return;
    }

    hasAnimated.current = true;

    const proxy = { val: 0 };
    tweenRef.current = gsap.to(proxy, {
      val: value,
      duration,
      ease: EASE.reveal,
      onUpdate: () => {
        setDisplayValue(Number(proxy.val.toFixed(decimals)));
      },
    });

    return () => {
      tweenRef.current?.kill();
    };
  }, [value, duration, decimals]);

  return displayValue;
}
