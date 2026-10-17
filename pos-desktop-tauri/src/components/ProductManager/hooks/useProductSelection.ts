import { useState } from 'react';
import { Product } from '../../../lib/api';
import { getDB } from '../../../lib/db';
import { useAuth } from '../../../contexts/AuthContext';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useProductsI18n } from '../../../i18n';

interface UseProductSelectionProps {
  products: Product[];
  filteredProducts: Product[];
  onDeleteSuccess: () => void;
}

export function useProductSelection({ products, filteredProducts, onDeleteSuccess }: UseProductSelectionProps) {
  const { currentUser } = useAuth();
  const t = useProductsI18n();
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);

  const toggleSelectAll = () => {
    if (selectedProductIds.size === filteredProducts.length && filteredProducts.length > 0) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const toggleSelectProduct = (productId: string) => {
    const newSet = new Set(selectedProductIds);
    if (newSet.has(productId)) {
      newSet.delete(productId);
    } else {
      newSet.add(productId);
    }
    setSelectedProductIds(newSet);
  };

  const exportSelectedPDF = async () => {
    try {
      const selectedProducts = products.filter(p => selectedProductIds.has(p.id));
      if (selectedProducts.length === 0) {
        toast.error(t.noProductsFound);
        return;
      }
      const db = await getDB();
      const aliasRows = await db.select('SELECT product_id, barcode FROM product_aliases') as { product_id: string; barcode: string }[];
      const aliasMap: Record<string, string[]> = {};
      aliasRows.forEach(r => {
        if (!aliasMap[r.product_id]) aliasMap[r.product_id] = [];
        aliasMap[r.product_id].push(r.barcode);
      });

      const doc = new jsPDF('l', 'mm', 'a4');
      doc.setFontSize(16);
      doc.text('Relatório Detalhado de Produtos Selecionados', 14, 15);
      doc.setFontSize(9);
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-MZ')} | Total: ${selectedProducts.length} itens`, 14, 21);
      
      const tableData = selectedProducts.map(p => {
        const selling = p.price_mt;
        const cost = p.cost_price_mt ?? 0;
        const markup = selling - cost;
        const marginPct = selling > 0 ? (markup / selling) * 100 : 0;
        const productAliases = aliasMap[p.id] || [];

        return [
          p.barcode,
          p.name,
          p.category || '-',
          `${cost.toFixed(2)} MT`,
          `${selling.toFixed(2)} MT`,
          `${markup.toFixed(2)} MT`,
          `${marginPct.toFixed(1)}%`,
          `${p.stock_quantity ?? 0} ${p.is_fractional ? 'kg' : 'un'}`,
          p.min_stock_alert ?? 5,
          productAliases.join(', ') || '-'
        ];
      });
      
      autoTable(doc, {
        startY: 25,
        head: [['Cód. Barra', 'Nome do Produto', 'Categoria', 'P. Custo', 'P. Venda', 'Lucro MZN', 'Margem %', 'Stock', 'Mín. Alerta', 'Aliases']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [79, 70, 229] }
      });
      
      doc.save(`produtos_selecionados_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success(t.exportPDF);
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Erro ao gerar PDF.');
    }
  };

  const exportSelectedCSV = async () => {
    try {
      const selectedProducts = products.filter(p => selectedProductIds.has(p.id));
      if (selectedProducts.length === 0) {
        toast.error(t.noProductsFound);
        return;
      }
      const db = await getDB();
      const aliasRows = await db.select('SELECT product_id, barcode FROM product_aliases') as { product_id: string; barcode: string }[];
      const aliasMap: Record<string, string[]> = {};
      aliasRows.forEach(r => {
        if (!aliasMap[r.product_id]) aliasMap[r.product_id] = [];
        aliasMap[r.product_id].push(r.barcode);
      });

      const headers = [
        'ID', 
        'Codigo de Barra', 
        'Nome', 
        'Categoria', 
        'Preco de Venda (MZN)', 
        'Preco de Custo (MZN)', 
        'Margem de Lucro (MZN)', 
        'Margem (%)', 
        'Stock Atual', 
        'Alerta Stock Minimo', 
        'Venda Fracionada (0=Nao, 1=Sim)',
        'Codigos Secundarios (Aliases)'
      ];

      const csvLines = [headers.join(';')];
      for (const p of selectedProducts) {
        const selling = p.price_mt;
        const cost = p.cost_price_mt ?? 0;
        const markup = selling - cost;
        const marginPct = selling > 0 ? (markup / selling) * 100 : 0;
        const productAliases = aliasMap[p.id] || [];

        const line = [
          p.id,
          p.barcode,
          `"${(p.name || '').replace(/"/g, '""')}"`,
          `"${(p.category || '').replace(/"/g, '""')}"`,
          selling,
          cost,
          markup,
          `${marginPct.toFixed(1)}%`,
          p.stock_quantity ?? 0,
          p.min_stock_alert ?? 5,
          p.is_fractional ? 1 : 0,
          `"${productAliases.join(';')}"`
        ].join(';');
        csvLines.push(line);
      }

      const csvContent = csvLines.join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `produtos_selecionados_${new Date().toISOString().split('T')[0]}.csv`);
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Ficheiro CSV dos produtos selecionados exportado com sucesso!');
    } catch (err) {
      console.error('CSV export error:', err);
      toast.error('Erro ao exportar CSV.');
    }
  };

  const deleteSelectedProducts = () => {
    if (selectedProductIds.size === 0) return;
    setIsBulkDeleteConfirmOpen(true);
  };

  const confirmBulkDeleteProducts = async (justification?: string) => {
    try {
      const db = await getDB();
      let deletedCount = 0;
      let skippedCount = 0;

      for (const id of selectedProductIds) {
        const prodRes = await db.select('SELECT id, name, requires_verification FROM products WHERE id = ?', [id]) as any[];
        const prod = prodRes[0];
        if (prod && (prod.requires_verification === 1 || prod.requires_verification === true)) {
          skippedCount++;
          continue;
        }

        await db.execute('DELETE FROM barcodes WHERE linked_product_id = ?', [id]);
        await db.execute('DELETE FROM product_aliases WHERE product_id = ?', [id]);
        await db.execute('UPDATE products SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP, barcode = NULL, updated_at = CURRENT_TIMESTAMP, sync_status = 0 WHERE id = ?', [id]);
        deletedCount++;
      }

      const { logAudit } = await import('../../../lib/audit');
      if (deletedCount > 0) {
        await logAudit(
          currentUser?.id, 
          'BULK_PRODUCT_WIPED', 
          `Eliminados ${deletedCount} produtos em lote${justification ? ` - Justificativa: ${justification}` : ''}`
        );
      }

      setSelectedProductIds(new Set());
      setIsBulkDeleteConfirmOpen(false);
      onDeleteSuccess();

      if (skippedCount > 0) {
        toast.error(`${deletedCount} ${t.productDeletedSuccess}. ${skippedCount} ${t.lockedOnly}`);
      } else {
        toast.success(t.productDeletedSuccess);
      }
    } catch (err) {
      toast.error(t.errorDeletingProduct);
    }
  };

  return {
    selectedProductIds,
    setSelectedProductIds,
    isBulkDeleteConfirmOpen,
    setIsBulkDeleteConfirmOpen,
    toggleSelectAll,
    toggleSelectProduct,
    exportSelectedPDF,
    exportSelectedCSV,
    deleteSelectedProducts,
    confirmBulkDeleteProducts
  };
}
