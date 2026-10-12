import { useState } from 'react';
import { Dumbbell } from 'lucide-react';

interface Props {
  src?: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: 'h-10 w-10 rounded-lg',
  md: 'h-20 w-20 rounded-xl',
  lg: 'h-40 w-full rounded-2xl',
};

export function ExerciseImage({
  src,
  alt,
  size = 'md',
  className = '',
}: Props) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const baseCls = `${SIZES[size]} object-cover bg-zinc-800 ${className}`;

  if (!src || error) {
    return (
      <div
        className={`${baseCls} flex items-center justify-center border border-zinc-800/60 text-zinc-600`}
        aria-label={alt}
      >
        <Dumbbell
          size={size === 'sm' ? 16 : size === 'md' ? 26 : 40}
          strokeWidth={1.8}
        />
      </div>
    );
  }

  return (
    <div className={`${baseCls} relative overflow-hidden`}>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-zinc-800" />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`h-full w-full object-cover transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}