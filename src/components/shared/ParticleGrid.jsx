import { useEffect, useMemo, useRef } from 'react';
import useTheme from '../../hooks/useTheme';

const MOBILE_SPACING = 92;
const DESKTOP_SPACING = 68;
const MAX_DISTANCE = 252;
const CONNECTION_DISTANCE = 124;
const POINTER_GLOW_RADIUS = 320;
const POINTER_EASING = 0.14;
const POINTER_EASING_REDUCED = 0.24;
const INTENSITY_EASING = 0.12;
const INTENSITY_EASING_REDUCED = 0.22;
const FORCE_STRENGTH = 1.32;
const FORCE_STRENGTH_REDUCED = 0.34;
const RETURN_STRENGTH = 0.074;
const RETURN_STRENGTH_REDUCED = 0.11;
const DAMPING = 0.86;
const DAMPING_REDUCED = 0.78;
const SETTLE_DISTANCE = 0.24;
const SETTLE_VELOCITY = 0.025;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export default function ParticleGrid() {
  const { theme } = useTheme();
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const pointerTargetRef = useRef({ x: 0, y: 0, intensity: 0 });
  const pointerCurrentRef = useRef({ x: 0, y: 0, intensity: 0 });
  const rafRef = useRef(null);
  const viewportRef = useRef({ width: 0, height: 0 });
  const reducedMotionRef = useRef(false);
  const palette = useMemo(
    () => (
      theme === 'light'
        ? {
            baseLineColor: '15, 23, 42',
            baseLineOpacity: 0.118,
            reactiveLineColor: '0, 207, 49',
            reactiveLineOpacity: 0.32,
            particleFill: 'rgba(15, 23, 42, 0.24)',
            particleGlow: 'rgba(0, 207, 49, 0.22)',
            particleCore: 'rgba(0, 207, 49, 0.94)',
            pointerGlow: [
              [0, 'rgba(255, 255, 255, 0.26)'],
              [0.18, 'rgba(255, 255, 255, 0.12)'],
              [0.46, 'rgba(0, 207, 49, 0.16)'],
              [0.78, 'rgba(0, 207, 49, 0.055)'],
              [1, 'rgba(0, 207, 49, 0)'],
            ],
          }
        : {
            baseLineColor: '255, 255, 255',
            baseLineOpacity: 0.155,
            reactiveLineColor: '88, 255, 134',
            reactiveLineOpacity: 0.4,
            particleFill: 'rgba(255, 255, 255, 0.28)',
            particleGlow: 'rgba(0, 207, 49, 0.2)',
            particleCore: 'rgba(188, 255, 207, 0.96)',
            pointerGlow: [
              [0, 'rgba(255, 255, 255, 0.12)'],
              [0.2, 'rgba(255, 255, 255, 0.06)'],
              [0.48, 'rgba(0, 207, 49, 0.12)'],
              [0.8, 'rgba(0, 207, 49, 0.04)'],
              [1, 'rgba(0, 207, 49, 0)'],
            ],
          }
    ),
    [theme],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    function initParticles(viewportWidth, viewportHeight) {
      particlesRef.current = [];
      const isMobile = viewportWidth < 768;
      const spacing = isMobile ? MOBILE_SPACING : DESKTOP_SPACING;
      const cols = Math.max(4, Math.ceil(viewportWidth / spacing));
      const rows = Math.max(4, Math.ceil(viewportHeight / spacing));
      const gapX = cols > 1 ? viewportWidth / (cols - 1) : viewportWidth;
      const gapY = rows > 1 ? viewportHeight / (rows - 1) : viewportHeight;

      for (let column = 0; column < cols; column += 1) {
        for (let row = 0; row < rows; row += 1) {
          particlesRef.current.push({
            x: column * gapX,
            y: row * gapY,
            baseX: column * gapX,
            baseY: row * gapY,
            vx: 0,
            vy: 0,
            reactive: 0,
          });
        }
      }
    }

    function drawFrame() {
      const { width, height } = viewportRef.current;
      const pointerTarget = pointerTargetRef.current;
      const pointerCurrent = pointerCurrentRef.current;
      const reducedMotion = reducedMotionRef.current;

      const pointerEasing = reducedMotion ? POINTER_EASING_REDUCED : POINTER_EASING;
      const intensityEasing = reducedMotion ? INTENSITY_EASING_REDUCED : INTENSITY_EASING;

      pointerCurrent.x += (pointerTarget.x - pointerCurrent.x) * pointerEasing;
      pointerCurrent.y += (pointerTarget.y - pointerCurrent.y) * pointerEasing;
      pointerCurrent.intensity += (pointerTarget.intensity - pointerCurrent.intensity) * intensityEasing;

      ctx.clearRect(0, 0, width, height);

      if (pointerCurrent.intensity > 0.01) {
        const pointerGlow = ctx.createRadialGradient(
          pointerCurrent.x,
          pointerCurrent.y,
          0,
          pointerCurrent.x,
          pointerCurrent.y,
          POINTER_GLOW_RADIUS * (0.8 + pointerCurrent.intensity * 0.2),
        );

        palette.pointerGlow.forEach(([stop, color]) => {
          pointerGlow.addColorStop(stop, color);
        });

        ctx.fillStyle = pointerGlow;
        ctx.fillRect(0, 0, width, height);
      }

      const particles = particlesRef.current;
      let hasParticleMomentum = false;

      for (let index = 0; index < particles.length; index += 1) {
        const particle = particles[index];
        const dx = pointerCurrent.x - particle.x;
        const dy = pointerCurrent.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const reactiveStrength = pointerCurrent.intensity > 0
          ? Math.max(0, 1 - distance / MAX_DISTANCE) * pointerCurrent.intensity
          : 0;

        if (reactiveStrength > 0) {
          const force = Math.pow(reactiveStrength, 1.55) * (reducedMotion ? FORCE_STRENGTH_REDUCED : FORCE_STRENGTH);
          const angle = Math.atan2(dy, dx);
          particle.vx -= Math.cos(angle) * force;
          particle.vy -= Math.sin(angle) * force;
        }

        particle.vx += (particle.baseX - particle.x) * (reducedMotion ? RETURN_STRENGTH_REDUCED : RETURN_STRENGTH);
        particle.vy += (particle.baseY - particle.y) * (reducedMotion ? RETURN_STRENGTH_REDUCED : RETURN_STRENGTH);
        particle.vx *= reducedMotion ? DAMPING_REDUCED : DAMPING;
        particle.vy *= reducedMotion ? DAMPING_REDUCED : DAMPING;
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.reactive = reactiveStrength;

        if (
          Math.abs(particle.vx) > SETTLE_VELOCITY
          || Math.abs(particle.vy) > SETTLE_VELOCITY
          || Math.abs(particle.baseX - particle.x) > SETTLE_DISTANCE
          || Math.abs(particle.baseY - particle.y) > SETTLE_DISTANCE
        ) {
          hasParticleMomentum = true;
        }
      }

      for (let index = 0; index < particles.length; index += 1) {
        const particle = particles[index];

        for (let connectionIndex = index + 1; connectionIndex < particles.length; connectionIndex += 1) {
          const otherParticle = particles[connectionIndex];
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance >= CONNECTION_DISTANCE) {
            continue;
          }

          const midpointX = (particle.x + otherParticle.x) / 2;
          const midpointY = (particle.y + otherParticle.y) / 2;
          const pointerDistance = Math.sqrt(
            (pointerCurrent.x - midpointX) * (pointerCurrent.x - midpointX)
            + (pointerCurrent.y - midpointY) * (pointerCurrent.y - midpointY),
          );
          const pointerProximity = pointerCurrent.intensity > 0
            ? Math.max(0, 1 - pointerDistance / (MAX_DISTANCE * 1.12)) * pointerCurrent.intensity
            : 0;
          const connectionStrength = (1 - distance / CONNECTION_DISTANCE);

          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(otherParticle.x, otherParticle.y);
          ctx.strokeStyle = `rgba(${palette.baseLineColor}, ${palette.baseLineOpacity * connectionStrength})`;
          ctx.lineWidth = 1;
          ctx.stroke();

          if (pointerProximity > 0.015) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.strokeStyle = `rgba(${palette.reactiveLineColor}, ${palette.reactiveLineOpacity * pointerProximity * (0.7 + connectionStrength * 0.3)})`;
            ctx.lineWidth = 1.15;
            ctx.stroke();
          }
        }
      }

      for (let index = 0; index < particles.length; index += 1) {
        const particle = particles[index];
        const highlight = particle.reactive;
        const particleRadius = 1.75 + highlight * 1.35;

        if (highlight > 0.01) {
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particleRadius * 2.4, 0, Math.PI * 2);
          ctx.fillStyle = palette.particleGlow;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particleRadius, 0, Math.PI * 2);
        ctx.fillStyle = highlight > 0.02 ? palette.particleCore : palette.particleFill;
        ctx.fill();
      }

      const pointerSettled = Math.abs(pointerTarget.x - pointerCurrent.x) < 0.18
        && Math.abs(pointerTarget.y - pointerCurrent.y) < 0.18
        && Math.abs(pointerTarget.intensity - pointerCurrent.intensity) < 0.008;

      return hasParticleMomentum || !pointerSettled;
    }

    function animate() {
      const shouldContinue = drawFrame();

      if (shouldContinue) {
        rafRef.current = window.requestAnimationFrame(animate);
      } else {
        rafRef.current = null;
      }
    }

    function scheduleFrame() {
      if (!rafRef.current) {
        rafRef.current = window.requestAnimationFrame(animate);
      }
    }

    function resizeCanvas() {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const centerX = viewportWidth / 2;
      const centerY = viewportHeight / 2;
      const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);

      viewportRef.current = { width: viewportWidth, height: viewportHeight };
      canvas.width = Math.floor(viewportWidth * devicePixelRatio);
      canvas.height = Math.floor(viewportHeight * devicePixelRatio);
      canvas.style.width = `${viewportWidth}px`;
      canvas.style.height = `${viewportHeight}px`;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

      if (viewportWidth > 0 && viewportHeight > 0) {
        if (pointerCurrentRef.current.x === 0 && pointerCurrentRef.current.y === 0) {
          pointerCurrentRef.current.x = centerX;
          pointerCurrentRef.current.y = centerY;
          pointerTargetRef.current.x = centerX;
          pointerTargetRef.current.y = centerY;
        } else {
          pointerCurrentRef.current.x = clamp(pointerCurrentRef.current.x, 0, viewportWidth);
          pointerCurrentRef.current.y = clamp(pointerCurrentRef.current.y, 0, viewportHeight);
          pointerTargetRef.current.x = clamp(pointerTargetRef.current.x, 0, viewportWidth);
          pointerTargetRef.current.y = clamp(pointerTargetRef.current.y, 0, viewportHeight);
        }
      }

      initParticles(viewportWidth, viewportHeight);
      drawFrame();
      scheduleFrame();
    }

    function settlePointer() {
      pointerTargetRef.current.intensity = 0;
      scheduleFrame();
    }

    function handlePointerMove(event) {
      pointerTargetRef.current.x = event.clientX;
      pointerTargetRef.current.y = event.clientY;
      pointerTargetRef.current.intensity = reducedMotionRef.current ? 0.26 : 1;
      scheduleFrame();
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        settlePointer();
        return;
      }

      drawFrame();
      scheduleFrame();
    }

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleReducedMotionChange = (event) => {
      reducedMotionRef.current = event.matches;
      pointerTargetRef.current.intensity = event.matches
        ? Math.min(pointerTargetRef.current.intensity, 0.26)
        : pointerTargetRef.current.intensity > 0
          ? 1
          : 0;
      scheduleFrame();
    };

    reducedMotionRef.current = reducedMotionQuery.matches;
    resizeCanvas();

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('blur', settlePointer);
    document.documentElement.addEventListener('mouseleave', settlePointer);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (reducedMotionQuery.addEventListener) {
      reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
    } else {
      reducedMotionQuery.addListener(handleReducedMotionChange);
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('blur', settlePointer);
      document.documentElement.removeEventListener('mouseleave', settlePointer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (reducedMotionQuery.removeEventListener) {
        reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
      } else {
        reducedMotionQuery.removeListener(handleReducedMotionChange);
      }
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [palette]);

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
