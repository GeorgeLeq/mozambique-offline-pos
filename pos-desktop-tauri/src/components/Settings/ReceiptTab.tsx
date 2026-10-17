import React from 'react';
import { motion } from 'motion/react';
import { 
  Printer, Receipt, FileText, CheckCircle2, Eye, 
  HelpCircle, Settings2, Sliders, Smartphone
} from 'lucide-react';
import { useSettingsI18n } from '../../i18n';

interface ReceiptTabProps {
  receiptHeaderTitle: string;
  setReceiptHeaderTitle: (val: string) => void;
  receiptHeaderAddress: string;
  setReceiptHeaderAddress: (val: string) => void;
  receiptHeaderPhone: string;
  setReceiptHeaderPhone: (val: string) => void;
  receiptHeaderNuit: string;
  setReceiptHeaderNuit: (val: string) => void;
  receiptFooterMsg: string;
  setReceiptFooterMsg: (val: string) => void;
  receiptShowBarcode: boolean;
  setReceiptShowBarcode: (val: boolean) => void;

  // Printer Settings
  printerAutoPrint: boolean;
  setPrinterAutoPrint: (val: boolean) => void;
  printerPaperWidth: string;
  setPrinterPaperWidth: (val: string) => void;
  printerConnection: string;
  setPrinterConnection: (val: string) => void;
  printerNetworkIp: string;
  setPrinterNetworkIp: (val: string) => void;
  printerCopies: string;
  setPrinterCopies: (val: string) => void;
  onOpenInfo?: () => void;
}

