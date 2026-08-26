/**
 * useReveal — Route and section entry reveal hook using GSAP.
 *
 * Uses gsap.from with autoAlpha so elements are never permanently hidden.
 * Clears inline props on completion to ensure zero visibility side-effects.
 * Respects prefers-reduced-motion via gsap.matchMedia.
 */

import { useRef } from 'react';
import { gsap, useGSAP, DURATION, EASE, STAGGER, MOTION_OK } from '../lib/motion';

interface UseRevealOptions {
  /** CSS selector for the children to reveal inside the scoped container. Default: '.reveal-item' */
  selector?: string;
  /** Duration in seconds. Default: DURATION.normal (0.3) */
  duration?: number;
  /** Stagger in seconds. Default: STAGGER.default (0.05) */
  stagger?: number;
  /** translateY start in px. Default: 10 */
  yOffset?: number;
}

export function useReveal(options: UseRevealOptions = {}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    selector = '.reveal-item',
    duration = DURATION.normal,
    stagger: staggerVal = STAGGER.default,
    yOffset = 10,
  } = options;

  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add(MOTION_OK, () => {
      const items = containerRef.current?.querySelectorAll(selector);
      if (!items || items.length === 0) return;

      // Cap stagger to max 8 items
      const cappedItems = Array.from(items).slice(0, STAGGER.maxItems);

      gsap.from(cappedItems, {
        autoAlpha: 0,
        y: yOffset,
        duration,
        stagger: staggerVal,
        ease: EASE.reveal,
        clearProps: 'opacity,visibility,transform',
      });
    });

    return () => mm.revert();
  }, { scope: containerRef });

  return containerRef;
}
