import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { PendingCashUser } from '../types';

interface UseCashShiftPromptProps {
  pin: string;
  setPin: (pin: string) => void;
  setError: (error: boolean) => void;
}

export function useCashShiftPrompt({ pin, setPin, setError }: UseCashShiftPromptProps) {
  const { login } = useAuth();
  const [pendingUser, setPendingUser] = useState<PendingCashUser | null>(null);
  const [cashInputValue, setCashInputValue] = useState('');
  const [isCashPromptOpen, setIsCashPromptOpen] = useState(false);

  const openCashShiftPrompt = (user: PendingCashUser, defaultCash?: number) => {
    setPendingUser(user);
    setCashInputValue(defaultCash !== undefined ? defaultCash.toString() : '10000');
    setIsCashPromptOpen(true);
  };

  const handleConfirmCashShift = async () => {
    const enteredAmt = parseFloat(cashInputValue);
    if (isNaN(enteredAmt) || enteredAmt < 0) {
      toast.error("Por favor, insira um valor de caixa inicial válido.");
      return;
    }

    const res = await login(pin, enteredAmt);
    if (!res.success) {
      if (res.blocked) {
        toast.error('ACESSO BLOQUEADO! Por favor, contacte o seu administrador.', { duration: 4000 });
      } else if (res.lockdown) {
        toast.error('SISTEMA EM BLOQUEIO DE EMERGÊNCIA! Apenas Administradores podem entrar.', { duration: 5000 });
      } else {
        toast.error('Erro ao iniciar turno.');
      }
      setError(true);
      setTimeout(() => {
        setPin('');
        setError(false);
        setIsCashPromptOpen(false);
        setPendingUser(null);
      }, 500);
    }
  };

  const handleCancelCashShift = () => {
    setPin('');
    setError(false);
    setIsCashPromptOpen(false);
    setPendingUser(null);
  };

  return {
    pendingUser,
    setPendingUser,
    cashInputValue,
    setCashInputValue,
    isCashPromptOpen,
    setIsCashPromptOpen,
    openCashShiftPrompt,
    handleConfirmCashShift,
    handleCancelCashShift
  };
}
