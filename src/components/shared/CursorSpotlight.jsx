import { useEffect, useRef } from 'react';
import { useCursorPosition } from '../../hooks/useCursorPosition';

export default function CursorSpotlight() {
  const position = useCursorPosition();
  const spotlightRef = useRef(null);

  useEffect(() => {
    if (spotlightRef.current) {
      spotlightRef.current.style.transform = `translate(${position.x}px, ${position.y}px)`;
    }
  }, [position]);

  return (
    <div
      ref={spotlightRef}
      className="cursor-spotlight"
      style={{
        position: 'fixed',
        top: '-200px',
        left: '-200px',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.08) 0%, rgba(168, 85, 247, 0.05) 40%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 5,
        willChange: 'transform',
        transition: 'transform 0.15s ease-out',
      }}
    />
  );
}
