import { useState, useEffect } from 'react';
import { IMAGES } from '../data/images';

const cropImages = [
  IMAGES.maizeField,
  IMAGES.maizeCloseup,
  IMAGES.maizeLeaves,
  IMAGES.maizeSunlit,
  IMAGES.beanVines,
  IMAGES.beanLeaves,
  IMAGES.cornField,
  IMAGES.greenField,
];

export function AnimatedBackground() {
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState<Set<number>>(new Set([0]));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(c => {
        const n = (c + 1) % cropImages.length;
        setLoaded(s => new Set(s).add(n));
        return n;
      });
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {cropImages.map((src, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-[2000ms] ease-in-out"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          <img
            src={src}
            alt=""
            className="w-full h-full object-cover"
            loading={i === 0 ? 'eager' : 'lazy'}
            onLoad={() => setLoaded(s => new Set(s).add(i))}
            style={{ display: loaded.has(i) ? 'block' : 'none' }}
          />
        </div>
      ))}
    </div>
  );
}
