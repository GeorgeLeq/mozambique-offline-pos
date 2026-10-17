import React, { useState } from 'react';
import { 
  Sparkles, 
  Download, 
  X, 
  RefreshCw, 
  ChevronRight, 
  MessageCircle,
  Info 
} from 'lucide-react';
import { useAppUpdate } from '../contexts/UpdateContext';

export default function UpdateBanner() {
  const { 
    updateInfo, 
    isUpdating, 
    updateProgress, 
    updateStatusText,
    isSoftPromptDismissed, 
    dismissSoftPrompt, 
    startUpdate,
    openWhatsAppSupport 
  } = useAppUpdate();

  const [showNotes, setShowNotes] = useState(false);

  // Only show if soft update is available, not hard blocked, and not dismissed
  if (!updateInfo || !updateInfo.isSoftUpdateAvailable || updateInfo.isHardBlocked || isSoftPromptDismissed) {
    return null;
  }

  return (
    <div 
      id="update-soft-prompt-banner"
      className="relative z-50 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 px-3 py-2 shadow-md border-b border-amber-600/30 select-none"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 sm:gap-4">
        {/* Left message with version tag */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-950/10 text-slate-950">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <div className="text-xs sm:text-sm font-semibold truncate">
            <span>Nova versão </span>
            <span className="font-mono font-bold bg-slate-950/15 px-1.5 py-0.5 rounded text-slate-950">
              v{updateInfo.latestVersion}
            </span>
            <span className="hidden md:inline"> disponível! Melhorias no desempenho e estabilidade.</span>
          </div>

          {updateInfo.updateNotes && (
            <button
              id="btn-toggle-update-notes"
              type="button"
              onClick={() => setShowNotes(!showNotes)}
              className="hidden lg:inline-flex items-center gap-1 text-[11px] font-medium text-slate-900 underline underline-offset-2 hover:text-black ml-1"
            >
              <Info className="w-3 h-3" />
              {showNotes ? 'Ocultar notas' : 'Ver novidades'}
            </button>
          )}
        </div>

        {/* Right action buttons */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <button
            id="btn-banner-update-now"
            type="button"
            disabled={isUpdating}
            onClick={startUpdate}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 ${
              isUpdating
                ? 'bg-slate-950/20 text-slate-900 cursor-not-allowed'
                : 'bg-slate-950 text-white hover:bg-slate-900'
            }`}
          >
            {isUpdating ? (
              <>
                <RefreshCw className="h-3 w-3 animate-spin text-amber-400" />
                <span>A atualizar ({updateProgress}%)...</span>
              </>
            ) : (
              <>
                <Download className="h-3 w-3" />
                <span>Atualizar Agora</span>
              </>
            )}
          </button>

          <button
            id="btn-banner-dismiss"
            type="button"
            onClick={dismissSoftPrompt}
            title="Lembrar mais tarde"
            className="p-1 rounded-lg text-slate-900 hover:bg-slate-950/10 transition-colors"
            aria-label="Lembrar mais tarde"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Expandable release notes popup */}
      {showNotes && updateInfo.updateNotes && (
        <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-slate-950/15 text-xs text-slate-900 flex items-start justify-between gap-4">
          <p className="leading-relaxed bg-slate-950/5 p-2 rounded-lg">
            <strong>O que mudou:</strong> {updateInfo.updateNotes}
          </p>
          <button
            type="button"
            onClick={() => openWhatsAppSupport('Dúvidas sobre a actualização')}
            className="shrink-0 text-[11px] font-semibold text-slate-900 flex items-center gap-1 hover:underline"
          >
            <MessageCircle className="w-3 h-3 text-emerald-800" />
            Suporte WhatsApp
          </button>
        </div>
      )}

      {/* Progress status if actively downloading in banner */}
      {isUpdating && updateStatusText && (
        <div className="max-w-7xl mx-auto mt-1.5 text-[11px] font-medium text-slate-900 flex items-center gap-2">
          <div className="w-24 bg-slate-950/20 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-slate-950 h-full rounded-full transition-all duration-300"
              style={{ width: `${updateProgress}%` }}
            />
          </div>
          <span className="truncate">{updateStatusText}</span>
        </div>
      )}
    </div>
  );
}
