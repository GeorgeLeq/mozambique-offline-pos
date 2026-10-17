import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Trash2, KeyRound, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { getDB } from '../../lib/db';
import { User } from '../../types';
import toast from 'react-hot-toast';
import { useCashierControlI18n } from '../../i18n';

interface EmergencyTokensModalProps {
  user: User;
  onClose: () => void;
}

export default function EmergencyTokensModal({ user, onClose }: EmergencyTokensModalProps) {
  const t = useCashierControlI18n();
  const [tokens, setTokens] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Client-side pagination states to replace infinite scrolling
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4; // 4 rows fit perfectly on screen without any vertical scrollbar

  useEffect(() => {
    loadTokens();
  }, [user]);

  const loadTokens = async () => {
    setIsLoading(true);
    try {
      const db = await getDB();
      // Clean up expired or used tokens locally
      try {
        await db.execute(
          "DELETE FROM emergency_tokens WHERE cashier_id = ? AND (datetime(expires_at) < datetime('now') OR is_used = 1)",
          [user.id]
        );
      } catch (e) {
        // Fallback cleanup if datetime function varies
      }

      const existingTokens = await db.select(
        'SELECT * FROM emergency_tokens WHERE cashier_id = ? ORDER BY created_at DESC',
        [user.id]
      ) as any[];

      // Filter out any expired tokens in memory just in case
      const validTokens = (existingTokens || []).filter(tItem => !tItem.expires_at || new Date(tItem.expires_at) > new Date());

      setTokens(validTokens);
      setCurrentPage(1); // Reset page on refresh/load
    } catch (e) {
      console.error('Failed to load tokens', e);
      toast.error(t.tokenLoadError || 'Erro ao carregar os códigos.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateTokens = async () => {
    try {
      const db = await getDB();
      
      // Generate 5 new tokens with 24-hour expiration
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      for (let i = 0; i < 5; i++) {
        const id = crypto.randomUUID();
        const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code!
        
        await db.execute(
          'INSERT INTO emergency_tokens (id, code, cashier_id, is_used, expires_at) VALUES (?, ?, ?, 0, ?)',
          [id, code, user.id, expiresAt]
        );
      }
      
      toast.success(t.tokensGeneratedSuccess || 'Lote de 5 novos códigos gerados (válidos por 24h)!');
      await loadTokens();
    } catch (e) {
      console.error('Failed to generate tokens', e);
      toast.error(t.tokenGenerateError || 'Erro ao gerar códigos.');
    }
  };
  
  const revokeToken = async (id: string) => {
    try {
      const db = await getDB();
      await db.execute('UPDATE emergency_tokens SET is_used = 1, sync_status = 0 WHERE id = ?', [id]);
      toast.success(t.tokenRevokedSuccess || 'Código revogado.');
      loadTokens();
    } catch (e) {
      console.error('Failed to revoke token', e);
      toast.error(t.tokenRevokeError || 'Erro ao revogar código.');
    }
  };

  // Pagination computations
  const totalPages = Math.ceil(tokens.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTokens = tokens.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 dark:bg-zinc-950/60 backdrop-blur-sm">
      {/* Backdrop tap to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="relative bg-white dark:bg-zinc-900 shadow-2xl h-full w-full max-w-2xl border-l border-slate-100 dark:border-zinc-800/80 flex flex-col z-50 overflow-hidden"
      >
        <div className="p-6 flex flex-col h-full">
          {/* Header section */}
          <div className="flex items-center justify-between mb-5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 dark:bg-rose-500/25 flex items-center justify-center border border-rose-500/20 shadow-inner">
                <ShieldAlert className="text-rose-600 dark:text-rose-400 w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800 dark:text-zinc-100 tracking-tight leading-none">
                  {t.tokensTitle || 'Fichas de Autenticação Rápida'}
                </h2>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
                    {(t.tableOperator || 'Operador')}: {user.name}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer border border-transparent dark:border-zinc-800"
            >
              ✕
            </button>
          </div>

          {/* Informative visual alert card */}
          <div className="bg-gradient-to-r from-rose-500/5 to-amber-500/5 border border-rose-500/10 dark:border-rose-500/20 p-4 rounded-2xl mb-5 shadow-inner shrink-0">
            <p className="text-xs font-semibold text-rose-800 dark:text-rose-350 leading-relaxed flex gap-2">
              💡 <span className="flex-1">
                {(t.tokensSubtitle || 'Códigos PIN temporários de uso único para {0}').replace('{0}', user.name)}. {(t.guideCard6Desc || 'Emita códigos de uso único para recuperação rápida de acessos esquecidos ou substituições.')}
              </span>
            </p>
          </div>

          {/* Generate button directly visible and premium */}
          <div className="mb-6 shrink-0">
            <button
              onClick={generateTokens}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-850 dark:bg-rose-600 dark:hover:bg-rose-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-slate-900/10 dark:shadow-rose-500/10 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <KeyRound size={15} className="stroke-[2.5]" />
              {t.generateNewTokensBtn || 'Gerar 5 Fichas (Válidas por 24h)'}
            </button>
          </div>

          {/* Tokens List / History */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <h3 className="text-xs font-extrabold text-slate-800 dark:text-zinc-300 uppercase tracking-wider">
                {t.activeTokens || 'Fichas Ativas'} ({tokens.length})
              </h3>
              {!isLoading && tokens.length > 0 && (
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono">
                  {(t.activeCountBadge || '{0} Ativos').replace('{0}', String(tokens.filter(tk => !tk.is_used).length))}
                </span>
              )}
            </div>

            <div className="flex-1 overflow-hidden pr-1 space-y-3">
              {isLoading ? (
                <div className="text-center py-8 text-slate-400 dark:text-zinc-550 text-sm font-medium animate-pulse">
                  {t.loadingOperators || 'A carregar...'}
                </div>
              ) : tokens.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 dark:bg-zinc-950/20 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 text-xs font-semibold">
                  {t.noActiveTokens || 'Nenhuma ficha ativa encontrada.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {paginatedTokens.map((token) => (
                    <div 
                      key={token.id} 
                      className={`relative overflow-hidden flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 ${
                        token.is_used 
                          ? 'bg-slate-50 dark:bg-zinc-950/20 border-slate-200/50 dark:border-white/5 opacity-50' 
                          : 'bg-gradient-to-r from-emerald-500/5 to-white dark:from-emerald-500/10 dark:to-zinc-900 border-emerald-200 dark:border-emerald-500/30 shadow-sm'
                      }`}
                    >
                      {/* Ticket notch left */}
                      <div className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-850 z-10" />
                      {/* Ticket notch right */}
                      <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white dark:bg-zinc-900 border-l border-slate-200 dark:border-zinc-850 z-10" />

                      <div className="flex items-center gap-4 pl-2">
                        <div className={`w-18 h-11 px-2 rounded-xl flex flex-col items-center justify-center font-mono font-black text-sm border ${
                          token.is_used 
                            ? 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-550 border-slate-200 dark:border-zinc-700' 
                            : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 shadow-inner'
                        }`}>
                          <span className="text-[7px] text-slate-400 dark:text-zinc-500 font-bold tracking-widest uppercase scale-90 -mb-0.5">PIN</span>
                          {token.code}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${token.is_used ? 'bg-slate-400' : 'bg-emerald-500 animate-pulse'}`} />
                            <p className="text-xs font-extrabold text-slate-800 dark:text-zinc-200 leading-none">
                              {token.is_used 
                                ? (token.used_for ? token.used_for : t.usedStatus || 'Utilizado') 
                                : t.unusedStatus || 'Disponível'}
                            </p>
                          </div>
                          {token.is_used && token.used_amount > 0 && (
                            <p className="text-[10px] font-black text-rose-600 dark:text-rose-450 mt-1 leading-none font-mono">
                              {token.used_for?.includes('%') 
                                ? `Percentual: ${token.used_amount}%` 
                                : `Valor: ${new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(token.used_amount)}`
                              }
                            </p>
                          )}
                          <p className="text-[10px] text-slate-500 dark:text-zinc-400 flex items-center gap-1 mt-1 font-medium leading-none">
                            <Clock size={10} />
                            {new Date(token.created_at).toLocaleDateString('pt-MZ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pr-2">
                        {!token.is_used ? (
                          <button
                            onClick={() => revokeToken(token.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all active:scale-90 cursor-pointer"
                            title={t.revokeToken || 'Revogar'}
                          >
                            <Trash2 size={15} />
                          </button>
                        ) : (
                          <span className="text-[9px] font-extrabold text-slate-400 dark:text-zinc-500 bg-slate-100 dark:bg-zinc-800/80 px-2.5 py-1 rounded-md">
                            {t.usedStatus || 'Inativo'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination Controls Footer for Tokens */}
            {!isLoading && tokens.length > itemsPerPage && (
              <div className="mt-3 py-3 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-between gap-4 shrink-0 text-xs">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-[10px] font-black uppercase tracking-wider text-slate-650 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition-all"
                >
                  <ChevronLeft size={12} />
                  {t.prevBtn || 'Anterior'}
                </button>
                <span className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                  {(t.guidePageOf || 'Página {0} de {1}')
                    .replace('{0}', String(currentPage))
                    .replace('{1}', String(totalPages))}
                </span>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-[10px] font-black uppercase tracking-wider text-slate-650 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition-all"
                >
                  {t.nextBtn || 'Seguinte'}
                  <ChevronRight size={12} />
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
