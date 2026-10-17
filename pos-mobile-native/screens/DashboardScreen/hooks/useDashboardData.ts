import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../supabase';
import { DashboardMetrics, Employee, ShopData, LiveMetricsData } from '../types';

function mapLiveMetricsToDashboard(
  liveMetrics: LiveMetricsData,
  fallbackBaseCash = 0
): DashboardMetrics {
  const baseCash = Number(liveMetrics.base_cash_mt ?? fallbackBaseCash);
  const dinheiroVivo = Number(liveMetrics.cash_sales_mt ?? 0);
  const mpesa = Number(liveMetrics.mpesa_sales_mt ?? 0);
  const emola = Number(liveMetrics.emola_sales_mt ?? 0);
  const cardSales = Number(liveMetrics.card_sales_mt ?? 0);
  const otherSales = Number(liveMetrics.other_sales_mt ?? 0);
  const totalPayouts = Number(liveMetrics.payouts_total_mt ?? 0);

  const calculatedRevenue =
    dinheiroVivo + mpesa + emola + cardSales + otherSales;
  const receitaTotal = Number(
    liveMetrics.today_revenue_mt ?? (calculatedRevenue > 0 ? calculatedRevenue : 0)
  );

  const dinheiroEmCaixa = Number(
    liveMetrics.live_cash_mt ?? Math.max(0, baseCash + dinheiroVivo - totalPayouts)
  );

  const salesCount = Number(liveMetrics.sales_count ?? 0);
  const averageTicket = Number(
    liveMetrics.average_ticket_mt ??
      (salesCount > 0 ? receitaTotal / salesCount : 0)
  );
  const pendingDebtsMt = Number(liveMetrics.pending_debts_mt ?? 0);
  const pendingDebtsCount = Number(liveMetrics.pending_debts_count ?? 0);

  return {
    receitaTotal,
    dinheiroVivo,
    mpesa,
    emola,
    cardSales,
    otherSales,
    dinheiroEmCaixa,
    baseCash,
    totalPayouts,
    salesCount,
    averageTicket,
    pendingDebtsMt,
    pendingDebtsCount,
    lastUpdatedAt: liveMetrics.last_updated_at,
    date: liveMetrics.date,
    rawLiveMetrics: liveMetrics,
  };
}

