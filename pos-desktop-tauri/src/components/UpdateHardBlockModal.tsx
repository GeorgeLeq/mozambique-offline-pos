import React from 'react';
import { 
  AlertOctagon, 
  Download, 
  RefreshCw, 
  MessageCircle, 
  ShieldAlert, 
  CheckCircle2, 
  WifiOff 
} from 'lucide-react';
import { useAppUpdate } from '../contexts/UpdateContext';

export default function UpdateHardBlockModal() {
  const { 
    updateInfo, 
    isUpdating, 
    updateProgress, 
    updateStatusText, 
    updateError, 
    startUpdate, 
    openWhatsAppSupport 
  } = useAppUpdate();

  if (!updateInfo || !updateInfo.isHardBlocked) {
    return null;
  }

  const isFailed = Boolean(updateError);

  return (
    <div 
      id="update-hard-block-overlay"
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-4 sm:p-6 overflow-y-auto"
      role="alertdialog"
      aria-modal="true"
    >
      <div 
        id="update-hard-block-card"
        className="w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-rose-500/30 rounded-3xl shadow-2xl shadow-rose-950/40 p-6 sm:p-8 text-white relative overflow-hidden"
      >
        {/* Glowing top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600" />

        {/* Warning Icon Badge */}
        <div className="flex items-center justify-center mb-5">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 shadow-inner">
            <AlertOctagon className="w-9 h-9 animate-pulse" />
          </div>
        </div>

        {/* Header Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold tracking-wider uppercase mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            Actualização Obrigatória
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            A sua versão expirou
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-md mx-auto">
            Para garantir a integridade das vendas, relatórios fiscais e conformidade com a base de dados central, é <strong className="text-rose-400 font-semibold">obrigatório atualizar</strong> para continuar a vender.
          </p>
        </div>

        {/* Version Badge Comparator */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between gap-2 text-xs font-mono">
            <div className="text-left">
              <span className="block text-slate-500 text-[10px] uppercase font-sans font-semibold tracking-wider">Versão Actual</span>
              <span className="inline-block mt-0.5 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20">
                v{updateInfo.currentVersion}
              </span>
            </div>
            <div className="text-slate-600 flex items-center gap-1">
              <span>➔</span>
            </div>
            <div className="text-right">
              <span className="block text-slate-500 text-[10px] uppercase font-sans font-semibold tracking-wider">Versão Mínima</span>
              <span className="inline-block mt-0.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                v{updateInfo.minVersion}
              </span>
            </div>
          </div>

          {updateInfo.updateNotes && (
            <div className="mt-3 pt-3 border-t border-slate-800/80 text-left">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Novidades da Versão:
              </span>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/50">
                {updateInfo.updateNotes}
              </p>
            </div>
          )}
        </div>

        {/* Progress Bar (Visible when updating) */}
        {isUpdating && (
          <div className="mb-6 bg-slate-950 border border-indigo-500/30 rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs font-medium mb-2">
              <span className="text-indigo-400 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                {updateStatusText || 'A transferir actualização...'}
              </span>
              <span className="text-white font-mono font-bold">{updateProgress}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${updateProgress}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 text-center mt-2.5">
              Por favor não feche o computador. O sistema reiniciará automaticamente.
            </p>
          </div>
        )}

        {/* Error Alert */}
        {isFailed && (
          <div className="mb-6 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs">
            <WifiOff className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold text-rose-200">Falha no download da actualização</strong>
              {updateError || 'Verifique a ligação à internet ou solicite o instalador por WhatsApp.'}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            id="btn-update-now"
            type="button"
            disabled={isUpdating}
            onClick={startUpdate}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg transition-all duration-200 ${
              isUpdating
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-rose-600 via-rose-500 to-orange-500 hover:from-rose-500 hover:to-orange-400 text-white shadow-rose-900/30 active:scale-[0.98]'
            }`}
          >
            {isUpdating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                A Actualizar ({updateProgress}%)...
              </>
            ) : isFailed ? (
              <>
                <RefreshCw className="w-5 h-5" />
                Tentar Atualizar Novamente
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Atualizar Agora
              </>
            )}
          </button>

          {/* WhatsApp Support Rescue Link */}
          <button
            id="btn-whatsapp-rescue"
            type="button"
            onClick={() => openWhatsAppSupport('Bloqueio Obrigatório: Versão Expirada')}
            className="w-full py-3 px-4 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>Pedir Ajuda no WhatsApp (+258 87 166 8217)</span>
          </button>
        </div>

        {/* Note */}
        <div className="mt-5 text-center text-[11px] text-slate-500">
          Mozambique POS • Actualização Automática Over-The-Air (OTA)
        </div>
      </div>
    </div>
  );
}
