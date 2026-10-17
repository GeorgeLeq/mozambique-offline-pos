import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Coins, Globe, Receipt, ShieldCheck, Database, Terminal, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getDB } from '../../lib/db';
import toast from 'react-hot-toast';
import { AmbientBackground } from '../AmbientBackground';
import { useAuth } from '../../contexts/AuthContext';
import { syncAllToCloud } from '../../lib/syncEngine';
import { sanitizeString, sanitizeNumeric } from '../../lib/security/sanitizer';
import { InternetStatusBadge } from '../InternetStatusBadge';
import { SyncStatusBadge } from '../SyncStatusBadge';
import { FullscreenButton } from '../FullscreenButton';
import { useSettingsI18n } from '../../i18n';

// Import sub-tabs and dev modal
import FinanceTab from './FinanceTab';
import LocalizationTab from './LocalizationTab';
import ReceiptTab from './ReceiptTab';
import DeviceTab from './DeviceTab';
import SyncTab from './SyncTab';
import DevSyncDiagnosticsModal from './DevSyncDiagnosticsModal';
import SettingsInfoModal, { InfoModalContent } from './SettingsInfoModal';

type SettingsTab = 'finance' | 'localization' | 'receipt' | 'sync' | 'device';

export default function Settings({ onBack }: { onBack: () => void }) {
  const t = useSettingsI18n();
  const { deactivateDevice } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('finance');
  const [isSaving, setIsSaving] = useState(false);
  const [shopId, setShopId] = useState('N/A');
  const [deviceId, setDeviceId] = useState('N/A');

  // Info Modal State
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [currentInfoContent, setCurrentInfoContent] = useState<InfoModalContent | null>(null);

  // Secret Dev Diagnostic Console state & trigger
  const [isDevDiagnosticsOpen, setIsDevDiagnosticsOpen] = useState(false);
  const [secretClickCount, setSecretClickCount] = useState(0);

  // Financial States
  const [baseCash, setBaseCash] = useState('10000');
  const [openingCashMode, setOpeningCashMode] = useState<'admin' | 'cashier'>('admin');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [taxRate, setTaxRate] = useState('16');
  const [allowNegativeStock, setAllowNegativeStock] = useState(false);
  const [blindStockMode, setBlindStockMode] = useState(false);
  const [discountPresets, setDiscountPresets] = useState('5%,10%,15%,-50,-100');
  const [maxDiscountCap, setMaxDiscountCap] = useState('20');

  // Localization States
  const [currencySymbol, setCurrencySymbol] = useState('MT');
  const [currencyDecimals, setCurrencyDecimals] = useState('2');
  const [currencyDecimalSeparator, setCurrencyDecimalSeparator] = useState(',');
  const [localeLang, setLocaleLang] = useState('pt');

  // Receipt Branding States
  const [receiptHeaderTitle, setReceiptHeaderTitle] = useState('');
  const [receiptHeaderAddress, setReceiptHeaderAddress] = useState('');
  const [receiptHeaderPhone, setReceiptHeaderPhone] = useState('');
  const [receiptHeaderNuit, setReceiptHeaderNuit] = useState('');
  const [receiptFooterMsg, setReceiptFooterMsg] = useState('Obrigado pela sua preferência!');
  const [receiptShowBarcode, setReceiptShowBarcode] = useState(true);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

  // Printer & Operations Auth States
  const [printerAutoPrint, setPrinterAutoPrint] = useState(true);
  const [printerPaperWidth, setPrinterPaperWidth] = useState('80mm');
  const [printerConnection, setPrinterConnection] = useState('system');
  const [printerNetworkIp, setPrinterNetworkIp] = useState('');
  const [printerCopies, setPrinterCopies] = useState('1');
  const [authorizationMode, setAuthorizationMode] = useState('remote_with_code');

  // Info Content Directory for each Tab
  const infoDictionary: Record<SettingsTab, InfoModalContent> = {
    finance: {
      title: t.guideFinanceTitle || 'Guia: Operações de Caixa & Parâmetros Financeiros',
      subtitle: t.guideFinanceSubtitle || 'Entenda o funcionamento do fundo de gaveta, IVA e limites de desconto',
      badge: t.guideFinanceBadge || 'Finanças & Caixa',
      sections: [
        {
          heading: t.openingCashModeLabel || 'Fundo de Caixa & Modos de Abertura',
          description: t.openingCashAdminDesc || 'O fundo de caixa é a quantia em numerário colocada na gaveta no início de cada turno para fornecer troco aos clientes.',
          tips: [
            t.defaultBaseCashLabel || 'Recomendado: 5.000 MT a 10.000 MT em notas pequenas para troco.',
          ],
        },
        {
          heading: t.taxRateLabel || 'Taxa de IVA Padrão (16%)',
          description: t.taxRateLabel || 'A taxa de imposto sobre o valor acrescentado é calculada automaticamente em todas as transações fiscais.',
        },
      ],
    },
    localization: {
      title: t.guideLocTitle || 'Guia: Localização, Moeda & Formatação Regional',
      subtitle: t.guideLocSubtitle || 'Configuração de moedas, decimais e idiomas para suporte regional',
      badge: t.guideLocBadge || 'Moeda & Idioma',
      sections: [
        {
          heading: t.currencySymbolLabel || 'Símbolo da Moeda',
          description: t.currencySymbolHelp || 'Define a sigla monetária que acompanha os preços em todos os ecrãs de venda, recibos e relatórios.',
        },
      ],
    },
    receipt: {
      title: t.guideReceiptTitle || 'Guia: Impressão Térmica ESC/POS & Dados do Recibo',
      subtitle: t.guideReceiptSubtitle || 'Como estruturar recibos fiscais com NUIT e dados da loja',
      badge: t.guideReceiptBadge || 'Impressão & Recibos',
      sections: [
        {
          heading: t.printerPaperWidthLabel || 'Largura do Papel (80mm vs 58mm)',
          description: t.printerAutoPrintLabel || 'O formato de 80mm é o padrão de balcão comercial, permitindo colunas completas.',
        },
      ],
    },
    sync: {
      title: t.guideSyncTitle || 'Guia: Arquitetura Offline-First & Segurança de Dados',
      subtitle: t.guideSyncSubtitle || 'Como o POS protege as suas vendas sem depender de conexão contínua',
      badge: t.guideSyncBadge || 'Segurança & Sincronia',
      sections: [
        {
          heading: t.cloudSyncStatusLabel || 'Como Funciona o Offline-First?',
          description: t.sqliteDbDetailsTitle || 'Todas as operações de caixa e vendas são gravadas primeiramente no disco local da sua máquina numa base de dados SQLite ultrarrápida.',
        },
      ],
    },
    device: {
      title: t.guideDeviceTitle || 'Guia: Políticas de Devolução & Gestão do Terminal',
      subtitle: t.guideDeviceSubtitle || 'Configuração de impressoras térmicas ESC/POS e níveis de autorização',
      badge: t.guideDeviceBadge || 'Terminal & Políticas',
      sections: [
        {
          heading: t.authModeLabel || 'Políticas e Prazos de Reembolso',
          description: t.deactivateModalDesc || 'Permite limitar até quantos dias após a emissão do recibo uma devolução pode ser aceita.',
        },
      ],
    },
  };

  const handleOpenInfoModal = (tab: SettingsTab) => {
    setCurrentInfoContent(infoDictionary[tab]);
    setIsInfoModalOpen(true);
  };

  // Secret developer keyboard listener (Ctrl + Alt + Shift + D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        setIsDevDiagnosticsOpen(prev => !prev);
        toast('Painel Técnico de Desenvolvedor Ativado', {
          icon: '🛠️',
          duration: 3000,
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSecretBadgeClick = () => {
    setSecretClickCount(prev => {
      const next = prev + 1;
      if (next >= 5) {
        setIsDevDiagnosticsOpen(true);
        toast('Painel Técnico de Desenvolvedor Ativado', {
          icon: '🛠️',
          duration: 3000,
        });
        return 0;
      }
      return next;
    });
  };

  const loadSettings = async () => {
    try {
      const db = await getDB();
      const settings = await db.select('SELECT key, value FROM settings');
      const settingsMap = settings.reduce((acc: any, row: any) => {
        acc[row.key] = row.value;
        return acc;
      }, {});

      if (settingsMap['base_cash']) setBaseCash(settingsMap['base_cash']);
      if (settingsMap['opening_cash_mode']) {
        setOpeningCashMode(settingsMap['opening_cash_mode'] as 'admin' | 'cashier');
      }
      if (settingsMap['low_stock_threshold']) setLowStockThreshold(settingsMap['low_stock_threshold']);
      if (settingsMap['tax_rate']) setTaxRate(settingsMap['tax_rate']);
      if (settingsMap['allow_negative_stock']) {
        setAllowNegativeStock(settingsMap['allow_negative_stock'] === '1');
      }
      if (settingsMap['blind_stock_mode']) {
        setBlindStockMode(settingsMap['blind_stock_mode'] === 'true');
      }
      if (settingsMap['discount_presets']) setDiscountPresets(settingsMap['discount_presets']);
      if (settingsMap['max_discount_cap']) setMaxDiscountCap(settingsMap['max_discount_cap']);
      
      if (settingsMap['currency_symbol']) setCurrencySymbol(settingsMap['currency_symbol']);
      if (settingsMap['currency_decimals']) setCurrencyDecimals(settingsMap['currency_decimals']);
      if (settingsMap['currency_decimal_separator']) setCurrencyDecimalSeparator(settingsMap['currency_decimal_separator']);
      if (settingsMap['locale_lang']) {
        setLocaleLang(settingsMap['locale_lang']);
        localStorage.setItem('locale_lang', settingsMap['locale_lang']);
      }
      
      if (settingsMap['receipt_header_title'] !== undefined) setReceiptHeaderTitle(settingsMap['receipt_header_title']);
      if (settingsMap['receipt_header_address'] !== undefined) setReceiptHeaderAddress(settingsMap['receipt_header_address']);
      if (settingsMap['receipt_header_phone'] !== undefined) setReceiptHeaderPhone(settingsMap['receipt_header_phone']);
      if (settingsMap['receipt_header_nuit'] !== undefined) setReceiptHeaderNuit(settingsMap['receipt_header_nuit']);
      if (settingsMap['receipt_footer_msg']) setReceiptFooterMsg(settingsMap['receipt_footer_msg']);
      if (settingsMap['receipt_show_barcode'] !== undefined) {
        setReceiptShowBarcode(settingsMap['receipt_show_barcode'] !== 'false');
      }
      if (settingsMap['printer_auto_print'] !== undefined) {
        setPrinterAutoPrint(settingsMap['printer_auto_print'] === 'true');
      }
      if (settingsMap['printer_paper_width']) {
        setPrinterPaperWidth(settingsMap['printer_paper_width']);
      }
      if (settingsMap['printer_connection']) {
        setPrinterConnection(settingsMap['printer_connection']);
      }
      if (settingsMap['printer_network_ip'] !== undefined) {
        setPrinterNetworkIp(settingsMap['printer_network_ip']);
      }
      if (settingsMap['printer_copies']) {
        setPrinterCopies(settingsMap['printer_copies']);
      }
      if (settingsMap['authorization_mode']) {
        setAuthorizationMode(settingsMap['authorization_mode']);
      }
      if (settingsMap['shop_id']) setShopId(settingsMap['shop_id']);
      if (settingsMap['device_id']) setDeviceId(settingsMap['device_id']);
    } catch (error) {
      console.error('Failed to load settings', error);
      toast.error('Erro ao carregar as configurações locais');
    }
  };

  const saveSettings = async () => {
    if (!baseCash || isNaN(parseFloat(baseCash))) {
      toast.error('Valor de fundo de caixa inválido');
      return;
    }

    if (!lowStockThreshold || isNaN(parseFloat(lowStockThreshold))) {
      toast.error('Limite de alerta de stock inválido');
      return;
    }

    if (taxRate === '' || isNaN(parseFloat(taxRate)) || parseFloat(taxRate) < 0 || parseFloat(taxRate) > 100) {
      toast.error('Taxa de IVA inválida (deve estar entre 0% e 100%)');
      return;
    }

    if (!maxDiscountCap || isNaN(parseFloat(maxDiscountCap)) || parseFloat(maxDiscountCap) <= 0) {
      toast.error('O limite máximo de desconto deve ser um número positivo.');
      return;
    }

    setIsSaving(true);
    try {
      const db = await getDB();
      
      const keysToSave = [
        { key: 'base_cash', value: sanitizeNumeric(baseCash, 10000).toString() },
        { key: 'opening_cash_mode', value: sanitizeString(openingCashMode) },
        { key: 'low_stock_threshold', value: sanitizeNumeric(lowStockThreshold, 5).toString() },
        { key: 'tax_rate', value: sanitizeNumeric(taxRate, 16).toString() },
        { key: 'currency_symbol', value: sanitizeString(currencySymbol) },
        { key: 'currency_decimals', value: sanitizeString(currencyDecimals) },
        { key: 'currency_decimal_separator', value: sanitizeString(currencyDecimalSeparator) },
        { key: 'locale_lang', value: sanitizeString(localeLang) },
        { key: 'receipt_header_title', value: sanitizeString(receiptHeaderTitle) },
        { key: 'receipt_header_address', value: sanitizeString(receiptHeaderAddress) },
        { key: 'receipt_header_phone', value: sanitizeString(receiptHeaderPhone) },
        { key: 'receipt_header_nuit', value: sanitizeString(receiptHeaderNuit) },
        { key: 'receipt_footer_msg', value: sanitizeString(receiptFooterMsg) },
        { key: 'receipt_show_barcode', value: receiptShowBarcode.toString() },
        { key: 'allow_negative_stock', value: allowNegativeStock ? '1' : '0' },
        { key: 'blind_stock_mode', value: blindStockMode.toString() },
        { key: 'discount_presets', value: sanitizeString(discountPresets) },
        { key: 'max_discount_cap', value: sanitizeNumeric(maxDiscountCap, 20).toString() },
        { key: 'printer_auto_print', value: printerAutoPrint.toString() },
        { key: 'printer_paper_width', value: sanitizeString(printerPaperWidth) },
        { key: 'printer_connection', value: sanitizeString(printerConnection) },
        { key: 'printer_network_ip', value: sanitizeString(printerNetworkIp) },
        { key: 'printer_copies', value: sanitizeString(printerCopies) },
        { key: 'authorization_mode', value: sanitizeString(authorizationMode) }
      ];

      for (const item of keysToSave) {
        const existing = await db.select('SELECT key FROM settings WHERE key = ?', [item.key]);
        if (existing.length > 0) {
          await db.execute('UPDATE settings SET value = ?, sync_status = 0 WHERE key = ?', [item.value, item.key]);
        } else {
          await db.execute('INSERT INTO settings (key, value, sync_status) VALUES (?, ?, 0)', [item.key, item.value]);
        }
        localStorage.setItem(item.key, item.value);
      }

      window.dispatchEvent(new Event('locale-changed'));

      toast.success(t.settingsSavedToast || 'Definições gravadas com sucesso!');
      syncAllToCloud();
    } catch (error) {
      console.error('Failed to save settings', error);
      toast.error(t.settingsSaveErrorToast || 'Erro ao gravar definições.');
    } finally {
      setIsSaving(false);
    }
  };

  const tabList: { id: SettingsTab; label: string; icon: any }[] = [
    { id: 'finance', label: t.tabFinance || 'Finanças & Caixa', icon: Coins },
    { id: 'localization', label: t.tabLocalization || 'Localização & Moeda', icon: Globe },
    { id: 'receipt', label: t.tabReceipt || 'Recibo & Impressão', icon: Receipt },
    { id: 'sync', label: t.tabSync || 'Nuvem & Diagnóstico', icon: Database },
    { id: 'device', label: t.tabDevice || 'Dispositivo & Operações', icon: ShieldCheck },
  ];

  return (
    <div className="h-screen overflow-hidden flex flex-col p-4 md:p-6 font-sans select-none transition-colors duration-500 relative bg-slate-50 dark:bg-zinc-950">
      <AmbientBackground />

      {/* Top Fixed Header Row - Extended to 85% Screen Width */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between w-full max-w-[85vw] mx-auto relative z-10 mb-4 shrink-0"
      >
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850 shadow-xs transition-all text-slate-700 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
            title={t.backToPanel || 'Voltar ao Painel'}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-zinc-100">
                {t.title || 'Definições do Sistema'}
              </h1>
              {/* Info Guide Button next to Title */}
              <button
                onClick={() => handleOpenInfoModal(activeTab)}
                className="px-2.5 py-1.5 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 hover:bg-indigo-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all flex items-center gap-1.5 text-xs font-bold shadow-xs cursor-pointer"
                title={t.guideTooltip || 'Guia & Instruções'}
              >
                <HelpCircle size={15} className="text-indigo-500" />
                <span className="hidden sm:inline">{t.guideTooltip || 'Guia Explicativo'}</span>
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-300 font-medium mt-0.5">
              {t.subtitle || 'Configure os parâmetros financeiros, impressoras, recibos e sincronização'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Iconic Internet Connection Status Badge */}
          <InternetStatusBadge />

          {/* Sync Status Badge Indicator */}
          <SyncStatusBadge />

          {/* Fullscreen F11 Mode Button */}
          <FullscreenButton />

          <button
            onClick={saveSettings}
            disabled={isSaving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-indigo-600/20 active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <Save size={16} />
            <span>{isSaving ? (t.savingSettings || 'A Gravar...') : (t.saveSettings || 'Gravar Definições')}</span>
          </button>
        </div>
      </motion.div>

      {/* Settings Central Hub Grid - 85% Screen Width - Zero Scroll */}
      <div className="w-full max-w-[85vw] mx-auto flex-1 flex flex-col lg:flex-row gap-5 relative z-10 overflow-hidden min-h-0">
        {/* Left Navigation Rail (Wider lg:w-64) */}
        <motion.div 
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:w-64 shrink-0 flex flex-row lg:flex-col justify-between gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0"
        >
          <div className="flex flex-row lg:flex-col gap-2 w-full">
            {tabList.map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all whitespace-nowrap text-xs border cursor-pointer ${
                    isSelected 
                      ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-zinc-800 shadow-sm' 
                      : 'text-slate-600 dark:text-zinc-400 border-transparent hover:bg-white/60 dark:hover:bg-zinc-900/50 hover:text-slate-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <Icon size={18} className={isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Discreet Developer Diagnostic Badge */}
          <div className="hidden lg:block pt-3 border-t border-slate-200/80 dark:border-zinc-800/80">
            <button
              onClick={handleSecretBadgeClick}
              className="w-full text-left p-2.5 rounded-xl text-xs font-mono text-slate-500 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300 transition-colors cursor-pointer select-none bg-slate-100/50 dark:bg-zinc-900/40 border border-slate-200/40 dark:border-zinc-800/40"
              title="Atalho Secreto: Ctrl + Shift + D"
            >
              <div className="flex items-center justify-between font-bold">
                <span>POS v2.4.0</span>
                <Terminal size={12} className="opacity-70 text-indigo-500" />
              </div>
              <div className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">Build Local 2026.09 (MZ)</div>
            </button>
          </div>
        </motion.div>

        {/* Right Main Content Card - Zero Scroll Full Height */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl shadow-sm border border-slate-200/80 dark:border-zinc-800 overflow-hidden p-5 md:p-6 flex flex-col justify-between"
        >
          <AnimatePresence mode="wait">
            {activeTab === 'finance' && (
              <FinanceTab
                baseCash={baseCash}
                setBaseCash={setBaseCash}
                openingCashMode={openingCashMode}
                setOpeningCashMode={setOpeningCashMode}
                lowStockThreshold={lowStockThreshold}
                setLowStockThreshold={setLowStockThreshold}
                taxRate={taxRate}
                setTaxRate={setTaxRate}
                allowNegativeStock={allowNegativeStock}
                setAllowNegativeStock={setAllowNegativeStock}
                blindStockMode={blindStockMode}
                setBlindStockMode={setBlindStockMode}
                discountPresets={discountPresets}
                setDiscountPresets={setDiscountPresets}
                maxDiscountCap={maxDiscountCap}
                setMaxDiscountCap={setMaxDiscountCap}
                onOpenInfo={() => handleOpenInfoModal('finance')}
              />
            )}

            {activeTab === 'localization' && (
              <LocalizationTab
                currencySymbol={currencySymbol}
                setCurrencySymbol={setCurrencySymbol}
                currencyDecimals={currencyDecimals}
                setCurrencyDecimals={setCurrencyDecimals}
                currencyDecimalSeparator={currencyDecimalSeparator}
                setCurrencyDecimalSeparator={setCurrencyDecimalSeparator}
                localeLang={localeLang}
                setLocaleLang={setLocaleLang}
                onOpenInfo={() => handleOpenInfoModal('localization')}
              />
            )}

            {activeTab === 'receipt' && (
              <ReceiptTab
                receiptHeaderTitle={receiptHeaderTitle}
                setReceiptHeaderTitle={setReceiptHeaderTitle}
                receiptHeaderAddress={receiptHeaderAddress}
                setReceiptHeaderAddress={setReceiptHeaderAddress}
                receiptHeaderPhone={receiptHeaderPhone}
                setReceiptHeaderPhone={setReceiptHeaderPhone}
                receiptHeaderNuit={receiptHeaderNuit}
                setReceiptHeaderNuit={setReceiptHeaderNuit}
                receiptFooterMsg={receiptFooterMsg}
                setReceiptFooterMsg={setReceiptFooterMsg}
                receiptShowBarcode={receiptShowBarcode}
                setReceiptShowBarcode={setReceiptShowBarcode}
                printerAutoPrint={printerAutoPrint}
                setPrinterAutoPrint={setPrinterAutoPrint}
                printerPaperWidth={printerPaperWidth}
                setPrinterPaperWidth={setPrinterPaperWidth}
                printerConnection={printerConnection}
                setPrinterConnection={setPrinterConnection}
                printerNetworkIp={printerNetworkIp}
                setPrinterNetworkIp={setPrinterNetworkIp}
                printerCopies={printerCopies}
                setPrinterCopies={setPrinterCopies}
                onOpenInfo={() => handleOpenInfoModal('receipt')}
              />
            )}

            {activeTab === 'sync' && (
              <SyncTab 
                onOpenDevDiagnostics={() => setIsDevDiagnosticsOpen(true)}
                onOpenInfo={() => handleOpenInfoModal('sync')}
              />
            )}

            {activeTab === 'device' && (
              <DeviceTab
                shopId={shopId}
                deviceId={deviceId}
                showDeactivateConfirm={showDeactivateConfirm}
                setShowDeactivateConfirm={setShowDeactivateConfirm}
                deactivateDevice={deactivateDevice}
                onOpenInfo={() => handleOpenInfoModal('device')}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Info Modals for Settings Tabs */}
      <SettingsInfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        content={currentInfoContent}
      />

      {/* Secret Dev Diagnostics & Queue Inspector Modal */}
      <DevSyncDiagnosticsModal
        isOpen={isDevDiagnosticsOpen}
        onClose={() => setIsDevDiagnosticsOpen(false)}
        shopId={shopId}
        deviceId={deviceId}
      />
    </div>
  );
}
