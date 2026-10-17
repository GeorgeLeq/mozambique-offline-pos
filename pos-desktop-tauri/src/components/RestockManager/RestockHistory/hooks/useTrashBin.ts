import { useState, useEffect } from 'react';
import { getDB } from '../../../../lib/db';
import { logAudit } from '../../../../lib/audit';
import toast from 'react-hot-toast';
import { DeletedProductItem } from '../types';
import { User } from '../../../../types';

export function useTrashBin(currentUser: User | null) {
  const [retentionDays, setRetentionDays] = useState<number>(() => {
    const saved = localStorage.getItem('mozpos_history_retention_days');
    return saved ? parseInt(saved, 10) : 30;
  });

  const [deletedProducts, setDeletedProducts] = useState<DeletedProductItem[]>([]);
  const [trashSearchTerm, setTrashSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [productToWipe, setProductToWipe] = useState<DeletedProductItem | null>(null);
  const [selectedTrashIds, setSelectedTrashIds] = useState<string[]>([]);
  const [isBulkRestoreConfirm, setIsBulkRestoreConfirm] = useState(false);
  const [isBulkWipeConfirm, setIsBulkWipeConfirm] = useState(false);

  const handleSetRetentionDays = (days: number) => {
    setRetentionDays(days);
    localStorage.setItem('mozpos_history_retention_days', days.toString());
    if (days <= 0) {
      toast.success('Política de retenção atualizada para: Nunca (Sem expiração)');
    } else {
      toast.success(`Política de retenção atualizada para ${days} dias.`);
    }
  };

  const loadTrashData = async () => {
    try {
      setIsLoading(true);
      const db = await getDB();
      const results = await db.select(`
        SELECT * FROM products 
        WHERE is_deleted = 1 
        ORDER BY updated_at DESC
      `) as DeletedProductItem[];

      const now = new Date().getTime();
      const retentionMs = retentionDays * 24 * 60 * 60 * 1000;
      const validDeleted: DeletedProductItem[] = [];

      // Auto-purge items exceeding selected retention window (skip if retentionDays <= 0 for "Never")
      for (const p of results) {
        const deletedTime = p.deleted_at 
          ? new Date(p.deleted_at).getTime() 
          : (p.updated_at ? new Date(p.updated_at).getTime() : now);
        
        if (retentionDays > 0 && (now - deletedTime > retentionMs)) {
          console.log(`[TrashPurge] Purging product beyond ${retentionDays} days: ${p.name} (${p.id})`);
          await db.execute('DELETE FROM barcodes WHERE linked_product_id = ?', [p.id]);
          await db.execute('DELETE FROM product_aliases WHERE product_id = ?', [p.id]);
          await db.execute('DELETE FROM products WHERE id = ?', [p.id]);
        } else {
          validDeleted.push(p);
        }
      }

      setDeletedProducts(validDeleted);
      setSelectedTrashIds([]);
    } catch (err) {
      console.error('Failed to load deleted products trash bin', err);
      toast.error('Erro ao carregar a lixeira.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTrashData();
  }, [retentionDays]);

  const handleRestoreProduct = async (product: DeletedProductItem) => {
    try {
      const db = await getDB();
      await db.execute(
        'UPDATE products SET is_deleted = 0, deleted_at = NULL, updated_at = CURRENT_TIMESTAMP, sync_status = 0 WHERE id = ?',
        [product.id]
      );
      await logAudit(currentUser?.id, 'PRODUCT_RESTORED', `Restored product ${product.name}`);
      toast.success(`"${product.name}" restaurado com sucesso!`);
      loadTrashData();
    } catch (err) {
      console.error('Failed to restore product', err);
      toast.error('Erro ao restaurar produto.');
    }
  };

  const handleBulkRestore = async () => {
    if (selectedTrashIds.length === 0) return;
    try {
      const db = await getDB();
      for (const id of selectedTrashIds) {
        await db.execute(
          'UPDATE products SET is_deleted = 0, deleted_at = NULL, updated_at = CURRENT_TIMESTAMP, sync_status = 0 WHERE id = ?',
          [id]
        );
      }
      await logAudit(currentUser?.id, 'BULK_PRODUCT_RESTORED', `Restored ${selectedTrashIds.length} products`);
      toast.success(`${selectedTrashIds.length} produtos restaurados com sucesso!`);
      setIsBulkRestoreConfirm(false);
      loadTrashData();
    } catch (err) {
      console.error('Failed to bulk restore', err);
      toast.error('Erro ao restaurar produtos em massa.');
    }
  };

  const handlePermanentWipeProduct = async () => {
    if (!productToWipe) return;
    try {
      const db = await getDB();
      await db.execute('DELETE FROM barcodes WHERE linked_product_id = ?', [productToWipe.id]);
      await db.execute('DELETE FROM product_aliases WHERE product_id = ?', [productToWipe.id]);
      await db.execute('DELETE FROM products WHERE id = ?', [productToWipe.id]);
      await logAudit(currentUser?.id, 'PRODUCT_PERMANENT_DELETED', `Permanently deleted product ${productToWipe.name}`);
      toast.success(`"${productToWipe.name}" eliminado definitivamente.`);
      setProductToWipe(null);
      loadTrashData();
    } catch (err) {
      console.error('Failed to wipe product permanently', err);
      toast.error('Erro ao eliminar definitivamente.');
    }
  };

  const handleBulkWipe = async () => {
    if (selectedTrashIds.length === 0) return;
    try {
      const db = await getDB();
      for (const id of selectedTrashIds) {
        await db.execute('DELETE FROM barcodes WHERE linked_product_id = ?', [id]);
        await db.execute('DELETE FROM product_aliases WHERE product_id = ?', [id]);
        await db.execute('DELETE FROM products WHERE id = ?', [id]);
      }
      await logAudit(currentUser?.id, 'BULK_PRODUCT_WIPED', `Permanently deleted ${selectedTrashIds.length} products`);
      toast.success(`${selectedTrashIds.length} produtos eliminados definitivamente.`);
      setIsBulkWipeConfirm(false);
      loadTrashData();
    } catch (err) {
      console.error('Failed to bulk wipe', err);
      toast.error('Erro na eliminação definitiva em lote.');
    }
  };

  const toggleSelectTrash = (id: string) => {
    setSelectedTrashIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const filteredTrash = deletedProducts.filter(p =>
    String(p.name || '').toLowerCase().includes(trashSearchTerm.toLowerCase()) ||
    String(p.barcode || '').toLowerCase().includes(trashSearchTerm.toLowerCase()) ||
    String(p.category || '').toLowerCase().includes(trashSearchTerm.toLowerCase())
  );

  const toggleSelectAllTrash = () => {
    if (selectedTrashIds.length === filteredTrash.length) {
      setSelectedTrashIds([]);
    } else {
      setSelectedTrashIds(filteredTrash.map(p => p.id));
    }
  };

  const getDaysRemaining = (p: DeletedProductItem) => {
    if (retentionDays <= 0) return -1;
    const deletedDate = p.deleted_at 
      ? new Date(p.deleted_at).getTime() 
      : (p.updated_at ? new Date(p.updated_at).getTime() : Date.now());
    const retentionMs = retentionDays * 24 * 60 * 60 * 1000;
    const diffMs = (deletedDate + retentionMs) - Date.now();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  return {
    deletedProducts,
    filteredTrash,
    trashSearchTerm,
    setTrashSearchTerm,
    isLoading,
    retentionDays,
    handleSetRetentionDays,
    selectedTrashIds,
    toggleSelectTrash,
    toggleSelectAllTrash,
    productToWipe,
    setProductToWipe,
    isBulkRestoreConfirm,
    setIsBulkRestoreConfirm,
    isBulkWipeConfirm,
    setIsBulkWipeConfirm,
    handleRestoreProduct,
    handleBulkRestore,
    handlePermanentWipeProduct,
    handleBulkWipe,
    getDaysRemaining,
    reloadTrash: loadTrashData
  };
}
