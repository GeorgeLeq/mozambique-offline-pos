import { useState, useEffect, useCallback, useRef } from 'react';
import { getDB } from '../../../lib/db';
import { useTableWatcher } from '../../../lib/dbEvents';
import toast from 'react-hot-toast';
import { DebtRecord } from '../types';
import { deleteDebtFromDB } from '../services/debtService';

export function useDebtsData() {
  const [debts, setDebts] = useState<DebtRecord[]>([]);
  const fetchIdRef = useRef(0);
  const pendingDebtsRef = useRef<Map<string, DebtRecord>>(new Map());

  const addOptimisticDebt = useCallback((debt: DebtRecord) => {
    pendingDebtsRef.current.set(debt.id, debt);
    setDebts(prev => {
      const filtered = prev.filter(d => d.id !== debt.id);
      return [debt, ...filtered];
    });
  }, []);

  const removeOptimisticDebt = useCallback((id: string) => {
    pendingDebtsRef.current.delete(id);
  }, []);

  const loadDebts = useCallback(async () => {
    const currentFetchId = ++fetchIdRef.current;
    const t0 = performance.now();
    console.log(`[ClientLedger] loadDebts #${currentFetchId}: START`);
    try {
      const db = await getDB();
      let loadedDebts: any[] = [];
      let loadedPayments: any[] = [];

      try {
        const results = await Promise.all([
          db.select('SELECT * FROM debts ORDER BY created_at DESC'),
          db.select('SELECT * FROM debt_payments ORDER BY created_at DESC')
        ]);
        loadedDebts = results[0] || [];
        loadedPayments = results[1] || [];
      } catch (dbErr) {
        console.warn('[ClientLedger] DB select failed:', dbErr);
      }

      // Guard against out-of-order stale responses
      if (currentFetchId !== fetchIdRef.current) {
        console.log(`[ClientLedger] loadDebts #${currentFetchId}: IGNORED (superseded by #${fetchIdRef.current})`);
        return;
      }

      const tSelect = performance.now();
      console.log(`[ClientLedger] loadDebts #${currentFetchId}: DB query finished in ${(tSelect - t0).toFixed(2)}ms. Loaded ${loadedDebts?.length || 0} debts, ${loadedPayments?.length || 0} payments.`);
      
      const paymentsMap = (loadedPayments || []).reduce((acc: Record<string, { total: number, history: any[] }>, p: any) => {
        if (!p || !p.debt_id) return acc;
        if (!acc[p.debt_id]) acc[p.debt_id] = { total: 0, history: [] };
        const pAmt = Number(p.amount_paid_mt ?? p.amount_mt ?? p.amount ?? 0);
        acc[p.debt_id].total += pAmt;
        acc[p.debt_id].history.push(p);
        return acc;
      }, {});
      
      let processedDebts = (loadedDebts || []).map(d => {
        const paymentInfo = paymentsMap[d.id] || { total: 0, history: [] };
        const totalPaid = paymentInfo.total;
        const currentAmt = Number(d.amount_mt) || 0;
        const origAmount = d.status === 'paid' ? (totalPaid > 0 ? totalPaid : currentAmt) : (currentAmt + totalPaid);
        
        return { 
          ...d, 
          amount_mt: currentAmt, 
          original_amount: origAmount, 
          total_paid: totalPaid,
          payment_history: paymentInfo.history
        };
      });

      // Auto-expiry check for active unpaid debts - ONLY if auto-expiry is explicitly enabled
      const autoExpireEnabled = localStorage.getItem('debts_auto_expire') === 'true';
      const expiryDaysSetting = Number(localStorage.getItem('debts_expiry_days') || '30');

      if (autoExpireEnabled && expiryDaysSetting > 0) {
        const nowTime = new Date().getTime();
        const expiredDebts = processedDebts.filter(d => {
          if (d.status === 'unpaid' && d.is_deleted !== 1 && d.created_at) {
            const createdTime = new Date(d.created_at).getTime();
            if (isNaN(createdTime)) return false;
            const ageInDays = (nowTime - createdTime) / (1000 * 60 * 60 * 24);
            return ageInDays > expiryDaysSetting;
          }
          return false;
        });

        if (expiredDebts.length > 0) {
          console.log(`[Auto-Expiry] Found ${expiredDebts.length} expired unpaid debts. Soft deleting...`);
          const nowIso = new Date().toISOString();
          for (const d of expiredDebts) {
            await db.execute(
              'UPDATE debts SET is_deleted = 1, deleted_at = ?, sync_status = 0 WHERE id = ?',
              [nowIso, d.id]
            );
            try {
              const { logAudit } = await import('../../../lib/audit');
              const details = `Dívida Expirada Automaticamente (Sistema - Expirou em ${expiryDaysSetting} dias): Cliente: "${d.customer_name}", Valor: ${d.amount_mt} MT, Registado por: "${d.cashier_name || 'N/A'}"`;
              await logAudit('system', 'DEBT_AUTO_EXPIRED', details);
            } catch (auditErr) {
              console.warn('Failed to log auto-expiry audit:', auditErr);
            }
          }
        }
      } else {
        // If auto-expiry is disabled, repair any debts that were falsely soft-deleted by auto-expiry previously
        const falselyDeleted = processedDebts.filter(d => d.status === 'unpaid' && d.amount_mt > 0 && d.is_deleted === 1 && d.deleted_at?.includes('Auto-Expiry'));
        if (falselyDeleted.length > 0) {
          console.log(`[Debts Recovery] Restoring ${falselyDeleted.length} debts previously auto-expired by bug...`);
          for (const d of falselyDeleted) {
            await db.execute(
              'UPDATE debts SET is_deleted = 0, deleted_at = NULL, sync_status = 0 WHERE id = ?',
              [d.id]
            );
            d.is_deleted = 0;
            d.deleted_at = undefined;
          }
        }
      }

      // Auto-purge canceled/soft-deleted debts exceeding selected retention window (skip if expiryDaysSetting <= 0 for "Never")
      if (expiryDaysSetting > 0) {
        const nowMs = new Date().getTime();
        const retentionMs = expiryDaysSetting * 24 * 60 * 60 * 1000;
        const validDebts: DebtRecord[] = [];

        for (const d of processedDebts) {
          if (d.is_deleted === 1) {
            const deletedTime = d.deleted_at 
              ? new Date(d.deleted_at).getTime() 
              : (d.created_at ? new Date(d.created_at).getTime() : nowMs);
            
            if (nowMs - deletedTime > retentionMs) {
              console.log(`[DebtsPurge] Auto-purging canceled debt beyond ${expiryDaysSetting} days: ID ${d.id} (${d.customer_name})`);
              await deleteDebtFromDB(d.id);
            } else {
              validDebts.push(d);
            }
          } else {
            validDebts.push(d);
          }
        }
        processedDebts = validDebts;
      }

      // Merge in-flight pending optimistic debts if they aren't in loaded list yet
      const loadedIds = new Set(processedDebts.map(d => d.id));
      const pendingToMerge: DebtRecord[] = [];
      pendingDebtsRef.current.forEach((pendingDebt, id) => {
        if (!loadedIds.has(id)) {
          pendingToMerge.push(pendingDebt);
        }
      });

      const mergedDebts = [...pendingToMerge, ...processedDebts];

      // Sort by created_at DESC
      mergedDebts.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      
      setDebts(mergedDebts as DebtRecord[]);
      const tEnd = performance.now();
      console.log(`[ClientLedger] loadDebts #${currentFetchId}: DONE in ${(tEnd - t0).toFixed(2)}ms. State set with ${mergedDebts.length} records.`);
    } catch (e) {
      console.error('[ClientLedger] loadDebts: ERROR', e);
      toast.error('Erro ao carregar dívidas do cliente');
    }
  }, []);

  useEffect(() => {
    loadDebts();
  }, [loadDebts]);

  useTableWatcher('debts', loadDebts);
  useTableWatcher('debt_payments', loadDebts);

  return { debts, setDebts, loadDebts, addOptimisticDebt, removeOptimisticDebt };
}
