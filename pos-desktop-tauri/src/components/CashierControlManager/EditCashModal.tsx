import React from 'react';
import { motion } from 'motion/react';
import { Wallet, Save } from 'lucide-react';
import { User } from '../../types';
import { useCashierControlI18n } from '../../i18n';

interface EditCashModalProps {
  editingUser: User;
  cashInputValue: string;
  setCashInputValue: (val: string) => void;
  updateActiveShift: boolean;
  setUpdateActiveShift: (val: boolean) => void;
  hasActiveShift: boolean;
  onClose: () => void;
  onSave: () => void;
  onAdjustPreset: (amount: number) => void;
}

export default function EditCashModal({
  editingUser,
  cashInputValue,
  setCashInputValue,
  updateActiveShift,
  setUpdateActiveShift,
  hasActiveShift,
  onClose,
  onSave,
  onAdjustPreset,
}: EditCashModalProps) {
  const t = useCashierControlI18n();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-zinc-950/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-white/5 rounded-[2.5rem] shadow-2xl p-7 max-w-md w-full"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <Wallet size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100">
              {(t.editCashTitle || 'Ajustar Caixa de {0}').replace('{0}', editingUser.name)}
            </h3>
            <p className="text-xs text-slate-450 dark:text-zinc-500 font-semibold mt-0.5">
              {t.editCashSubtitle || 'Modifique o fundo de caixa predefinido do operador.'}
            </p>
          </div>
        </div>

        {/* Cash Input */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
              {t.cashFloatLabel || 'Valor de Fundo de Caixa (MT)'}
            </label>
            <input
              type="number"
              step="any"
              value={cashInputValue}
              onChange={(e) => setCashInputValue(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/5 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-600 outline-none transition-all font-mono font-bold text-center text-lg"
              placeholder={t.cashFloatPlaceholder || 'Deixe em branco para usar o padrão global'}
            />
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1.5 block font-semibold leading-normal">
              {t.cashFloatHint || 'Se deixar em branco, este operador utilizará o valor global padrão do estabelecimento sempre que iniciar um novo turno.'}
            </span>
          </div>

          {/* Preset helpers */}
          <div className="grid grid-cols-4 gap-2">
            {[500, 1000, 5000, 10000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => onAdjustPreset(amt)}
                className="py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded-xl text-[10px] font-black font-mono border border-slate-200/50 dark:border-white/5 transition-all cursor-pointer"
              >
                +{amt.toLocaleString('pt-MZ')}
              </button>
            ))}
          </div>

          {/* Live shift sync checkbox if user has an active shift */}
          {hasActiveShift && (
            <div className="p-3.5 bg-green-50/50 dark:bg-green-500/5 border border-green-100/50 dark:border-green-500/10 rounded-2xl flex items-start gap-3 mt-4">
              <input 
                type="checkbox"
                id="update-active-checkbox"
                checked={updateActiveShift}
                onChange={(e) => setUpdateActiveShift(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-green-600 rounded border-green-300 dark:border-zinc-800 focus:ring-green-500 cursor-pointer"
              />
              <label htmlFor="update-active-checkbox" className="flex-1 cursor-pointer select-none">
                <span className="block text-xs font-extrabold text-green-800 dark:text-green-400">
                  {t.syncActiveShiftTitle || 'Sincronizar com o Turno Ativo'}
                </span>
                <span className="block text-[10px] text-green-600 dark:text-green-500 font-semibold leading-normal mt-0.5">
                  {t.syncActiveShiftDesc || 'O operador está com sessão aberta agora mesmo! Se ativado, esta alteração irá atualizar o fundo de caixa ativo atual sem requerer fecho de turno.'}
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-slate-150 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-450 font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            {t.cancelBtn || 'Cancelar'}
          </button>
          <button
            type="button"
            onClick={onSave}
            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 dark:shadow-indigo-500/10 cursor-pointer"
          >
            <Save size={14} />
            <span>{t.saveChangesBtn || 'Gravar'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
