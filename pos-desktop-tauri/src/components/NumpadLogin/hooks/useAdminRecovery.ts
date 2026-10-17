import { useState } from 'react';
import toast from 'react-hot-toast';
import { getDB } from '../../../lib/db';
import { supabase } from '../../../lib/supabase';

export function useAdminRecovery() {
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [recoveryShopCode, setRecoveryShopCode] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);

  const handleRecoverAdminPin = async () => {
    if (!recoveryShopCode.trim()) {
      toast.error('Insira o código da loja para continuar.');
      return;
    }

    setIsRecovering(true);
    try {
      const db = await getDB();
      // 1. Get the local shop_id from settings
      const settingsResult = await db.select('SELECT value FROM settings WHERE key = ?', ['shop_id']) as any[];
      if (!settingsResult || settingsResult.length === 0) {
        toast.error('Nenhuma loja configurada localmente neste terminal.');
        setIsRecovering(false);
        return;
      }
      
      const localShopId = settingsResult[0].value;

      // 2. Query Supabase to find a shop with code = recoveryShopCode and id = localShopId
      const { data: shop, error: shopError } = await supabase
        .from('shops')
        .select('*')
        .eq('code', recoveryShopCode.trim().toUpperCase())
        .eq('id', localShopId)
        .maybeSingle();

      if (shopError || !shop) {
        toast.error('Código de Loja inválido ou não correspondente a este terminal.');
        setIsRecovering(false);
        return;
      }

      // 3. Update local Admin user PIN in SQLite to match the cloud master_pin
      const cloudMasterPin = shop.master_pin;
      
      // Update local 'Admin' role users to use this master PIN
      await db.execute('UPDATE users SET pin = ? WHERE role = ?', [cloudMasterPin, 'Admin']);
      
      toast.success('PIN redefinido com sucesso! O PIN do Administrador foi sincronizado com o PIN Master da Nuvem.', { duration: 6000 });
      setIsRecoveryOpen(false);
      setRecoveryShopCode('');
    } catch (err) {
      console.error('Error recovering PIN:', err);
      toast.error('Ocorreu um erro ao recuperar o PIN do Administrador.');
    } finally {
      setIsRecovering(false);
    }
  };

  return {
    isRecoveryOpen,
    setIsRecoveryOpen,
    recoveryShopCode,
    setRecoveryShopCode,
    isRecovering,
    handleRecoverAdminPin
  };
}
