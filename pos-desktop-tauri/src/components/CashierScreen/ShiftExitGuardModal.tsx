import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, 
  ShieldCheck, 
  LogOut, 
  Lock, 
  X, 
  ArrowRight, 
  Clock, 
  Wallet, 
  ShieldAlert,
  Coins
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { getDB } from '../../lib/db';
import { findUserByPin } from '../../lib/security/crypto';
import toast from 'react-hot-toast';

interface ShiftExitGuardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onTriggerCloseShift: () => void;
  onForceExitApproved: () => void;
}

export function ShiftExitGuardModal({
  isOpen,
  onClose,
  currentUser,
  onTriggerCloseShift,
  onForceExitApproved,
}: ShiftExitGuardModalProps) {
  const [adminPin, setAdminPin] = useState('');
  const [showAdminPinInput, setShowAdminPinInput] = useState(false);
  const [pinError, setPinError] = useState('');
  const [isValidatingPin, setIsValidatingPin] = useState(false);
  const [shiftSummary, setShiftSummary] = useState<{
    startTime: string;
    duration: string;
    totalSales: number;
    salesCount: number;
    baseCash: number;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setShowAdminPinInput(false);
      setAdminPin('');
      setPinError('');
      return;
    }

    const loadShiftDetails = async () => {
      try {
        const db = await getDB();
        let shiftStart = currentUser?.current_shift_start || '';
        if (!shiftStart) {
          const ss = await db.select('SELECT value FROM settings WHERE key = "current_shift_start"') as any[];
          if (ss.length > 0) shiftStart = ss[0].value;
        }

        let formattedStart = 'Não registado';
        let durationText = '0h 0m';
        let dateCondition = '1=1';

        if (shiftStart) {
          const startDate = new Date(shiftStart);
          formattedStart = startDate.toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' }) +
            ' (' + startDate.toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short' }) + ')';
          
          const diffMs = Date.now() - startDate.getTime();
          const diffMins = Math.floor(diffMs / (1000 * 60));
          durationText = `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`;

          const sqlStart = shiftStart.replace('T', ' ').substring(0, 19);
          dateCondition = `created_at >= '${sqlStart}'`;
        }

        const sales: any[] = await db.select(
          `SELECT total_mt FROM sales WHERE ${dateCondition}`
        );

        const totalSales = sales.reduce((sum, s) => sum + (s.total_mt || 0), 0);
        const baseCash = currentUser?.current_shift_cash ?? currentUser?.opening_cash ?? 0;

        setShiftSummary({
          startTime: formattedStart,
          duration: durationText,
          totalSales,
          salesCount: sales.length,
          baseCash
        });
      } catch (e) {
        console.warn('Failed to load shift summary for exit guard:', e);
      }
    };

    loadShiftDetails();
  }, [isOpen, currentUser]);

  const handleAdminPinSubmit = async () => {
    if (adminPin.length < 4) {
      setPinError('Insira um PIN de 4 a 6 dígitos');
      return;
    }

    setIsValidatingPin(true);
    setPinError('');

    try {
      const db = await getDB();
      const admin = await findUserByPin(db, adminPin);

      if (!admin) {
        setPinError('PIN inválido');
        setIsValidatingPin(false);
        return;
      }

      const role = (admin.role || '').toLowerCase();
      const isAdminOrManager = role === 'admin' || role === 'gerente' || role === 'manager';

      if (!isAdminOrManager) {
        setPinError('Apenas Administrador ou Gerente pode autorizar a saída sem fecho');
        setIsValidatingPin(false);
        return;
      }

      // Log the unauthorized / forced bypass in audit_logs for accountability
      try {
        const auditId = crypto.randomUUID();
        await db.execute(
          `INSERT INTO audit_logs (id, user_id, user_name, action, details, sync_status) 
           VALUES (?, ?, ?, 'FORCE_EXIT_WITHOUT_CLOSE', ?, 0)`,
          [
            auditId,
            admin.id,
            admin.name,
            `Saída forçada com turno em aberto autorizada por ${admin.name} para o operador ${currentUser?.name || 'Desconhecido'}.`
          ]
        );
      } catch (err) {
        console.warn('Audit log write error:', err);
      }

      toast.success('Saída forçada autorizada pelo supervisor');
      onForceExitApproved();
    } catch (e) {
      setPinError('Erro ao validar PIN');
    } finally {
      setIsValidatingPin(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        id="shift-exit-guard-overlay"
        className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md"
        role="alertdialog"
        aria-modal="true"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-amber-500/30 rounded-3xl shadow-2xl shadow-amber-950/20 p-6 sm:p-7 text-slate-900 dark:text-zinc-100 relative overflow-hidden"
        >
          {/* Amber Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500" />

          {/* Close / Cancel 'X' Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            title="Cancelar e continuar"
          >
            <X size={18} />
          </button>

          {/* Header Warning */}
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block mb-0.5">
                Alerta de Fecho de Caixa
              </span>
              <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                Turno em Aberto Detectado
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                O operador <strong className="text-slate-800 dark:text-zinc-200">{currentUser?.name || 'Caixa'}</strong> tem um turno activo com vendas registadas.
              </p>
            </div>
          </div>

          {/* Shift Snapshot Card */}
          <div className="bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-4 mb-5">
            <div className="grid grid-cols-2 gap-3 text-xs mb-3 pb-3 border-b border-slate-200/60 dark:border-zinc-800/60">
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase flex items-center gap-1 mb-1">
                  <Clock size={12} className="text-indigo-500" /> Início do Turno
                </span>
                <span className="font-bold text-slate-800 dark:text-zinc-200 block text-xs truncate">
                  {shiftSummary?.startTime || 'A carregar...'}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                  Duração: {shiftSummary?.duration || '0m'}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase flex items-center gap-1 mb-1">
                  <Coins size={12} className="text-emerald-500" /> Fundo de Caixa
                </span>
                <span className="font-black text-slate-800 dark:text-zinc-200 block font-mono">
                  {formatCurrency(shiftSummary?.baseCash || 0)} MT
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase block">
                  Vendas do Turno ({shiftSummary?.salesCount || 0} recibos)
                </span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {formatCurrency(shiftSummary?.totalSales || 0)} MT
                </span>
              </div>
              <div className="text-right text-[11px] text-slate-500 dark:text-zinc-400">
                Se fechar sem conferir o caixa,<br />o relatório Z de hoje fica pendente.
              </div>
            </div>
          </div>

          {/* Action Options */}
          {!showAdminPinInput ? (
            <div className="space-y-2.5">
              {/* Recommended Action: Close Shift & Exit */}
              <button
                id="btn-guard-close-shift"
                type="button"
                onClick={() => {
                  onClose();
                  onTriggerCloseShift();
                }}
                className="w-full p-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-md shadow-emerald-900/20 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 text-left">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <span className="block font-black text-sm">Fechar Turno & Sair (Recomendado)</span>
                    <span className="block text-[10px] text-white/80 font-medium">Conta o dinheiro, imprime o relatório Z e sai limpo.</span>
                  </div>
                </div>
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </button>

              {/* Force Exit (Supervisor Authorized) */}
              <button
                id="btn-guard-force-exit"
                type="button"
                onClick={() => setShowAdminPinInput(true)}
                className="w-full p-3 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-750 text-slate-700 dark:text-zinc-300 rounded-2xl font-bold text-xs transition-all flex items-center justify-between cursor-pointer border border-slate-200 dark:border-zinc-700/60"
              >
                <div className="flex items-center gap-2.5 text-left">
                  <div className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-zinc-700 flex items-center justify-center text-slate-600 dark:text-zinc-400">
                    <Lock size={14} />
                  </div>
                  <div>
                    <span className="block font-bold">Sair Sem Fechar Turno</span>
                    <span className="block text-[10px] text-slate-400 dark:text-zinc-500">Exige autorização com PIN de Administrador/Gerente.</span>
                  </div>
                </div>
                <ShieldAlert size={16} className="text-amber-500" />
              </button>

              {/* Cancel Button */}
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 text-center text-xs font-bold text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors"
              >
                Cancelar e Continuar no Sistema
              </button>
            </div>
          ) : (
            /* Admin PIN Verification Screen */
            <div className="bg-slate-50 dark:bg-zinc-950/80 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Lock size={13} className="text-amber-500" /> Autorização de Administrador
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminPinInput(false);
                    setPinError('');
                  }}
                  className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 underline font-medium"
                >
                  Voltar
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Insira o PIN de Administrador para confirmar a saída de emergência sem encerramento de turno.
              </p>

              <div className="space-y-2">
                <input
                  type="password"
                  autoFocus
                  maxLength={6}
                  placeholder="PIN do Administrador"
                  value={adminPin}
                  onChange={(e) => {
                    setAdminPin(e.target.value.replace(/\D/g, ''));
                    setPinError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAdminPinSubmit();
                  }}
                  className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-center text-lg font-mono font-bold tracking-widest text-slate-900 dark:text-zinc-100 outline-none focus:border-amber-500"
                />

                {pinError && (
                  <span className="block text-xs font-semibold text-rose-500 text-center">
                    {pinError}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={isValidatingPin || adminPin.length < 4}
                  onClick={handleAdminPinSubmit}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    adminPin.length >= 4 && !isValidatingPin
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-slate-200 dark:bg-zinc-800 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <LogOut size={13} />
                  <span>{isValidatingPin ? 'A validar...' : 'Confirmar Saída Forçada'}</span>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
