import React, { useState } from 'react';
import { Key } from 'lucide-react';
import toast from 'react-hot-toast';
import { getDB } from '../../../lib/db';

interface NumpadFooterActionsProps {
  onOpenRecovery: () => void;
  onSetIsLoading: (loading: boolean) => void;
}

export function NumpadFooterActions({ onOpenRecovery, onSetIsLoading }: NumpadFooterActionsProps) {
  const handleWipeSystem = async () => {
    if (window.confirm('TEM A CERTEZA QUE DESEJA APAGAR TODO O SISTEMA? Esta ação é irreversível e limpará produtos, utilizadores, vendas e configurações!')) {
      if (window.confirm('Confirmação final: APAGAR TUDO?')) {
        try {
          onSetIsLoading(true);
          const db = await getDB();
          await db.execute('DELETE FROM expected_delivery_items');
          await db.execute('DELETE FROM expected_deliveries');
          await db.execute('DELETE FROM product_aliases');
          await db.execute('DELETE FROM spoiled_items');
          await db.execute('DELETE FROM debt_payments');
          await db.execute('DELETE FROM debts');
          await db.execute('DELETE FROM sales');
          await db.execute('DELETE FROM shift_reports');
          await db.execute('DELETE FROM till_payouts');
          await db.execute('DELETE FROM audit_logs');
          await db.execute('DELETE FROM scan_history');
          await db.execute('DELETE FROM products');
          await db.execute('DELETE FROM users');
          await db.execute('DELETE FROM settings');
          localStorage.clear();
          toast.success('Sistema limpo com sucesso! A reiniciar...');
          setTimeout(() => window.location.reload(), 1500);
        } catch (e) {
          console.error(e);
          toast.error('Erro ao limpar sistema.');
          onSetIsLoading(false);
        }
      }
    }
  };

  return (
    <>
      <button
        onClick={onOpenRecovery}
        className="mt-8 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1.5"
      >
        <Key size={12} />
        Esqueceu o PIN do Administrador?
      </button>

      <button
        onClick={handleWipeSystem}
        className="mt-4 text-[10px] font-bold text-slate-300 hover:text-rose-500 dark:text-zinc-700 dark:hover:text-rose-600 transition-colors cursor-pointer"
        title="Limpar Sistema (Teste)"
      >
        WIPE SYSTEM
      </button>
    </>
  );
}
