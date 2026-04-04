import { useEffect, useRef } from 'react';

export default function ParticleGrid() {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const isMobile = window.innerWidth < 768;
    
    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    // Initialize particles
    const initParticles = () => {
      particlesRef.current = [];
      const cols = Math.floor(canvas.width / (isMobile ? 100 : 70));
      const rows = Math.floor(canvas.height / (isMobile ? 100 : 70));

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          particlesRef.current.push({
            x: i * (canvas.width / cols),
            y: j * (canvas.height / rows),
            baseX: i * (canvas.width / cols),
            baseY: j * (canvas.height / rows),
            vx: 0,
            vy: 0,
          });
        }
      }
    };

    // Mouse move handler
    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle) => {
        // Calculate distance from mouse
        const dx = mouseRef.current.x - particle.x;
        const dy = mouseRef.current.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 200;

        // Apply repulsion force (increased strength)
        if (distance < maxDistance) {
          const force = (maxDistance - distance) / maxDistance;
          const angle = Math.atan2(dy, dx);
          particle.vx -= Math.cos(angle) * force * 1.2;
          particle.vy -= Math.sin(angle) * force * 1.2;
        }

        // Apply spring force back to base position
        particle.vx += (particle.baseX - particle.x) * 0.08;
        particle.vy += (particle.baseY - particle.y) * 0.08;

        // Apply damping
        particle.vx *= 0.85;
        particle.vy *= 0.85;

        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(6, 182, 212, 0.25)';
        ctx.fill();

        // Draw connections to nearby particles
        particlesRef.current.forEach((otherParticle) => {
          const dx2 = particle.x - otherParticle.x;
          const dy2 = particle.y - otherParticle.y;
          const dist = Math.sqrt(dx2 * dx2 + dy2 * dy2);

          if (dist < 120 && dist > 0) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.strokeStyle = `rgba(6, 182, 212, ${0.1 * (1 - dist / 120)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="particle-grid"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
}
