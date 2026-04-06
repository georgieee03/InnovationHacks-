import CursorSpotlight from './CursorSpotlight';
import ParticleGrid from './ParticleGrid';

export default function AmbientBackground({ children, className = '' }) {
  return (
    <div className={`app-background ${className}`.trim()}>
      <div className="animated-bg" />
      <ParticleGrid />
      <div className="noise-overlay" />
      <CursorSpotlight />
      {children}
    </div>
  );
}
