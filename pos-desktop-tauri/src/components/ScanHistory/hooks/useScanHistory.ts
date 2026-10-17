import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getDB } from '../../../lib/db';
import { UserStats } from '../types';

export function useScanHistory() {
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>('');
  const [userScans, setUserScans] = useState<any[]>([]);
  const [userPayouts, setUserPayouts] = useState<any[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'scans' | 'payouts'>('scans');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const db = await getDB();
      
      const users: any[] = await db.select('SELECT id, name, sync_status FROM users');
      const scans: any[] = await db.select('SELECT user_id, COUNT(*) as count FROM scan_history GROUP BY user_id');
      const sales: any[] = await db.select('SELECT user_id, payment_method, SUM(total_mt) as total, SUM(quantity) as items FROM sales GROUP BY user_id, payment_method');
      const payouts: any[] = await db.select('SELECT user_id, SUM(amount) as total, COUNT(*) as count FROM till_payouts GROUP BY user_id');
      
      const statsMap = new Map<string, UserStats>();
      
      users.forEach(u => {
        statsMap.set(u.id, {
          user_id: u.id,
          user_name: u.name,
          scan_count: 0,
          total_sales: 0,
          items_sold: 0,
          payments: { cash: 0, mpesa: 0, emola: 0, fiado: 0 },
          payouts_total: 0,
          payouts_count: 0,
          sync_status: u.sync_status
        });
      });
      
      scans.forEach(s => {
        if (!statsMap.has(s.user_id)) {
          statsMap.set(s.user_id, {
            user_id: s.user_id, user_name: 'Desconhecido', scan_count: 0, total_sales: 0, items_sold: 0,
            payments: { cash: 0, mpesa: 0, emola: 0, fiado: 0 }, payouts_total: 0, payouts_count: 0
          });
        }
        statsMap.get(s.user_id)!.scan_count = s.count;
      });
      
      sales.forEach(s => {
        if (!statsMap.has(s.user_id)) {
          statsMap.set(s.user_id, {
            user_id: s.user_id, user_name: 'Desconhecido', scan_count: 0, total_sales: 0, items_sold: 0,
            payments: { cash: 0, mpesa: 0, emola: 0, fiado: 0 }, payouts_total: 0, payouts_count: 0
          });
        }
        const stat = statsMap.get(s.user_id)!;
        stat.total_sales += (s.total || 0);
        stat.items_sold += (s.items || 0);
        
        const method = (s.payment_method || '').toLowerCase().replace('-', '');
        if (method === 'cash') stat.payments.cash += (s.total || 0);
        else if (method === 'mpesa') stat.payments.mpesa += (s.total || 0);
        else if (method === 'emola') stat.payments.emola += (s.total || 0);
        else if (method === 'fiado') stat.payments.fiado += (s.total || 0);
      });

      payouts.forEach(p => {
        if (!statsMap.has(p.user_id)) {
          statsMap.set(p.user_id, {
            user_id: p.user_id, user_name: 'Desconhecido', scan_count: 0, total_sales: 0, items_sold: 0,
            payments: { cash: 0, mpesa: 0, emola: 0, fiado: 0 }, payouts_total: 0, payouts_count: 0
          });
        }
        const stat = statsMap.get(p.user_id)!;
        stat.payouts_total += (p.total || 0);
        stat.payouts_count += (p.count || 0);
      });
      
      const activeStats = Array.from(statsMap.values())
        .filter(s => s.scan_count > 0 || s.total_sales > 0 || s.payouts_count > 0)
        .sort((a, b) => b.total_sales - a.total_sales);
        
      setUserStats(activeStats);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar histórico');
    } finally {
      setLoading(false);
    }
  };
  
  const loadUserDetails = async (userId: string) => {
    setLoading(true);
    try {
      const db = await getDB();
      const scansResults = await db.select(`
        SELECT 
          s.id, 
          s.created_at, 
          p.name as product_name, 
          p.barcode, 
          s.payment_method, 
          'success' as status,
          s.quantity,
          s.total_mt
        FROM sales s
        LEFT JOIN products p ON s.product_id = p.id
        WHERE s.user_id = ? 
        ORDER BY s.created_at DESC 
        LIMIT 500
      `, [userId]);
      setUserScans(scansResults as any[]);

      const payoutsResults = await db.select('SELECT * FROM till_payouts WHERE user_id = ? ORDER BY created_at DESC LIMIT 500', [userId]);
      setUserPayouts(payoutsResults as any[]);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao carregar detalhes');
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (userId: string, userName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setActiveSubTab('scans');
    loadUserDetails(userId);
    setSearchTerm('');
  };

  const resetSelection = () => {
    setSelectedUserId(null);
    setSelectedUserName('');
    setUserScans([]);
    setUserPayouts([]);
    setSearchTerm('');
  };

  return {
    userStats,
    loading,
    searchTerm,
    setSearchTerm,
    selectedUserId,
    selectedUserName,
    userScans,
    userPayouts,
    activeSubTab,
    setActiveSubTab,
    handleUserClick,
    resetSelection,
  };
}
