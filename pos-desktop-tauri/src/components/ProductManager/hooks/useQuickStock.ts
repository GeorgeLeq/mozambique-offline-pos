import { useState, useRef } from 'react';
import { Product } from '../../../lib/api';
import { getDB } from '../../../lib/db';
import toast from 'react-hot-toast';
import { useAuth } from '../../../contexts/AuthContext';
import { logAudit } from '../../../lib/audit';
import { useProductsI18n } from '../../../i18n';

interface UseQuickStockProps {
  onSuccess: () => void;
}

export function useQuickStock({ onSuccess }: UseQuickStockProps) {
  const { currentUser } = useAuth();
  const t = useProductsI18n();
  const [quickStockId, setQuickStockId] = useState<string | null>(null);
  const [quickStockValue, setQuickStockValue] = useState<string>('');
  const quickStockInputRef = useRef<HTMLInputElement>(null);

  const submitQuickStock = async (product: Product) => {
    if (!quickStockValue) {
      setQuickStockId(null);
      return;
    }
    const val = parseFloat(quickStockValue);
    if (isNaN(val)) {
      toast.error('Quantidade inválida');
      return;
    }

    try {
      const db = await getDB();
      const newStock = (product.stock_quantity || 0) + val;
      await db.execute('UPDATE products SET stock_quantity = ?, sync_status = 0 WHERE id = ?', [newStock, product.id]);
      await logAudit(currentUser?.id, 'STOCK_ADJUSTMENT', `Quick adjusted stock for ${product.name} by ${val}. New stock: ${newStock}`);

      // Create a high-risk manager alert notification for manual stock adjustments
      const notifId = crypto.randomUUID();
      await db.execute(`
        INSERT INTO notifications (id, type, title, message, is_read, action_url, sync_status)
        VALUES (?, ?, ?, ?, 0, ?, 0)
      `, [
        notifId,
        'STOCK_ADJUSTED',
        'Ajuste de Stock Manual',
        `O utilizador ${currentUser?.name || 'Operador'} ajustou manualmente o stock de "${product.name}" por ${val > 0 ? '+' : ''}${val}. Novo stock: ${newStock}`,
        'products'
      ]);

      toast.success(`${product.name}: ${t.quickStockSuccess}`);
      setQuickStockId(null);
      setQuickStockValue('');
      onSuccess();
    } catch (err) {
      toast.error(t.quickStockError || t.errorUpdatingProduct);
    }
  };

  return {
    quickStockId,
    setQuickStockId,
    quickStockValue,
    setQuickStockValue,
    quickStockInputRef,
    submitQuickStock
  };
}
