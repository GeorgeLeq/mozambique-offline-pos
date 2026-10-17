import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

export interface RestockLog {
  id: string;
  action?: string;
  user_name: string;
  details: string;
  created_at: string;
  sync_status?: number;
  price_mt?: number;
  cost_price_mt?: number;
  stock_impact?: number | string;
  unit?: string;
  item_name?: string;
}

export interface DeletedProductItem {
  id: string;
  barcode?: string;
  name: string;
  category?: string;
  price_mt?: number;
  cost_price_mt?: number;
  stock_quantity?: number;
  deleted_at?: string;
  updated_at?: string;
}

export function exportHistoryCSV(
  activeTab: 'history' | 'trash',
  logs: RestockLog[],
  deletedProducts: DeletedProductItem[],
  retentionDays: number = 30
) {
  if (activeTab === 'history') {
    if (logs.length === 0) {
      toast.error('Nenhum registo de histórico para exportar.');
      return;
    }
    const headers = ['ID', 'Data', 'Hora', 'Ação', 'Operador', 'Detalhes'];
    const csvRows = [
      headers.join(';'),
      ...logs.map(log => {
        const d = new Date(log.created_at);
        return [
          log.id,
          d.toLocaleDateString('pt-MZ'),
          d.toLocaleTimeString('pt-MZ'),
          `"${(log.action || 'RESTOCK').replace(/"/g, '""')}"`,
          `"${(log.user_name || 'Sistema').replace(/"/g, '""')}"`,
          `"${(log.details || '').replace(/"/g, '""')}"`
        ].join(';');
      })
    ];

    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `historico_auditoria_inventario_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Histórico exportado para CSV com sucesso!');
  } else {
    if (deletedProducts.length === 0) {
      toast.error('A lixeira está vazia.');
      return;
    }
    const headers = ['ID', 'Código de Barras', 'Nome', 'Categoria', 'Preço Venda (MT)', 'Custo (MT)', 'Data de Eliminação', 'Dias Restantes'];
    const now = Date.now();
    const retentionMs = retentionDays * 24 * 60 * 60 * 1000;

    const csvRows = [
      headers.join(';'),
      ...deletedProducts.map(p => {
        const deletedDate = p.deleted_at ? new Date(p.deleted_at) : (p.updated_at ? new Date(p.updated_at) : new Date());
        const diffMs = (deletedDate.getTime() + retentionMs) - now;
        const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

        return [
          p.id,
          p.barcode || '',
          `"${(p.name || '').replace(/"/g, '""')}"`,
          `"${(p.category || '-').replace(/"/g, '""')}"`,
          p.price_mt ?? 0,
          p.cost_price_mt ?? 0,
          deletedDate.toLocaleDateString('pt-MZ'),
          daysRemaining
        ].join(';');
      })
    ];

    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `lixeira_produtos_backup_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Backup da lixeira exportado para CSV com sucesso!');
  }
}

export function exportHistoryPDF(
  activeTab: 'history' | 'trash',
  logs: RestockLog[],
  deletedProducts: DeletedProductItem[],
  retentionDays: number = 30
) {
  if (activeTab === 'history') {
    if (logs.length === 0) {
      toast.error('Nenhum registo de histórico para exportar.');
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Relatório de Histórico & Auditoria de Inventário', 14, 15);
    doc.setFontSize(10);
    doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-MZ')} ${new Date().toLocaleTimeString('pt-MZ')} | Total de Registos: ${logs.length}`, 14, 22);

    const tableData = logs.map(log => {
      const d = new Date(log.created_at);
      return [
        `${d.toLocaleDateString('pt-MZ')} ${d.toLocaleTimeString('pt-MZ')}`,
        log.action || 'RESTOCK',
        log.user_name || 'Sistema',
        log.details || '-'
      ];
    });

    autoTable(doc, {
      startY: 27,
      head: [['Data & Hora', 'Ação', 'Operador', 'Detalhes da Operação']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [79, 70, 229] },
      columnStyles: {
        0: { cellWidth: 32 },
        1: { cellWidth: 32 },
        2: { cellWidth: 30 },
        3: { cellWidth: 'auto' }
      }
    });

    doc.save(`relatorio_auditoria_inventario_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Relatório PDF do Histórico gerado com sucesso!');
  } else {
    if (deletedProducts.length === 0) {
      toast.error('A lixeira está vazia.');
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Relatório de Backup da Lixeira de Produtos', 14, 15);
    doc.setFontSize(10);
    doc.text(`Política de Retenção Ativa: ${retentionDays} Dias | Total na Lixeira: ${deletedProducts.length}`, 14, 22);

    const now = Date.now();
    const retentionMs = retentionDays * 24 * 60 * 60 * 1000;

    const tableData = deletedProducts.map(p => {
      const deletedDate = p.deleted_at ? new Date(p.deleted_at) : (p.updated_at ? new Date(p.updated_at) : new Date());
      const diffMs = (deletedDate.getTime() + retentionMs) - now;
      const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

      return [
        p.barcode || '-',
        p.name,
        p.category || '-',
        `${p.price_mt ?? 0} MT`,
        deletedDate.toLocaleDateString('pt-MZ'),
        `${daysRemaining} dias`
      ];
    });

    autoTable(doc, {
      startY: 27,
      head: [['Código de Barras', 'Produto', 'Categoria', 'Preço Venda', 'Data Eliminação', 'Retenção Restante']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [225, 29, 72] }
    });

    doc.save(`backup_lixeira_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Relatório PDF da Lixeira gerado com sucesso!');
  }
}
