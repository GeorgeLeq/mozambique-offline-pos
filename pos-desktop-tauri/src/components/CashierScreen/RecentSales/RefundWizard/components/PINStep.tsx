import React from 'react';
import { AlertTriangle, Lock, Check } from 'lucide-react';

interface RefundItem { quantity: number; product_name: string; total_mt: number; }
interface PINStepProps {
  refundItem: RefundItem;
  refundReceiptId: string;
  isTimeLimitExceeded: boolean;
  daysSinceSale: number;
  refundTimeLimit: number;
  managerPin: string;
  setManagerPin: (pin: string) => void;
  pinError: string;
  setPinError: (err: string) => void;
  handlePinSubmit: (e: React.FormEvent) => void;
}

const KEY_LETTERS: { [key: number]: string } = {
  2: 'A B C',
  3: 'D E F',
  4: 'G H I',
  5: 'J K L',
  6: 'M N O',
  7: 'P Q R S',
  8: 'T U V',
  9: 'W X Y Z',
};

export const PINStep: React.FC<PINStepProps> = ({
  refundItem,
  isTimeLimitExceeded,
  daysSinceSale,
  refundTimeLimit,
  managerPin,
  setManagerPin,
  pinError,
  setPinError,
  handlePinSubmit,
}) => {
  return (
    <div className="flex flex-col gap-4 relative">
      {isTimeLimitExceeded && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-left">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-bold text-amber-800 dark:text-amber-400">
              Limite de Tempo Excedido!
            </p>
            <p className="text-[10px] text-amber-700/90 dark:text-amber-400/80 leading-normal mt-0.5">
              Esta venda tem {daysSinceSale} dias de antiguidade. A política da loja restringe a {refundTimeLimit} dias. <strong>Requer PIN de Administrador</strong>.
            </p>
          </div>
        </div>
      )}

      <div className="text-center space-y-1">
        <span className="inline-block text-[10px] font-extrabold text-rose-500 dark:text-rose-400 uppercase tracking-widest bg-rose-500/10 dark:bg-rose-500/20 px-3 py-1 rounded-full">
          🔐 PIN DE SEGURANÇA REQUERIDO
        </span>
        <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium pt-1.5">
          Anulando <strong className="text-slate-800 dark:text-zinc-100">{refundItem.quantity}x {refundItem.product_name}</strong>
        </p>
        <p className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono tracking-tight">
          {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(refundItem.total_mt)}
        </p>
      </div>

      <form onSubmit={handlePinSubmit} className="space-y-4">
        {/* Secure visual feedback dots */}
        <div className="flex justify-center items-center gap-3.5 py-1">
          {Array.from({ length: 8 }).map((_, i) => {
            const active = i < managerPin.length;
            return (
              <div
                key={i}
                className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-200 ${
                  active
                    ? 'bg-rose-500 border-rose-500 scale-110 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                    : 'border-slate-300 dark:border-zinc-700 bg-transparent'
                }`}
              />
            );
          })}
        </div>

        <div className="relative max-w-[280px] mx-auto">
          <input
            type="password"
            value={managerPin}
            readOnly
            placeholder="••••••••"
            className="w-full py-2.5 bg-slate-100/60 dark:bg-zinc-950/40 border border-slate-200/85 dark:border-white/5 rounded-2xl text-center text-xl font-black tracking-[0.4em] text-slate-800 dark:text-zinc-100 focus:outline-none placeholder-slate-300 dark:placeholder-zinc-700 select-none"
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <Lock size={15} />
          </div>
        </div>

        {/* Tactile Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[280px] mx-auto pt-1 pb-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => {
                if (managerPin.length < 8) {
                  setManagerPin(managerPin + num);
                  setPinError('');
                }
              }}
              className="group h-14 bg-white hover:bg-slate-50 active:scale-95 dark:bg-zinc-900 dark:hover:bg-zinc-800/80 border border-slate-200/60 dark:border-zinc-800/70 text-slate-800 dark:text-zinc-100 rounded-2xl transition-all cursor-pointer flex flex-col items-center justify-center select-none shadow-sm hover:shadow active:shadow-inner"
            >
              <span className="text-xl font-black leading-none">{num}</span>
              <span className="text-[7px] text-slate-400 dark:text-zinc-500 font-bold tracking-widest uppercase mt-0.5 h-2">
                {KEY_LETTERS[num] || ' '}
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setManagerPin('');
              setPinError('');
            }}
            className="h-14 bg-rose-50/50 hover:bg-rose-50 dark:bg-rose-950/10 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 font-extrabold text-[10px] rounded-2xl transition-all cursor-pointer flex items-center justify-center select-none uppercase tracking-wider active:scale-95 border border-transparent dark:border-rose-950/20"
          >
            Limpar
          </button>
          <button
            type="button"
            onClick={() => {
              if (managerPin.length < 8) {
                setManagerPin(managerPin + '0');
                setPinError('');
              }
            }}
            className="h-14 bg-white hover:bg-slate-50 active:scale-95 dark:bg-zinc-900 dark:hover:bg-zinc-800/80 border border-slate-200/60 dark:border-zinc-800/70 text-slate-800 dark:text-zinc-100 rounded-2xl transition-all cursor-pointer flex flex-col items-center justify-center select-none shadow-sm hover:shadow active:shadow-inner"
          >
            <span className="text-xl font-black leading-none">0</span>
            <span className="text-[7px] text-slate-400 dark:text-zinc-500 font-bold tracking-widest uppercase mt-0.5 h-2">
              ➕
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setManagerPin(managerPin.slice(0, -1));
              setPinError('');
            }}
            className="h-14 bg-slate-100/80 hover:bg-slate-200 active:scale-95 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded-2xl transition-all cursor-pointer flex items-center justify-center select-none shadow-sm"
          >
            <span className="text-base font-bold">⌫</span>
          </button>
        </div>
        
        {pinError && (
          <p className="text-center text-xs font-black text-rose-500 font-mono animate-bounce" id="pin-error-msg">
            ⚠️ {pinError}
          </p>
        )}

        <button
          type="submit"
          disabled={!managerPin}
          className="w-full max-w-[280px] mx-auto py-3.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 dark:disabled:bg-zinc-800 disabled:text-slate-400 dark:disabled:text-zinc-600 text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-rose-500/10 disabled:shadow-none flex items-center justify-center gap-2 cursor-pointer"
        >
          <Check size={14} className="stroke-[3]" /> Confirmar Autorização
        </button>
      </form>
    </div>
  );
};
