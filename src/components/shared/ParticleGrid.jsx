import { useEffect, useMemo, useRef } from 'react';
import useTheme from '../../hooks/useTheme';

const MOBILE_SPACING = 92;
const DESKTOP_SPACING = 68;
const MAX_DISTANCE = 210;
const CONNECTION_DISTANCE = 118;

export default function ParticleGrid() {
  const { theme } = useTheme();
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const mouseRef = useRef({ x: Number.POSITIVE_INFINITY, y: Number.POSITIVE_INFINITY });
  const rafRef = useRef(null);
  const viewportRef = useRef({ width: 0, height: 0 });
  const reducedMotionRef = useRef(false);
  const palette = useMemo(() => (
    theme === 'light'
      ? {
          pointerGlow: [
            [0, 'rgba(255, 255, 255, 0.24)'],
            [0.26, 'rgba(0, 207, 49, 0.1)'],
            [0.58, 'rgba(0, 207, 49, 0.045)'],
            [1, 'rgba(0, 207, 49, 0)'],
          ],
          particleFill: 'rgba(15, 23, 42, 0.18)',
          lineOpacity: 0.085,
        }
      : {
          pointerGlow: [
            [0, 'rgba(255, 255, 255, 0.08)'],
            [0.28, 'rgba(255, 255, 255, 0.03)'],
            [0.62, 'rgba(0, 207, 49, 0.04)'],
            [1, 'rgba(0, 207, 49, 0)'],
          ],
          particleFill: 'rgba(255, 255, 255, 0.2)',
          lineOpacity: 0.11,
        }
  ), [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const resizeCanvas = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);

      viewportRef.current = { width: viewportWidth, height: viewportHeight };
      canvas.width = Math.floor(viewportWidth * devicePixelRatio);
      canvas.height = Math.floor(viewportHeight * devicePixelRatio);
      canvas.style.width = `${viewportWidth}px`;
      canvas.style.height = `${viewportHeight}px`;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

      initParticles(viewportWidth, viewportHeight);
      scheduleFrame();
    };

    const initParticles = (viewportWidth, viewportHeight) => {
      particlesRef.current = [];
      const isMobile = viewportWidth < 768;
      const spacing = isMobile ? MOBILE_SPACING : DESKTOP_SPACING;
      const cols = Math.max(4, Math.ceil(viewportWidth / spacing));
      const rows = Math.max(4, Math.ceil(viewportHeight / spacing));
      const gapX = cols > 1 ? viewportWidth / (cols - 1) : viewportWidth;
      const gapY = rows > 1 ? viewportHeight / (rows - 1) : viewportHeight;

      for (let i = 0; i < cols; i += 1) {
        for (let j = 0; j < rows; j += 1) {
          particlesRef.current.push({
            x: i * gapX,
            y: j * gapY,
            baseX: i * gapX,
            baseY: j * gapY,
            vx: 0,
            vy: 0,
          });
        }
      }
    };

    const drawFrame = () => {
      const { width, height } = viewportRef.current;
      ctx.clearRect(0, 0, width, height);

      if (Number.isFinite(mouseRef.current.x) && Number.isFinite(mouseRef.current.y)) {
        const pointerGlow = ctx.createRadialGradient(
          mouseRef.current.x,
          mouseRef.current.y,
          0,
          mouseRef.current.x,
          mouseRef.current.y,
          260,
        );
        palette.pointerGlow.forEach(([stop, color]) => {
          pointerGlow.addColorStop(stop, color);
        });
        ctx.fillStyle = pointerGlow;
        ctx.fillRect(0, 0, width, height);
      }

      let hasMomentum = false;

      for (let index = 0; index < particlesRef.current.length; index += 1) {
        const particle = particlesRef.current[index];
        const dx = mouseRef.current.x - particle.x;
        const dy = mouseRef.current.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (!reducedMotionRef.current && distance < MAX_DISTANCE) {
          const force = (MAX_DISTANCE - distance) / MAX_DISTANCE;
          const angle = Math.atan2(dy, dx);
          particle.vx -= Math.cos(angle) * force * 0.95;
          particle.vy -= Math.sin(angle) * force * 0.95;
        }

        particle.vx += (particle.baseX - particle.x) * (reducedMotionRef.current ? 0.14 : 0.065);
        particle.vy += (particle.baseY - particle.y) * (reducedMotionRef.current ? 0.14 : 0.065);
        particle.vx *= reducedMotionRef.current ? 0.76 : 0.87;
        particle.vy *= reducedMotionRef.current ? 0.76 : 0.87;
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (
          Math.abs(particle.vx) > 0.015
          || Math.abs(particle.vy) > 0.015
          || Math.abs(particle.baseX - particle.x) > 0.15
          || Math.abs(particle.baseY - particle.y) > 0.15
        ) {
          hasMomentum = true;
        }

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 1.9, 0, Math.PI * 2);
        ctx.fillStyle = palette.particleFill;
        ctx.fill();

        for (let connectionIndex = index + 1; connectionIndex < particlesRef.current.length; connectionIndex += 1) {
          const otherParticle = particlesRef.current[connectionIndex];
          const dx2 = particle.x - otherParticle.x;
          const dy2 = particle.y - otherParticle.y;
          const dist = Math.sqrt(dx2 * dx2 + dy2 * dy2);

          if (dist < CONNECTION_DISTANCE) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.strokeStyle = theme === 'light'
              ? `rgba(15, 23, 42, ${palette.lineOpacity * (1 - dist / CONNECTION_DISTANCE)})`
              : `rgba(255, 255, 255, ${palette.lineOpacity * (1 - dist / CONNECTION_DISTANCE)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      return hasMomentum;
    };

    const animate = () => {
      const hasMomentum = drawFrame();

      if (!reducedMotionRef.current || hasMomentum) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        rafRef.current = null;
      }
    };

    const scheduleFrame = () => {
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    const handlePointerMove = (event) => {
      mouseRef.current = { x: event.clientX, y: event.clientY };
      scheduleFrame();
    };

    const handlePointerLeave = () => {
      mouseRef.current = { x: Number.POSITIVE_INFINITY, y: Number.POSITIVE_INFINITY };
      scheduleFrame();
    };

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleReducedMotionChange = (event) => {
      reducedMotionRef.current = event.matches;
      scheduleFrame();
    };

    reducedMotionRef.current = reducedMotionQuery.matches;
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeave);
    window.addEventListener('blur', handlePointerLeave);

    if (reducedMotionQuery.addEventListener) {
      reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
    } else {
      reducedMotionQuery.addListener(handleReducedMotionChange);
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('blur', handlePointerLeave);
      if (reducedMotionQuery.removeEventListener) {
        reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
      } else {
        reducedMotionQuery.removeListener(handleReducedMotionChange);
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [palette, theme]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="particle-grid"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 2,
      }}
    />
  );
}
