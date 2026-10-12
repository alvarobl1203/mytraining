import { Loader2 } from 'lucide-react';

export function LoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <Loader2 className="animate-spin text-blue-500" size={28} />
    </div>
  );
}