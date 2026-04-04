import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const MotionButton = motion.button;

export default function MagneticButton({ children, className, onClick, ...props }) {
  const buttonRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const button = buttonRef.current;
    if (!button || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const handleMouseMove = (event) => {
      const rect = button.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distanceX = event.clientX - centerX;
      const distanceY = event.clientY - centerY;
      const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
      const magneticRadius = 80;
      const magneticStrength = 0.3;

      if (distance < magneticRadius) {
        const strength = (magneticRadius - distance) / magneticRadius;
        setPosition({
          x: distanceX * strength * magneticStrength,
          y: distanceY * strength * magneticStrength,
        });
      } else {
        setPosition({ x: 0, y: 0 });
      }
    };

    const handleMouseLeave = () => {
      setPosition({ x: 0, y: 0 });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    button.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      button.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <MotionButton
      ref={buttonRef}
      className={className}
      onClick={onClick}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 380, damping: 24 }}
      whileHover={{
        scale: 1.02,
        boxShadow: '0 0 20px rgba(6, 182, 212, 0.2)',
      }}
      whileTap={{ scale: 0.96 }}
      {...props}
    >
      {children}
    </MotionButton>
  );
}
