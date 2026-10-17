import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertOctagon, 
  ShieldCheck, 
  Clock, 
  ArrowRight, 
  Lock, 
  Coins, 
  ZapOff 
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { getDB } from '../../lib/db';
import { findUserByPin } from '../../lib/security/crypto';
import toast from 'react-hot-toast';

interface StaleShiftRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  shiftStartTime: string;
  baseCash: number;
  currentUser: any;
  onTriggerCloseShift: () => void;
  onContinueCurrentShiftApproved: () => void;
}

export function StaleShiftRecoveryModal({
  isOpen,
  onClose,
  shiftStartTime,
  baseCash,
  currentUser,
  onTriggerCloseShift,
  onContinueCurrentShiftApproved
}: StaleShiftRecoveryModalProps) {
  const [adminPin, setAdminPin] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);
  const [pinError, setPinError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  if (!isOpen) return null;

  const startDate = shiftStartTime ? new Date(shiftStartTime) : new Date();
  const formattedStart = startDate.toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' }) +
    ' de ' + startDate.toLocaleDateString('pt-MZ', { day: '2-digit', month: 'long', year: 'numeric' });

  const diffHours = Math.max(1, Math.round((Date.now() - startDate.getTime()) / (1000 * 60 * 60)));

  const handleAdminPinSubmit = async () => {
    if (adminPin.length < 4) {
      setPinError('Insira um PIN de 4 a 6 dígitos');
      return;
    }

    setIsValidating(true);
    setPinError('');

    try {
      const db = await getDB();
      const admin = await findUserByPin(db, adminPin);

      if (!admin) {
        setPinError('PIN incorreto');
        setIsValidating(false);
        return;
      }

      const role = (admin.role || '').toLowerCase();
      if (role !== 'admin' && role !== 'gerente' && role !== 'manager') {
        setPinError('Apenas Administrador/Gerente pode autorizar continuar turno desfasado');
        setIsValidating(false);
        return;
      }

      toast.success('Continuação de turno autorizada pelo Administrador');
      onContinueCurrentShiftApproved();
      onClose();
    } catch (err) {
      setPinError('Erro ao validar PIN');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <AnimatePresence>
      <div 
        id="stale-shift-recovery-overlay"
        className="fixed inset-0 z-[100001] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md"
        role="alertdialog"
        aria-modal="true"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-amber-500/40 rounded-3xl shadow-2xl p-6 sm:p-7 text-slate-900 dark:text-zinc-100 relative overflow-hidden"
        >
          {/* Top warning line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500" />

          {/* Header */}
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <ZapOff className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block mb-0.5">
                Segurança de Fecho de Caixa
              </span>
              <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                Turno Anterior Não Encerrado
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                Detectámos um turno anterior aberto há <strong className="text-amber-600 dark:text-amber-400">{diffHours} horas</strong> que não foi fechado (provável corte de energia ou saída forçada).
              </p>
            </div>
          </div>

          {/* Details Card */}
          <div className="bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-4 mb-5 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                <Clock size={13} className="text-indigo-500" /> Início do Turno Pendente:
              </span>
              <span className="font-bold text-slate-800 dark:text-zinc-200">{formattedStart}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                <Coins size={13} className="text-emerald-500" /> Fundo de Caixa Inicial:
              </span>
              <span className="font-bold text-slate-800 dark:text-zinc-200 font-mono">
                {formatCurrency(baseCash)} MT
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-800/60 text-[11px] text-amber-700 dark:text-amber-400/90 font-medium">
              💡 Para evitar furos de caixa e misturar as vendas de ontem com as de hoje, é vivamente recomendado encerrar este turno agora.
            </div>
          </div>

          {/* Actions */}
          {!showPinInput ? (
            <div className="space-y-2.5">
              {/* Recommended Action: Close and Reconcile Previous Shift */}
              <button
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
                    <span className="block font-black text-sm">Conferir Caixa & Encerrar Turno Anterior</span>
                    <span className="block text-[10px] text-white/80 font-medium">Conta o dinheiro em caixa, gera o relatório Z e inicia um novo turno limpo.</span>
                  </div>
                </div>
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </button>

              {/* Bypass / Continue Shift with Admin PIN */}
              <button
                type="button"
                onClick={() => setShowPinInput(true)}
                className="w-full p-3 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-750 text-slate-700 dark:text-zinc-300 rounded-2xl font-bold text-xs transition-all flex items-center justify-between cursor-pointer border border-slate-200 dark:border-zinc-700/60"
              >
                <div className="flex items-center gap-2.5 text-left">
                  <div className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-zinc-700 flex items-center justify-center text-slate-600 dark:text-zinc-400">
                    <Lock size={14} />
                  </div>
                  <div>
                    <span className="block font-bold">Continuar Este Mesmo Turno</span>
                    <span className="block text-[10px] text-slate-400 dark:text-zinc-500">Exige autorização com PIN de Administrador/Gerente.</span>
                  </div>
                </div>
                <AlertOctagon size={16} className="text-amber-500" />
              </button>
            </div>
          ) : (
            /* PIN verification */
            <div className="bg-slate-50 dark:bg-zinc-950/80 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Lock size={13} className="text-amber-500" /> Autorização de Administrador
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowPinInput(false);
                    setPinError('');
                  }}
                  className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 underline font-medium"
                >
                  Voltar
                </button>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Insira o PIN de Administrador para confirmar que deseja manter as vendas no mesmo turno antigo.
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
                  disabled={isValidating || adminPin.length < 4}
                  onClick={handleAdminPinSubmit}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    adminPin.length >= 4 && !isValidating
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-slate-200 dark:bg-zinc-800 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Lock size={13} />
                  <span>{isValidating ? 'A validar...' : 'Autorizar Continuação'}</span>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
