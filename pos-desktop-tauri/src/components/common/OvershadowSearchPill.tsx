import React, { useState, useRef, useEffect } from 'react';
import { Search, X, CornerDownLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OvershadowSearchPillProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  isFocusMode?: boolean;
  resultsCount?: number;
  id?: string;
}

export function OvershadowSearchPill({
  value,
  onChange,
  placeholder = 'Pesquisar...',
  isFocusMode = false,
  resultsCount,
  id = 'overshadow-search-pill'
}: OvershadowSearchPillProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus input on expand
  useEffect(() => {
    if (isExpanded) {
      // Small timeout to guarantee ref mounted
      const t = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
      return () => clearTimeout(t);
    }
  }, [isExpanded]);

  // Global keyboard shortcut to open search (unless typing in another input)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle on Ctrl+K / Cmd+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsExpanded(prev => !prev);
        return;
      }

      // Open on "/" when not already typing
      if (e.key === '/' && !isExpanded) {
        const activeTag = document.activeElement?.tagName;
        if (activeTag !== 'INPUT' && activeTag !== 'TEXTAREA') {
          e.preventDefault();
          setIsExpanded(true);
        }
      }

      // Close on Escape
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  // Click outside to collapse
  useEffect(() => {
    if (!isExpanded) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded]);

  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange('');
    inputRef.current?.focus();
  };

  return (
    <div id={id} ref={containerRef} className="flex items-center">
      {/* Collapsed Pill Button */}
      {!isExpanded && (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className={`flex items-center gap-1.5 rounded-xl border transition-all cursor-pointer active:scale-95 shrink-0 ${
            isFocusMode ? 'px-2 py-1 text-xs' : 'px-2.5 py-1.5 text-xs'
          } ${
            value
              ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700/60 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs'
              : 'bg-slate-100/80 dark:bg-zinc-900 border-slate-200/60 dark:border-white/10 hover:border-indigo-500/50 text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 shadow-2xs'
          }`}
          title={value ? `Pesquisa ativa: "${value}". Clique para alterar.` : 'Pesquisar (/ ou ⌘K)'}
        >
          <Search size={14} className={value ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'} />
          {value ? (
            <div className="flex items-center gap-1">
              <span className="max-w-[110px] truncate font-bold">{value}</span>
              <button
                type="button"
                onClick={handleClear}
                className="p-0.5 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400"
                title="Limpar pesquisa"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <span className="hidden sm:inline-block text-[10px] font-mono text-slate-400 dark:text-zinc-500 font-bold">
              /
            </span>
          )}
        </button>
      )}

      {/* Expanded Overshadowing Overlay */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.99 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute inset-x-2 sm:inset-x-3 top-1 bottom-1 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md rounded-xl border border-indigo-500 shadow-xl flex items-center gap-2.5 px-3"
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
              <Search size={15} />
            </div>

            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="flex-1 min-w-0 bg-transparent text-xs font-bold text-slate-900 dark:text-zinc-100 placeholder-slate-400 outline-none"
            />

            {resultsCount !== undefined && (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 shrink-0">
                {resultsCount} result.
              </span>
            )}

            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer shrink-0"
                title="Limpar pesquisa"
              >
                <X size={14} />
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 text-[10px] font-bold tracking-wide transition-colors cursor-pointer shrink-0 flex items-center gap-1 border border-slate-200/60 dark:border-white/5"
              title="Fechar (Esc)"
            >
              <span>Fechar</span>
              <kbd className="hidden sm:inline-block px-1 py-0.2 bg-white dark:bg-zinc-800 rounded text-[9px] border border-slate-300 dark:border-zinc-700 font-mono text-slate-500">
                Esc
              </kbd>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
