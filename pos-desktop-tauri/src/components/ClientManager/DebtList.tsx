import React, { useRef, useState, useEffect, useMemo } from 'react';
import { UserCircle2 } from 'lucide-react';
import { DebtCard } from './DebtCard';
import { DebtRecord } from './types';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useCustomersI18n } from '../../i18n';

interface DebtListProps {
  debts: DebtRecord[];
  parentRef: React.RefObject<HTMLDivElement | null>;
  onShareWhatsApp: (debt: DebtRecord) => void;
  onSettle: (debt: DebtRecord) => void;
  onPrintReceipt: (debt: DebtRecord) => void;
  onViewHistory: (debt: DebtRecord) => void;
  onEdit: (debt: DebtRecord) => void;
  onDelete: (debt: DebtRecord) => void;
}

export const DebtList = React.memo(function DebtList({
  debts,
  parentRef,
  onShareWhatsApp,
  onSettle,
  onPrintReceipt,
  onViewHistory,
  onEdit,
  onDelete
}: DebtListProps) {
  const t = useCustomersI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(1);

  // Responsive columns using ResizeObserver
  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        if (width >= 1024) {
          setColumns(3);
        } else if (width >= 768) {
          setColumns(2);
        } else {
          setColumns(1);
        }
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [parentRef]);

  // Chunk debts into rows of size 'columns'
  const rows = useMemo(() => {
    const chunks: DebtRecord[][] = [];
    for (let i = 0; i < debts.length; i += columns) {
      chunks.push(debts.slice(i, i + columns));
    }
    return chunks;
  }, [debts, columns]);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 320, // Estimated size of a card row with gaps
    overscan: 3,
  });

  if (debts.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-zinc-555 relative z-10 py-12">
        <div className="w-20 h-20 bg-amber-50 dark:bg-zinc-950/50 text-amber-600 dark:text-amber-500/50 rounded-3xl flex items-center justify-center mb-6 border border-amber-100/40 dark:border-white/5 mx-auto">
          <UserCircle2 size={32} className="opacity-50" />
        </div>
        <p className="text-lg font-medium text-slate-500 dark:text-zinc-400">{t.noDebtsFound || 'Nenhum fiado encontrado.'}</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      style={{
        height: `${rowVirtualizer.getTotalSize()}px`,
        width: '100%',
        position: 'relative'
      }}
    >
      {rowVirtualizer.getVirtualItems().map((virtualRow) => {
        const rowItems = rows[virtualRow.index];
        if (!rowItems) return null;

        return (
          <div
            key={virtualRow.key}
            ref={rowVirtualizer.measureElement}
            data-index={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translate3d(0, ${virtualRow.start}px, 0)`,
              willChange: 'transform'
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4"
          >
            {rowItems.map((debt) => {
              const orig = debt.original_amount || debt.amount_mt;
              const isPartial = debt.status === 'unpaid' && Math.abs(debt.amount_mt - orig) > 0.01 && debt.amount_mt > 0;

              return (
                <DebtCard
                  key={debt.id}
                  debt={debt}
                  isPartial={isPartial}
                  onShareWhatsApp={onShareWhatsApp}
                  onSettle={onSettle}
                  onPrintReceipt={onPrintReceipt}
                  onViewHistory={onViewHistory}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
});
