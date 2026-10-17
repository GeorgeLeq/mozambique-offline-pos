import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../../../supabase';
import { EmergencyToken, EmployeeOption } from '../types';

interface UseEmergencyTokensProps {
  shopId: string;
  shopCode?: string;
  employees: EmployeeOption[];
  onTokenUsedNotification?: (token: EmergencyToken) => void;
}

// Generates valid RFC4122 v4 UUID
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      // fallback below
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function useEmergencyTokens({
  shopId,
  shopCode,
  employees,
  onTokenUsedNotification,
}: UseEmergencyTokensProps) {
  const [tokens, setTokens] = useState<EmergencyToken[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Use refs to stabilize callbacks and prevent infinite render loops
  const notificationRef = useRef(onTokenUsedNotification);
  notificationRef.current = onTokenUsedNotification;

  const employeesRef = useRef(employees);
  employeesRef.current = employees;

  // Map database row directly according to user's exact Supabase schema
  const mapTokenRow = useCallback(
    (row: any): EmergencyToken => {
      if (!row) {
        return {
          id: generateUUID(),
          shop_id: shopId,
          code: '000000',
          is_used: false,
          created_at: new Date().toISOString(),
          cashier_name: 'Universal (Any Cashier)',
        };
      }

      // 1. PIN code
      const rawCode = row.code ?? row.pin ?? row.token ?? row.passcode ?? '';
      const tokenCode = String(rawCode);

      // 2. is_used boolean
      let isUsed = false;
      if (typeof row.is_used === 'boolean') {
        isUsed = row.is_used;
      } else if (typeof row.is_used === 'string') {
        isUsed = row.is_used.toLowerCase() === 'true' || row.is_used === '1';
      } else if (typeof row.used === 'boolean') {
        isUsed = row.used;
      } else if (row.status) {
        isUsed = String(row.status).toLowerCase() === 'used' || String(row.status).toLowerCase() === 'redeemed';
      }

      // 3. Cashier identification
      const cashierId = row.cashier_id ?? row.employee_id ?? row.user_id ?? null;
      let cashierName = 'Universal (Any Cashier)';
      const currentEmployees = employeesRef.current || [];

      if (cashierId) {
        const matched = currentEmployees.find(
          (e) =>
            String(e.id).toLowerCase() === String(cashierId).toLowerCase() ||
            String(e.user_id).toLowerCase() === String(cashierId).toLowerCase()
        );
        if (matched) {
          cashierName = matched.name;
        } else if (row.cashier_name || row.employee_name) {
          cashierName = String(row.cashier_name || row.employee_name);
        } else {
          cashierName = `Cashier (${String(cashierId).slice(0, 6)}...)`;
        }
      } else if (row.cashier_name || row.employee_name) {
        cashierName = String(row.cashier_name || row.employee_name);
      }

      // 4. Amounts & timestamps
      let usedAmount: number | null = null;
      if (row.used_amount !== undefined && row.used_amount !== null) {
        usedAmount = Number(row.used_amount);
      }

      return {
        id: String(row.id || row.idx || generateUUID()),
        shop_id: String(row.shop_id || shopId),
        code: tokenCode,
        cashier_id: cashierId ? String(cashierId) : null,
        cashier_name: cashierName,
        is_used: isUsed,
        used_amount: isNaN(Number(usedAmount)) ? null : usedAmount,
        used_for: row.used_for || null,
        created_at: String(row.created_at || new Date().toISOString()),
        used_at: row.used_at || null,
      };
    },
    [shopId]
  );

  // Fetch tokens from Supabase
  const fetchTokens = useCallback(
    async (isRefresh = false) => {
      const cleanShopId = (shopId || '').trim();
      const cleanShopCode = (shopCode || '').trim();

      if (!cleanShopId && !cleanShopCode) {
        setLoading(false);
        return;
      }

      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        // Query 1: standard select by shop_id ordered by created_at
        let { data, error } = await supabase
          .from('emergency_tokens')
          .select('*')
          .eq('shop_id', cleanShopId)
          .order('created_at', { ascending: false });

        // Query fallback if order column fails or no rows found with cleanShopId and code is different
        if ((error || !data || data.length === 0) && cleanShopCode && cleanShopCode !== cleanShopId) {
          const codeQuery = await supabase
            .from('emergency_tokens')
            .select('*')
            .eq('shop_id', cleanShopCode)
            .order('created_at', { ascending: false });
          if (!codeQuery.error && codeQuery.data && codeQuery.data.length > 0) {
            data = codeQuery.data;
            error = null;
          }
        }

        // Query fallback without server order if ordering failed
        if (error) {
          const unorderedQuery = await supabase
            .from('emergency_tokens')
            .select('*')
            .eq('shop_id', cleanShopId);
          if (!unorderedQuery.error) {
            data = unorderedQuery.data;
            error = null;
          }
        }

        if (error) {
          console.warn('Emergency tokens fetch notice:', error.message || error.code);
          setErrorMessage(error.message || 'Could not fetch emergency tokens.');
        } else {
          setErrorMessage(null);
          const mapped = (data || []).map(mapTokenRow);
          // Sort descending by date in-memory
          mapped.sort((a, b) => {
            const tA = new Date(a.created_at).getTime() || 0;
            const tB = new Date(b.created_at).getTime() || 0;
            return tB - tA;
          });
          setTokens(mapped);
        }
      } catch (err: any) {
        console.error('Error fetching emergency tokens:', err);
        setErrorMessage(err?.message || 'Failed to fetch tokens');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [shopId, shopCode, mapTokenRow]
  );

  // Initial load
  useEffect(() => {
    fetchTokens(false);
  }, [shopId, shopCode, fetchTokens]);

  // Realtime postgres changes subscription
  useEffect(() => {
    const cleanShopId = (shopId || '').trim();
    if (!cleanShopId) return;

    const channelName = `emergency_tokens_channel_${cleanShopId.slice(0, 8)}_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'emergency_tokens',
        },
        (payload: any) => {
          const rowData = payload.new || payload.old;
          if (
            !rowData ||
            !rowData.shop_id ||
            rowData.shop_id === cleanShopId ||
            (shopCode && rowData.shop_id === shopCode.trim())
          ) {
            if (payload.eventType === 'INSERT') {
              const fresh = mapTokenRow(payload.new);
              setTokens((prev) => [fresh, ...prev.filter((t) => t.id !== fresh.id && t.code !== fresh.code)]);
            } else if (payload.eventType === 'UPDATE') {
              const updated = mapTokenRow(payload.new);
              setTokens((prev) =>
                prev.map((t) => (t.id === updated.id || t.code === updated.code ? updated : t))
              );
              if (updated.is_used && notificationRef.current) {
                notificationRef.current(updated);
              }
            } else if (payload.eventType === 'DELETE') {
              const deletedId = payload.old?.id;
              const deletedCode = payload.old?.code;
              if (deletedId || deletedCode) {
                setTokens((prev) =>
                  prev.filter((t) => t.id !== deletedId && t.code !== deletedCode)
                );
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shopId, shopCode, mapTokenRow]);

  // Create new Token with optimistic update & database insert
  const createToken = useCallback(
    async (code: string, cashierId: string | null) => {
      const cleanShopId = (shopId || '').trim();
      if (!cleanShopId) throw new Error('Shop ID missing');
      const cleanCode = (code || '').trim();
      if (cleanCode.length < 4) throw new Error('PIN must be at least 4 digits');

      const uuid = generateUUID();
      const nowIso = new Date().toISOString();

      const newRow: any = {
        id: uuid,
        shop_id: cleanShopId,
        code: cleanCode,
        cashier_id: cashierId ? cashierId.trim() : null,
        is_used: false,
        used_amount: '0.00',
        used_for: 'Emergency Override',
        created_at: nowIso,
      };

      // Optimistic update
      const matchedEmp = cashierId
        ? employeesRef.current.find(
            (e) => String(e.id).toLowerCase() === String(cashierId).toLowerCase()
          )
        : null;

      const optimisticToken: EmergencyToken = {
        id: uuid,
        shop_id: cleanShopId,
        code: cleanCode,
        cashier_id: cashierId || null,
        cashier_name: matchedEmp ? matchedEmp.name : 'Universal (Any Cashier)',
        is_used: false,
        used_amount: 0,
        used_for: 'Emergency Override',
        created_at: nowIso,
        used_at: null,
      };

      setTokens((prev) => [optimisticToken, ...prev.filter((t) => t.id !== uuid && t.code !== cleanCode)]);

      // Insert to Supabase
      const { data, error } = await supabase
        .from('emergency_tokens')
        .insert(newRow)
        .select();

      if (error) {
        console.error('Error inserting into emergency_tokens:', error);
        // If error occurred, attempt minimal payload without id if server handles it
        const minimalRow = {
          shop_id: cleanShopId,
          code: cleanCode,
          cashier_id: cashierId ? cashierId.trim() : null,
          is_used: false,
        };
        const retry = await supabase.from('emergency_tokens').insert(minimalRow).select();
        if (retry.error) {
          // Revert optimistic update
          setTokens((prev) => prev.filter((t) => t.id !== uuid));
          throw new Error(retry.error.message || error.message || 'Failed to save token to database');
        } else if (retry.data && retry.data[0]) {
          const synced = mapTokenRow(retry.data[0]);
          setTokens((prev) => [synced, ...prev.filter((t) => t.id !== uuid && t.id !== synced.id)]);
        }
      } else if (data && data[0]) {
        const synced = mapTokenRow(data[0]);
        setTokens((prev) => [synced, ...prev.filter((t) => t.id !== uuid && t.id !== synced.id)]);
      }

      return uuid;
    },
    [shopId, mapTokenRow]
  );

  // Revoke token
  const revokeToken = useCallback(
    async (tokenId: string) => {
      try {
        // Optimistic removal
        setTokens((prev) => prev.filter((t) => t.id !== tokenId));

        const { error } = await supabase
          .from('emergency_tokens')
          .delete()
          .eq('id', tokenId);

        if (error) {
          console.error('Error revoking token:', error);
          // Retry fetch to restore state if delete failed
          fetchTokens(false);
          throw error;
        }
        return true;
      } catch (err: any) {
        throw err;
      }
    },
    [fetchTokens]
  );

  // Derived active vs used lists
  const activeTokens = useMemo(() => tokens.filter((t) => !t.is_used), [tokens]);
  const usedTokens = useMemo(() => tokens.filter((t) => t.is_used), [tokens]);

  return {
    tokens,
    activeTokens,
    usedTokens,
    loading,
    refreshing,
    errorMessage,
    fetchTokens,
    createToken,
    revokeToken,
  };
}
