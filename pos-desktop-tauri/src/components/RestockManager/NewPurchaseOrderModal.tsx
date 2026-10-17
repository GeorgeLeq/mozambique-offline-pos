import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Search, Plus, Trash2, Download, Upload, Maximize2, Minimize2, Loader2, FileText } from 'lucide-react';
import { getDB } from '../../lib/db';
import { Product } from '../../lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { sanitizeString, sanitizeNumeric } from '../../lib/security/sanitizer';

interface POItem {
  id: string;
  productName: string;
  barcode?: string;
  quantity: number;
  productId?: string;
  requiresVerification?: boolean;
}

export function NewPurchaseOrderModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const { currentUser } = useAuth();
  const [supplier, setSupplier] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [globalRequiresVerification, setGlobalRequiresVerification] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [items, setItems] = useState<POItem[]>([]);
  
  // Direct product name and quantity inputs
  const [directName, setDirectName] = useState('');
  const [directQty, setDirectQty] = useState('1');
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const handleSearch = async (term: string) => {
    const cleanTerm = sanitizeString(term);
    setSearchTerm(cleanTerm);
    if (cleanTerm.length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      const db = await getDB();
      const results = await db.select(
        'SELECT * FROM products WHERE name LIKE ? OR barcode LIKE ? LIMIT 10',
        [`%${cleanTerm}%`, `%${cleanTerm}%`]
      ) as Product[];
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddProduct = (product: Product) => {
    const existing = items.find(i => i.productId === product.id);
    if (existing) {
      setItems(items.map(i => i.id === existing.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setItems([...items, { id: Math.random().toString(), productName: product.name, barcode: product.barcode, quantity: 1, productId: product.id, requiresVerification: true }]);
    }
    setSearchTerm('');
    setSearchResults([]);
    searchInputRef.current?.focus();
  };

  const handleAddDirect = () => {
    const cleanName = sanitizeString(directName);
    const qty = parseFloat(directQty) || 1;
    if (!cleanName) {
      return toast.error('Introduza o nome do produto');
    }
    setItems([...items, { id: Math.random().toString(), productName: cleanName, barcode: 'MANUAL', quantity: qty, requiresVerification: true }]);
    setDirectName('');
    setDirectQty('1');
  };

  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,produto,barcode,quantidade\nCoca-Cola 1.5L,123456789,10\nArroz 5kg,987654321,5";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "encomenda_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Modelo CSV descarregado');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        const db = await getDB();
        const newItems = [...items];
        
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',').map(p => p.trim());
          if (parts.length >= 2) {
            const prodNameOrCode = parts[0];
            const qty = parseFloat(parts[1] || parts[2]) || 1;
            const prods = await db.select('SELECT * FROM products WHERE barcode = ? OR name LIKE ?', [prodNameOrCode, `%${prodNameOrCode}%`]) as Product[];
            if (prods.length > 0) {
              const prod = prods[0];
              newItems.push({
                id: Math.random().toString(),
                productName: prod.name,
                barcode: prod.barcode,
                quantity: qty,
                productId: prod.id
              });
            } else {
              newItems.push({
                id: Math.random().toString(),
                productName: prodNameOrCode,
                barcode: 'CSV',
                quantity: qty
              });
            }
          }
        }
        setItems(newItems);
        toast.success('Produtos importados via CSV com sucesso!');
      } catch (err) {
        console.error(err);
        toast.error('Erro ao processar ficheiro CSV');
      }
    };
    reader.readAsText(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    const cleanSupplier = sanitizeString(supplier);
    const cleanInvoice = sanitizeString(invoiceNumber);
    const cleanDate = sanitizeString(expectedDate);

    if (!cleanSupplier) return toast.error('Nome do fornecedor obrigatório');
    if (items.length === 0) return toast.error('Adicione pelo menos um produto');
    
    setIsSaving(true);
    try {
      const db = await getDB();
      const deliveryId = crypto.randomUUID();
      
      const maxRes = await db.select('SELECT MAX(po_number) as max_po FROM expected_deliveries') as any[];
      const nextPoNumber = (maxRes[0]?.max_po && maxRes[0].max_po >= 1000) ? maxRes[0].max_po + 1 : 1001;
      
      await db.execute(
        'INSERT INTO expected_deliveries (id, po_number, invoice_number, supplier_name, expected_date, created_by, requires_verification) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [deliveryId, nextPoNumber, cleanInvoice || null, cleanSupplier, cleanDate || null, currentUser?.id || 'admin', globalRequiresVerification ? 1 : 0]
      );
      
      for (const item of items) {
        const cleanQty = sanitizeNumeric(item.quantity, 1);
        const itemRequiresVerif = globalRequiresVerification && (item.requiresVerification !== false) ? 1 : 0;
        let prodId = item.productId;
        if (!prodId) {
          // Check if product exists by name or barcode (ignoring generic placeholding barcodes)
          const validBarcode = (item.barcode && item.barcode !== 'MANUAL' && item.barcode !== 'CSV') ? item.barcode : '';
          
          let existingProd: any[] = [];
          if (validBarcode) {
            existingProd = await db.select(
              'SELECT id FROM products WHERE name = ? OR barcode = ? LIMIT 1',
              [item.productName, validBarcode]
            ) as any[];
          } else {
            existingProd = await db.select(
              'SELECT id FROM products WHERE name = ? LIMIT 1',
              [item.productName]
            ) as any[];
          }

          if (existingProd.length > 0) {
            prodId = existingProd[0].id;
            await db.execute(
              'UPDATE products SET requires_verification = ? WHERE id = ?',
              [itemRequiresVerif, prodId]
            );
          } else {
            // Determine a safe, unique barcode
            let finalBarcode = validBarcode;
            if (!finalBarcode) {
              finalBarcode = `PO-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
            }

            // Ensure barcode is unique in products table
            const barcodeCheck = await db.select(
              'SELECT id FROM products WHERE barcode = ? LIMIT 1',
              [finalBarcode]
            ) as any[];

            if (barcodeCheck.length > 0) {
              finalBarcode = `PO-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
            }

            prodId = crypto.randomUUID();
            await db.execute(
              'INSERT INTO products (id, name, barcode, cost_price_mt, price_mt, stock_quantity, sync_status, requires_verification) VALUES (?, ?, ?, ?, ?, ?, 0, ?)',
              [prodId, item.productName, finalBarcode, 0, 0, 0, itemRequiresVerif]
            );
          }
        } else {
          await db.execute(
            'UPDATE products SET requires_verification = ? WHERE id = ?',
            [itemRequiresVerif, prodId]
          );
        }

        await db.execute(
          'INSERT INTO expected_delivery_items (id, delivery_id, product_id, expected_quantity, cost_price_mt, sync_status, requires_verification) VALUES (?, ?, ?, ?, ?, 0, ?)',
          [crypto.randomUUID(), deliveryId, prodId, cleanQty, 0, itemRequiresVerif]
        );
      }

      // Trigger sync if available
      try {
        const { syncExpectedDeliveriesToCloud } = await import('../../lib/syncEngine/expectedDeliveries');
        const { syncProductsToCloud } = await import('../../lib/syncEngine/products');
        await syncProductsToCloud();
        await syncExpectedDeliveriesToCloud();
      } catch (e) {
        console.warn('Auto sync trigger failed:', e);
      }
      
      toast.success('Encomenda criada com sucesso');
      onSuccess();
    } catch (err) {
      console.error('Failed to create PO', err);
      toast.error('Erro ao guardar encomenda');
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/50 dark:bg-black/70"
        />

        {/* Right Full-Width Sidebar Panel */}
        <motion.div 
          initial={{ opacity: 0, x: '100%' }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: '100%' }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className={`relative ${isFullScreen ? 'w-full max-w-full' : 'w-full sm:w-[585px] md:w-[680px] lg:w-[780px]'} bg-white dark:bg-zinc-900 border-l border-slate-200 dark:border-white/10 shadow-2xl flex flex-col h-full z-10`}
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/80 dark:bg-zinc-950/80 backdrop-blur-md shrink-0">
            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-extrabold uppercase tracking-wider mb-1">
                Nova Encomenda (PO)
              </span>
              <h2 className="text-xl font-black text-slate-800 dark:text-zinc-50">
                Registar Expectativa de Receção
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
                title={isFullScreen ? "Reduzir janela" : "Expandir ecrã inteiro"}
              >
                {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
              <button
                onClick={onClose}
                className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Form Body */}
          <div className="p-8 overflow-y-auto space-y-6 flex-1 text-slate-700 dark:text-zinc-300">
            <form onSubmit={handleSave} id="po-form-elem" className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Fornecedor *</label>
                  <input
                    type="text"
                    value={supplier}
                    onChange={e => setSupplier(e.target.value)}
                    placeholder="Ex: Coca-Cola, SAB..."
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200/80 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-xs font-bold text-slate-900 dark:text-zinc-100 shadow-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Nº Fatura / Guia (Opcional)</label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={e => setInvoiceNumber(e.target.value)}
                    placeholder="Ex: FAT-2026/089"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200/80 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-xs font-bold text-slate-900 dark:text-zinc-100 shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Data Prevista</label>
                  <input
                    type="date"
                    value={expectedDate}
                    onChange={e => setExpectedDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200/80 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-xs font-bold text-slate-900 dark:text-zinc-100 shadow-xs"
                  />
                </div>
              </div>

              {/* Global Verification Toggle Switch */}
              <div className="flex items-center justify-between bg-indigo-50/70 dark:bg-indigo-950/30 p-4 rounded-2xl border border-indigo-200/60 dark:border-indigo-800/40">
                <div className="pr-4">
                  <span className="block text-xs font-black text-indigo-950 dark:text-indigo-200 uppercase tracking-wider mb-0.5">
                    🛡️ Verificação de Stock no Acolhimento
                  </span>
                  <span className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400">
                    Ativo por defeito. Impede a venda POS destes produtos até que o Gestor confirme a receção e verificação de stock.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setGlobalRequiresVerification(!globalRequiresVerification)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${globalRequiresVerification ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-zinc-700'}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${globalRequiresVerification ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="border-t border-slate-100 dark:border-white/5 pt-6 space-y-5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Adicionar Produtos</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 rounded-lg text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download size={12} />
                      Modelo CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-lg text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Upload size={12} />
                      Importar CSV
                    </button>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept=".csv" 
                      onChange={handleFileUpload} 
                      className="hidden" 
                    />
                  </div>
                </div>

                {/* Direct Product Name & Quantity Input fields */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-indigo-50/40 dark:bg-indigo-950/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                  <div className="sm:col-span-7">
                    <label className="block text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">Nome do Produto</label>
                    <input
                      type="text"
                      value={directName}
                      onChange={e => setDirectName(e.target.value)}
                      placeholder="Ex: Produto Exemplo..."
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">Quantidade</label>
                    <input
                      type="number"
                      min="1"
                      value={directQty}
                      onChange={e => setDirectQty(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold font-mono outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-end">
                    <button
                      type="button"
                      onClick={handleAddDirect}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-all border-0"
                    >
                      <Plus size={14} />
                      Adicionar
                    </button>
                  </div>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={e => handleSearch(e.target.value)}
                    placeholder="Ou pesquisar no catálogo por nome ou código..."
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200/80 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-xs text-slate-900 dark:text-zinc-100 shadow-xs"
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden z-20 max-h-48 overflow-y-auto p-1">
                      {searchResults.map(product => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => handleAddProduct(product)}
                          className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 flex justify-between items-center cursor-pointer text-xs"
                        >
                          <div>
                            <div className="font-bold text-slate-800 dark:text-zinc-200">{product.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">{product.barcode}</div>
                          </div>
                          <Plus size={14} className="text-slate-400" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50/50 dark:bg-zinc-950/50 p-4 min-h-[180px] max-h-[280px] overflow-y-auto">
                  {items.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold py-12">
                      Nenhum produto adicionado
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {items.map(item => (
                        <div key={item.id} className="flex items-center gap-3 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-slate-200/80 dark:border-white/5 shadow-xs">
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-xs truncate text-slate-800 dark:text-zinc-200">{item.productName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{item.barcode || 'Manual'}</div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {globalRequiresVerification && (
                              <button
                                type="button"
                                onClick={() => setItems(items.map(i => i.id === item.id ? { ...i, requiresVerification: i.requiresVerification === false } : i))}
                                className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-colors border cursor-pointer ${
                                  item.requiresVerification !== false 
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' 
                                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 border-slate-200 dark:border-zinc-700'
                                }`}
                                title={item.requiresVerification !== false ? "Requer Verificação ao Receber" : "Verificação Desativada para este produto"}
                              >
                                <span>{item.requiresVerification !== false ? '🔒 Verificar' : '🔓 Sem Verif.'}</span>
                              </button>
                            )}
                            <div className="flex items-center gap-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Qtd:</label>
                              <input 
                                type="number"
                                min="0.1"
                                step="any"
                                value={item.quantity}
                                onChange={(e) => setItems(items.map(i => i.id === item.id ? {...i, quantity: parseFloat(e.target.value) || 0} : i))}
                                className="w-16 px-2 py-1.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-right font-mono font-bold text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                            <button 
                              type="button"
                              onClick={() => setItems(items.filter(i => i.id !== item.id))}
                              className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Footer Actions */}
          <div className="px-8 py-5 border-t border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-zinc-950/80 backdrop-blur-md flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="po-form-elem"
              disabled={isSaving}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-sm shadow-indigo-500/20 transition-all cursor-pointer border-0 flex items-center gap-1.5"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {isSaving ? 'A guardar...' : 'Guardar Encomenda'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
