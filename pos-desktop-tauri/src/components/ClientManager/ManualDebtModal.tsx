import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, UserPlus, BookOpen, Maximize2, Minimize2, Loader2, Search, Plus, Minus, Trash2, MapPin, Package, HelpCircle } from 'lucide-react';
import { DebtRecord } from './types';
import { sanitizeString } from '../../lib/security/sanitizer';
import { getDB } from '../../lib/db';
import { formatCurrency } from '../../lib/utils';
import { useCustomersI18n } from '../../i18n';
import { DebtFormGuideModal } from './DebtFormGuideModal';

interface ManualDebtModalProps {

  isOpen: boolean;
  onClose: () => void;
  onSave: (debt: Partial<DebtRecord>) => Promise<void> | void;
  editDebt: DebtRecord | null;
}

interface ProductItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

interface CatalogProduct {
  id: string;
  name: string;
  barcode?: string;
  price_mt: number;
  stock_quantity: number;
}

export function ManualDebtModal({ isOpen, onClose, onSave, editDebt }: ManualDebtModalProps) {
  const t = useCustomersI18n();
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [address, setAddress] = useState('');
  const [baseAmount, setBaseAmount] = useState('');
  const [includeTax, setIncludeTax] = useState(false);
  const [taxRateInput, setTaxRateInput] = useState('16');
  const [description, setDescription] = useState('');
  const [initialDesc, setInitialDesc] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Product Catalog & Search
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<ProductItem[]>([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // Load default tax rate from local DB settings on mount/open
  useEffect(() => {
    if (isOpen) {
      getDB().then(async (db) => {
        try {
          const res = await db.select("SELECT value FROM settings WHERE key = 'tax_rate'");
          if (res && res.length > 0) {
            setTaxRateInput(res[0].value);
          } else {
            setTaxRateInput('16');
          }
        } catch (e) {
          console.warn('Failed to load tax rate setting', e);
          setTaxRateInput('16');
        }
      });
    }
  }, [isOpen]);

  // Load products on modal open
  useEffect(() => {
    if (isOpen) {
      setIsSaving(false);
      setProductSearchQuery('');
      setShowProductDropdown(false);

      // Fetch products from local DB, excluding locked ones
      getDB().then(async (db) => {
        try {
          const prods: any[] = await db.select(
            'SELECT id, name, barcode, price_mt, stock_quantity FROM products WHERE (is_deleted IS NULL OR is_deleted = 0) AND (requires_verification IS NULL OR requires_verification = 0) ORDER BY name ASC'
          );
          setCatalogProducts(prods || []);
        } catch (e) {
          console.warn('Could not load products for debt search:', e);
        }
      });

      if (editDebt) {
        setCustomerName(editDebt.customer_name);
        setPhoneNumber(editDebt.phone_number || '');
        setAddress(editDebt.address || '');
        setBaseAmount(editDebt.amount_mt.toString());
        setIncludeTax(false);

        let loadedItems: ProductItem[] = [];
        let desc = '';

        if (editDebt.items_json) {
          try {
            let rawJson = editDebt.items_json;
            if (typeof rawJson === 'string' && rawJson.includes('\\"')) {
              rawJson = rawJson.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
            }
            const parsed = JSON.parse(rawJson);
            if (Array.isArray(parsed) && parsed.length > 0) {
              loadedItems = parsed.map((it: any, idx: number) => ({
                id: it.id || `item-${idx}`,
                name: it.name || it.description || 'Produto',
                price: Number(it.price || it.unit_price || 0),
                quantity: Number(it.quantity || 1),
                total: Number(it.total || (Number(it.price || 0) * Number(it.quantity || 1)))
              }));
              desc = loadedItems.map(i => `${i.quantity}x ${i.name}`).join(', ');
            } else if (typeof parsed === 'string') {
              desc = parsed;
            }
          } catch (e) {
            desc = editDebt.items_json;
          }
        }
        setSelectedProducts(loadedItems);
        setDescription(desc);
        setInitialDesc(desc);
      } else {
        setCustomerName('');
        setPhoneNumber('');
        setAddress('');
        setBaseAmount('');
        setIncludeTax(false);
        setDescription('');
        setInitialDesc('');
        setSelectedProducts([]);
      }
    }
  }, [isOpen, editDebt]);

  // Recalculate total amount when selectedProducts change
  useEffect(() => {
    if (selectedProducts.length > 0) {
      const totalSum = selectedProducts.reduce((acc, curr) => acc + (curr.total || 0), 0);
      setBaseAmount(totalSum.toString());
      setDescription(selectedProducts.map(p => `${p.quantity}x ${p.name}`).join(', '));
    }
  }, [selectedProducts]);

  // Filter catalog products for search dropdown
  const filteredCatalogProducts = useMemo(() => {
    if (!productSearchQuery.trim()) return [];
    const query = productSearchQuery.toLowerCase().trim();
    return catalogProducts.filter(
      p =>
        p.name.toLowerCase().includes(query) ||
        (p.barcode && p.barcode.toLowerCase().includes(query))
    ).slice(0, 6);
  }, [catalogProducts, productSearchQuery]);

  const handleSelectCatalogProduct = (prod: CatalogProduct) => {
    setSelectedProducts(prev => {
      const existingIdx = prev.findIndex(p => p.id === prod.id || p.name === prod.name);
      if (existingIdx >= 0) {
        const updated = [...prev];
        const item = updated[existingIdx];
        const newQty = item.quantity + 1;
        updated[existingIdx] = {
          ...item,
          quantity: newQty,
          total: newQty * item.price
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            id: prod.id,
            name: prod.name,
            price: prod.price_mt || 0,
            quantity: 1,
            total: prod.price_mt || 0
          }
        ];
      }
    });
    setProductSearchQuery('');
    setShowProductDropdown(false);
  };

  const handleQuantityChange = (id: string, delta: number) => {
    setSelectedProducts(prev =>
      prev
        .map(item => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              total: newQty * item.price
            };
          }
          return item;
        })
        .filter(Boolean) as ProductItem[]
    );
  };

  const handleRemoveProduct = (id: string) => {
    setSelectedProducts(prev => prev.filter(p => p.id !== id));
  };

  const parsedBaseAmount = parseFloat(baseAmount) || 0;
  const parsedTaxRate = parseFloat(taxRateInput) || 0;
  const taxAmount = includeTax ? parsedBaseAmount * (parsedTaxRate / 100) : 0;
  const finalTotalAmount = parsedBaseAmount + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    const cleanCustomerName = sanitizeString(customerName);
    const cleanPhoneNumber = sanitizeString(phoneNumber);
    const cleanAddress = sanitizeString(address);
    const cleanAmount = finalTotalAmount;
    const cleanDescription = description.trim();

    if (!cleanCustomerName || cleanAmount <= 0) {
      return;
    }

    setIsSaving(true);

    try {
      let itemsJson = editDebt?.items_json || null;

      if (selectedProducts.length > 0) {
        itemsJson = JSON.stringify(selectedProducts);
      } else if (cleanDescription) {
        if (!editDebt || cleanDescription !== initialDesc || !editDebt.items_json) {
          itemsJson = JSON.stringify([
            {
              id: 'manual',
              name: cleanDescription,
              quantity: 1,
              price: cleanAmount,
              total: cleanAmount
            }
          ]);
        }
      } else if (!editDebt) {
        itemsJson = null;
      }

      await onSave({
        id: editDebt?.id,
        customer_name: cleanCustomerName,
        phone_number: cleanPhoneNumber,
        address: cleanAddress,
        amount_mt: cleanAmount,
        items_json: itemsJson
      });
    } catch (err) {
      console.error('[ManualDebtModal] Error during onSave:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div key="manual-debt-modal-container" className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm"
          />

          {/* Slide-over Drawer Panel (Instant Open / No Slide Translation) */}
          <div
            className={`relative ${
              isFullScreen ? 'w-full max-w-full' : 'w-full sm:w-[580px] md:w-[680px] lg:w-[720px]'
            } bg-white dark:bg-zinc-900 border-l border-slate-200 dark:border-zinc-800 shadow-2xl flex flex-col h-full z-10 text-slate-900 dark:text-white transition-all overflow-hidden`}
          >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200/80 dark:border-zinc-800 flex items-center justify-between bg-slate-50/90 dark:bg-zinc-950/80 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <UserPlus size={18} />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-zinc-100 tracking-tight">
                  {editDebt ? (t.editDebtTitle || 'Editar Fiado') : (t.newDebtTitle || 'Registar Novo Fiado')}
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  {t.debtSubtitle || 'Preencha os dados do cliente e os artigos para crédito'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsGuideOpen(true)}
                className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl transition-colors cursor-pointer flex items-center gap-1 font-bold text-xs"
                title={t.formGuideBtn || 'Guia do Formulário'}
              >
                <HelpCircle size={16} />
                <span className="hidden sm:inline">{t.guideBtn || 'Guia'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
                title={isFullScreen ? (t.restoreSidePanel || 'Restaurar Painel Lateral') : (t.expandFullscreen || 'Expandir Ecrã Inteiro')}
              >
                {isFullScreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
                title={t.closeBtn || 'Fechar'}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <DebtFormGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

          {/* Form / Body */}
          <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden justify-between">
            <div className="p-5 text-slate-700 dark:text-zinc-300 space-y-4 overflow-y-auto flex-1">
              
              {/* Row 1: Customer Details (1-Tap Compact Grid) */}
              <div className={`grid ${isFullScreen ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 sm:grid-cols-3'} gap-3 bg-slate-50/80 dark:bg-zinc-950/40 p-3.5 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80`}>
                {/* Customer Name */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
                    {t.customerNameRequired || 'Nome do Cliente *'}
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isSaving}
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600 disabled:opacity-50 shadow-xs"
                    placeholder={t.customerNamePlaceholder || "Ex: João Muchanga"}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
                    {t.contactPhone || 'Contacto / Telefone'}
                  </label>
                  <input
                    type="tel"
                    disabled={isSaving}
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 font-mono focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600 disabled:opacity-50 shadow-xs"
                    placeholder={t.phonePlaceholder || "Ex: 841234567"}
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <MapPin size={11} className="text-indigo-600 dark:text-indigo-400" />
                    <span>{t.addressLabel || 'Endereço / Bairro'}</span>
                  </label>
                  <input
                    type="text"
                    disabled={isSaving}
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600 disabled:opacity-50 shadow-xs"
                    placeholder={t.addressPlaceholder || "Ex: Bairro Central"}
                  />
                </div>
              </div>

              {/* Row 2: Stacked layout in standard side drawer, 2-Grid in Expanded Mode */}
              <div className={`grid ${isFullScreen ? 'grid-cols-1 lg:grid-cols-2 gap-4' : 'grid-cols-1 gap-4'}`}>
                
                {/* Column A: Product Quick Search & Selected */}
                <div className="space-y-3 bg-slate-50/80 dark:bg-zinc-950/60 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-3.5 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                        <Package size={13} />
                        <span>{t.searchStockProducts || 'Pesquisar Produtos do Estoque'}</span>
                      </label>
                      {catalogProducts.length > 0 && (
                        <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-bold">
                          {catalogProducts.length} {t.availableCount || 'disponíveis'}
                        </span>
                      )}
                    </div>

                    {/* Search Bar Input */}
                    <div className="relative">
                      <input
                        type="text"
                        disabled={isSaving}
                        value={productSearchQuery}
                        onFocus={() => setShowProductDropdown(true)}
                        onChange={e => {
                          setProductSearchQuery(e.target.value);
                          setShowProductDropdown(true);
                        }}
                        className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600 shadow-xs"
                        placeholder={t.searchStockPlaceholder || "Nome ou código de barras..."}
                      />
                      <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 pointer-events-none" />

                      {/* Dropdown Results */}
                      {showProductDropdown && filteredCatalogProducts.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-2xl overflow-hidden z-30 max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800">
                          {filteredCatalogProducts.map(prod => (
                            <button
                              key={prod.id}
                              type="button"
                              onClick={() => handleSelectCatalogProduct(prod)}
                              className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center justify-between transition-colors cursor-pointer"
                            >
                              <div>
                                <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">{prod.name}</p>
                                <p className="text-[9px] text-slate-400 dark:text-zinc-500">{t.stockLabel || 'Estoque:'} {prod.stock_quantity ?? 0} un</p>
                              </div>
                              <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                                {formatCurrency(prod.price_mt)}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Selected Products List */}
                    {selectedProducts.length > 0 ? (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
                          {t.selectedArticles || 'Artigos Selecionados'} ({selectedProducts.length})
                        </span>
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {selectedProducts.map((p) => (
                            <div
                              key={p.id}
                              className="bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 flex items-center justify-between text-xs gap-2 shadow-xs"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-800 dark:text-zinc-200 truncate text-[11px]">{p.name}</p>
                                <p className="text-[9px] text-slate-500 dark:text-zinc-400 font-mono">
                                  {formatCurrency(p.price)} x {p.quantity} = <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(p.total)}</strong>
                                </p>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleQuantityChange(p.id, -1)}
                                  className="p-1 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Minus size={10} />
                                </button>
                                <span className="w-5 text-center font-bold text-slate-800 dark:text-zinc-200 font-mono text-[11px]">
                                  {p.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleQuantityChange(p.id, 1)}
                                  className="p-1 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Plus size={10} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveProduct(p.id)}
                                  className="p-1 text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors ml-0.5 cursor-pointer"
                                  title={t.delete || "Remover"}
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      /* Free Text Description Alternative */
                      <div className="pt-1">
                        <label className="block text-[9px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                          {t.orDescribeManually || 'Ou Descreva os Artigos Manualmente'}
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            disabled={isSaving}
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pl-3 pr-8 py-2 text-xs text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600 shadow-xs"
                            placeholder={t.manualDescPlaceholder || "Ex: 2x Sacos de Cimento, 3x Blocos"}
                          />
                          <BookOpen size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>


                {/* Column B: Amounts, Tax and Live Totals */}
                <div className="space-y-3 bg-slate-50/80 dark:bg-zinc-950/40 p-3.5 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 flex flex-col justify-between">
                  <div>
                    {/* Base / Subtotal Amount */}
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
                      {selectedProducts.length > 0 ? (t.itemsSubtotal || 'Subtotal dos Artigos (MT)') : (t.baseAmountRequired || 'Valor Base da Dívida (MT) *')}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        disabled={isSaving || selectedProducts.length > 0}
                        min="0.01"
                        step="0.01"
                        value={baseAmount}
                        onChange={e => setBaseAmount(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pl-3 pr-9 py-2 text-base text-emerald-600 dark:text-emerald-400 font-mono font-black focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600 disabled:opacity-50 shadow-xs"
                        placeholder="0.00"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 font-bold text-xs">MT</span>
                    </div>

                    {/* Tax Config Checkbox & Rate */}
                    <div className="p-3 bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 rounded-xl space-y-2 shadow-xs mt-3">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={includeTax}
                            onChange={e => setIncludeTax(e.target.checked)}
                            className="w-3.5 h-3.5 rounded border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-850 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">{t.includeTax || 'Incluir IVA / Imposto'}</span>
                        </label>

                        {includeTax && (
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500">{t.taxRateLabel || 'TAXA:'}</span>
                            <div className="relative w-14">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={taxRateInput}
                                onChange={e => setTaxRateInput(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-zinc-850 border border-slate-300 dark:border-zinc-700 rounded-lg px-2 py-0.5 text-xs text-slate-800 dark:text-zinc-200 font-mono font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
                              />
                              <span className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 text-[9px] font-bold">%</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {includeTax && (
                        <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-800/60 grid grid-cols-3 gap-1.5 text-center">
                          <div className="bg-slate-50 dark:bg-zinc-950/30 p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800/40">
                            <span className="text-[8px] text-slate-400 dark:text-zinc-500 uppercase font-black block">{t.taxBaseLabel || 'Base'}</span>
                            <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-zinc-300">
                              {formatCurrency(parsedBaseAmount)}
                            </span>
                          </div>
                          <div className="bg-slate-50 dark:bg-zinc-950/30 p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800/40">
                            <span className="text-[8px] text-slate-400 dark:text-zinc-500 uppercase font-black block">{t.taxVatLabel || 'IVA'}</span>
                            <span className="font-mono text-[11px] font-bold text-amber-600 dark:text-amber-400">
                              {formatCurrency(taxAmount)}
                            </span>
                          </div>
                          <div className="bg-slate-50 dark:bg-zinc-950/30 p-1.5 rounded-lg border border-indigo-200 dark:border-indigo-950/40">
                            <span className="text-[8px] text-indigo-600 dark:text-indigo-400 uppercase font-black block">{t.taxTotalLabel || 'Total'}</span>
                            <span className="font-mono text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(finalTotalAmount)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Summary Callout Banner */}
                  <div className="bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                        {t.finalBalanceToCharge || 'Saldo Final a Cobrar'}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-zinc-400">
                        {selectedProducts.length > 0 ? `${selectedProducts.length} ${t.itemsCountUnit || 'artigos'}` : (t.singleAmount || 'Valor avulso')}
                      </span>
                    </div>
                    <span className="text-xl font-black text-indigo-700 dark:text-indigo-300 font-mono">
                      {formatCurrency(finalTotalAmount)} MT
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/90 dark:bg-zinc-950/80 backdrop-blur-md flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                disabled={isSaving}
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-all cursor-pointer disabled:opacity-50"
              >
                {t.cancelBtn || 'Cancelar'}
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={13} className="animate-spin text-white" />
                    <span>{t.savingBtn || 'A guardar...'}</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={13} />
                    <span>{editDebt ? (t.updateDebtBtn || 'Atualizar Fiado') : (t.saveRecordBtn || 'Salvar Registo')}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
