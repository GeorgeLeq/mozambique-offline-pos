import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, ToggleLeft, ToggleRight, Lock, Unlock, Edit3, ShieldCheck } from 'lucide-react';
import { User } from '../../types';
import { getDB } from '../../lib/db';
import { useCashierControlI18n } from '../../i18n';

interface ShiftInfo {
  startTime: string;
  startCash: number;
}

interface OperatorCardProps {
  key?: React.Key | string | number;
  user: User;
  activeShift: ShiftInfo | undefined;
  defaultCash: number;
  isExempt: boolean;
  onToggleNeedsCash: (user: User) => void | Promise<void>;
  onToggleBlockStatus: (user: User) => void | Promise<void>;
  onOpenEditModal: (user: User) => void;
  onManageTokens: (user: User) => void;
  onUpdateEmergencyLimits: (userId: string, maxDiscount: number, maxRefund: number) => void | Promise<void>;
  onUpdateTerminalName: (userId: string, terminalName: string) => void | Promise<void>;
}

const OperatorCard = React.memo(function OperatorCard({
  user,
  activeShift,
  defaultCash,
  isExempt,
  onToggleNeedsCash,
  onToggleBlockStatus,
  onOpenEditModal,
  onManageTokens,
  onUpdateEmergencyLimits,
  onUpdateTerminalName,
}: OperatorCardProps) {
  const t = useCashierControlI18n();
  const [localMaxDiscount, setLocalMaxDiscount] = useState('10');
  const [localMaxRefund, setLocalMaxRefund] = useState('2000');
  const [localTerminalName, setLocalTerminalName] = useState(user.terminal_name || '');
  const [isDirty, setIsDirty] = useState(false);
  const [isTerminalDirty, setIsTerminalDirty] = useState(false);
  const [usedRefundAmount, setUsedRefundAmount] = useState(0);

  useEffect(() => {
    setLocalTerminalName(user.terminal_name || '');
    setIsTerminalDirty(false);
  }, [user.terminal_name]);

  useEffect(() => {
    const fetchUsedRefund = async () => {
      try {
        const db = await getDB();
        const result = await db.select(
          "SELECT SUM(used_amount) as total FROM emergency_tokens WHERE cashier_id = ? AND is_used = 1 AND (used_for LIKE 'Reembolso%' OR used_for LIKE 'Refund%')",
          [user.id]
        ) as any[];
        if (result && result.length > 0 && result[0].total) {
          setUsedRefundAmount(parseFloat(result[0].total));
        } else {
          setUsedRefundAmount(0);
        }
      } catch (e) {
        console.warn('Error fetching used refund amount for user', user.id, e);
      }
    };
    
    if (user.role === 'Cashier') {
      fetchUsedRefund();
    }
  }, [user.id, user.role, user.permissions_json]);

  useEffect(() => {
    if (user.permissions_json) {
      try {
        const parsed = JSON.parse(user.permissions_json);
        if (parsed && typeof parsed === 'object') {
          if (parsed.emergency_max_discount !== undefined) {
            setLocalMaxDiscount(parsed.emergency_max_discount.toString());
          }
          if (parsed.emergency_max_refund !== undefined) {
            setLocalMaxRefund(parsed.emergency_max_refund.toString());
          }
        }
      } catch (e) {
        console.warn('Error parsing permissions_json in OperatorCard', e);
      }
    }
  }, [user.permissions_json]);

  const handleSaveLimits = async () => {
    const discount = parseFloat(localMaxDiscount) || 0;
    const refund = parseFloat(localMaxRefund) || 0;
    await onUpdateEmergencyLimits(user.id, discount, refund);
    setIsDirty(false);
  };

  const handleSaveTerminal = async () => {
    await onUpdateTerminalName(user.id, localTerminalName.trim());
    setIsTerminalDirty(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.15)] flex flex-col justify-between gap-4 transition-all hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-black flex items-center justify-center text-base shadow-inner">
            {user.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="font-extrabold text-slate-850 dark:text-zinc-100 text-sm">{user.name}</h3>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-[10px] font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-widest">
                {user.role}
              </span>
              {user.role === 'Cashier' && user.terminal_name && (
                <>
                  <span className="text-slate-300 dark:text-zinc-700 text-xs font-bold leading-none">•</span>
                  <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 rounded-lg text-[9px] font-black uppercase tracking-wider">
                    {user.terminal_name}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Status Badges Group */}
        <div className="flex flex-col items-end gap-1">
          {user.is_blocked === 1 && (
            <span className="px-2.5 py-1 bg-rose-50 dark:bg-rose-500/10 text-rose-650 dark:text-rose-400 rounded-xl text-[9px] font-bold border border-rose-200/30 flex items-center gap-1">
              <ShieldAlert size={11} />
              {t.blockedBadge || 'Bloqueado'}
            </span>
          )}
          {isExempt ? (
            <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-650 dark:text-amber-400 rounded-xl text-[9px] font-bold border border-amber-200/30">
              {t.exemptBadge || 'Isento de Caixa'}
            </span>
          ) : activeShift ? (
            <span className="px-2.5 py-1 bg-green-50 dark:bg-green-500/10 text-green-650 dark:text-green-400 rounded-xl text-[9px] font-bold border border-green-200/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              {t.openShiftBadge || 'Turno Aberto'}
            </span>
          ) : (
            <span className="px-2.5 py-1 bg-slate-100 dark:bg-zinc-800 text-slate-550 dark:text-zinc-400 rounded-xl text-[9px] font-bold">
              {t.closedShiftBadge || 'Turno Fechado'}
            </span>
          )}
        </div>
      </div>

      {/* Fundo de Caixa Display Section */}
      <div className="p-3.5 rounded-xl bg-slate-50/60 dark:bg-zinc-950/40 border border-slate-150 dark:border-zinc-800/80 flex items-center justify-between gap-3">
        <div>
          <span className="block text-[9px] font-black text-slate-450 dark:text-zinc-500 uppercase tracking-widest">
            {t.initialCashLabel || 'Fundo de Caixa Inicial'}
          </span>
          {isExempt ? (
            <span className="text-[11px] font-bold text-amber-650 dark:text-amber-400 block mt-0.5">
              {t.exemptDescription || 'Isento de prestação de contas'}
            </span>
          ) : (
            <span className="text-sm font-black text-slate-850 dark:text-zinc-100 block mt-0.5 font-mono">
              {user.opening_cash !== null && user.opening_cash !== undefined ? (
                <>
                  {user.opening_cash.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} <span className="text-[9px] font-semibold text-slate-450">MZN</span>
                </>
              ) : (
                <>
                  {defaultCash.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} <span className="text-[9px] font-semibold text-slate-450">MZN ({t.defaultCashLabel || 'Padrão'})</span>
                </>
              )}
            </span>
          )}
        </div>

        {activeShift && !isExempt && (
          <div className="text-right">
            <span className="block text-[9px] font-black text-slate-450 dark:text-zinc-500 uppercase tracking-widest">
              {t.inCashStartLabel || 'Em Caixa no Início'}
            </span>
            <span className="text-xs font-bold text-green-650 dark:text-green-400 block mt-0.5 font-mono">
              {activeShift.startCash.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} MT
            </span>
          </div>
        )}
      </div>

      {/* Terminal / Banca Assignment Section */}
      {user.role === 'Cashier' && (
        <div className="p-3.5 rounded-xl bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/15 dark:border-zinc-800/80 flex flex-col gap-2 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="block text-[9px] font-black text-indigo-750 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1">
              🖥️ {t.terminalLabel || 'Terminal / Banca Associada'}
            </span>
            {isTerminalDirty && (
              <button
                onClick={handleSaveTerminal}
                className="flex items-center gap-1 px-2.5 py-1 bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold text-[9px] uppercase tracking-wider rounded-lg transition-all active:scale-95 cursor-pointer shadow-sm"
              >
                {t.saveLimitsBtn || 'Gravar'}
              </button>
            )}
          </div>
          
          <input
            type="text"
            value={localTerminalName}
            onChange={(e) => {
              setLocalTerminalName(e.target.value);
              setIsTerminalDirty(true);
            }}
            placeholder={t.terminalPlaceholder || 'Ex: Terminal 1, Banca 1'}
            className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-black text-slate-850 dark:text-zinc-100 font-mono shadow-sm transition-all"
          />
        </div>
      )}

      {/* In-Line Emergency Limits Section */}
      {user.role === 'Cashier' && (
        <div className="p-3.5 rounded-xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/15 dark:border-zinc-800/80 space-y-2.5 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="block text-[9px] font-black text-rose-750 dark:text-rose-400 uppercase tracking-widest flex items-center gap-1">
              🛡️ {t.emergencyLimitsTitle || 'Limites p/ Código de Emergência'}
            </span>
            {isDirty && (
              <button
                onClick={handleSaveLimits}
                className="flex items-center gap-1 px-2.5 py-1 bg-rose-650 hover:bg-rose-700 text-white font-extrabold text-[9px] uppercase tracking-wider rounded-lg transition-all active:scale-95 cursor-pointer shadow-sm"
              >
                <ShieldCheck size={11} />
                {t.saveLimitsBtn || 'Gravar'}
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[8px] font-black text-slate-450 dark:text-zinc-500 uppercase tracking-widest leading-none">
                {t.maxDiscountField || 'Desconto Máx (%)'}
              </label>
              <input
                type="number"
                value={localMaxDiscount}
                onChange={(e) => {
                  setLocalMaxDiscount(e.target.value);
                  setIsDirty(true);
                }}
                className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:ring-2 focus:ring-rose-500 outline-none text-xs font-black text-slate-850 dark:text-zinc-100 font-mono shadow-sm transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[8px] font-black text-slate-450 dark:text-zinc-500 uppercase tracking-widest leading-none">
                {t.maxRefundField || 'Reembolso Máx (MZN)'}
              </label>
              <input
                type="number"
                value={localMaxRefund}
                onChange={(e) => {
                  setLocalMaxRefund(e.target.value);
                  setIsDirty(true);
                }}
                className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:ring-2 focus:ring-rose-500 outline-none text-xs font-black text-slate-850 dark:text-zinc-100 font-mono shadow-sm transition-all"
              />
            </div>
          </div>

          {/* Refund Utilization Tracker */}
          <div className="pt-2 border-t border-rose-500/10 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[9px]">
              <span className="font-extrabold text-slate-550 dark:text-zinc-400 uppercase tracking-wide">
                {t.consumedRefunds || 'Reembolsos Consumidos:'}
              </span>
              <span className="font-black text-rose-650 dark:text-rose-400 font-mono">
                {usedRefundAmount.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} MT
              </span>
            </div>
            
            <div className="w-full h-1.5 bg-slate-150 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-rose-500 rounded-full transition-all duration-500" 
                style={{ 
                  width: `${Math.min(100, (usedRefundAmount / (parseFloat(localMaxRefund) || 1)) * 100)}%` 
                }} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Actions and Controls Panel */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-150 dark:border-zinc-800/80 pt-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggle button needs_shift_cash */}
          <button
            onClick={() => onToggleNeedsCash(user)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
              isExempt
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-750 border-amber-200/40'
                : 'bg-indigo-50/60 hover:bg-indigo-100/60 text-indigo-750 border-indigo-200/40 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20'
            }`}
            title={isExempt ? (t.requireCashBtn || "Definir que operador precisa de gerir caixa") : (t.makeExemptBtn || "Isentar operador de gerir caixa")}
          >
            {isExempt ? <ToggleRight size={12} className="text-amber-500" /> : <ToggleLeft size={12} />}
            <span>{isExempt ? (t.requireCashBtn || 'Requerer Caixa') : (t.makeExemptBtn || 'Tornar Isento')}</span>
          </button>

          {/* Block / Grant Access Button */}
          {user.role !== 'Admin' && (
            <button
              onClick={() => onToggleBlockStatus(user)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                user.is_blocked === 1
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-750 border-rose-200/40 dark:bg-rose-500/10 dark:text-rose-400'
                  : 'bg-slate-150 hover:bg-slate-200 text-slate-750 border-slate-250/40 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
              }`}
              title={user.is_blocked === 1 ? (t.unblockBtn || "Desbloquear operador para login") : (t.blockBtn || "Bloquear operador de fazer login")}
            >
              {user.is_blocked === 1 ? <Unlock size={12} /> : <Lock size={12} />}
              <span>{user.is_blocked === 1 ? (t.unblockBtn || 'Desbloquear') : (t.blockBtn || 'Bloquear')}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Edit Cash Button (Only if not exempt) */}
          {!isExempt && (
            <button
              onClick={() => onOpenEditModal(user)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-150 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-750 dark:text-zinc-300 rounded-xl text-[9px] font-black uppercase tracking-wider border border-slate-250/40 dark:border-zinc-700 transition-all cursor-pointer"
            >
              <Edit3 size={11} />
              <span>{t.editCashShortBtn || 'Caixa'}</span>
            </button>
          )}

          <button
            onClick={() => onManageTokens(user)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-650 dark:text-red-400 rounded-xl text-[9px] font-black uppercase tracking-wider border border-red-200/40 dark:border-red-500/20 transition-all cursor-pointer"
          >
            <ShieldAlert size={11} />
            <span>{t.tokensShortBtn || 'Tokens'}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
});

export default OperatorCard;
