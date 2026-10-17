import { useState, useEffect } from 'react';
import { getDB } from '../../../lib/db';
import { User } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';
import { syncUsersToCloud } from '../../../lib/syncEngine/users';
import { logAudit } from '../../../lib/audit';
import { sanitizeNumeric } from '../../../lib/security/sanitizer';
import toast from 'react-hot-toast';

export interface ShiftInfo {
  startTime?: string;
  startingCash?: number;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  details: string;
  created_at: string;
  user_name?: string;
  user_role?: 'Admin' | 'Cashier';
}

export function useCashierControl() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [activeShifts, setActiveShifts] = useState<Record<string, ShiftInfo>>({});
  const [todayLogs, setTodayLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLockdownActive, setIsLockdownActive] = useState(false);
  const [defaultCash, setDefaultCash] = useState(10000);

  // Edit Caixa Modal States
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [cashInputValue, setCashInputValue] = useState('');
  const [updateActiveShift, setUpdateActiveShift] = useState(true);

  // Tokens Modal State
  const [tokensUser, setTokensUser] = useState<User | null>(null);

  // Inline Edit States
  const [editingTerminalId, setEditingTerminalId] = useState<string | null>(null);
  const [tempTerminalName, setTempTerminalName] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadData();
  }, []);

  const loadTodayLogs = async () => {
    try {
      const db = await getDB();
      // Load recent login/logout actions (last 100 entries) to show latest shift date log on the operators card
      const logs = await db.select(
        `SELECT al.*, u.name as user_name, u.role as user_role 
         FROM audit_logs al 
         LEFT JOIN users u ON al.user_id = u.id 
         WHERE al.action IN ('LOGIN', 'LOGIN_SHIFT_START', 'LOGIN_RECONNECT', 'LOGOUT') 
         ORDER BY al.created_at DESC 
         LIMIT 100`
      ) as AuditLog[];
      setTodayLogs(logs || []);
    } catch (err) {
      console.error('Erro ao carregar histórico de sessões:', err);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const db = await getDB();
      
      // 1. Load users
      const loadedUsers = await db.select('SELECT * FROM users ORDER BY role, name') as User[];
      setUsers(loadedUsers || []);

      // Load base cash setting
      const baseCashResult = await db.select("SELECT value FROM settings WHERE key = 'base_cash'") as any[];
      if (baseCashResult && baseCashResult.length > 0) {
        setDefaultCash(parseFloat(baseCashResult[0].value) || 10000);
      }

      // Load emergency lockdown status
      const lockdownSetting = await db.select('SELECT value FROM settings WHERE key = ?', ['emergency_lockdown']) as any[];
      setIsLockdownActive(lockdownSetting && lockdownSetting.length > 0 && lockdownSetting[0].value === '1');

      // 2. Load active shift settings
      const shiftSettings = await db.select(
        "SELECT key, value FROM settings WHERE key LIKE 'current_shift_start_%' OR key LIKE 'current_shift_cash_%'"
      ) as any[];

      const shiftMap: Record<string, ShiftInfo> = {};
      if (shiftSettings) {
        shiftSettings.forEach((row) => {
          const startMatch = row.key.match(/^current_shift_start_(.+)$/);
          const cashMatch = row.key.match(/^current_shift_cash_(.+)$/);
          if (startMatch) {
            const uId = startMatch[1];
            if (!shiftMap[uId]) shiftMap[uId] = {};
            shiftMap[uId].startTime = row.value;
          }
          if (cashMatch) {
            const uId = cashMatch[1];
            if (!shiftMap[uId]) shiftMap[uId] = {};
            shiftMap[uId].startingCash = parseFloat(row.value) || 0;
          }
        });
      }
      setActiveShifts(shiftMap);

      // 3. Load today's login logs
      await loadTodayLogs();

    } catch (err) {
      console.error('Erro ao carregar dados do controlo de caixa:', err);
      toast.error('Erro ao carregar os dados de caixa.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleNeedsCash = async (user: User) => {
    try {
      const db = await getDB();
      const currentVal = user.needs_shift_cash !== 0; // true if needs, false if exempt
      const newVal = currentVal ? 0 : 1; // 0 for exempt, 1 for needs

      await db.execute(
        'UPDATE users SET needs_shift_cash = ?, sync_status = 0 WHERE id = ?',
        [newVal, user.id]
      );

      const actionText = newVal ? 'Requer Caixa' : 'Isento de Caixa';
      await logAudit(
        currentUser?.id, 
        'USER_CASH_REQUIREMENT_TOGGLED', 
        `Alterou requisito de caixa do operador ${user.name} para ${actionText}`
      );

      toast.success(`${user.name} agora está ${newVal ? 'sujeito a controlo' : 'isento'} de caixa.`);
      loadData();
    } catch (err) {
      console.error('Erro ao alternar exigência de caixa:', err);
      toast.error('Não foi possível alterar a exigência de caixa.');
    }
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setCashInputValue(user.opening_cash !== undefined && user.opening_cash !== null ? user.opening_cash.toString() : '');
    setUpdateActiveShift(true);
  };

  const handleSaveCashSettings = async () => {
    if (!editingUser) return;
    try {
      const db = await getDB();
      const valToSave = cashInputValue.trim() !== '' ? sanitizeNumeric(cashInputValue) : null;

      await db.execute(
        'UPDATE users SET opening_cash = ?, sync_status = 0 WHERE id = ?',
        [valToSave, editingUser.id]
      );

      if (updateActiveShift && activeShifts[editingUser.id]) {
        await db.execute(
          "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
          [`current_shift_cash_${editingUser.id}`, valToSave !== null ? valToSave.toString() : defaultCash.toString()]
        );
        await logAudit(
          currentUser?.id,
          'USER_ACTIVE_SHIFT_CASH_EDITED',
          `Alterou saldo do turno ativo de ${editingUser.name} para ${valToSave} MT`
        );
      }

      const logMsg = valToSave !== null 
        ? `Configurou fundo de caixa inicial de ${editingUser.name} para ${valToSave} MT`
        : `Definiu fundo de caixa inicial de ${editingUser.name} como Padrão Global`;

      await logAudit(currentUser?.id, 'USER_DEFAULT_CASH_EDITED', logMsg);

      toast.success('Alterações gravadas com sucesso!');
      setEditingUser(null);
      loadData();
    } catch (err) {
      console.error('Erro ao gravar configurações de caixa:', err);
      toast.error('Não foi possível gravar as alterações de caixa.');
    }
  };

  const adjustPreset = (amount: number) => {
    const current = parseFloat(cashInputValue) || 0;
    setCashInputValue(Math.max(0, current + amount).toString());
  };

  const handleSaveTerminalInline = async (userId: string, terminalName: string) => {
    try {
      const db = await getDB();
      await db.execute(
        'UPDATE users SET terminal_name = ?, sync_status = 0 WHERE id = ?',
        [terminalName.trim(), userId]
      );

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, terminal_name: terminalName.trim() } : u));
      
      const userObj = users.find(u => u.id === userId);
      const userName = userObj ? userObj.name : 'unknown';
      await logAudit(
        currentUser?.id || 'unknown',
        'update_user_terminal_name',
        `Alterou terminal/banca do operador ${userName} para: ${terminalName}`
      );

      await syncUsersToCloud().catch(err => console.warn('Instant user sync failed', err));
      toast.success('Banca do operador updated!');
      setEditingTerminalId(null);
    } catch (err) {
      console.error('Erro ao gravar banca do operador:', err);
      toast.error('Não foi possível gravar a banca.');
    }
  };

  const handleToggleBlockStatus = async (user: User) => {
    try {
      const db = await getDB();
      const currentVal = user.is_blocked === 1;
      const newVal = currentVal ? 0 : 1;

      await db.execute(
        'UPDATE users SET is_blocked = ?, sync_status = 0 WHERE id = ?',
        [newVal, user.id]
      );

      const actionText = newVal ? 'BLOQUEADO' : 'ATIVO';
      await logAudit(
        currentUser?.id, 
        newVal ? 'USER_BLOCKED' : 'USER_UNBLOCKED', 
        `Alterou status do operador ${user.name} para ${actionText}`
      );

      toast.success(`Acesso do operador ${user.name} foi ${newVal ? 'bloqueado' : 'restaurado'} com sucesso.`);
      loadData();
    } catch (err) {
      console.error('Erro ao alternar bloqueio de operador:', err);
      toast.error('Não foi possível alterar o status de bloqueio.');
    }
  };

  const handleToggleEmergencyLockdown = async () => {
    try {
      const db = await getDB();
      const newVal = isLockdownActive ? '0' : '1';

      await db.execute(
        'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
        ['emergency_lockdown', newVal]
      );

      setIsLockdownActive(!isLockdownActive);

      await logAudit(
        currentUser?.id,
        newVal === '1' ? 'EMERGENCY_LOCKDOWN_ENABLED' : 'EMERGENCY_LOCKDOWN_DISABLED',
        newVal === '1'
          ? 'Ativou o Bloqueio de Emergência de todos os operadores'
          : 'Desativou o Bloqueio de Emergência de todos os operadores'
      );

      if (newVal === '1') {
        toast.error('SISTEMA EM LOCKDOWN! Todos os operadores comuns foram impedidos de iniciar sessão.');
      } else {
        toast.success('Lockdown desativado. Sessão dos operadores restaurada.');
      }
    } catch (err) {
      console.error('Erro ao alternar lockdown de emergência:', err);
      toast.error('Não foi possível alterar o status de lockdown.');
    }
  };

  return {
    users,
    setUsers,
    activeShifts,
    todayLogs,
    isLoading,
    isLockdownActive,
    defaultCash,
    editingUser,
    setEditingUser,
    cashInputValue,
    setCashInputValue,
    updateActiveShift,
    setUpdateActiveShift,
    tokensUser,
    setTokensUser,
    editingTerminalId,
    setEditingTerminalId,
    tempTerminalName,
    setTempTerminalName,
    currentPage,
    setCurrentPage,
    loadData,
    handleToggleNeedsCash,
    handleOpenEditModal,
    handleSaveCashSettings,
    adjustPreset,
    handleSaveTerminalInline,
    handleToggleBlockStatus,
    handleToggleEmergencyLockdown,
  };
}
