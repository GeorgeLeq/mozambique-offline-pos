import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle, Bookmark, Trash2, Edit3, Download, Square, CheckSquare, Tag, Store, Package, Clock, Eye } from 'lucide-react';
import Barcode from 'react-barcode';
import { BarcodeRecord } from './types';
import { useI18n } from '../../i18n';

interface BarcodeCardProps {
  key?: React.Key;
  b: BarcodeRecord;
  isSelected?: boolean;
  onSelect?: () => void;
  onDelete: (barcode: string) => void;
  onSave: (barcode: string) => void;
  onEdit: (b: BarcodeRecord) => void;
  onDownload: (barcode: string) => void;
  onDetails: (b: BarcodeRecord) => void;
}

export const BarcodeCard = React.memo(function BarcodeCard({ b, isSelected, onSelect, onDelete, onSave, onEdit, onDownload, onDetails }: BarcodeCardProps) {
  const t = useI18n();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'used': return 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
      default: return 'text-slate-600 dark:text-slate-400 bg-slate-500/10 border-white/5';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return t.statusAvailable;
      case 'used': return t.statusUsed;
      default: return status;
    }
  };

  const getGradient = (name: string) => {
    const colors = [
      'from-indigo-500/15 to-purple-500/5 text-indigo-600 dark:text-indigo-400 border-indigo-500/10',
      'from-emerald-500/15 to-teal-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/10',
      'from-blue-500/15 to-indigo-500/5 text-blue-600 dark:text-blue-400 border-blue-500/10',
      'from-rose-500/15 to-pink-500/5 text-rose-600 dark:text-rose-400 border-rose-500/10',
      'from-amber-500/15 to-orange-500/5 text-amber-600 dark:text-amber-400 border-amber-500/10',
    ];
    let sum = 0;
    const cleanName = name || 'Label';
    for (let i = 0; i < cleanName.length; i++) {
      sum += cleanName.charCodeAt(i);
    }
    return colors[sum % colors.length];
  };

  const avatarStyle = getGradient(b.item_name || '');
  const initials = b.item_name
    ? b.item_name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '';

  const isSavedIndefinitely = b.expires_at.startsWith('2099');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`bg-white dark:bg-zinc-900/60 backdrop-blur-md p-5 sm:p-6 rounded-[2rem] border shadow-[0_8px_30px_rgba(0,0,0,0.015)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.15)] flex flex-col sm:flex-row gap-5 items-stretch group transition-all relative overflow-hidden ${
        isSelected 
          ? 'border-indigo-500 ring-2 ring-indigo-500/10 dark:ring-indigo-500/20 shadow-indigo-500/5' 
          : 'border-slate-150 dark:border-zinc-800/80 hover:border-indigo-500/30 dark:hover:border-zinc-700/50'
      }`}
    >
      {/* LEFT SECTION: Info & Meta (Flexible) */}
      <div className="flex-1 flex flex-col justify-between gap-4">
        {/* Left Header: Selection and status badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onSelect}
            className={`p-2 rounded-xl border bg-white dark:bg-zinc-950 transition-all shadow-sm active:scale-90 ${
              isSelected 
                ? 'border-indigo-500 text-indigo-500 ring-4 ring-indigo-500/10' 
                : 'border-slate-200 dark:border-zinc-800 text-slate-400 hover:text-indigo-500 hover:border-indigo-500'
            }`}
          >
            {isSelected ? <CheckSquare size={16} className="fill-current" /> : <Square size={16} />}
          </button>
          
          <span className={`text-[9px] px-2.5 py-1 rounded-lg border font-black tracking-wider uppercase flex items-center ${getStatusColor(b.status)}`}>
            {b.status === 'available' && <CheckCircle size={9} className="mr-1 inline stroke-[3]" />}
            {getStatusLabel(b.status)}
          </span>
          <span className="text-[9px] px-2.5 py-1 rounded-lg border border-purple-500/20 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-black tracking-wider uppercase">
            {t.permanent}
          </span>
        </div>

        {/* Left Body: Product details */}
        <div 
          onClick={() => onDetails(b)}
          className="flex items-start gap-3.5 min-w-0 my-1 cursor-pointer group/title"
        >
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${avatarStyle} border flex items-center justify-center font-black tracking-wider text-xs shrink-0 shadow-sm`}>
            {initials || (b.linked_product_id ? <Package size={18} /> : <Tag size={18} />)}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-black text-slate-900 dark:text-zinc-50 tracking-tight leading-snug text-sm sm:text-base truncate group-hover/title:text-indigo-600 dark:group-hover/title:text-indigo-400 transition-colors" title={b.item_name || ''}>
              {b.item_name || '—'}
            </h3>
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {b.shop_name && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-[10px] font-bold text-slate-500 dark:text-zinc-400 border border-slate-200/40 dark:border-zinc-700/30">
                  <Store size={9} className="text-slate-400 dark:text-zinc-500" />
                  {b.shop_name}
                </span>
              )}
              {b.attributes && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-100/40 dark:border-indigo-900/30">
                  <Tag size={9} className="text-indigo-400" />
                  {b.attributes}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Left Footer: Timing */}
        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 dark:text-zinc-500 font-mono pt-3 border-t border-slate-100 dark:border-zinc-800/60">
          <span className="flex items-center gap-1">
            <Clock size={11} className="text-slate-300 dark:text-zinc-600 stroke-[2.5]" />
            {t.createdDate || 'Data'}: {new Date(b.created_at).toLocaleDateString('pt-MZ', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </span>
          <span className="bg-slate-100/80 dark:bg-zinc-800/50 px-2 py-0.5 rounded-md border border-slate-200/10 dark:border-zinc-700/10">
            {new Date(b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* DASHED LINE SEPARATOR WITH TICKET TEAR CUTOUTS */}
      <div className="hidden sm:block w-px border-l border-dashed border-slate-200 dark:border-zinc-800/80 relative self-stretch mx-1">
        <div className="absolute -top-8 -left-2 w-4 h-4 rounded-full bg-slate-50 dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800/80" />
        <div className="absolute -bottom-8 -left-2 w-4 h-4 rounded-full bg-slate-50 dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-800/80" />
      </div>

      {/* RIGHT SECTION: Barcode & Actions */}
      <div className="w-full sm:w-[240px] shrink-0 flex flex-col justify-between gap-4">
        {/* Right Header: Action Buttons */}
        <div className="flex justify-end items-center gap-1.5">
          <button
            onClick={() => onDetails(b)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/15 border border-slate-100 dark:border-zinc-800 hover:border-indigo-100 bg-white dark:bg-zinc-950 shadow-sm transition-all active:scale-90"
            title={t.viewDetails}
          >
            <Eye size={13} className="stroke-[2.5]" />
          </button>

          <button
            onClick={() => onDelete(b.barcode)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/15 border border-slate-100 dark:border-zinc-800 hover:border-rose-100 bg-white dark:bg-zinc-950 shadow-sm transition-all active:scale-90"
            title={t.deleteBarcode}
          >
            <Trash2 size={13} className="stroke-[2.5]" />
          </button>
          <button
            onClick={() => onEdit(b)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/15 border border-slate-100 dark:border-zinc-800 hover:border-amber-100 bg-white dark:bg-zinc-950 shadow-sm transition-all active:scale-90"
            title={t.editData}
          >
            <Edit3 size={13} className="stroke-[2.5]" />
          </button>
          <button
            onClick={() => onDownload(b.barcode)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/15 border border-slate-100 dark:border-zinc-800 hover:border-emerald-100 bg-white dark:bg-zinc-950 shadow-sm transition-all active:scale-90"
            title={t.downloadPNG}
          >
            <Download size={13} className="stroke-[2.5]" />
          </button>
        </div>

        {/* Right Sticker Box */}
        <div 
          id={`barcode-${b.barcode}`} 
          onClick={() => onDetails(b)}
          className="bg-white rounded-[1.2rem] p-4 border border-slate-150 dark:border-zinc-800/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.015)] flex flex-col items-center justify-center gap-1.5 transition-all group-hover:border-indigo-500/30 relative overflow-hidden cursor-pointer"
        >
          {b.price_mt ? (
            <div className="font-mono font-black text-slate-900 text-xs tracking-tight bg-slate-50 border border-slate-150 px-2.5 py-1 rounded-lg">
              {b.price_mt.toFixed(2)} MT
            </div>
          ) : (
            <div className="text-[8px] font-black tracking-widest text-slate-400 uppercase bg-slate-50 border border-slate-150 px-2.5 py-1 rounded-lg">
              —
            </div>
          )}
          
          <div className="w-full flex justify-center py-0.5 overflow-x-auto hide-scrollbar">
            <Barcode value={b.barcode} width={1.4} height={42} fontSize={11} background="transparent" />
          </div>
        </div>
      </div>
    </motion.div>
  );
});
