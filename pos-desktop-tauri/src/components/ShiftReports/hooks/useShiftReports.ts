import { useState, useEffect } from 'react';
import { getDB } from '../../../lib/db';
import { supabase } from '../../../lib/supabase';
import { ShiftReport } from '../types';
import toast from 'react-hot-toast';

export function useShiftReports() {
  const [reports, setReports] = useState<ShiftReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [baseCash, setBaseCash] = useState<string>('10000');
  const [isSavingBaseCash, setIsSavingBaseCash] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ok' | 'shortage' | 'surplus'>('all');
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [showArchive, setShowArchive] = useState(false);
  const [archivedReports, setArchivedReports] = useState<ShiftReport[]>([]);
  const [loadingArchive, setLoadingArchive] = useState(false);
  const [hasArchiveRecords, setHasArchiveRecords] = useState(true);
  const [activeShiftsCount, setActiveShiftsCount] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    loadData();
    checkArchiveAvailability();
  }, []);

  const checkArchiveAvailability = async () => {
    try {
      const db = await getDB();
      const settings = await db.select("SELECT value FROM settings WHERE key = 'shop_id'") as { value: string }[];
      const shopId = settings?.[0]?.value || 'default_shop';

      const { count, error } = await supabase
        .from('shift_reports')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shopId)
        .eq('is_archived', true);

      if (!error && count !== null) {
        setHasArchiveRecords(count > 0);
      }
    } catch (e) {
      // Non-blocking
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, showArchive]);

  const fetchArchivedReportsFromCloud = async () => {
    setLoadingArchive(true);
    try {
      const db = await getDB();
      const settings = await db.select("SELECT value FROM settings WHERE key = 'shop_id'") as { value: string }[];
      const shopId = settings?.[0]?.value || 'default_shop';

      const { data, error } = await supabase
        .from('shift_reports')
        .select('*')
        .eq('shop_id', shopId)
        .eq('is_archived', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArchivedReports((data || []).map((r: any) => ({
        id: r.id,
        user_id: r.user_id,
        reported_amount_mt: r.closing_cash ?? r.reported_amount_mt ?? 0,
        expected_amount_mt: r.expected_cash ?? r.expected_amount_mt ?? 0,
        difference_mt: r.discrepancy ?? r.difference_mt ?? 0,
        details_json: typeof r.details_json === 'object' ? JSON.stringify(r.details_json) : r.details_json,
        created_at: r.created_at
      })));
      setShowArchive(true);
      toast.success('Arquivo histórico carregado do Supabase.');
    } catch (e) {
      console.error('Failed to load archive from cloud', e);
      toast.error('Erro ao carregar arquivo do Supabase');
    } finally {
      setLoadingArchive(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const db = await getDB();
      try {
        await db.execute("DELETE FROM shift_reports WHERE datetime(COALESCE(closed_at, opened_at)) < datetime('now', '-30 days')");
      } catch (e) {
        // Fallback
      }

      const loadedReports: any[] = await db.select('SELECT id, user_id, user_name, closing_cash as reported_amount_mt, expected_cash as expected_amount_mt, discrepancy as difference_mt, details_json, opened_at as created_at FROM shift_reports ORDER BY opened_at DESC, closed_at DESC');
      
      const mappedReports: ShiftReport[] = loadedReports.map(r => ({
        id: r.id,
        user_id: r.user_id,
        reported_amount_mt: r.reported_amount_mt || 0,
        expected_amount_mt: r.expected_amount_mt || 0,
        difference_mt: r.difference_mt || 0,
        details_json: r.details_json,
        created_at: r.created_at
      }));

      setReports(mappedReports);

      const users: any[] = await db.select('SELECT id, name FROM users');
      const uMap: Record<string, string> = {};
      users.forEach(u => {
        uMap[u.id] = u.name;
      });
      // also include from report itself if available
      loadedReports.forEach(r => {
        if (r.user_name && !uMap[r.user_id]) {
          uMap[r.user_id] = r.user_name;
        }
      });
      setUserMap(uMap);

      const savedBaseCash = await db.select("SELECT value FROM settings WHERE key = 'base_cash'") as { value: string }[];
      if (savedBaseCash.length > 0) {
        setBaseCash(savedBaseCash[0].value);
      }

      try {
        const activeUsers: any[] = await db.select('SELECT COUNT(*) as count FROM users WHERE current_shift_start IS NOT NULL');
        const openReports: any[] = await db.select("SELECT COUNT(*) as count FROM shift_reports WHERE status = 'open' OR closed_at IS NULL");
        const activeCount = Math.max(activeUsers?.[0]?.count || 0, openReports?.[0]?.count || 0);
        setActiveShiftsCount(activeCount);
      } catch (e) {
        // non-blocking
      }
    } catch (error) {
      console.error('Failed to load shift reports:', error);
      toast.error('Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBaseCash = async () => {
    setIsSavingBaseCash(true);
    try {
      const db = await getDB();
      const val = parseFloat(baseCash);
      if (isNaN(val) || val < 0) {
        toast.error('Valor inválido');
        return;
      }
      await db.execute('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['base_cash', val.toString()]);
      toast.success('Fundo de maneio atualizado');
    } catch (error) {
      console.error('Failed to save base cash:', error);
      toast.error('Erro ao salvar');
    } finally {
      setIsSavingBaseCash(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const activeSource = showArchive ? archivedReports : reports;

  const totalExpected = activeSource.reduce((sum, r) => sum + r.expected_amount_mt, 0);
  const totalReported = activeSource.reduce((sum, r) => sum + r.reported_amount_mt, 0);
  const totalDifference = activeSource.reduce((sum, r) => sum + r.difference_mt, 0);
  const totalShifts = activeSource.length;

  const okCount = activeSource.filter(r => r.difference_mt === 0).length;
  const shortageCount = activeSource.filter(r => r.difference_mt < 0).length;
  const surplusCount = activeSource.filter(r => r.difference_mt > 0).length;

  const filteredReports = activeSource.filter(r => {
    const formattedDate = new Date(r.created_at).toLocaleString('pt-MZ');
    const userName = userMap[r.user_id] || r.user_id || 'Sistema';
    const matchesSearch = userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          formattedDate.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'ok') {
      return matchesSearch && r.difference_mt === 0;
    } else if (statusFilter === 'shortage') {
      return matchesSearch && r.difference_mt < 0;
    } else if (statusFilter === 'surplus') {
      return matchesSearch && r.difference_mt > 0;
    }
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage) || 1;
  const paginatedReports = filteredReports.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return {
    reports,
    loading,
    baseCash,
    setBaseCash,
    isSavingBaseCash,
    expandedId,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    userMap,
    currentPage,
    setCurrentPage,
    showArchive,
    setShowArchive,
    archivedReports,
    loadingArchive,
    itemsPerPage,
    totalPages,
    paginatedReports,
    filteredReports,
    totalExpected,
    totalReported,
    totalDifference,
    totalShifts,
    activeShiftsCount,
    okCount,
    shortageCount,
    surplusCount,
    hasArchiveRecords,
    fetchArchivedReportsFromCloud,
    loadData,
    handleSaveBaseCash,
    toggleExpand
  };
}