export function useDashboardData(shopData: ShopData) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    receitaTotal: 0,
    dinheiroVivo: 0,
    mpesa: 0,
    emola: 0,
    cardSales: 0,
    otherSales: 0,
    dinheiroEmCaixa: 0,
    baseCash: 0,
    totalPayouts: 0,
    salesCount: 0,
    averageTicket: 0,
    pendingDebtsMt: 0,
    pendingDebtsCount: 0,
  });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [activeTokensCount, setActiveTokensCount] = useState<number>(0);

  const getDayBounds = () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return { startIso: start.toISOString(), endIso: end.toISOString() };
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      // 1. First attempt to fetch live_metrics directly from shops table (Real-time POS JSONB snapshot)
      let foundLiveMetrics = false;
      try {
        const { data: shopRecord, error: shopErr } = await supabase
          .from('shops')
          .select('live_metrics')
          .eq('id', shopData.id)
          .maybeSingle();

        if (!shopErr && shopRecord?.live_metrics) {
          let parsed: LiveMetricsData | null = null;
          if (typeof shopRecord.live_metrics === 'string') {
            try {
              parsed = JSON.parse(shopRecord.live_metrics);
            } catch (e) {
              parsed = null;
            }
          } else if (typeof shopRecord.live_metrics === 'object') {
            parsed = shopRecord.live_metrics as LiveMetricsData;
          }

          if (parsed && typeof parsed === 'object') {
            const mapped = mapLiveMetricsToDashboard(parsed);
            setMetrics(mapped);
            foundLiveMetrics = true;
          }
        }
      } catch (err) {
        // Fallback to table queries if live_metrics column is not present or query errors
      }

      // 2. Fallback: If live_metrics was not found or null, compute from raw sales, payouts, settings
      if (!foundLiveMetrics) {
        const { startIso, endIso } = getDayBounds();

        // Fetch Sales for today (not voided)
        const { data: sales } = await supabase
          .from('sales')
          .select('*')
          .eq('shop_id', shopData.id)
          .gte('created_at', startIso)
          .lt('created_at', endIso)
          .neq('status', 'voided');

        // Fetch Till Payouts
        const { data: payouts } = await supabase
          .from('till_payouts')
          .select('*')
          .eq('shop_id', shopData.id)
          .gte('created_at', startIso)
          .lt('created_at', endIso);

        // Fetch Base Cash
        const { data: settings } = await supabase
          .from('settings')
          .select('value')
          .eq('shop_id', shopData.id)
          .eq('key', 'base_cash')
          .maybeSingle();

        const baseCash = settings?.value ? parseFloat(settings.value) : 0;

        let receitaTotal = 0;
        let dinheiroVivo = 0;
        let mpesa = 0;
        let emola = 0;
        let cardSales = 0;
        let otherSales = 0;
        const salesCount = (sales || []).length;

        (sales || []).forEach((sale: any) => {
          const amount = parseFloat(sale.total_mt) || 0;
          receitaTotal += amount;

          const method = (sale.payment_method || '').toLowerCase();

          if (method === 'cash') {
            dinheiroVivo += amount;
          } else if (method === 'mpesa' || method === 'm-pesa') {
            mpesa += amount;
          } else if (method === 'emola' || method === 'e-mola') {
            emola += amount;
          } else if (method === 'card' || method === 'cartão' || method === 'pos') {
            cardSales += amount;
          } else if (method === 'mixed') {
            let details: any = {};
            try {
              details =
                typeof sale.payment_details === 'string'
                  ? JSON.parse(sale.payment_details)
                  : sale.payment_details || {};
            } catch (e) {}

            const cashAmount = parseFloat(details.cash || 0);
            const mpesaAmount = parseFloat(details.mpesa || details['m-pesa'] || 0);
            const emolaAmount = parseFloat(details.emola || details['e-mola'] || 0);
            const cardAmount = parseFloat(details.card || details['cartão'] || 0);

            dinheiroVivo += cashAmount;
            mpesa += mpesaAmount;
            emola += emolaAmount;
            cardSales += cardAmount;
          } else {
            otherSales += amount;
          }
        });

        const totalPayouts = (payouts || []).reduce(
          (acc: number, p: any) => acc + (parseFloat(p.amount) || 0),
          0
        );
        const dinheiroEmCaixa = Math.max(0, baseCash + dinheiroVivo - totalPayouts);
        const averageTicket = salesCount > 0 ? receitaTotal / salesCount : 0;

        setMetrics({
          receitaTotal,
          dinheiroVivo,
          mpesa,
          emola,
          cardSales,
          otherSales,
          dinheiroEmCaixa,
          baseCash,
          totalPayouts,
          salesCount,
          averageTicket,
          pendingDebtsMt: 0,
          pendingDebtsCount: 0,
        });
      }

      // 3. Fetch Employees
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .eq('shop_id', shopData.id)
        .order('current_shift_start', { ascending: false });

      if (!usersError && usersData) {
        setEmployees(usersData);
      }

      // 4. Fetch Active Emergency Tokens Count
      try {
        const { data: tokData, error: tokErr } = await supabase
          .from('emergency_tokens')
          .select('*')
          .eq('shop_id', shopData.id);

        if (!tokErr && tokData) {
          const count = tokData.filter(
            (t: any) => t.is_used === false || t.is_used === 'false'
          ).length;
          setActiveTokensCount(count);
        }
      } catch (tokErr) {
        // ignore fallback
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [shopData.id]);

  useEffect(() => {
    fetchDashboardData();

    // Setup Real-time listener for live_metrics updates on the shops table
    const channel = supabase
      .channel(`shop-live-metrics-${shopData.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'shops',
          filter: `id=eq.${shopData.id}`,
        },
        (payload: any) => {
          if (payload.new && payload.new.live_metrics) {
            let parsed: LiveMetricsData | null = null;
            if (typeof payload.new.live_metrics === 'string') {
              try {
                parsed = JSON.parse(payload.new.live_metrics);
              } catch (e) {
                parsed = null;
              }
            } else if (typeof payload.new.live_metrics === 'object') {
              parsed = payload.new.live_metrics;
            }

            if (parsed && typeof parsed === 'object') {
              setMetrics((prev) => mapLiveMetricsToDashboard(parsed!, prev.baseCash));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDashboardData, shopData.id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  const toggleEmployeeBlock = async (employeeId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;

    // Optimistic update
    setEmployees((prev) =>
      prev.map((e) => (e.id === employeeId ? { ...e, is_blocked: newStatus } : e))
    );

    try {
      const { error } = await supabase
        .from('users')
        .update({ is_blocked: newStatus })
        .eq('id', employeeId);

      if (error) throw error;
    } catch (err) {
      console.error('Error toggling block status:', err);
      // Revert on error
      setEmployees((prev) =>
        prev.map((e) => (e.id === employeeId ? { ...e, is_blocked: currentStatus } : e))
      );
    }
  };

  return {
    loading,
    refreshing,
    metrics,
    employees,
    activeTokensCount,
    onRefresh,
    toggleEmployeeBlock,
  };
}
