import { useCallback } from "react";
import { useState } from 'react';
import { getDB } from '../../../lib/db';

export function useDashboardFinancials() {
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [pendingDebts, setPendingDebts] = useState(0);
  const [expectedCash, setExpectedCash] = useState(0);
  const [mpesaRevenue, setMpesaRevenue] = useState(0);
  const [emolaRevenue, setEmolaRevenue] = useState(0);
  const [cashSalesTotal, setCashSalesTotal] = useState(0);
  const [baseCash, setBaseCash] = useState(0);
  const [payoutsTotal, setPayoutsTotal] = useState(0);
  const [cashierBreakdown, setCashierBreakdown] = useState<any[]>([]);
  
  const [voidCount, setVoidCount] = useState(0);
  const [totalVoidAmount, setTotalVoidAmount] = useState(0);
  const [manualDiscounts, setManualDiscounts] = useState(0);

  const loadFinancials = useCallback(async (db: any, startOfDay: string, endOfDay: string) => {
    // Flash Financials
    const salesToday = await db.select(
       "SELECT SUM(total_mt) as total, payment_method FROM sales WHERE created_at >= ? AND created_at < ? AND status != 'voided' GROUP BY payment_method",
       [startOfDay, endOfDay]
    ) as any[];
    
    let revenue = 0;
    let cashSales = 0;
    let mpesa = 0;
    let emola = 0;

    if (salesToday) {
      salesToday.forEach((row: any) => {
        revenue += row.total || 0;
        if (row.payment_method === 'cash') cashSales += row.total || 0;
        if (row.payment_method === 'mpesa') mpesa += row.total || 0;
        if (row.payment_method === 'emola') emola += row.total || 0;
      });
    }

    // Add mixed payment breakdowns from today's sales
    const mixedToday = await db.select(
      "SELECT receipt_id, payment_details FROM sales WHERE created_at >= ? AND created_at < ? AND status != 'voided' AND payment_method = 'mixed'",
      [startOfDay, endOfDay]
    ) as any[];

    const uniqueMixedReceipts: { [receiptId: string]: any } = {};
    if (mixedToday) {
      mixedToday.forEach((row: any) => {
        if (row.receipt_id && row.payment_details) {
          try {
            uniqueMixedReceipts[row.receipt_id] = JSON.parse(row.payment_details);
          } catch(e) {}
        }
      });
    }

    let mixedCash = 0;
    let mixedMpesa = 0;
    let mixedEmola = 0;
    Object.values(uniqueMixedReceipts).forEach(details => {
      mixedCash += parseFloat(details.cash) || 0;
      mixedMpesa += parseFloat(details.mpesa) || 0;
      mixedEmola += parseFloat(details.emola) || 0;
    });

    cashSales += mixedCash;
    mpesa += mixedMpesa;
    emola += mixedEmola;

    setTodayRevenue(revenue);
    setMpesaRevenue(mpesa);
    setEmolaRevenue(emola);
    setCashSalesTotal(cashSales);

    const debts = await db.select("SELECT SUM(amount_mt) as total FROM debts WHERE status = 'unpaid'") as any[];
    setPendingDebts(debts?.[0]?.total || 0);

    // Operations & Security: Voids
    const voidsData = await db.select("SELECT COUNT(*) as count, SUM(total_mt) as amount FROM sales WHERE status = 'voided' AND created_at >= ?", [startOfDay]) as any[];
    setVoidCount(voidsData?.[0]?.count || 0);
    setTotalVoidAmount(-(voidsData?.[0]?.amount || 0));

    const voids = await db.select("SELECT COUNT(*) as count FROM audit_logs WHERE action IN ('void_receipt', 'remove_item') AND created_at >= ? AND created_at < ?", [startOfDay, endOfDay]) as any[];
    setVoidCount(prev => prev > (voids?.[0]?.count || 0) ? prev : (voids?.[0]?.count || 0));

    // Operations & Security: Manual Discounts
    const discountsData = await db.select(`
      SELECT SUM(
        CASE 
          WHEN discount_type = 'percent' THEN (original_price_mt * quantity * discount_value / 100.0)
          WHEN discount_type = 'value' THEN (discount_value * quantity)
          ELSE 0
        END
      ) as total FROM sales WHERE created_at >= ? AND status != 'voided'
    `, [startOfDay]) as any[];
    setManualDiscounts(discountsData?.[0]?.total || 0);

    const payouts = await db.select("SELECT SUM(amount) as total FROM till_payouts WHERE created_at >= ? AND created_at < ?", [startOfDay, endOfDay]) as any[];
    const totalPayouts = payouts?.[0]?.total || 0;
    setPayoutsTotal(totalPayouts);

    // Cashier breakdown & Total Starting Cash
    const baseCashRow = await db.select("SELECT value FROM settings WHERE key = 'base_cash'") as any[];
    const bCash = parseFloat(baseCashRow?.[0]?.value || '0');
    
    let totalActiveStartingCash = 0;
    let breakdown: any[] = [];
    
    try {
      const usersList = await db.select("SELECT * FROM users") as any[];
      for (const u of usersList) {
        const shiftStartRow = await db.select('SELECT value FROM settings WHERE key = ?', [`current_shift_start_${u.id}`]) as any[];
        const shiftStart = shiftStartRow?.[0]?.value || null;
        
        if (shiftStart) {
          const shiftCashRow = await db.select('SELECT value FROM settings WHERE key = ?', [`current_shift_cash_${u.id}`]) as any[];
          let startingCash = 0;
          if (shiftCashRow && shiftCashRow.length > 0) {
            startingCash = parseFloat(shiftCashRow[0].value) || 0;
          } else if (u.opening_cash !== null && u.opening_cash !== undefined) {
            startingCash = parseFloat(u.opening_cash) || 0;
          } else {
            startingCash = bCash;
          }
          totalActiveStartingCash += startingCash;

          const formattedShiftStart = shiftStart.replace('T', ' ').substring(0, 19);
          
          let cSales = 0;
          const salesSinceStart = await db.select(
            "SELECT total_mt, payment_method, payment_details FROM sales WHERE created_at >= ? AND user_id = ? AND status != 'voided'",
            [formattedShiftStart, u.id]
          ) as any[];

          if (salesSinceStart) {
            salesSinceStart.forEach((row: any) => {
              if (row.payment_method === 'cash') {
                cSales += row.total_mt || 0;
              } else if (row.payment_method === 'mixed' && row.payment_details) {
                try {
                  const splits = JSON.parse(row.payment_details);
                  cSales += parseFloat(splits.cash) || 0;
                } catch(e) {}
              }
            });
          }

          const cPayoutsRow = await db.select(
            "SELECT SUM(amount) as total FROM till_payouts WHERE created_at >= ? AND user_id = ?",
            [formattedShiftStart, u.id]
          ) as any[];
          const cPayouts = cPayoutsRow?.[0]?.total || 0;
          
          const cExpected = startingCash + cSales - cPayouts;
          breakdown.push({
            userId: u.id,
            name: u.name,
            role: u.role,
            isActive: true,
            shiftStart,
            startingCash,
            cashSales: cSales,
            payouts: cPayouts,
            expectedCash: cExpected
          });
        } else {
          let defaultPreset = 0;
          if (u.opening_cash !== null && u.opening_cash !== undefined) {
            defaultPreset = parseFloat(u.opening_cash) || 0;
          } else {
            defaultPreset = bCash;
          }
          breakdown.push({
            userId: u.id,
            name: u.name,
            role: u.role,
            isActive: false,
            shiftStart: null,
            startingCash: defaultPreset,
            cashSales: 0,
            payouts: 0,
            expectedCash: 0
          });
        }
      }
    } catch (err) {
      console.warn("Failed to build cashier breakdown:", err);
    }
    
    setCashierBreakdown(breakdown);

    const consolidatedBaseCash = totalActiveStartingCash > 0 ? totalActiveStartingCash : bCash;
    setBaseCash(consolidatedBaseCash);
    setExpectedCash(consolidatedBaseCash + cashSales - totalPayouts);
  }, []);

  const handleUpdateBaseCash = async (val: number) => {
    try {
      const db = await getDB();
      await db.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('base_cash', ?)", [val.toString()]);
      setBaseCash(val);
      setExpectedCash(val + cashSalesTotal - payoutsTotal);
    } catch (err) {
      console.error("Error saving base_cash setting:", err);
    }
  };

  return {
    todayRevenue,
    pendingDebts,
    expectedCash,
    mpesaRevenue,
    emolaRevenue,
    cashSalesTotal,
    baseCash,
    payoutsTotal,
    cashierBreakdown,
    voidCount,
    totalVoidAmount,
    manualDiscounts,
    loadFinancials,
    handleUpdateBaseCash
  };
}
