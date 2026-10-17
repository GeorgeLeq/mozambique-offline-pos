import React from 'react';
import { Shield, KeyRound, CheckCircle2 } from 'lucide-react';
import { PermissionItem } from './types';
import { EmployeesTranslations } from '../../i18n/types';

interface PermissionBadgeProps {
  permission: PermissionItem;
  userName?: string;
  t: EmployeesTranslations;
  isCompact?: boolean;
}

export function getPermissionCategoryStyle(category?: string, t?: EmployeesTranslations) {
  switch (category) {
    case 'vendas':
      return {
        gradient: 'from-rose-500 via-pink-500 to-amber-500',
        badgeBg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        iconBg: 'bg-rose-500/20 text-rose-400 border-rose-500/30 ring-rose-500/20',
        chipBorder: 'hover:border-rose-300/80 dark:hover:border-rose-500/50',
        label: t?.permCategorySales || 'Vendas & POS',
      };
    case 'financeiro':
      return {
        gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
        badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 ring-emerald-500/20',
        chipBorder: 'hover:border-emerald-300/80 dark:hover:border-emerald-500/50',
        label: t?.permCategoryFinance || 'Financeiro & Caixa',
      };
    case 'catalogo':
      return {
        gradient: 'from-indigo-500 via-violet-500 to-purple-500',
        badgeBg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
        iconBg: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30 ring-indigo-500/20',
        chipBorder: 'hover:border-indigo-300/80 dark:hover:border-indigo-500/50',
        label: t?.permCategoryCatalog || 'Catálogo & Artigos',
      };
    case 'seguranca':
      return {
        gradient: 'from-amber-500 via-orange-500 to-red-500',
        badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        iconBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30 ring-amber-500/20',
        chipBorder: 'hover:border-amber-300/80 dark:hover:border-amber-500/50',
        label: t?.permCategorySecurity || 'Segurança & Auditoria',
      };
    case 'operacoes':
    default:
      return {
        gradient: 'from-sky-500 via-blue-500 to-indigo-500',
        badgeBg: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
        iconBg: 'bg-sky-500/20 text-sky-400 border-sky-500/30 ring-sky-500/20',
        chipBorder: 'hover:border-sky-300/80 dark:hover:border-sky-500/50',
        label: t?.permCategoryOps || 'Operações de Loja',
      };
  }
}

export const PermissionBadge = React.memo(({
  permission,
  userName,
  t,
  isCompact = false,
}: PermissionBadgeProps) => {
  const IconComp = permission.icon || Shield;
  const catStyle = getPermissionCategoryStyle(permission.category, t);

  return (
    <div className="relative group/perm-chip inline-flex items-center">
      {/* Interactive Chip */}
      <span 
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all duration-150 cursor-help select-none ${
          isCompact 
            ? 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200/80 dark:border-zinc-700/80' 
            : 'bg-slate-100/90 dark:bg-zinc-800/90 text-slate-750 dark:text-zinc-250 border border-slate-250/70 dark:border-zinc-700/70 shadow-2xs'
        } ${catStyle.chipBorder} hover:shadow-xs hover:scale-[1.02]`}
      >
        <IconComp size={11} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
        <span className="truncate max-w-[120px]">{permission.label}</span>
      </span>

      {/* Premium Tooltip floating above */}
      <div className="absolute left-0 bottom-full mb-2.5 hidden group-hover/perm-chip:block z-50 w-80 p-3.5 bg-slate-950/95 dark:bg-zinc-950/95 backdrop-blur-xl text-white rounded-2xl shadow-2xl border border-slate-700/70 dark:border-zinc-700/80 pointer-events-none ring-1 ring-black/40 animate-in fade-in zoom-in-95 duration-150">
        {/* Category Gradient Top Accent */}
        <div className={`h-1 w-full bg-gradient-to-r ${catStyle.gradient} rounded-full mb-3 shadow-xs`} />

        {/* Header with Icon, Title and Category Badge */}
        <div className="flex items-start gap-3 pb-2.5 mb-2.5 border-b border-white/10">
          <div className={`w-8 h-8 rounded-xl ${catStyle.iconBg} border ring-1 flex items-center justify-center shrink-0 shadow-sm mt-0.5`}>
            <IconComp size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1.5 mb-0.5">
              <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${catStyle.badgeBg}`}>
                {catStyle.label}
              </span>
              <span className="flex items-center gap-1 text-emerald-400 font-bold text-[9px]">
                <CheckCircle2 size={10} />
                {t.permActiveBadge || 'Ativo'}
              </span>
            </div>
            <h4 className="font-extrabold text-xs text-slate-100 leading-snug">
              {permission.label}
            </h4>
          </div>
        </div>

        {/* Access Scope Sub-Description (Primary Focus) */}
        <div className="p-2.5 rounded-xl bg-white/[0.05] dark:bg-zinc-900/80 border border-white/[0.08] shadow-inner space-y-1">
          <div className="flex items-center gap-1 text-amber-300 text-[9.5px] font-black uppercase tracking-wider">
            <KeyRound size={11} className="text-amber-400 shrink-0" />
            <span>{t.permScopeTitle || 'Âmbito de Acesso'}</span>
          </div>
          <p className="text-[11px] text-slate-200 font-medium leading-relaxed">
            {permission.accessSummary || permission.desc}
          </p>
        </div>

        {/* Secondary Module Functional Description */}
        {permission.accessSummary && permission.desc && permission.accessSummary !== permission.desc && (
          <p className="text-[10px] text-slate-400 leading-snug mt-2 px-1">
            {permission.desc}
          </p>
        )}

        {/* Tooltip Footer */}
        <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
          <span className="text-[9px] font-medium text-slate-400">
            {userName ? `${t.tableOperator || 'Operador'}: ` : ''}
            <span className="text-slate-200 font-bold">{userName || ''}</span>
          </span>
          <span className="text-[9px] font-mono text-indigo-300/80 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
            ID: {permission.id}
          </span>
        </div>
      </div>
    </div>
  );
});

PermissionBadge.displayName = 'PermissionBadge';
