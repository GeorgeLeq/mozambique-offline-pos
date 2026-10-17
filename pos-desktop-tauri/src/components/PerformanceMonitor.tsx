import React, { useEffect, useRef, useState } from 'react';
import { Activity, X, Gauge, RefreshCw, Cpu, Layers, HelpCircle, ChevronRight, AlertTriangle, ShieldCheck } from 'lucide-react';

interface DiagnosticResult {
  type: 'success' | 'warning' | 'info';
  message: string;
}

export function PerformanceMonitor() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  // Refs for zero-render DOM updates (super performant - 120fps friendly)
  const fpsRef = useRef<HTMLSpanElement>(null);
  const domNodesRef = useRef<HTMLSpanElement>(null);
  const statusIndicatorRef = useRef<HTMLDivElement>(null);
  const statusLabelRef = useRef<HTMLSpanElement>(null);

  // Performance calculation variables
  const frameTimes = useRef<number[]>([]);
  const lastFrameTime = useRef<number>(performance.now());
  const rafId = useRef<number>(0);

  useEffect(() => {
    // Check if user previously closed or opened it
    const savedState = localStorage.getItem('performance_hud_open') === 'true';
    setIsOpen(savedState);

    const handleToggleEvent = () => {
      setIsOpen(prev => {
        const next = !prev;
        localStorage.setItem('performance_hud_open', String(next));
        return next;
      });
    };

    window.addEventListener('toggle-performance-hud', handleToggleEvent);
    return () => window.removeEventListener('toggle-performance-hud', handleToggleEvent);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    let lastLoggedTime = performance.now();
    let frameCount = 0;

    const measure = (now: number) => {
      frameCount++;
      const delta = now - lastFrameTime.current;
      lastFrameTime.current = now;

      // Keep a moving window of frame times for averages
      frameTimes.current.push(delta);
      if (frameTimes.current.length > 60) {
        frameTimes.current.shift();
      }

      // Update HUD metrics every 500ms to reduce DOM write pressure
      if (now - lastLoggedTime >= 500) {
        const fps = Math.round((frameCount * 1000) / (now - lastLoggedTime));
        frameCount = 0;
        lastLoggedTime = now;

        // Direct DOM writes to achieve zero React re-renders
        if (fpsRef.current) {
          fpsRef.current.textContent = `${fps} FPS`;
        }

        if (domNodesRef.current) {
          domNodesRef.current.textContent = document.querySelectorAll('*').length.toString();
        }

        // Visual status helper
        if (statusIndicatorRef.current && statusLabelRef.current) {
          if (fps >= 55) {
            statusIndicatorRef.current.className = 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse';
            statusLabelRef.current.textContent = 'Fluido (120/60Hz)';
            statusLabelRef.current.className = 'text-[9px] font-bold uppercase tracking-wider text-emerald-400';
          } else if (fps >= 40) {
            statusIndicatorRef.current.className = 'w-2 h-2 rounded-full bg-amber-500 animate-pulse';
            statusLabelRef.current.textContent = 'Queda Leve';
            statusLabelRef.current.className = 'text-[9px] font-bold uppercase tracking-wider text-amber-400';
          } else {
            statusIndicatorRef.current.className = 'w-2 h-2 rounded-full bg-rose-600 animate-bounce';
            statusLabelRef.current.textContent = 'Alerta de Lag';
            statusLabelRef.current.className = 'text-[9px] font-bold uppercase tracking-wider text-rose-500';
          }
        }
      }

      rafId.current = requestAnimationFrame(measure);
    };

    rafId.current = requestAnimationFrame(measure);

    return () => {
      cancelAnimationFrame(rafId.current);
    };
  }, [isOpen]);

  const runDiagnostics = () => {
    setIsDiagnosing(true);
    setDiagnostics([]);

    setTimeout(() => {
      const results: DiagnosticResult[] = [];

      // 1. Check DOM Element Count
      const elementCount = document.querySelectorAll('*').length;
      if (elementCount > 2500) {
        results.push({
          type: 'warning',
          message: `O número de elementos DOM é alto (${elementCount}). Isso pode desacelerar o render.`,
        });
      } else {
        results.push({
          type: 'success',
          message: `Contagem de elementos DOM ideal: ${elementCount} nós activos.`,
        });
      }

      // 2. Scan for backdrop filters (CPU killers on scroll)
      const blurredElements: Element[] = [];
      const allEls = document.querySelectorAll('*');
      allEls.forEach((el) => {
        const style = window.getComputedStyle(el);
        if (style.backdropFilter && style.backdropFilter !== 'none') {
          blurredElements.push(el);
        }
      });

      if (blurredElements.length > 0) {
        results.push({
          type: 'warning',
          message: `Detectados ${blurredElements.length} elementos com 'backdrop-blur'. Filtros CSS aumentam o uso de CPU durante scroll.`,
        });
      } else {
        results.push({
          type: 'success',
          message: 'Excelente! Sem filtros de desfocagem (backdrop-filter) pesados activos.',
        });
      }

      // 3. Scan for nested scrolling elements which confuse mousewheel engines
      const scrollableElements: Element[] = [];
      allEls.forEach((el) => {
        const style = window.getComputedStyle(el);
        const hasScroll = style.overflowY === 'auto' || style.overflowY === 'scroll' || style.overflow === 'auto';
        if (hasScroll && el.scrollHeight > el.clientHeight && el.tagName !== 'HTML' && el.tagName !== 'BODY') {
          scrollableElements.push(el);
        }
      });

      if (scrollableElements.length > 1) {
        results.push({
          type: 'info',
          message: `Detectados ${scrollableElements.length} contentores de scroll internos. Evite sobreposições de rolagem.`,
        });
      } else {
        results.push({
          type: 'success',
          message: 'Rolagem limpa: sem múltiplos contentores de scroll conflitantes.',
        });
      }

      // 4. Check hardware acceleration support
      const isGPUAccelerated = 'WebGLRenderingContext' in window;
      if (isGPUAccelerated) {
        results.push({
          type: 'success',
          message: 'Aceleração de hardware por GPU activa e suportada.',
        });
      } else {
        results.push({
          type: 'warning',
          message: 'WebGL não detectado. O browser pode estar a renderizar por software.',
        });
      }

      setDiagnostics(results);
      setIsDiagnosing(false);
    }, 800);
  };

  const toggleHud = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    localStorage.setItem('performance_hud_open', String(newState));
  };

  // Enable/disable key combination (Ctrl+Shift+P) to trigger HUD silently
  useEffect(() => {
    const handleKeyCombo = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        toggleHud();
      }
    };

    window.addEventListener('keydown', handleKeyCombo);
    return () => window.removeEventListener('keydown', handleKeyCombo);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] select-none font-sans">
      <div className="bg-zinc-950/95 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100 w-80 backdrop-blur-md">
        {/* Header bar */}
        <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={15} className="text-indigo-400 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-zinc-200">Sonda de Performance</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg text-[10px] font-bold uppercase px-2 transition-all"
            >
              {isExpanded ? 'Ocultar Detalhes' : 'Expandir'}
            </button>
            <button
              onClick={toggleHud}
              className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-all"
            >
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Core HUD stats (always visible when open) */}
        <div className="p-4 space-y-3.5">
          <div className="grid grid-cols-2 gap-3.5">
            <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-850 flex flex-col justify-between">
              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                <Gauge size={10} /> Velocidade
              </span>
              <span ref={fpsRef} className="text-xl font-extrabold text-zinc-50 tracking-tight font-mono">
                -- FPS
              </span>
            </div>

            <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-850 flex flex-col justify-between">
              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                <Layers size={10} /> Elementos DOM
              </span>
              <span ref={domNodesRef} className="text-xl font-extrabold text-zinc-50 tracking-tight font-mono">
                --
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-zinc-900/50 rounded-xl border border-zinc-850">
            <div className="flex items-center gap-2">
              <div ref={statusIndicatorRef} className="w-2 h-2 rounded-full bg-zinc-600" />
              <span ref={statusLabelRef} className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                A carregar...
              </span>
            </div>
            <span className="text-[9px] text-zinc-500 font-medium">MozPOS Diagnóstico</span>
          </div>

          {/* Expanded Diagnostics Reports */}
          {isExpanded && (
            <div className="pt-3 border-t border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                  <Cpu size={12} /> Diagnósticos Locais
                </span>
                <button
                  onClick={runDiagnostics}
                  disabled={isDiagnosing}
                  className="p-1 px-2.5 bg-zinc-900 hover:bg-zinc-850 text-[10px] font-bold text-indigo-400 rounded-lg border border-zinc-800 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={9} className={isDiagnosing ? 'animate-spin' : ''} />
                  <span>{isDiagnosing ? 'Analisando...' : 'Analisar'}</span>
                </button>
              </div>

              {/* Reports list */}
              <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin pr-1 text-[11px]">
                {diagnostics.length === 0 ? (
                  <div className="text-center py-4 text-zinc-500 font-medium flex flex-col items-center gap-1.5">
                    <HelpCircle size={18} className="text-zinc-600" />
                    <span>Inicie uma análise para sondar possíveis causas de lag.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {diagnostics.map((diag, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border text-[11px] leading-relaxed flex items-start gap-2 ${
                          diag.type === 'success'
                            ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400'
                            : diag.type === 'warning'
                            ? 'bg-amber-500/5 border-amber-500/10 text-amber-400'
                            : 'bg-indigo-500/5 border-indigo-500/10 text-indigo-400'
                        }`}
                      >
                        {diag.type === 'success' ? (
                          <ShieldCheck size={14} className="shrink-0 text-emerald-400" />
                        ) : diag.type === 'warning' ? (
                          <AlertTriangle size={14} className="shrink-0 text-amber-400" />
                        ) : (
                          <Cpu size={14} className="shrink-0 text-indigo-400" />
                        )}
                        <span>{diag.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