export default function ReceiptTab({
  receiptHeaderTitle,
  setReceiptHeaderTitle,
  receiptHeaderAddress,
  setReceiptHeaderAddress,
  receiptHeaderPhone,
  setReceiptHeaderPhone,
  receiptHeaderNuit,
  setReceiptHeaderNuit,
  receiptFooterMsg,
  setReceiptFooterMsg,
  receiptShowBarcode,
  setReceiptShowBarcode,

  printerAutoPrint,
  setPrinterAutoPrint,
  printerPaperWidth,
  setPrinterPaperWidth,
  printerConnection,
  setPrinterConnection,
  printerNetworkIp,
  setPrinterNetworkIp,
  printerCopies,
  setPrinterCopies,
  onOpenInfo,
}: ReceiptTabProps) {
  const t = useSettingsI18n();

  // Sample template receipt values for live accurate preview
  const currentDate = new Date().toLocaleDateString('pt-MZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const currentTime = new Date().toLocaleTimeString('pt-MZ', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const sampleItems = [
    { name: 'Arroz Dona Ana 5Kg', qty: 2, price: 340.0, total: 680.0 },
    { name: 'Óleo Vegetal Sol 1L', qty: 3, price: 110.0, total: 330.0 },
    { name: 'Leite Condensado 395g', qty: 1, price: 95.0, total: 95.0 },
    { name: 'Sabão em Barra 1Kg', qty: 2, price: 75.0, total: 150.0 },
  ];

  const subtotal = sampleItems.reduce((acc, item) => acc + item.total, 0);
  const ivaAmount = subtotal * 0.16;
  const grandTotal = subtotal;

  const is58mm = printerPaperWidth === '58mm';

  return (
    <motion.div
      key="receipt"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="h-full flex flex-col justify-between space-y-4"
    >
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between pb-2 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2.5">
            <Printer size={22} className="text-indigo-600 dark:text-indigo-400" />
            {t.printerTitle || 'Impressão Térmica & Modelo do Recibo'}
          </h2>
          <p className="text-xs text-slate-600 dark:text-zinc-300 font-medium mt-0.5">
            {t.printerSubtitle || 'Personalize os dados da sua empresa no cabeçalho fiscal, conectividade de impressão e confira o recibo ao vivo.'}
          </p>
        </div>

        {onOpenInfo && (
          <button
            onClick={onOpenInfo}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200 dark:border-zinc-700"
          >
            <HelpCircle size={15} className="text-indigo-500" />
            <span>{t.helpGuide || 'Guia de Ajuda'}</span>
          </button>
        )}
      </div>

      {/* 3-Column Layout: Form Col 1 (Printer) + Form Col 2 (Branding) + Receipt Preview Col 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0">
        {/* Col 1: Impressora Térmica (4 Cols) */}
        <div className="lg:col-span-4 space-y-4 flex flex-col justify-between">
          <div className="p-4 bg-slate-50/80 dark:bg-zinc-950/40 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-3.5 flex-1 flex flex-col justify-between">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200/80 dark:border-zinc-800/80">
              <Sliders size={16} className="text-indigo-500" />
              <h3 className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
                {t.printerSettings || 'Configurações da Impressora'}
              </h3>
            </div>

            {/* Auto Print Toggle */}
            <div className="p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl flex items-center justify-between shadow-xs">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 block">
                  {t.printerAutoPrintLabel || 'Impressão Automática no Checkout'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium block mt-0.5">
                  {t.printerAutoPrintHelp || 'Imprime sem abrir janela de confirmação'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPrinterAutoPrint(!printerAutoPrint)}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                  printerAutoPrint ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-zinc-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform shadow-xs ${
                  printerAutoPrint ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Largura & Vias */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  {t.printerPaperWidthLabel || 'Largura do Papel'}
                </label>
                <select
                  value={printerPaperWidth}
                  onChange={(e) => setPrinterPaperWidth(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 text-xs font-bold outline-none cursor-pointer"
                >
                  <option value="80mm">{t.paperWidth80mm || '80mm (Padrão Balcão)'}</option>
                  <option value="58mm">{t.paperWidth58mm || '58mm (Térmica Portátil)'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  {t.printerCopiesLabel || 'Vias de Impressão'}
                </label>
                <select
                  value={printerCopies}
                  onChange={(e) => setPrinterCopies(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 text-xs font-bold outline-none cursor-pointer"
                >
                  <option value="1">{t.copies1 || '1 Via (Cliente)'}</option>
                  <option value="2">{t.copies2 || '2 Vias (Cliente + Caixa)'}</option>
                  <option value="3">{t.copies3 || '3 Vias'}</option>
                </select>
              </div>
            </div>

            {/* Interface de Conexão */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                {t.printerConnectionLabel || 'Tipo de Conexão com a Impressora'}
              </label>
              <select
                value={printerConnection}
                onChange={(e) => setPrinterConnection(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 text-xs font-bold outline-none cursor-pointer"
              >
                <option value="system">{t.connectionSystem || 'Diálogo do Sistema (Driver do Sistema)'}</option>
                <option value="network">{t.connectionNetwork || 'Rede Local (Ethernet / IP Wi-Fi)'}</option>
                <option value="usb">{t.connectionUsb || 'Ligação Direta USB / Porta Serial'}</option>
              </select>
            </div>

            {printerConnection === 'network' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  {t.printerNetworkIpLabel || 'Endereço IP da Impressora'}
                </label>
                <input
                  type="text"
                  value={printerNetworkIp}
                  onChange={(e) => setPrinterNetworkIp(e.target.value)}
                  placeholder="Ex: 192.168.1.200"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 text-xs font-mono font-bold"
                />
              </div>
            )}

            {/* Barcode toggle */}
            <div className="p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl flex items-center justify-between shadow-xs">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 block">
                  {t.receiptShowBarcodeLabel || 'Código de Barras no Recibo'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium block mt-0.5">
                  {t.receiptShowBarcodeHelp || 'Código CODE128 para devoluções rápidas'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setReceiptShowBarcode(!receiptShowBarcode)}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                  receiptShowBarcode ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-zinc-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform shadow-xs ${
                  receiptShowBarcode ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Col 2: Branding & Cabeçalho (4 Cols) */}
        <div className="lg:col-span-4 space-y-4 flex flex-col justify-between">
          <div className="p-4 bg-slate-50/80 dark:bg-zinc-950/40 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-3 flex-1 flex flex-col justify-between">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200/80 dark:border-zinc-800/80">
              <Receipt size={16} className="text-indigo-500" />
              <h3 className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
                {t.storeBrandingTitle || 'Dados Fiscais & Branding da Loja'}
              </h3>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                {t.receiptHeaderTitleLabel || 'Nome Comercial da Loja'}
              </label>
              <input
                type="text"
                value={receiptHeaderTitle}
                onChange={(e) => setReceiptHeaderTitle(e.target.value)}
                placeholder="Ex: MINIPREÇO SUPERMERCADO"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 text-xs font-extrabold outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 block">
                {t.receiptHeaderTitleHelp || 'Nome exibido no topo centralizado do talão'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  {t.receiptHeaderNuitLabel || 'NUIT Fiscal'}
                </label>
                <input
                  type="text"
                  value={receiptHeaderNuit}
                  onChange={(e) => setReceiptHeaderNuit(e.target.value)}
                  placeholder="Ex: 400123456"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 text-xs font-mono font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  {t.receiptHeaderPhoneLabel || 'Contacto / Celular'}
                </label>
                <input
                  type="text"
                  value={receiptHeaderPhone}
                  onChange={(e) => setReceiptHeaderPhone(e.target.value)}
                  placeholder="Ex: +258 84 123 4567"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 text-xs font-bold outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                {t.receiptHeaderAddressLabel || 'Endereço Físico do Estabelecimento'}
              </label>
              <input
                type="text"
                value={receiptHeaderAddress}
                onChange={(e) => setReceiptHeaderAddress(e.target.value)}
                placeholder="Ex: Av. Eduardo Mondlane nº 1234, Maputo"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 text-xs font-medium outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                {t.receiptFooterMsgLabel || 'Mensagem de Agradecimento (Rodapé)'}
              </label>
              <input
                type="text"
                value={receiptFooterMsg}
                onChange={(e) => setReceiptFooterMsg(e.target.value)}
                placeholder="Ex: Obrigado pela sua preferência! Volte Sempre."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 text-xs font-medium outline-none"
              />
            </div>
          </div>
        </div>

        {/* Col 3: Live Template Receipt Preview (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col h-full overflow-hidden">
          <div className="p-3 bg-slate-100 dark:bg-zinc-950/80 rounded-2xl border border-slate-200 dark:border-zinc-800 flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-zinc-800/80 shrink-0">
              <div className="flex items-center gap-2">
                <Eye size={15} className="text-indigo-500" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200">
                  {t.previewTitle || 'Pré-visualização do Talão'} ({printerPaperWidth})
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                {t.realLayoutBadge || 'Layout Real'}
              </span>
            </div>

            {/* Thermal Paper Simulation */}
            <div className="flex-1 overflow-y-auto mt-2 p-4 bg-white text-zinc-900 rounded-xl shadow-inner font-mono text-[11px] leading-relaxed border border-zinc-300 selection:bg-zinc-200">
              {/* Header */}
              <div className="text-center space-y-0.5 border-b border-dashed border-zinc-400 pb-2 mb-2">
                <div className="text-sm font-black uppercase tracking-tight">
                  {receiptHeaderTitle || t.companyNamePlaceholder || 'NOME DA EMPRESA'}
                </div>
                {receiptHeaderAddress && (
                  <div className="text-[10px] text-zinc-600">
                    {receiptHeaderAddress}
                  </div>
                )}
                <div className="text-[10px] text-zinc-600 flex items-center justify-center gap-2">
                  {receiptHeaderNuit && <span>NUIT: {receiptHeaderNuit}</span>}
                  {receiptHeaderPhone && <span>TEL: {receiptHeaderPhone}</span>}
                </div>
                <div className="text-[10px] font-bold text-zinc-800 pt-1">
                  {t.receiptPreviewHeaderTitle || 'TALÃO DE VENDA / RECIBO FISCAL'}
                </div>
              </div>

              {/* Meta info */}
              <div className="text-[10px] text-zinc-600 border-b border-dashed border-zinc-400 pb-1.5 mb-2 space-y-0.5">
                <div className="flex justify-between">
                  <span>{t.dateLabel || 'Data:'} {currentDate}</span>
                  <span>{t.timeLabel || 'Hora:'} {currentTime}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t.ticketLabel || 'Talão Nº:'} #VD-2026-0842</span>
                  <span>{t.operatorLabel || 'Operador:'} Caixa 01</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-1.5 border-b border-dashed border-zinc-400 pb-2 mb-2">
                <div className="flex justify-between font-bold text-[10px] text-zinc-800 border-b border-zinc-300 pb-0.5">
                  <span>{t.itemHeader || 'ITEM'}</span>
                  <span>{t.totalHeader || 'TOTAL'}</span>
                </div>
                {sampleItems.map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="font-bold flex justify-between">
                      <span className="truncate pr-2">{item.name}</span>
                      <span>{item.total.toFixed(2)}</span>
                    </div>
                    <div className="text-[9px] text-zinc-500 pl-1">
                      {item.qty} un x {item.price.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals Breakdown */}
              <div className="space-y-1 text-[11px] border-b border-dashed border-zinc-400 pb-2 mb-2">
                <div className="flex justify-between text-zinc-600">
                  <span>{t.subtotalLabel || 'Subtotal'}:</span>
                  <span>{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>{t.vatLabel || 'IVA (16%)'}:</span>
                  <span>{ivaAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black text-xs text-zinc-950 pt-1 border-t border-zinc-300">
                  <span>{t.totalPayable || 'TOTAL A PAGAR'}:</span>
                  <span>{grandTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-zinc-600 pt-0.5">
                  <span>{t.paymentMethodLabel || 'Forma de Pagamento'}:</span>
                  <span className="font-bold">{t.paymentCash || 'NUMERÁRIO / DINHEIRO'}</span>
                </div>
              </div>

              {/* Barcode & Footer */}
              <div className="text-center space-y-1.5 pt-1">
                {receiptShowBarcode && (
                  <div className="flex flex-col items-center justify-center py-1">
                    <div className="tracking-[4px] font-black text-xs">
                      ||| | |||| || | ||||| ||
                    </div>
                    <span className="text-[9px] text-zinc-500 tracking-wider">VD20260842MZ</span>
                  </div>
                )}
                <div className="text-[10px] italic text-zinc-600">
                  {receiptFooterMsg || t.thankYouDefault || 'Obrigado pela sua preferência!'}
                </div>
                <div className="text-[8px] text-zinc-400 uppercase">
                  POS Offline-First MZ
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
