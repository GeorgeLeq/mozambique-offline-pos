import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { getDB } from '../../../../../lib/db';
import { findUserByPin } from '../../../../../lib/security/crypto';
import { useAuth } from '../../../../../contexts/AuthContext';
import { SaleItem } from '../../types';
import { WizardStep, ItemCondition } from '../types';

interface UseRefundWizardProps {
  isOpen: boolean;
  refundItem: SaleItem | null;
  refundReceiptId: string;
  onClose: () => void;
  onRefundComplete: () => void;
}

export function useRefundWizard({
  isOpen,
  refundItem,
  refundReceiptId,
  onClose,
  onRefundComplete,
}: UseRefundWizardProps) {
  const { currentUser } = useAuth();

  // Wizard flow states
  const [wizardStep, setWizardStep] = useState<WizardStep>('pin');
  
  // PIN Entry States
  const [managerPin, setManagerPin] = useState('');
  const [authorizedManager, setAuthorizedManager] = useState<any>(null);
  const [pinError, setPinError] = useState('');

  // Inventory Stock Decision State
  const [itemCondition, setItemCondition] = useState<ItemCondition | null>(null);

  // Dynamic Refund Policy states loaded from SQLite
  const [refundTimeLimit, setRefundTimeLimit] = useState('-1');
  const [refundAuthLevel, setRefundAuthLevel] = useState('manager');
  const [refundMethod, setRefundMethod] = useState('any');
  const [authTriggerVoid, setAuthTriggerVoid] = useState<boolean>(true);

  // Fetch refund policies on mount/open
  useEffect(() => {
    async function loadRefundPolicies() {
      try {
        const db = await getDB();
        const res = await db.select(
          'SELECT key, value FROM settings WHERE key IN ("refund_time_limit", "refund_auth_level", "refund_method", "auth_trigger_void", "auth_trigger_refund", "authorization_mode", "remote_auth_enabled", "remote_auth_timeout")'
        ) as any[];
        
        if (res && res.length > 0) {
          res.forEach(item => {
            if (item.key === 'refund_time_limit') setRefundTimeLimit(item.value);
            if (item.key === 'refund_auth_level') setRefundAuthLevel(item.value);
            if (item.key === 'refund_method') setRefundMethod(item.value);
            if (item.key === 'auth_trigger_void') setAuthTriggerVoid(item.value === 'true');
          });
        }
      } catch (e) {
        console.warn('Failed to load refund policy settings:', e);
      }
    }
    if (isOpen) {
      loadRefundPolicies();
    }
  }, [isOpen]);

  // Calculate days passed since sale
  const daysSinceSale = useMemo(() => {
    if (!refundItem) return 0;
    
    const rawDate = refundItem.created_at;
    let saleDate = new Date();
    
    if (rawDate) {
      const normalized = rawDate.includes('T') ? rawDate : rawDate.replace(' ', 'T');
      saleDate = new Date(normalized);
      if (isNaN(saleDate.getTime())) {
        saleDate = new Date(rawDate);
      }
    }
    
    const currentDate = new Date();
    const diffTime = Math.max(0, currentDate.getTime() - saleDate.getTime());
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return isNaN(days) ? 0 : days;
  }, [refundItem]);

  // Check if time limit is exceeded
  const isTimeLimitExceeded = useMemo(() => {
    if (!refundItem || refundTimeLimit === '-1' || parseInt(refundTimeLimit, 10) === -1) {
      return false;
    }
    
    const limitDays = parseInt(refundTimeLimit, 10);
    if (isNaN(limitDays)) {
      return false;
    }
    
    return daysSinceSale > limitDays;
  }, [refundItem, refundTimeLimit, daysSinceSale]);

  // Auto bypass PIN screen if triggers are disabled or if operator level allows
  useEffect(() => {
    if (isOpen && refundItem) {
      const requiresAuth = authTriggerVoid || refundAuthLevel !== 'any' || isTimeLimitExceeded;
      
      if (requiresAuth) {
        setWizardStep('pin');
      } else {
        const activeUser = currentUser || { id: 'sim-cashier', name: 'Operador de Caixa', role: 'Cashier' };
        setAuthorizedManager(activeUser);
        setWizardStep('condition');
      }
    }
  }, [isOpen, refundItem, refundAuthLevel, isTimeLimitExceeded, currentUser, authTriggerVoid]);

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managerPin) return;

    try {
      const db = await getDB();
      const manager = await findUserByPin(db, managerPin);
      
      let isAuthorized = false;
      if (manager && !manager.__role_mismatch) {
        const roleUpper = (manager.role || '').toUpperCase();
        if (isTimeLimitExceeded || refundAuthLevel === 'admin_only') {
          isAuthorized = roleUpper === 'ADMIN';
        } else if (refundAuthLevel === 'manager') {
          if (roleUpper === 'ADMIN' || roleUpper === 'MANAGER') {
            isAuthorized = true;
          } else {
            try {
              const perms = manager.permissions_json ? JSON.parse(manager.permissions_json) : [];
              isAuthorized = Array.isArray(perms) && perms.includes('refunds');
            } catch {
              isAuthorized = false;
            }
          }
        } else {
          isAuthorized = true;
        }
      }

      if (manager && isAuthorized) {
        setAuthorizedManager(manager);
        toast.success(`Autorizado por: ${manager.name}`);
        setWizardStep('condition');
      } else {
        // Check emergency tokens by code
        const tokens = await db.select(
          'SELECT * FROM emergency_tokens WHERE code = ? AND is_used = 0',
          [managerPin]
        ) as any[];

        const matchedToken = tokens.find(t => 
          (!t.expires_at || new Date(t.expires_at) > new Date()) &&
          (!t.cashier_id || 
           !currentUser?.id || 
           t.cashier_id === currentUser?.id || 
           currentUser?.id === 'sim-cashier' || 
           currentUser?.id === 'unknown')
        );

        if (matchedToken) {
          let emergencyMaxRefund = 2000;
          const targetUserId = matchedToken.cashier_id || currentUser?.id;
          if (targetUserId) {
            const tokenUserRows = await db.select('SELECT permissions_json FROM users WHERE id = ?', [targetUserId]) as any[];
            const permSource = tokenUserRows.length > 0 ? tokenUserRows[0] : currentUser;
            if (permSource?.permissions_json) {
              try {
                const parsed = JSON.parse(permSource.permissions_json);
                if (parsed && typeof parsed === 'object' && parsed.emergency_max_refund !== undefined) {
                  emergencyMaxRefund = parseFloat(parsed.emergency_max_refund);
                }
              } catch {}
            }
          }
             
          const totalRefundAmount = refundItem?.total_mt || 0;
          if (totalRefundAmount > emergencyMaxRefund) {
            toast.error(`Código válido, mas reembolso excede o limite de emergência (${emergencyMaxRefund} MZN). Requer Admin físico.`);
            setManagerPin('');
            return;
          }
             
          await db.execute(
            'UPDATE emergency_tokens SET is_used = 1, used_at = CURRENT_TIMESTAMP, used_amount = ?, used_for = ?, sync_status = 0 WHERE id = ?', 
            [totalRefundAmount, `Reembolso: ${refundItem?.product_name || 'Item'}`, matchedToken.id]
          );
          setAuthorizedManager({ id: 'emergency-token', name: 'Código de Emergência', role: 'Admin' });
          toast.success('Autorizado via código de emergência.');
          setWizardStep('condition');
        } else {
          if (isTimeLimitExceeded) {
            setPinError('Apenas Administrador!');
            toast.error('Acesso Negado: Prazo de devolução excedido! Requer PIN do Administrador.');
          } else if (refundAuthLevel === 'admin_only') {
            setPinError('Apenas Administrador!');
            toast.error('Acesso Negado: Apenas o Administrador Geral pode autorizar reembolsos.');
          } else {
            setPinError('PIN sem Permissão!');
            toast.error('Acesso Negado: Este utilizador não possui privilégios de Gestor/Gerente.');
          }
          setManagerPin('');
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao validar PIN');
      setManagerPin('');
    }
  };

  const handleClose = () => {
    setManagerPin('');
    setAuthorizedManager(null);
    setPinError('');
    setItemCondition(null);
    setWizardStep('pin');
    onClose();
  };

  const handleFinalizeRefund = async () => {
    if (!refundItem || !authorizedManager || !itemCondition) {
      toast.error('Por favor complete todos os passos.');
      return;
    }

    try {
      const db = await getDB();
      const refundId = crypto.randomUUID();

      if (itemCondition === 'shelf') {
        const prodData: any[] = await db.select('SELECT stock_quantity FROM products WHERE id = ?', [refundItem.product_id]);
        if (prodData.length > 0) {
          const currentStock = parseFloat(prodData[0].stock_quantity) || 0;
          await db.execute(
            'UPDATE products SET stock_quantity = ?, sync_status = 0 WHERE id = ?', 
            [currentStock + refundItem.quantity, refundItem.product_id]
          );
        }
      } else {
        const spoilageId = crypto.randomUUID();
        await db.execute(
          `INSERT INTO spoiled_items (id, product_id, quantity, reason, authorized_by, sale_id, receipt_id)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            spoilageId,
            refundItem.product_id,
            refundItem.quantity,
            'Artigo Danificado / Quebra',
            authorizedManager.name,
            refundId,
            refundReceiptId
          ]
        );
      }

      await db.execute(
        `INSERT INTO sales (id, receipt_id, product_id, quantity, total_mt, payment_method, status, is_synced, authorized_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
        [
          refundId,
          refundReceiptId,
          refundItem.product_id,
          -refundItem.quantity,
          -refundItem.total_mt,
          (refundItem as any).payment_method || 'cash',
          'refunded',
          authorizedManager.name
        ]
      );

      const detailsText = `Artigo reembolsado: ${refundItem.product_name} (${refundItem.quantity}x). Total: -${refundItem.total_mt} MT. Autorizado por: ${authorizedManager.name}. Estado: ${itemCondition === 'shelf' ? 'Voltou ao Stock' : 'Quebra/Danificado'}. Recibo original: ${refundReceiptId}`;
      
      await db.execute(
        `INSERT INTO audit_logs (id, user_id, action, details, sync_status) VALUES (?, ?, ?, ?, 0)`,
        [crypto.randomUUID(), currentUser?.id || 'unknown', 'ITEM_REFUNDED', detailsText]
      );

      const notifPrefsRow: any[] = await db.select("SELECT value FROM settings WHERE key = 'notification_preferences'");
      const prefs = notifPrefsRow[0]?.value ? notifPrefsRow[0].value.split(',') : [];

      const maxRefRow: any[] = await db.select("SELECT value FROM settings WHERE key = 'max_refund_limit'");
      const maxRefundLimit = parseFloat(maxRefRow[0]?.value || '3000');

      if (prefs.includes('voids')) {
        const notifId = crypto.randomUUID();
        await db.execute(`
          INSERT INTO notifications (id, type, title, message, is_read, action_url, sync_status)
          VALUES (?, ?, ?, ?, 0, ?, 0)
        `, [
          notifId,
          'ITEM_REFUNDED',
          'Artigo Reembolsado',
          `Anulação de -${refundItem.total_mt} MT em ${(refundItem as any).payment_method?.toUpperCase()} para o artigo "${refundItem.product_name}" (Aut: ${authorizedManager.name}).`,
          'audit'
        ]);
      }

      if (refundItem.total_mt > maxRefundLimit) {
        const notifIdLimit = crypto.randomUUID();
        await db.execute(`
          INSERT INTO notifications (id, type, title, message, is_read, action_url, sync_status)
          VALUES (?, ?, ?, ?, 0, ?, 0)
        `, [
          notifIdLimit,
          'HIGH_VALUE_REFUND',
          'Alerta: Reembolso Elevado',
          `Um reembolso de ${refundItem.total_mt} MT foi processado, excedendo o limite de ${maxRefundLimit} MT. (Artigo: ${refundItem.product_name}, Aut: ${authorizedManager.name})`,
          'audit'
        ]);
      }

      toast.success('Reembolso processado com sucesso!');
      handleClose();
      onRefundComplete();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar o reembolso');
    }
  };

  return {
    wizardStep,
    setWizardStep,
    managerPin,
    setManagerPin,
    authorizedManager,
    pinError,
    setPinError,
    itemCondition,
    setItemCondition,
    refundTimeLimit,
    refundMethod,
    daysSinceSale,
    isTimeLimitExceeded,
    handlePinSubmit,
    handleClose,
    handleFinalizeRefund,
  };
}
