import { ExpectedDelivery } from '../index';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function useDeliveryExports(deliveries: ExpectedDelivery[]) {
  const exportPDF = () => {
    try {
      if (deliveries.length === 0) {
        toast.error('Nenhuma encomenda para exportar.');
        return;
      }
      const doc = new jsPDF('l', 'mm', 'a4');
      doc.setFontSize(16);
      doc.text('Relatório de Encomendas', 14, 15);
      doc.setFontSize(9);
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-MZ')} | Total: ${deliveries.length} encomendas`, 14, 21);
      
      const tableData = deliveries.map(d => {
        return [
          d.po_number || 'N/A',
          d.invoice_number || '-',
          d.supplier_name,
          new Date(d.expected_date).toLocaleDateString('pt-MZ'),
          d.status === 'pending' ? 'Pendente' : d.status === 'received' ? 'Recebido' : d.status === 'concluded' ? 'Concluído' : 'Divergência',
          d.total_expected_qty || 0,
          d.total_received_qty || 0,
          `${(d.total_cost_mt || 0).toFixed(2)} MT`
        ];
      });
      
      autoTable(doc, {
        startY: 25,
        head: [['PO / Nº Ref', 'Fatura', 'Fornecedor', 'Data Prevista', 'Estado', 'Qtd Esperada', 'Qtd Recebida', 'Custo Total']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [79, 70, 229] }
      });
      
      doc.save(`encomendas_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Relatório PDF exportado com sucesso!');
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('Erro ao exportar PDF.');
    }
  };

  const exportCSV = () => {
    try {
      if (deliveries.length === 0) {
        toast.error('Nenhuma encomenda para exportar.');
        return;
      }
      
      const headers = [
        'ID',
        'PO / Numero',
        'Fatura',
        'Fornecedor',
        'Data Prevista',
        'Estado',
        'Qtd Esperada',
        'Qtd Recebida',
        'Custo Total (MZN)',
        'Data de Criacao'
      ];

      const csvLines = [headers.join(';')];
      for (const d of deliveries) {
        const line = [
          d.id,
          d.po_number || '',
          d.invoice_number || '',
          `"${(d.supplier_name || '').replace(/"/g, '""')}"`,
          d.expected_date ? new Date(d.expected_date).toISOString().split('T')[0] : '',
          d.status,
          d.total_expected_qty || 0,
          d.total_received_qty || 0,
          d.total_cost_mt || 0,
          d.created_at ? new Date(d.created_at).toISOString().split('T')[0] : ''
        ].join(';');
        csvLines.push(line);
      }

      const csvContent = csvLines.join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `encomendas_${new Date().toISOString().split('T')[0]}.csv`);
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Ficheiro CSV exportado com sucesso!');
    } catch (err) {
      console.error('CSV export error:', err);
      toast.error('Erro ao exportar CSV.');
    }
  };

  const downloadTemplate = () => {
    const headers = [
      'Fornecedor',
      'Data_Prevista_YYYY_MM_DD',
      'Fatura_Opcional',
      'Produto_Nome',
      'Codigo_Barras',
      'Quantidade_Esperada',
      'Custo_Unitario'
    ];
    
    const sampleRows = [
      ['Fornecedor Exemplo Lda', '2023-12-31', 'INV-001', 'Arroz 5kg', '2345678901234', '100', '450.50'],
      ['Fornecedor Exemplo Lda', '2023-12-31', 'INV-001', 'Feijao 1kg', '8765432109876', '50', '80.00']
    ];

    const csvContent = [
      headers.join(';'),
      ...sampleRows.map(row => row.join(';'))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'modelo_importacao_encomendas.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Modelo de importação CSV baixado.');
  };

  const importCSV = () => {
    toast.error('Importação em lote de encomendas estará disponível na próxima atualização.');
  };

  return { exportPDF, exportCSV, importCSV, downloadTemplate };
}
