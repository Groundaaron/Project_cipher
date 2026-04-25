import { useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../hooks/useTheme';

interface ConfettiParticle {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  rotation: number;
  speed: number;
  drift: number;
  opacity: number;
  spin: number;
}

interface ConfettiProps {
  active: boolean;
  duration?: number;
  particleCount?: number;
  originY?: number;
  originX?: number;
  spread?: number;
  onDone?: () => void;
}

const LIGHT_COLORS = ['#b8a9d9', '#8ea3d1', '#e8a2b8', '#f5d0c5', '#ffffff', '#c4b5e0'];
const DARK_COLORS = ['#ca4fe3', '#6d4ecc', '#4a1d78', '#60a5fa', '#22c55e', '#f59e0b'];

export default function Confetti({
  active,
  duration = 2500,
  particleCount = 60,
  originY = 0,
  originX = 0.5,
  spread = 1,
  onDone,
}: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const { theme } = useTheme();

  const spawn = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
    const particles: ConfettiParticle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.random() - 0.5) * Math.PI * spread;
      const speed = Math.random() * 4 + 2;
      particles.push({
        x: canvas.width * originX + (Math.random() - 0.5) * 200,
        y: canvas.height * originY - Math.random() * 40,
        w: Math.random() * 8 + 4,
        h: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        speed: speed,
        drift: Math.sin(angle) * 1.5,
        opacity: 1,
        spin: (Math.random() - 0.5) * 8,
      });
    }

    const startTime = performance.now();
    const fadeStart = duration * 0.6;

    const draw = (now: number) => {
      const elapsed = now - startTime;
      if (elapsed > duration) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onDone?.();
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const globalFade = elapsed > fadeStart ? 1 - (elapsed - fadeStart) / (duration - fadeStart) : 1;

      for (const p of particles) {
        p.y += p.speed;
        p.x += p.drift + Math.sin(elapsed * 0.003 + p.rotation) * 0.5;
        p.rotation += p.spin;
        p.opacity = globalFade;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        if (theme === 'dark') {
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 6;
        }

        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
  }, [theme, duration, particleCount, originX, originY, spread, onDone]);

  useEffect(() => {
    if (active) {
      spawn();
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, spawn]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 100 }}
    />
  );
}
