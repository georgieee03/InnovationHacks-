import { motion, useScroll, useSpring } from 'framer-motion';

const MotionDiv = motion.div;

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 28,
    mass: 0.2,
  });

  return (
    <MotionDiv
      aria-hidden="true"
      className="scroll-progress fixed left-0 right-0 top-[88px] z-[35] h-px origin-left"
      style={{ scaleX }}
    />
  );
}
