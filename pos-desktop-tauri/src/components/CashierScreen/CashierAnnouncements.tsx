import React from 'react';
import { 
  Megaphone, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Clock, 
  User, 
  Bell,
  CheckCheck
} from 'lucide-react';
import { PosAnnouncement } from '../../lib/syncEngine/posAnnouncements';
import { motion, AnimatePresence } from 'motion/react';
import { useI18n } from '../../i18n';

interface CashierAnnouncementsProps {
  announcements: PosAnnouncement[];
  unreadCount: number;
  activeUrgentModal: PosAnnouncement | null;
  isDrawerOpen: boolean;
  onCloseDrawer: () => void;
  onAcknowledge: (id: string) => void;
  onAcknowledgeAll: () => void;
}

export function CashierAnnouncements({
  announcements,
  unreadCount,
  activeUrgentModal,
  isDrawerOpen,
  onCloseDrawer,
  onAcknowledge,
  onAcknowledgeAll
}: CashierAnnouncementsProps) {
  const t = useI18n();

  return (
    <>
      {/* 1. Urgent Announcement High-Priority Modal Overlay */}
      <AnimatePresence>
        {activeUrgentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 10 }}
              className="bg-white dark:bg-zinc-900 border-2 border-rose-500 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="bg-rose-600 px-6 py-4 flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                    <AlertTriangle size={22} className="text-white animate-bounce" />
                  </div>
                  <div>
                    <h2 className="text-base font-black tracking-wide uppercase">{t.urgentManagementNotice || 'Aviso Urgente da Gerência'}</h2>
                    <p className="text-xs text-rose-100 font-medium">{t.mandatoryAttention || 'Atenção obrigatória para o operador de caixa'}</p>
                  </div>
                </div>
              </div>

              {/* Body Content */}
              <div className="p-6 flex flex-col gap-4">
                <div className="p-4 bg-rose-50 dark:bg-rose-950/30 rounded-2xl border border-rose-200 dark:border-rose-900/40 text-slate-800 dark:text-zinc-100 text-sm font-bold leading-relaxed whitespace-pre-wrap">
                  {activeUrgentModal.message}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                  <span className="flex items-center gap-1">
                    <User size={12} />
                    {t.recipient || 'Destinatário:'} {activeUrgentModal.target_name || t.allCashiers || 'Todos os Caixas'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(activeUrgentModal.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Footer Confirmation Action */}
              <div className="p-4 bg-slate-50 dark:bg-zinc-950 border-t border-slate-200/80 dark:border-zinc-800 flex justify-end">
                <button
                  onClick={() => onAcknowledge(activeUrgentModal.id)}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all cursor-pointer border-0"
                >
                  <CheckCircle2 size={16} />
                  <span>{t.understoodConfirm || 'Entendido / Confirmar Leitura'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Slide-Over Announcements Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-40 flex justify-end bg-black/40 backdrop-blur-2xs">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="bg-white dark:bg-zinc-900 w-full max-w-md h-full shadow-2xl border-l border-slate-200/80 dark:border-zinc-800 flex flex-col"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-slate-200/80 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-950">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Megaphone size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{t.cashierAnnouncementsTitle || 'Comunicados do Caixa'}</h3>
                    <p className="text-[10px] text-slate-400 font-bold">{unreadCount} {t.pendingMessages || 'mensagem(ns) pendente(s)'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {unreadCount > 0 && (
                    <button
                      onClick={onAcknowledgeAll}
                      className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer border-0"
                      title={t.clearAll || 'Limpar Tudo'}
                    >
                      <CheckCheck size={12} />
                      <span className="hidden sm:inline">{t.clearAll || 'Limpar Tudo'}</span>
                    </button>
                  )}
                  <button
                    onClick={onCloseDrawer}
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Drawer List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {announcements.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-zinc-500 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                      <Bell size={24} className="text-slate-400" />
                    </div>
                    <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">{t.noPendingAnnouncements || 'Sem Comunicados Pendentes'}</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">
                      {t.announcementsHelp || 'As instruções da gestão ou mensagens urgentes enviadas pelo aplicativo aparecerão aqui.'}
                    </p>
                  </div>
                ) : (
                  announcements.map((ann) => {
                    const isUrgent = ann.priority === 'urgent';
                    const dateObj = new Date(ann.created_at);

                    return (
                      <div
                        key={ann.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col gap-2.5 ${
                          isUrgent
                            ? 'bg-rose-500/5 dark:bg-rose-950/20 border-rose-500/30'
                            : 'bg-slate-50 dark:bg-zinc-950/60 border-slate-200/80 dark:border-zinc-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                            isUrgent
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                              : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                          }`}>
                            {isUrgent ? <AlertTriangle size={10} /> : <Megaphone size={10} />}
                            <span>{isUrgent ? 'Urgente' : 'Informativo'}</span>
                          </span>

                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                            {dateObj.toLocaleDateString()} {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <p className="text-xs font-bold text-slate-800 dark:text-zinc-100 whitespace-pre-wrap leading-relaxed">
                          {ann.message}
                        </p>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-zinc-800/60">
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                            {t.recipient || 'Para:'} {ann.target_name || t.allCashiers || 'Todos os Caixas'}
                          </span>
                          <button
                            onClick={() => onAcknowledge(ann.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer shadow-2xs border-0"
                          >
                            <CheckCircle2 size={11} />
                            <span>{t.ok || 'Entendido'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
