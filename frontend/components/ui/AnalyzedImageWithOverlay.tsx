'use client';

import Image from 'next/image';
import React from 'react';

interface BoundingBox {
  x: number; // relative (0-1)
  y: number;
  width: number;
  height: number;
}

interface ComponentWithBox {
  name: string;
  bounding_box: BoundingBox;
  [key: string]: any;
}

interface Props {
  imageData: string; // base64
  components: ComponentWithBox[];
  onComponentClick: (component: ComponentWithBox) => void;
}

export default function AnalyzedImageWithOverlay({ imageData, components, onComponentClick }: Props) {
  // We'll use a ref to get the image size for absolute positioning
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [imgSize, setImgSize] = React.useState({ width: 1, height: 1 });

  React.useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setImgSize({ width: rect.width, height: rect.height });
    }
  }, [imageData]);

  return (
    <div ref={containerRef} className="relative w-full max-w-[400px] mx-auto">
      <img
        src={`data:image/jpeg;base64,${imageData}`}
        alt="Analyzed"
        className="w-full h-auto rounded-lg"
        onLoad={e => {
          const target = e.target as HTMLImageElement;
          setImgSize({ width: target.offsetWidth, height: target.offsetHeight });
        }}
      />
      {components.map((component, idx) => {
        const { x, y, width, height } = component.bounding_box;
        return (
          <button
            key={idx}
            className="absolute border-2 border-meta-pink bg-meta-pink/10 rounded-md cursor-pointer transition hover:bg-meta-pink/30"
            style={{
              left: `${x * imgSize.width}px`,
              top: `${y * imgSize.height}px`,
              width: `${width * imgSize.width}px`,
              height: `${height * imgSize.height}px`,
            }}
            onClick={() => onComponentClick(component)}
            title={component.name}
          >
            <span className="sr-only">{component.name}</span>
          </button>
        );
      })}
    </div>
  );
} 