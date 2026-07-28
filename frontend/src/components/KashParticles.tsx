import React, { useMemo } from 'react';

interface Particle {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  blur: number;
  opacity: number;
  svgType: number;
}

const KashParticles: React.FC = () => {
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 18 + 12,
      duration: Math.random() * 12 + 10,
      delay: Math.random() * 10,
      blur: Math.random() > 0.6 ? 1 : 0,
      opacity: Math.random() * 0.5 + 0.3,
      svgType: i % 3,
    }));
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute animate-kash"
          style={{
            left: `${p.left}%`,
            top: `-5%`,
            width: `${p.size}px`,
            height: `${p.size * 1.6}px`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            filter: p.blur ? `blur(${p.blur}px)` : 'none',
            opacity: p.opacity,
          }}
        >
          {p.svgType === 0 ? (
            <svg viewBox="0 0 24 36" fill="none" className="w-full h-full text-paper/80">
              <path
                d="M12 2C12 2 18 10 18 18C18 24 14 34 12 34C10 34 6 24 6 18C6 10 12 2 12 2Z"
                fill="currentColor"
                fillOpacity="0.4"
              />
              <path
                d="M12 4C12 4 16 12 16 19C16 24 13 32 12 32"
                stroke="#E5B05C"
                strokeWidth="0.8"
                strokeOpacity="0.7"
              />
            </svg>
          ) : p.svgType === 1 ? (
            <svg viewBox="0 0 20 30" fill="none" className="w-full h-full text-[#E5B05C]/70">
              <ellipse cx="10" cy="15" rx="6" ry="12" fill="currentColor" fillOpacity="0.5" />
              <path d="M10 3V27" stroke="#FAF6ED" strokeWidth="0.7" />
            </svg>
          ) : (
            <svg viewBox="0 0 18 28" fill="none" className="w-full h-full text-paper/90">
              <path
                d="M9 1C9 1 15 8 15 14C15 20 11 27 9 27C7 27 3 20 3 14C3 8 9 1 9 1Z"
                fill="currentColor"
                fillOpacity="0.6"
              />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
};

export default KashParticles;
