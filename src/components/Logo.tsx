import { Dumbbell, Zap } from 'lucide-react';

export default function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dims = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-14 w-14' };
  const iconSize = { sm: 18, md: 22, lg: 30 };
  const textSize = { sm: 'text-lg', md: 'text-xl', lg: 'text-3xl' };

  return (
    <div className="flex items-center gap-2">
      <div
        className={`${dims[size]} rounded-xl gradient-brand flex items-center justify-center shadow-glow`}
      >
        <Dumbbell size={iconSize[size]} className="text-white" strokeWidth={2.5} />
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`${textSize[size]} font-extrabold tracking-tight text-white`}>
          My
        </span>
        <span className={`${textSize[size]} font-extrabold tracking-tight gradient-brand-text`}>
          Training
        </span>
        <Zap size={size === 'lg' ? 18 : 14} className="text-cyan-400 fill-cyan-400" />
      </div>
    </div>
  );
}
