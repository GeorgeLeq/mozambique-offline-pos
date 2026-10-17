import React, { useState } from 'react';
import { Tag, Plus, Trash2 } from 'lucide-react';

interface CustomAttributesSectionProps {
  attributes: { key: string; value: string }[];
  setAttributes: (attrs: { key: string; value: string }[]) => void;
}

export const CustomAttributesSection = React.memo(function CustomAttributesSection({
  attributes,
  setAttributes
}: CustomAttributesSectionProps) {
  const [newAttrKey, setNewAttrKey] = useState('');
  const [newAttrVal, setNewAttrVal] = useState('');

  const handleAddAttribute = () => {
    if (!newAttrKey.trim() || !newAttrVal.trim()) return;
    setAttributes([...attributes, { key: newAttrKey.trim(), value: newAttrVal.trim() }]);
    setNewAttrKey('');
    setNewAttrVal('');
  };

  const handleRemoveAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddAttribute();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Tag size={14} className="text-indigo-500" />
          <span className="text-[11px] font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
            Especificações & Variações {attributes.length > 0 && `(${attributes.length})`}
          </span>
        </div>
        <span className="text-[10px] text-slate-400 dark:text-zinc-500">
          Ilimitado (ex: Tamanho, Sabor, Marca)
        </span>
      </div>

      {/* Scrollable list for attributes if many are added */}
      {attributes.length > 0 && (
        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
          {attributes.map((attr, idx) => (
            <div key={idx} className="flex items-center justify-between bg-white dark:bg-zinc-900 px-3 py-2 rounded-xl border border-slate-200/80 dark:border-zinc-800 text-xs shadow-2xs">
              <span className="font-bold text-slate-700 dark:text-zinc-300">{attr.key}:</span>
              <div className="flex items-center gap-2">
                <span className="text-indigo-600 dark:text-indigo-400 font-medium">{attr.value}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveAttribute(idx)}
                  className="text-rose-500 hover:text-rose-700 p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  title="Remover atributo"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex flex-col sm:flex-row gap-2 pt-1">
        <input
          type="text"
          value={newAttrKey}
          onChange={(e) => setNewAttrKey(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Atributo (ex: Sabor / Tamanho)"
          className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-700 text-xs text-slate-800 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <input
          type="text"
          value={newAttrVal}
          onChange={(e) => setNewAttrVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Valor (ex: Morango / 500ml)"
          className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-700 text-xs text-slate-800 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="button"
          onClick={handleAddAttribute}
          disabled={!newAttrKey.trim() || !newAttrVal.trim()}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold cursor-pointer shrink-0 flex items-center justify-center gap-1 active:scale-95 transition-all shadow-xs"
        >
          <Plus size={14} /> Adicionar
        </button>
      </div>
    </div>
  );
});
