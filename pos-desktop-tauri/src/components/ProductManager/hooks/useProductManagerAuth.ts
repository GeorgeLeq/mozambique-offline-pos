import { useState, useEffect, useRef } from 'react';
import { getDB } from '../../../lib/db';
import { findUserByPin } from '../../../lib/security/crypto';
import toast from 'react-hot-toast';

const SESSION_UNLOCK_PRODUCTS_KEY = 'mozpos_products_unlocked_until';
const SESSION_UNLOCK_ORDERS_KEY = 'mozpos_orders_unlocked_until';
const SESSION_UNLOCK_HISTORY_KEY = 'mozpos_history_unlocked_until';

export function useProductManagerAuth(currentUser: any, activeTab: string) {
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinValue, setPinValue] = useState('');
  const [pinSuccessCallback, setPinSuccessCallback] = useState<(() => void) | null>(null);
  const [requiredPinScope, setRequiredPinScope] = useState<'products' | 'orders' | 'history'>('products');

  const lastActivityRef = useRef<number>(Date.now());

  const checkIsProductsUnlocked = () => {
    if (currentUser?.role === 'Admin') return true;
    const until = sessionStorage.getItem(SESSION_UNLOCK_PRODUCTS_KEY);
    if (until) {
      const expires = parseInt(until, 10);
      if (Date.now() < expires) {
        return true;
      } else {
        sessionStorage.removeItem(SESSION_UNLOCK_PRODUCTS_KEY);
      }
    }
    return false;
  };

  const checkIsOrdersUnlocked = () => {
    if (currentUser?.role === 'Admin') return true;
    const until = sessionStorage.getItem(SESSION_UNLOCK_ORDERS_KEY);
    if (until) {
      const expires = parseInt(until, 10);
      if (Date.now() < expires) {
        return true;
      } else {
        sessionStorage.removeItem(SESSION_UNLOCK_ORDERS_KEY);
      }
    }
    return false;
  };

  const checkIsHistoryUnlocked = () => {
    if (currentUser?.role === 'Admin') return true;
    let userPerms: string[] = [];
    if (currentUser?.permissions_json) {
      try {
        const parsed = JSON.parse(currentUser.permissions_json);
        userPerms = Array.isArray(parsed) ? parsed : (parsed.permissions || []);
      } catch (e) {}
    }
    if (userPerms.includes('history')) return true;

    const until = sessionStorage.getItem(SESSION_UNLOCK_HISTORY_KEY);
    if (until) {
      const expires = parseInt(until, 10);
      if (Date.now() < expires) {
        return true;
      } else {
        sessionStorage.removeItem(SESSION_UNLOCK_HISTORY_KEY);
      }
    }
    return false;
  };

  // Activity timer listener for 1 hour inactivity lock
  useEffect(() => {
    let lastRecord = 0;
    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastRecord > 2000) {
        lastRecord = now;
        lastActivityRef.current = now;
      }
    };

    window.addEventListener('pointerdown', handleUserActivity, { passive: true });
    window.addEventListener('keydown', handleUserActivity, { passive: true });
    window.addEventListener('scroll', handleUserActivity, { passive: true });

    const intervalId = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      const ONE_HOUR = 60 * 60 * 1000;
      if (elapsed >= ONE_HOUR) {
        const prodUnlocked = sessionStorage.getItem(SESSION_UNLOCK_PRODUCTS_KEY);
        const ordUnlocked = sessionStorage.getItem(SESSION_UNLOCK_ORDERS_KEY);
        const histUnlocked = sessionStorage.getItem(SESSION_UNLOCK_HISTORY_KEY);
        if (prodUnlocked || ordUnlocked || histUnlocked) {
          sessionStorage.removeItem(SESSION_UNLOCK_PRODUCTS_KEY);
          sessionStorage.removeItem(SESSION_UNLOCK_ORDERS_KEY);
          sessionStorage.removeItem(SESSION_UNLOCK_HISTORY_KEY);
          setIsAdminUnlocked(false);
          toast.error('Sessão de autorização bloqueada por inatividade (1 hora sem utilização).');
        }
      }
    }, 60000);

    return () => {
      window.removeEventListener('pointerdown', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
      clearInterval(intervalId);
    };
  }, []);

  // Sync Admin Role & session timer check
  useEffect(() => {
    if (currentUser?.role === 'Admin' || checkIsProductsUnlocked() || checkIsOrdersUnlocked() || checkIsHistoryUnlocked()) {
      setIsAdminUnlocked(true);
    } else {
      setIsAdminUnlocked(false);
    }
  }, [currentUser, activeTab]);

  const setSessionUnlock = (scope: 'products' | 'orders' | 'history' = 'products') => {
    const oneHourLater = Date.now() + 60 * 60 * 1000;
    if (scope === 'products') {
      sessionStorage.setItem(SESSION_UNLOCK_PRODUCTS_KEY, oneHourLater.toString());
    } else if (scope === 'orders') {
      sessionStorage.setItem(SESSION_UNLOCK_ORDERS_KEY, oneHourLater.toString());
    } else {
      sessionStorage.setItem(SESSION_UNLOCK_HISTORY_KEY, oneHourLater.toString());
    }
    lastActivityRef.current = Date.now();
    setIsAdminUnlocked(true);
  };

  const handleLockSession = () => {
    sessionStorage.removeItem(SESSION_UNLOCK_PRODUCTS_KEY);
    sessionStorage.removeItem(SESSION_UNLOCK_ORDERS_KEY);
    sessionStorage.removeItem(SESSION_UNLOCK_HISTORY_KEY);
    if (currentUser?.role !== 'Admin') {
      setIsAdminUnlocked(false);
    }
    toast.success('Sessão de autorização bloqueada.');
  };

  const handlePromptAdminPin = (onSuccess: () => void, scope: 'products' | 'orders' | 'history' = 'products') => {
    let isUnlockedForScope = false;
    if (scope === 'orders') isUnlockedForScope = checkIsOrdersUnlocked();
    else if (scope === 'history') isUnlockedForScope = checkIsHistoryUnlocked();
    else isUnlockedForScope = checkIsProductsUnlocked();

    if (isUnlockedForScope) {
      onSuccess();
      return;
    }
    setRequiredPinScope(scope);
    setPinSuccessCallback(() => onSuccess);
    setPinValue('');
    setShowPinModal(true);
  };

  const handleVerifyPin = async () => {
    if (pinValue.length < 4) return;
    
    console.log(`[AdminPinAuth] Attempting to verify PIN (length: ${pinValue.length}) for scope: ${requiredPinScope}`);

    try {
      const db = await getDB();
      const verifiedUser = await findUserByPin(db, pinValue);
      
      console.log(`[AdminPinAuth] Verification result:`, verifiedUser ? `User Found: ${verifiedUser.name} (${verifiedUser.role})` : 'Invalid PIN');

      if (verifiedUser) {
        const roleUpper = (verifiedUser.role || '').toUpperCase();
        let perms: string[] = [];
        if (verifiedUser.permissions_json) {
          try {
            const parsed = JSON.parse(verifiedUser.permissions_json);
            perms = Array.isArray(parsed) ? parsed : (parsed.permissions || []);
          } catch (e) {}
        }

        const isRoleAdmin = roleUpper === 'ADMIN';
        const isRoleManager = roleUpper === 'MANAGER';

        if (requiredPinScope === 'history') {
          const hasHistoryPermission = isRoleAdmin || isRoleManager || perms.includes('history') || perms.includes('audit');
          if (hasHistoryPermission) {
            setSessionUnlock('history');
            toast.success(`Acesso ao Histórico & Lixeira concedido: ${verifiedUser.name}`);
            setShowPinModal(false);
            setPinValue('');
            if (pinSuccessCallback) {
              pinSuccessCallback();
            }
          } else {
            toast.error(`O utilizador ${verifiedUser.name} não possui permissão para aceder ao Histórico.`);
            setPinValue('');
          }
        } else if (requiredPinScope === 'orders') {
          const hasOrderPermission = isRoleAdmin || perms.includes('orders') || perms.includes('restock') || perms.includes('encomendas');
          if (hasOrderPermission) {
            setSessionUnlock('orders');
            toast.success(`Acesso a Encomendas PO concedido: ${verifiedUser.name}`);
            setShowPinModal(false);
            setPinValue('');
            if (pinSuccessCallback) {
              pinSuccessCallback();
            }
          } else {
            toast.error(`O utilizador ${verifiedUser.name} não possui permissão explícita para aceder a Encomendas PO.`);
            setPinValue('');
          }
        } else {
          const hasProductPermission = isRoleAdmin || isRoleManager || perms.includes('products');
          if (hasProductPermission) {
            setSessionUnlock('products');
            toast.success(`Acesso a Gestão de Produtos concedido: ${verifiedUser.name}`);
            setShowPinModal(false);
            setPinValue('');
            if (pinSuccessCallback) {
              pinSuccessCallback();
            }
          } else {
            toast.error(`O utilizador ${verifiedUser.name} não possui permissão para gerir produtos.`);
            setPinValue('');
          }
        }
      } else {
        toast.error('PIN de autenticação inválido.');
        setPinValue('');
      }
    } catch (err) {
      console.error('Failed to verify PIN', err);
      toast.error('Erro na validação do PIN.');
    }
  };

  const handleKeypadPress = (num: string) => {
    if (pinValue.length < 6) {
      console.log(`[AdminPinAuth] Keypad pressed: ${num}, Current PIN length: ${pinValue.length + 1}`);
      setPinValue(prev => prev + num);
    }
  };

  const handleKeypadClear = () => {
    setPinValue('');
  };

  const handleKeypadBackspace = () => {
    setPinValue(prev => prev.slice(0, -1));
  };

  return {
    isAdminUnlocked,
    showPinModal,
    setShowPinModal,
    pinValue,
    handleLockSession,
    handlePromptAdminPin,
    handleVerifyPin,
    handleKeypadPress,
    handleKeypadClear,
    handleKeypadBackspace,
    checkIsOrdersUnlocked,
    checkIsProductsUnlocked
  };
}
