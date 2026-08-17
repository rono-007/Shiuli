import React from 'react';

const SectionDivider: React.FC = () => {
  return (
    <div
      className="w-full relative z-20 pointer-events-none select-none"
      style={{
        // The image height is 223px on a 2172px width = 10.267% of width.
        // We pull the entire divider up by its total height to overlap the hero.
        marginTop: '-6.35%',
        marginBottom: 0,
        padding: 0,
        // Ensure the container height matches the image height
        display: 'flex',
        transform: 'translateY(-2px)',
      }}
    >
      {/* 
        Instead of CSS border-radius, we use an inline SVG to precisely draw the mask 
        in the exact same coordinate system as the original 2172x223 image.
        The terracotta arch is slightly wider at the base than a perfect semi-circle.
        This SVG path perfectly traces the inside of the arch and the bottom section.
      */}
      <svg
        viewBox="0 0 2172 223"
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: -1 }}
        preserveAspectRatio="none"
      >
        <path 
          d="
            M 0 138 
            L 946 138 
            A 138 128 0 0 1 1222 138 
            L 2172 138 
            L 2172 223 
            L 0 223 Z
          "
          fill="#FAF5EC"
        />
      </svg>

      <img
        src="/divider-cropped.png"
        alt=""
        style={{
          display: 'block',
          width: '100%',
          height: 'auto',
          margin: 0,
          padding: 0,
          zIndex: 1
        }}
      />
    </div>
  );
};

export default SectionDivider;
