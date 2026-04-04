import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function MagneticButton({ children, className, onClick, ...props }) {
  const buttonRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    const handleMouseMove = (e) => {
      const rect = button.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distanceX = e.clientX - centerX;
      const distanceY = e.clientY - centerY;
      const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
      const maxDistance = 60;
      if (distance < maxDistance) {
        const strength = (maxDistance - distance) / maxDistance;
        setPosition({ x: distanceX * strength * 0.3, y: distanceY * strength * 0.3 });
      } else {
        setPosition({ x: 0, y: 0 });
      }
    };

    const handleMouseLeave = () => setPosition({ x: 0, y: 0 });

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    button.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      button.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <motion.button ref={buttonRef} className={className} onClick={onClick}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      whileTap={{ scale: 0.95 }} {...props}
    >
      {children}
    </motion.button>
  );
}
