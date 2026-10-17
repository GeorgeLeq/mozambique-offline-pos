import React from 'react';
import { Tag, Package, Scale } from 'lucide-react';

export type ProductFormType = 'unit' | 'pack' | 'bulk';

interface ProductTypeTabsProps {
  activeType: ProductFormType;
  onChangeType: (type: ProductFormType) => void;
}

export const ProductTypeTabs = React.memo(function ProductTypeTabs({ activeType, onChangeType }: ProductTypeTabsProps) {
  const tabs = [
    {
      id: 'unit' as ProductFormType,
      label: 'Unidade Simples',
      sublabel: 'Garrafa, Barra, Lata, Pão',
      icon: Tag,
      color: 'indigo',
    },
    {
      id: 'pack' as ProductFormType,
      label: 'Pack / Caixa / Fardo',
      sublabel: 'Pack x6, Caixa x12/24',
      icon: Package,
      color: 'purple',
    },
    {
      id: 'bulk' as ProductFormType,
      label: 'Venda a Granel',
      sublabel: 'Peso / Volume (Kg, g, L)',
      icon: Scale,
      color: 'amber',
    },
  ];

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-3 gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeType === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeType(tab.id)}
              className={`px-3 py-2 rounded-xl border text-left transition-all relative flex items-center gap-2.5 cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20 ring-2 ring-indigo-600/30'
                  : 'bg-white dark:bg-zinc-900 border-slate-200/90 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'
              }`}
            >
              <div className={`p-1.5 rounded-lg shrink-0 ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'}`}>
                <Icon size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-extrabold text-xs leading-tight truncate">
                  {tab.label}
                </div>
                <div className={`text-[10px] truncate ${isActive ? 'text-indigo-100' : 'text-slate-400 dark:text-zinc-500'}`}>
                  {tab.sublabel}
                </div>
              </div>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ring-2 ring-white/30 shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
});
