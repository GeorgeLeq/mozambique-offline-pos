import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getDB } from '../../lib/db';
import { User } from '../../types';
import { ArrowLeft, Users, Sparkles, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AmbientBackground } from '../AmbientBackground';
import { InternetStatusBadge } from '../InternetStatusBadge';
import { sanitizeString, sanitizeNumeric, validatePin } from '../../lib/security/sanitizer';
import { hashPin, verifyPin } from '../../lib/security/crypto';
import { useTableWatcher } from '../../lib/dbEvents';
import { syncUsersToCloud } from '../../lib/syncEngine/users';
import { syncUserUsageToCloud } from '../../lib/syncEngine/heartbeat';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

import { useSubscription } from '../../subscription/subscriptionContext';
import { getUserUsageSummary, checkUserLimit, UserUsageSummary } from './services/userLimitService';
import { useEmployeesI18n } from '../../i18n';

// Subcomponents
import { EmployeeHeader } from './EmployeeHeader';
import { EmployeeForm } from './EmployeeForm';
import { EmployeeList } from './EmployeeList';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { EmployeeGuideModal } from './EmployeeGuideModal';

const RETENTION_STORAGE_KEY = 'mozpos_history_retention_days';

export default function EmployeeManager({ onBack }: { onBack: () => void }) {
  const t = useEmployeesI18n();
  const { openFeatureLockModal } = useSubscription();
  const [employees, setEmployees] = useState<User[]>([]);
  const [userUsage, setUserUsage] = useState<UserUsageSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Retention Days State
  const [retentionDays, setRetentionDays] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(RETENTION_STORAGE_KEY);
      return saved !== null ? Number(saved) : 30;
    } catch {
      return 30;
    }
  });

  // Form fields
  const [name, setName] = useState('');
  const [role, setRole] = useState<'Admin' | 'Cashier'>('Cashier');
  const [pin, setPin] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [openingCash, setOpeningCash] = useState('');
  const [needsShiftCash, setNeedsShiftCash] = useState(true);
  
  // UI states
  const [generatedPin, setGeneratedPin] = useState<string | null>(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'Admin' | 'Cashier' | 'bin'>('all');

  // Purge expired soft-deleted employees exceeding retention policy
  const autoPurgeExpiredEmployees = useCallback(async (users: User[], days: number) => {
    if (days <= 0) return users; // 0 = never expire
    const now = Date.now();
    const retentionMs = days * 24 * 60 * 60 * 1000;
    const expiredUsers = users.filter(u => {
      if (u.is_deleted !== 1) return false;
      const deletedTime = u.deleted_at ? new Date(u.deleted_at).getTime() : now;
      return (now - deletedTime) > retentionMs;
    });

    if (expiredUsers.length > 0) {
      try {
        const db = await getDB();
        for (const exp of expiredUsers) {
          console.log(`[EmployeePurge] Purging expired operator "${exp.name}" (${exp.id}) after ${days} days.`);
          await db.execute('DELETE FROM users WHERE id = ?', [exp.id]);
          if (isSupabaseConfigured()) {
            try {
              await supabase.from('users').delete().eq('id', exp.id);
            } catch (err) {
              console.warn('[EmployeePurge] Supabase cloud delete warning:', err);
            }
          }
        }
        return users.filter(u => !expiredUsers.some(exp => exp.id === u.id));
      } catch (err) {
        console.error('[EmployeePurge] Failed to auto purge expired users:', err);
      }
    }
    return users;
  }, []);

  const loadEmployees = async (isInitial = false) => {
    try {
      if (isInitial || employees.length === 0) {
        setIsLoading(true);
      }
      const db = await getDB();
      const rawUsers = await db.select('SELECT * FROM users ORDER BY role, name') as User[];
      const validUsers = await autoPurgeExpiredEmployees(rawUsers || [], retentionDays);
      setEmployees(validUsers || []);

      // Refresh operator subscription limit summary
      const summary = await getUserUsageSummary();
      setUserUsage(summary);
    } catch (err) {
      console.error('Erro ao carregar funcionários:', err);
      toast.error(t.toastLoadError || 'Não foi possível carregar os funcionários');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees(true);
  }, [retentionDays]);

  const handleOpenUpgradeModal = () => {
    openFeatureLockModal(
      'unlimited_users',
      t.limitReachedTitle || 'Limite de Operadores Atingido',
      (t.limitReachedDesc || 'Atingiu o limite de {0} operadores permitidos no seu plano atual. Atualize o seu plano para cadastrar operadores ilimitados.').replace('{0}', String(userUsage?.limit || 3))
    );
  };

  // Listen to live database events on the users table
  useTableWatcher('users', () => loadEmployees(false));

  const handleRetentionChange = async (days: number) => {
    setRetentionDays(days);
    try {
      localStorage.setItem(RETENTION_STORAGE_KEY, String(days));
      toast.success(
        days > 0 
          ? (t.retentionUpdatedMsg?.replace('{0}', String(days)) || `Retenção configurada para ${days} dias.`)
          : (t.retentionNeverOption || 'Retenção configurada para nunca expirar.')
      );
    } catch (e) {
      console.warn('Failed to persist retention days in localStorage:', e);
    }
  };

  const checkPinUniqueness = async (testPin: string, excludeId?: string): Promise<boolean> => {
    const db = await getDB();
    const users = await db.select('SELECT * FROM users WHERE is_deleted = 0 OR is_deleted IS NULL') as any[];
    if (!users) return true;
    for (const u of users) {
      if (excludeId && u.id === excludeId) continue;
      if (await verifyPin(testPin, u.pin)) {
        return false;
      }
    }
    return true;
  };

  const generateUniquePin = async (): Promise<string> => {
    let newPin = '';
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 50) {
      attempts++;
      newPin = Math.floor(100000 + Math.random() * 900000).toString();
      if (await checkPinUniqueness(newPin)) {
        isUnique = true;
      }
    }
    return newPin;
  };

  const handleCreateMode = async () => {
    // Check subscription plan user limit
    const limitCheck = await checkUserLimit(1);
    if (!limitCheck.allowed) {
      openFeatureLockModal(
        'unlimited_users',
        t.limitReachedTitle || 'Limite de Operadores Atingido',
        limitCheck.message || (t.limitReachedDesc || 'Atingiu o limite de operadores permitidos pelo seu plano. Atualize o seu plano para cadastrar novos utilizadores.').replace('{0}', String(userUsage?.limit || 3))
      );
      return;
    }

    setFormMode('create');
    setSelectedUser(null);
    setName('');
    setRole('Cashier');
    setPin('');
    setPermissions([]);
    setGeneratedPin(null);
    setOpeningCash('');
    setNeedsShiftCash(true);
    setIsModalOpen(true);
  };

  const handleEditClick = (user: User) => {
    setFormMode('edit');
    setSelectedUser(user);
    setName(user.name);
    setRole(user.role);
    setPin(''); // Don't expose hashed PIN in plaintext edit form
    const perms = user.permissions_json ? JSON.parse(user.permissions_json) : [];
    setPermissions(Array.isArray(perms) ? perms : (perms.permissions || []));
    setGeneratedPin(null);
    setOpeningCash(user.opening_cash !== undefined && user.opening_cash !== null ? user.opening_cash.toString() : '');
    setNeedsShiftCash(user.needs_shift_cash !== 0);
    setIsModalOpen(true);
  };

  const handleSaveEmployee = async (formData: {
    name: string;
    role: 'Admin' | 'Cashier';
    pin: string;
    permissions: string[];
    openingCash: string;
    needsShiftCash: boolean;
  }) => {
    const cleanName = sanitizeString(formData.name);
    if (!cleanName) {
      toast.error(t.toastNameRequired || 'O nome do funcionário é obrigatório');
      return;
    }

    try {
      const db = await getDB();

      if (formMode === 'create') {
        // Enforce active subscription plan operator quota
        const limitCheck = await checkUserLimit(1);
        if (!limitCheck.allowed) {
          toast.error(
            limitCheck.message ||
            (t.limitReachedDesc || 'Atingiu o limite de {0} operadores permitidos no seu plano atual.').replace('{0}', String(limitCheck.limit))
          );
          handleOpenUpgradeModal();
          return;
        }

        const uniquePin = await generateUniquePin();
        const hashedUniquePin = await hashPin(uniquePin);
        const id = crypto.randomUUID();
        const cashVal = formData.openingCash.trim() ? sanitizeNumeric(formData.openingCash, 0) : null;
        const needsCashInt = formData.needsShiftCash ? 1 : 0;

        await db.execute(
          'INSERT INTO users (id, name, role, pin, permissions_json, opening_cash, needs_shift_cash, is_deleted, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0)',
          [id, cleanName, formData.role, hashedUniquePin, JSON.stringify(formData.permissions), cashVal, needsCashInt]
        );

        setGeneratedPin(uniquePin);
        setName('');
        setPermissions([]);
        setOpeningCash('');
        toast.success((t.toastEmployeeAdded || 'Funcionário {0} adicionado com sucesso!').replace('{0}', cleanName));
      } else {
        // Edit mode
        if (!selectedUser) return;

        let hashedPinToSave = selectedUser.pin;
        if (formData.pin.trim()) {
          const cleanPin = sanitizeString(formData.pin);
          if (!validatePin(cleanPin)) {
            toast.error(t.toastPinValidation || 'O PIN deve conter entre 4 e 8 dígitos numéricos.');
            return;
          }

          const isUnique = await checkPinUniqueness(cleanPin, selectedUser.id);
          if (!isUnique) {
            toast.error(t.toastPinInUse || 'Este PIN já está a ser utilizado por outro funcionário.');
            return;
          }
          hashedPinToSave = await hashPin(cleanPin);
        }

        const cashVal = formData.openingCash.trim() ? sanitizeNumeric(formData.openingCash, 0) : null;
        const needsCashInt = formData.needsShiftCash ? 1 : 0;

        await db.execute(
          'UPDATE users SET name = ?, role = ?, pin = ?, permissions_json = ?, opening_cash = ?, needs_shift_cash = ?, sync_status = 0 WHERE id = ?',
          [cleanName, formData.role, hashedPinToSave, JSON.stringify(formData.permissions), cashVal, needsCashInt, selectedUser.id]
        );

        toast.success(t.toastEmployeeUpdated || 'Funcionário atualizado com sucesso!');
        setIsModalOpen(false); // Close modal on edit success
      }

      // Synchronize updated user count to Supabase Command Central in background
      syncUsersToCloud().catch(err => console.warn('[EmployeeManager] syncUsersToCloud warning:', err));
      syncUserUsageToCloud().catch(err => console.warn('[EmployeeManager] syncUserUsageToCloud warning:', err));
      loadEmployees();
    } catch (error) {
      console.error('Falha ao guardar funcionário:', error);
      toast.error(t.toastSaveError || 'Erro ao registar alterações na base de dados.');
    }
  };

  const handleGeneratePinInForm = async (): Promise<string> => {
    const uniquePin = await generateUniquePin();
    toast.success(t.toastNewPinGenerated || 'Novo PIN único gerado!');
    return uniquePin;
  };

  const handleRegeneratePinForList = async (user: User) => {
    try {
      const db = await getDB();
      const uniquePin = await generateUniquePin();
      const hashedUniquePin = await hashPin(uniquePin);
      
      await db.execute(
        'UPDATE users SET pin = ?, sync_status = 0 WHERE id = ?',
        [hashedUniquePin, user.id]
      );
      
      setGeneratedPin(uniquePin);
      // Open modal to display the voucher clearly
      setFormMode('edit');
      setSelectedUser(user);
      setName(user.name);
      setRole(user.role);
      setPin('');
      const perms = user.permissions_json ? JSON.parse(user.permissions_json) : [];
      setPermissions(Array.isArray(perms) ? perms : (perms.permissions || []));
      setOpeningCash(user.opening_cash !== undefined && user.opening_cash !== null ? user.opening_cash.toString() : '');
      setNeedsShiftCash(user.needs_shift_cash !== 0);
      setIsModalOpen(true);
      
      toast.success((t.toastPinRegenerated || 'Novo PIN gerado para {0}!').replace('{0}', user.name));
      syncUsersToCloud().catch(err => console.warn(err));
      loadEmployees();
    } catch (err) {
      console.error('Erro ao regerar PIN:', err);
      toast.error(t.toastPinRegenerateError || 'Erro ao regerar o PIN do funcionário');
    }
  };

  // Soft Delete into Recycle Bin with Reason
  const handleDelete = async (reason: string, details?: string) => {
    if (!deleteConfirmTarget) return;
    try {
      const db = await getDB();
      const now = new Date().toISOString();
      const reasonText = details && details.trim() ? `${reason}: ${details.trim()}` : reason;

      await db.execute(
        'UPDATE users SET is_deleted = 1, deleted_at = ?, deletion_reason = ?, sync_status = 0 WHERE id = ?',
        [now, reasonText, deleteConfirmTarget.id]
      );

      toast.success((t.toastEmployeeMovedToBin || 'Operador {0} movido para a lixeira.').replace('{0}', deleteConfirmTarget.name));
      setDeleteConfirmTarget(null);
      
      // If we were editing this user, close the form modal
      if (selectedUser?.id === deleteConfirmTarget.id) {
        setIsModalOpen(false);
      }
      
      // Synchronize updated user count to Supabase Command Central in background
      syncUsersToCloud().catch(err => console.warn('[EmployeeManager] syncUsersToCloud warning:', err));
      syncUserUsageToCloud().catch(err => console.warn('[EmployeeManager] syncUserUsageToCloud warning:', err));
      loadEmployees();
    } catch (error) {
      console.error('Falha ao revogar funcionário:', error);
      toast.error(t.toastDeleteError || 'Erro ao revogar acesso do funcionário');
    }
  };

  // Restore Soft-Deleted Employee from Bin
  const handleRestoreEmployee = async (user: User) => {
    try {
      // Check user limit quota before restoring
      const limitCheck = await checkUserLimit(1);
      if (!limitCheck.allowed) {
        openFeatureLockModal(
          'unlimited_users',
          t.limitReachedTitle || 'Limite de Operadores Atingido',
          limitCheck.message || (t.limitReachedDesc || 'Atingiu o limite de operadores do plano. Atualize o plano para restaurar mais operadores.').replace('{0}', String(userUsage?.limit || 3))
        );
        return;
      }

      const db = await getDB();
      await db.execute(
        'UPDATE users SET is_deleted = 0, deleted_at = NULL, deletion_reason = NULL, deleted_by = NULL, sync_status = 0 WHERE id = ?',
        [user.id]
      );

      toast.success((t.toastEmployeeRestored || 'Operador {0} restaurado com sucesso!').replace('{0}', user.name));
      syncUsersToCloud().catch(err => console.warn(err));
      syncUserUsageToCloud().catch(err => console.warn(err));
      loadEmployees();
    } catch (err) {
      console.error('Erro ao restaurar operador:', err);
      toast.error(t.toastRestoreError || 'Não foi possível restaurar o operador');
    }
  };

  // Permanent Delete Single Operator
  const handlePermanentDeleteEmployee = async (user: User) => {
    try {
      const db = await getDB();
      await db.execute('DELETE FROM users WHERE id = ?', [user.id]);
      if (isSupabaseConfigured()) {
        try {
          await supabase.from('users').delete().eq('id', user.id);
        } catch (err) {
          console.warn('[EmployeeManager] Supabase permanent delete warning:', err);
        }
      }

      toast.success((t.toastEmployeePermanentlyDeleted || 'Operador {0} eliminado definitivamente.').replace('{0}', user.name));
      syncUserUsageToCloud().catch(err => console.warn(err));
      loadEmployees();
    } catch (err) {
      console.error('Erro ao eliminar definitivamente:', err);
      toast.error(t.toastDeleteError || 'Erro ao eliminar definitivamente');
    }
  };

  // Empty Entire Bin
  const handleEmptyBin = async () => {
    const deletedList = employees.filter(e => e.is_deleted === 1);
    if (deletedList.length === 0) return;

    try {
      const db = await getDB();
      for (const emp of deletedList) {
        await db.execute('DELETE FROM users WHERE id = ?', [emp.id]);
        if (isSupabaseConfigured()) {
          try {
            await supabase.from('users').delete().eq('id', emp.id);
          } catch (err) {
            console.warn('[EmployeeManager] Empty bin cloud warning:', err);
          }
        }
      }

      toast.success(t.toastBinEmptied || 'Lixeira de operadores esvaziada com sucesso!');
      syncUserUsageToCloud().catch(err => console.warn(err));
      loadEmployees();
    } catch (err) {
      console.error('Erro ao esvaziar lixeira:', err);
      toast.error(t.toastEmptyBinError || 'Erro ao esvaziar lixeira de operadores');
    }
  };

  // Split Active vs Deleted Employees
  const activeEmployees = useMemo(() => employees.filter(e => !e.is_deleted || e.is_deleted === 0), [employees]);
  const deletedEmployees = useMemo(() => employees.filter(e => e.is_deleted === 1), [employees]);

  return (
    <div id="employee-manager-root" className="flex-1 flex flex-col h-screen w-full relative overflow-hidden bg-[#fbfbfd] dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 font-sans select-none">
      <AmbientBackground />

      {/* Single Unified Edge-to-Edge Topbar Header */}
      <EmployeeHeader 
        onBack={onBack}
        isLoading={isLoading}
        onRefresh={() => loadEmployees(false)}
        onAddClick={handleCreateMode}
        onOpenGuideModal={() => setIsGuideOpen(true)}
        usage={userUsage}
        onOpenUpgradeModal={handleOpenUpgradeModal}
      />

      {/* Main Full-Screen Table View with Integrated Toolbar & 4 Tabs */}
      <main className="flex-1 relative flex flex-col overflow-hidden w-full h-full">
        <EmployeeList 
          employees={activeEmployees}
          deletedEmployees={deletedEmployees}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
          onAddClick={handleCreateMode}
          selectedUser={selectedUser}
          onEditClick={handleEditClick}
          onRegeneratePin={handleRegeneratePinForList}
          onDeleteClick={setDeleteConfirmTarget}
          onOpenGuide={() => setIsGuideOpen(true)}
          retentionDays={retentionDays}
          onRetentionChange={handleRetentionChange}
          onRestoreEmployee={handleRestoreEmployee}
          onPermanentDeleteEmployee={handlePermanentDeleteEmployee}
          onEmptyBin={handleEmptyBin}
          isLoading={isLoading}
        />
      </main>

      {/* Slide-over Operator Form Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <EmployeeForm 
            onClose={() => setIsModalOpen(false)}
            formMode={formMode}
            selectedUser={selectedUser}
            initialName={name}
            initialRole={role}
            initialPin={pin}
            initialPermissions={permissions}
            initialOpeningCash={openingCash}
            initialNeedsShiftCash={needsShiftCash}
            onSave={handleSaveEmployee}
            onGeneratePin={handleGeneratePinInForm}
            generatedPin={generatedPin}
            clearGeneratedPin={() => setGeneratedPin(null)}
          />
        )}
      </AnimatePresence>

      {/* Access Revocation Confirmation Modal */}
      <DeleteConfirmModal 
        deleteConfirmTarget={deleteConfirmTarget}
        onClose={() => setDeleteConfirmTarget(null)}
        onConfirm={handleDelete}
      />

      {/* Informative Operator Guide Modal */}
      <EmployeeGuideModal 
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
