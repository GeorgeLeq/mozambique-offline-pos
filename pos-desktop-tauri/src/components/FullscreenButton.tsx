import React from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { useFullscreen } from '../lib/useFullscreen';

interface FullscreenButtonProps {
  className?: string;
  showLabel?: boolean;
}

export function FullscreenButton({ className = '', showLabel = false }: FullscreenButtonProps) {
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  return (
    <button
      onClick={toggleFullscreen}
      className={`p-2 bg-slate-100 hover:bg-indigo-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 rounded-xl transition-all cursor-pointer border border-slate-200/80 dark:border-zinc-800 flex items-center gap-1.5 text-xs font-bold shadow-xs ${className}`}
      title={isFullscreen ? 'Sair do Ecrã Inteiro (F11)' : 'Ecrã Inteiro Zero Barras (F11)'}
    >
      {isFullscreen ? <Minimize2 size={14} className="text-indigo-500" /> : <Maximize2 size={14} />}
      {showLabel && (
        <span className="hidden sm:inline">
          {isFullscreen ? 'Sair (F11)' : 'Ecrã Cheio (F11)'}
        </span>
      )}
    </button>
  );
}
