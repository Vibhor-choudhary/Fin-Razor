import { useState, useEffect, useRef, useCallback } from 'react';

interface UseGuidedTraceProps {
  totalItems: number;
  intervalMs?: number;
  resumeDelayMs?: number;
  initialIndex?: number;
}

export function useGuidedTrace({
  totalItems,
  intervalMs = 4200,
  resumeDelayMs = 12000,
  initialIndex = 0
}: UseGuidedTraceProps) {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  const containerRef = useRef<HTMLElement | null>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoplayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check prefers-reduced-motion
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false
  );

  const clearTimers = useCallback(() => {
    if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
  }, []);

  const handleInteraction = useCallback(() => {
    if (prefersReducedMotion.current) return;
    setIsPaused(true);
    clearTimers();
    
    // Start resume timer
    resumeTimerRef.current = setTimeout(() => {
      setIsPaused(false);
    }, resumeDelayMs);
  }, [clearTimers, resumeDelayMs]);

  const selectItem = useCallback((index: number) => {
    setSelectedIndex(index);
    handleInteraction();
  }, [handleInteraction]);

  // Handle visibility with IntersectionObserver
  useEffect(() => {
    if (prefersReducedMotion.current) return;
    
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 } // At least 10% visible
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Main autoplay effect
  useEffect(() => {
    if (prefersReducedMotion.current || isPaused || !isVisible || totalItems <= 1) {
      if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
      return;
    }

    autoplayTimerRef.current = setInterval(() => {
      setSelectedIndex((prev) => (prev + 1) % totalItems);
    }, intervalMs);

    return () => {
      if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
    };
  }, [isPaused, isVisible, totalItems, intervalMs]);

  // Keyboard navigation support within the container
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % totalItems);
        handleInteraction();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
        handleInteraction();
      }
    };

    // Attach to the container so it only works when focused inside
    node.addEventListener('keydown', handleKeyDown);
    return () => node.removeEventListener('keydown', handleKeyDown);
  }, [totalItems, handleInteraction]);

  return {
    selectedIndex,
    selectItem,
    containerRef,
    isPaused
  };
}
