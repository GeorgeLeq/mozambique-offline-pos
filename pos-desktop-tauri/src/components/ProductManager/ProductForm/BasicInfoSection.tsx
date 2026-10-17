import React, { useMemo } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BasicInfoSectionProps {
  barcode: string;
  name: string;
  setName: (val: string) => void;
  category: string;
  setCategory: (val: string) => void;
  autofillBarcode: () => void;
  handleBarcodeKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  existingCategories: string[];
  isCategoryDropdownOpen: boolean;
  setIsCategoryDropdownOpen: (val: boolean) => void;
  categoryDropdownRef: React.RefObject<HTMLDivElement | null>;
}

export const BasicInfoSection = React.memo(function BasicInfoSection({
  barcode,
  name,
  setName,
  category,
  setCategory,
  autofillBarcode,
  handleBarcodeKeyDown,
  existingCategories,
  isCategoryDropdownOpen,
  setIsCategoryDropdownOpen,
  categoryDropdownRef
}: BasicInfoSectionProps) {
  const filteredCategories = useMemo(() => {
    if (!category) return existingCategories;
    const catLower = category.toLowerCase();
    return existingCategories.filter(c => c.toLowerCase().includes(catLower));
  }, [existingCategories, category]);

  return (
    <div className="space-y-4">
      {/* Barcode & Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Código de Barras
            </label>
            <button
              type="button"
              onClick={autofillBarcode}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Gerar Automático
            </button>
          </div>
          <input
            type="text"
            readOnly
            value={barcode}
            onKeyDown={handleBarcodeKeyDown}
            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-zinc-100 font-mono text-xs shadow-xs outline-none"
            placeholder="Escaneie ou gere..."
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
            Nome do Produto
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-zinc-100 text-xs font-medium shadow-xs focus:ring-2 focus:ring-indigo-500/50 outline-none"
            placeholder="Ex: Coca-Cola 2L"
            required
          />
        </div>
      </div>

      {/* Category */}
      <div className="relative" ref={categoryDropdownRef}>
        <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
          Categoria
        </label>
        <div 
          onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
          className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/80 dark:border-white/10 flex items-center justify-between cursor-pointer text-xs font-medium shadow-xs"
        >
          <input
            type="text"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setIsCategoryDropdownOpen(true);
            }}
            className="bg-transparent outline-none flex-1 text-slate-900 dark:text-zinc-100 min-w-0"
            placeholder="Selecione ou digite nova categoria..."
          />
          <ChevronDown size={14} className={`text-slate-400 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
        </div>

        <AnimatePresence>
          {isCategoryDropdownOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden max-h-40 overflow-y-auto p-1"
            >
              {filteredCategories.map(c => (
                <div
                  key={c}
                  onClick={() => {
                    setCategory(c);
                    setIsCategoryDropdownOpen(false);
                  }}
                  className={`px-3 py-2 rounded-lg text-xs flex items-center justify-between cursor-pointer ${category === c ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 font-bold' : 'hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300'}`}
                >
                  <span>{c}</span>
                  {category === c && <Check size={13} className="text-indigo-600" />}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});
