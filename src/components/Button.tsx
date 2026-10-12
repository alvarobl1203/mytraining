import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-grad-brand text-white shadow-cta hover:shadow-cta-hover active:shadow-cta',
  secondary:
    'border border-zinc-800 bg-zinc-900/70 text-zinc-200 hover:border-zinc-700 hover:bg-zinc-900',
  ghost:
    'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60',
  danger:
    'border border-red-500/30 bg-red-500/5 text-red-400 hover:bg-red-500/10',
};

const SIZES: Record<Size, string> = {
  sm: 'px-3.5 py-2 text-xs rounded-xl gap-1.5',
  md: 'px-4 py-2.5 text-sm rounded-2xl gap-2',
  lg: 'px-5 py-3 text-sm rounded-2xl gap-2',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-semibold
        transition-all duration-200 active:scale-[0.98]
        disabled:opacity-50 disabled:active:scale-100
        ${VARIANTS[variant]}
        ${SIZES[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={14} />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}