/**
 * motion.ts — Shared GSAP motion module
 *
 * Single registration point for GSAP + ScrollTrigger.
 * All other files import from here instead of touching gsap directly.
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

// ─── Plugin Registration (once) ────────────────────────────────────────────
gsap.registerPlugin(ScrollTrigger);

// ─── Shared Timing Constants ───────────────────────────────────────────────
export const DURATION = {
  micro: 0.12,       // 120ms — button press, row highlight
  fast: 0.18,        // 180ms — chip, small interactive
  normal: 0.3,       // 300ms — reveal, crossfade
  slow: 0.7,         // 700ms — connector draw
  countUp: 1.0,      // 1000ms — metric count-up
} as const;

export const EASE = {
  reveal: 'power2.out',
  inOut: 'power2.inOut',
  snap: 'power1.out',
} as const;

export const STAGGER = {
  default: 0.05,     // 50ms
  maxItems: 8,
} as const;

// ─── Reduced Motion ────────────────────────────────────────────────────────

/** Runtime check — true if user prefers reduced motion. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Convenience: the media-query string to use with gsap.matchMedia()
 * so all GSAP animations only run when motion is NOT reduced.
 */
export const MOTION_OK = '(prefers-reduced-motion: no-preference)';

// ─── Re-exports ────────────────────────────────────────────────────────────
export { gsap, ScrollTrigger, useGSAP };
