import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, LogOut, ShieldCheck, Clock, ArrowRight, CornerDownRight, Coins, Wallet2, FileSpreadsheet, ArrowLeftRight, Lock, ShieldAlert } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { getDB } from '../../lib/db';
import { useI18n } from '../../i18n';
import { findUserByPin } from '../../lib/security/crypto';
import toast from 'react-hot-toast';

interface SmartExitModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  shiftStats?: any;
  dailyTotal?: number;
  onTriggerCloseShift: () => void;
  onJustExit: () => void;
}

export function SmartExitModal({
  isOpen,
  onClose,
  currentUser,
  shiftStats,
  dailyTotal,
  onTriggerCloseShift,
  onJustExit
}: SmartExitModalProps) {
  const { pos: t, common: commonT } = useI18n();
  const [shiftDurationText, setShiftDurationText] = useState('0h 0m');
  const [shiftStartTimeText, setShiftStartTimeText] = useState('');
  const [internalDailyTotal, setInternalDailyTotal] = useState(0);
  const [internalShiftStats, setInternalShiftStats] = useState<any>(null);

  const displayStats = useMemo(() => shiftStats || internalShiftStats, [shiftStats, internalShiftStats]);
  const displayTotal = useMemo(() => (dailyTotal !== undefined && dailyTotal !== null) ? dailyTotal : internalDailyTotal, [dailyTotal, internalDailyTotal]);

  const [showSupervisorPin, setShowSupervisorPin] = useState(false);
  const [supervisorPin, setSupervisorPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isValidatingPin, setIsValidatingPin] = useState(false);

  const isAdmin = useMemo(() => {
    const role = (currentUser?.role || '').toLowerCase();
    return role === 'admin' || role === 'gerente' || role === 'manager';
  }, [currentUser]);

  const handleJustExitClick = () => {
    if (isAdmin) {
      onClose();
      onJustExit();
    } else {
      setShowSupervisorPin(true);
      setSupervisorPin('');
      setPinError('');
    }
  };

  const handleValidateSupervisorPin = async () => {
    if (supervisorPin.length < 4) {
      setPinError('Insira um PIN de 4 a 6 dígitos');
      return;
    }
    setIsValidatingPin(true);
    setPinError('');
    try {
      const db = await getDB();
      const supervisor = await findUserByPin(db, supervisorPin);
      if (!supervisor) {
        setPinError('PIN de supervisor incorreto');
        setIsValidatingPin(false);
        return;
      }
      const role = (supervisor.role || '').toLowerCase();
      if (role !== 'admin' && role !== 'gerente' && role !== 'manager') {
        setPinError('Apenas Administrador ou Gerente pode autorizar a saída sem fechar o turno');
        setIsValidatingPin(false);
        return;
      }
      toast.success('Saída autorizada pelo supervisor');
      onClose();
      onJustExit();
    } catch {
      setPinError('Erro ao validar PIN');
    } finally {
      setIsValidatingPin(false);
    }
  };

  // Calculate shift duration and statistics
  useEffect(() => {
    if (isOpen) {
      const fetchShiftStart = async () => {
        try {
          const db = await getDB();
          const ss = await db.select('SELECT value FROM settings WHERE key = "current_shift_start"') as any[];
          let dateCondition = '1=1';
          let shiftStart = '';
          
          if (ss.length > 0) {
            shiftStart = ss[0].value;
            const startTime = new Date(shiftStart);
            
            // Format start time string
            setShiftStartTimeText(
              startTime.toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' }) + 
              ' (' + startTime.toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short' }) + ')'
            );

            // Calculate duration
            const diffMs = Date.now() - startTime.getTime();
            const diffMins = Math.floor(diffMs / (1000 * 60));
            const hours = Math.floor(diffMins / 60);
            const mins = diffMins % 60;
            setShiftDurationText(`${hours}h ${mins}m`);
            
            const formattedShiftStart = shiftStart.replace('T', ' ').substring(0, 19);
            dateCondition = `created_at >= '${formattedShiftStart}'`;
          } else {
            setShiftDurationText('Turno não iniciado');
            setShiftStartTimeText('Desconhecido');
          }

          if (!shiftStats || dailyTotal === undefined) {
            // Fetch sales to compute stats internally
            const sales: any[] = await db.select(`SELECT total_mt, payment_method, payment_details FROM sales WHERE ${dateCondition}`);
            
            let cashSalesTotal = 0;
            let mpesaSalesTotal = 0;
            let emolaSalesTotal = 0;
            let fiadoSalesTotal = 0;

            for (const s of sales) {
              if (s.total_mt > 0) {
                if (s.payment_method === 'cash') {
                  cashSalesTotal += s.total_mt;
                } else if (s.payment_method === 'm-pesa' || s.payment_method === 'mpesa') {
                  mpesaSalesTotal += s.total_mt;
                } else if (s.payment_method === 'e-mola' || s.payment_method === 'emola') {
                  emolaSalesTotal += s.total_mt;
                } else if (s.payment_method === 'fiado') {
                  fiadoSalesTotal += s.total_mt;
                } else if (s.payment_method === 'mixed') {
                  try {
                    if (s.payment_details) {
                      const splits = JSON.parse(s.payment_details);
                      const splitCash = parseFloat(splits.cash) || 0;
                      const splitMpesa = parseFloat(splits.mpesa) || 0;
                      const splitEmola = parseFloat(splits.emola) || 0;
                      const splitTotal = splitCash + splitMpesa + splitEmola;
                      if (splitTotal > 0) {
                        const cashRatio = splitCash / splitTotal;
                        const mpesaRatio = splitMpesa / splitTotal;
                        const emolaRatio = splitEmola / splitTotal;
                        cashSalesTotal += s.total_mt * cashRatio;
                        mpesaSalesTotal += s.total_mt * mpesaRatio;
                        emolaSalesTotal += s.total_mt * emolaRatio;
                      } else {
                        cashSalesTotal += s.total_mt;
                      }
                    } else {
                      cashSalesTotal += s.total_mt;
                    }
                  } catch (e) {
                    cashSalesTotal += s.total_mt;
                  }
                }
              }
            }

            const refundsCashTotal = sales.filter(s => s.payment_method === 'cash' && s.total_mt < 0).reduce((sum, s) => sum + s.total_mt, 0);

            let debtPayments: any[] = [];
            try {
              debtPayments = await db.select(`SELECT amount_paid_mt as amount, payment_method FROM debt_payments WHERE ${dateCondition}`);
            } catch (e) {
              try {
                debtPayments = await db.select(`SELECT amount_mt as amount, payment_method FROM debt_payments WHERE ${dateCondition}`);
              } catch (e2) {
                console.warn('Failed to load debt payments from either column:', e2);
              }
            }
            const cashDebtPayments = debtPayments.filter(s => s.payment_method === 'cash').reduce((sum, s) => sum + (s.amount || 0), 0);

            let tillPayoutsTotal = 0;
            try {
              const payouts: any[] = await db.select(`SELECT amount FROM till_payouts WHERE ${dateCondition}`);
              tillPayoutsTotal = payouts.reduce((sum, p) => sum + p.amount, 0);
            } catch (e) {}

            let baseCash = 10000;
            try {
              let loaded = false;
              if (currentUser?.id) {
                const userShiftCashRow = await db.select('SELECT value FROM settings WHERE key = ?', [`current_shift_cash_${currentUser.id}`]) as any[];
                if (userShiftCashRow.length > 0) {
                  baseCash = parseFloat(userShiftCashRow[0].value) || 0;
                  loaded = true;
                }
              }
              if (!loaded) {
                const settings: any[] = await db.select('SELECT value FROM settings WHERE key = "base_cash"');
                if (settings.length > 0) {
                  baseCash = parseFloat(settings[0].value) || 0;
                }
              }
            } catch (e) {}

            const totalExpectedCash = baseCash + cashSalesTotal + cashDebtPayments - tillPayoutsTotal + refundsCashTotal;

            setInternalShiftStats({
              baseCash,
              cashSalesTotal,
              cashDebtPayments,
              mpesaSalesTotal,
              emolaSalesTotal,
              fiadoSalesTotal,
              tillPayoutsTotal,
              refundsCashTotal,
              totalExpectedCash
            });
            setInternalDailyTotal(totalExpectedCash);
          }
        } catch (e) {
          console.warn('Failed to calculate shift start details in exit prompt:', e);
        }
      };
      fetchShiftStart();
    }
  }, [isOpen, shiftStats, dailyTotal, currentUser]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 "
        />

        {/* Modal container */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-xl bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10 flex flex-col p-8 gap-6 text-slate-800 dark:text-zinc-200"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={20} />
          </button>

          {/* Header */}
          <div className="flex flex-col items-center text-center space-y-2 mt-2">
            <div className="w-14 h-14 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center border border-rose-100 dark:border-rose-500/10 shadow-lg shadow-rose-500/5">
              <LogOut size={28} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {t.smartExitTitle || 'Sair do Sistema POS'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-sm">
              <span className="font-semibold text-slate-800 dark:text-zinc-200">{currentUser?.name}</span>, {t.activeSessionPrompt || 'como deseja proceder com a sua sessão ativa?'}
            </p>
          </div>

          {/* Shift info section */}
          <div className="p-5 bg-slate-50/50 dark:bg-zinc-950/30 rounded-3xl border border-slate-100 dark:border-zinc-800/60 space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-100 dark:border-zinc-800/80 pb-3 text-xs font-semibold text-slate-400 dark:text-zinc-500">
              <span className="flex items-center gap-1">
                <Clock size={13} />
                {t.shiftStartTime || 'Inicio:'} <span className="text-slate-700 dark:text-zinc-300 font-mono font-bold">{shiftStartTimeText}</span>
              </span>
              <span>
                {t.shiftDuration || 'Duração:'} <span className="text-indigo-600 dark:text-indigo-400 font-bold font-mono">{shiftDurationText}</span>
              </span>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                  <Coins size={11} className="text-emerald-500" /> {t.cashInDrawer || 'Dinheiro em Caixa'}
                </span>
                <span className="text-base font-black text-slate-800 dark:text-zinc-100 font-mono block">
                  {formatCurrency(displayTotal)} MT
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                  <Wallet2 size={11} className="text-red-500" /> {t.mobileMoneyTotal || 'M-Pesa & e-Mola'}
                </span>
                <span className="text-base font-black text-slate-800 dark:text-zinc-100 font-mono block">
                  {formatCurrency((displayStats?.mpesaSalesTotal || 0) + (displayStats?.emolaSalesTotal || 0))} MT
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                  <FileSpreadsheet size={11} className="text-amber-500" /> {t.fiadosCreated || 'Fiados Criados'}
                </span>
                <span className="text-base font-black text-slate-800 dark:text-zinc-100 font-mono block">
                  {formatCurrency(displayStats?.fiadoSalesTotal || 0)} MT
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                  <ArrowLeftRight size={11} className="text-sky-500" /> {t.fiadoPayments || 'Pagam. de Fiados'}
                </span>
                <span className="text-base font-black text-slate-800 dark:text-zinc-100 font-mono block">
                  {formatCurrency(displayStats?.cashDebtPayments || 0)} MT
                </span>
              </div>
            </div>
          </div>

          {/* Prompt options */}
          {!showSupervisorPin ? (
            <div className="flex flex-col gap-3.5 mt-2">
              {/* Option 1: Full shift closure */}
              <button
                onClick={() => {
                  onClose();
                  onTriggerCloseShift();
                }}
                className="w-full p-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-2xl font-bold text-sm shadow-xl shadow-red-500/10 hover:shadow-red-500/20 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <span className="block font-black text-sm">{t.closeShiftAndExit || 'Fechar Turno & Sair'}</span>
                    <span className="block text-[10px] text-white/70 font-medium">{t.closeShiftRecommendedDesc || 'Recomendado. Audita os valores e encerra a caixa.'}</span>
                  </div>
                </div>
                <ArrowRight size={18} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1.5 transition-all duration-300" />
              </button>

              {/* Option 2: Just exit app / log out (Guarded with Admin PIN for Cashiers) */}
              <button
                onClick={handleJustExitClick}
                className="w-full p-4 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-750 text-slate-800 dark:text-zinc-100 rounded-2xl font-bold text-sm border border-slate-200/50 dark:border-white/5 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-zinc-700 flex items-center justify-center text-slate-600 dark:text-zinc-300">
                    <LogOut size={16} />
                  </div>
                  <div>
                    <span className="block font-black text-sm">
                      {t.justExitKeepShift || 'Apenas Sair (Manter Turno Ativo)'}
                      {!isAdmin && <span className="text-[10px] text-amber-500 font-semibold ml-2">(Exige PIN Admin)</span>}
                    </span>
                    <span className="block text-[10px] text-slate-500 dark:text-zinc-400 font-medium">{t.justExitDesc || 'Sair do POS temporariamente. Ideal para admins/isento.'}</span>
                  </div>
                </div>
                <CornerDownRight size={18} className="text-slate-400 dark:text-zinc-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-1.5 transition-all duration-300" />
              </button>

              {/* Option 3: Cancel */}
              <button
                onClick={onClose}
                className="w-full py-3.5 text-center text-xs font-bold text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 bg-transparent hover:bg-slate-50 dark:hover:bg-zinc-850 rounded-xl transition-all cursor-pointer"
              >
                {t.cancelAndContinueSelling || 'Cancelar e Continuar a Vender'}
              </button>
            </div>
          ) : (
            /* Supervisor PIN screen */
            <div className="bg-slate-50 dark:bg-zinc-950/80 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-3 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Lock size={13} className="text-amber-500" /> Autorização de Administrador / Gerente
                </span>
                <button
                  type="button"
                  onClick={() => setShowSupervisorPin(false)}
                  className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 underline font-medium"
                >
                  Voltar
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Apenas o Administrador ou Gerente pode autorizar sair do sistema deixando um turno em aberto.
              </p>

              <div className="space-y-2">
                <input
                  type="password"
                  autoFocus
                  maxLength={6}
                  placeholder="PIN do Administrador"
                  value={supervisorPin}
                  onChange={(e) => {
                    setSupervisorPin(e.target.value.replace(/\D/g, ''));
                    setPinError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleValidateSupervisorPin();
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
                  disabled={isValidatingPin || supervisorPin.length < 4}
                  onClick={handleValidateSupervisorPin}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    supervisorPin.length >= 4 && !isValidatingPin
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-slate-200 dark:bg-zinc-800 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Lock size={13} />
                  <span>{isValidatingPin ? 'A validar...' : 'Confirmar Saída'}</span>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
