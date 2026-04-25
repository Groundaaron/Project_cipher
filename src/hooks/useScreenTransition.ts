import { useCallback, useRef } from 'react';
import anime from 'animejs';

export type Screen = 'start' | 'game' | 'end' | 'leaderboard';

export function useScreenTransition() {
  const containerRef = useRef<HTMLDivElement>(null);

  const transitionTo = useCallback((callback: () => void, direction: 'in' | 'out' = 'out') => {
    if (!containerRef.current) {
      callback();
      return;
    }

    if (direction === 'out') {
      anime({
        targets: containerRef.current,
        opacity: [1, 0],
        translateY: [0, -20],
        scale: [1, 0.97],
        duration: 350,
        easing: 'easeInCubic',
        complete: () => {
          callback();
          // Animate in after React re-render
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              if (containerRef.current) {
                anime({
                  targets: containerRef.current,
                  opacity: [0, 1],
                  translateY: [20, 0],
                  scale: [0.97, 1],
                  duration: 450,
                  easing: 'easeOutCubic',
                });
              }
            });
          });
        },
      });
    } else {
      callback();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (containerRef.current) {
            anime({
              targets: containerRef.current,
              opacity: [0, 1],
              translateY: [20, 0],
              scale: [0.97, 1],
              duration: 450,
              easing: 'easeOutCubic',
            });
          }
        });
      });
    }
  }, []);

  const animateIn = useCallback(() => {
    if (!containerRef.current) return;
    anime({
      targets: containerRef.current,
      opacity: [0, 1],
      translateY: [20, 0],
      scale: [0.97, 1],
      duration: 600,
      easing: 'easeOutCubic',
    });
  }, []);

  return { containerRef, transitionTo, animateIn };
}
