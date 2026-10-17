import React from 'react';
import { 
  LayoutDashboard, Package, Users, Barcode, 
  UserCircle2, FileText, Settings as SettingsIcon, ChevronRight, Crown, Lock 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../subscription';

interface SidebarNavigationProps {
  onNavigate: (tab: string) => void;
  cloudOnline?: boolean;
}

export default function SidebarNavigation({ onNavigate, cloudOnline = true }: SidebarNavigationProps) {
  const { currentUser } = useAuth();
  const { isFeatureUnlocked, openSubscriptionPage, isProActive } = useSubscription();

  const hasPermission = (page: string) => {
    if (currentUser?.role === 'Admin') return true;
    try {
      const perms = currentUser?.permissions_json ? JSON.parse(currentUser.permissions_json) : [];
      return perms.includes(page);
    } catch {
      return false;
    }
  };

  return (
    <div className="w-full lg:w-64 shrink-0 flex flex-col gap-2.5 bg-white/70 dark:bg-zinc-900/75 backdrop-blur-md p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-zinc-800/80 h-fit animate-fade-in">
      <div className="px-3 py-1 flex items-center justify-between">
        <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
          Aplicações POS
        </span>
        <div className="flex items-center gap-1.5 group relative cursor-help" id="sidebar-status-indicator">
          <span className={`text-[9px] font-bold tracking-tight uppercase ${cloudOnline ? 'text-emerald-500' : 'text-amber-500'}`}>
            {cloudOnline ? 'Nuvem' : 'Local'}
          </span>
          <span className={`w-2 h-2 rounded-full ${cloudOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`} />
          
          {/* Custom tooltip on hover */}
          <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block bg-slate-900 text-slate-100 dark:bg-zinc-950 dark:text-zinc-300 text-[10px] font-bold py-1.5 px-3 rounded-xl whitespace-nowrap shadow-lg border border-slate-200 dark:border-zinc-800/80 z-50 transition-all pointer-events-none">
            {cloudOnline 
              ? 'SQLite Ligado • Ligação Supabase Ativa' 
              : 'Modo Offline • Guardando em SQLite Localmente'}
          </div>
        </div>
      </div>
      
      <div className="space-y-1.5">
        <button className="flex items-center justify-between px-4 py-3 rounded-2xl bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/10 hover:bg-indigo-700 transition-all w-full text-left">
          <div className="flex items-center gap-3">
            <LayoutDashboard size={18} className="stroke-[2.5]" />
            <span className="text-sm">Painel Principal</span>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-white" />
        </button>

        {hasPermission('products') && (
          <button 
            onClick={() => onNavigate('products')} 
            className="flex items-center justify-between px-4 py-3 rounded-2xl text-slate-600 dark:text-zinc-400 hover:bg-slate-100/60 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-100 font-bold transition-all w-full text-left group"
            id="nav-products-btn"
          >
            <div className="flex items-center gap-3">
              <Package size={18} className="text-slate-400 dark:text-zinc-500 group-hover:text-indigo-500 transition-colors" />
              <span className="text-sm">Produtos</span>
            </div>
            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 text-slate-400 transition-all transform translate-x-1 group-hover:translate-x-0" />
          </button>
        )}

        {hasPermission('employees') && currentUser?.role === 'Admin' && (
          <button 
            onClick={() => onNavigate('employees')} 
            className="flex items-center justify-between px-4 py-3 rounded-2xl text-slate-600 dark:text-zinc-400 hover:bg-slate-100/60 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-100 font-bold transition-all w-full text-left group"
            id="nav-employees-btn"
          >
            <div className="flex items-center gap-3">
              <Users size={18} className="text-slate-400 dark:text-zinc-500 group-hover:text-indigo-500 transition-colors" />
              <span className="text-sm">Operadores</span>
            </div>
            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 text-slate-400 transition-all transform translate-x-1 group-hover:translate-x-0" />
          </button>
        )}

        {hasPermission('barcodes') && (
          <button 
            onClick={() => onNavigate('barcodes')} 
            className="flex items-center justify-between px-4 py-3 rounded-2xl text-slate-600 dark:text-zinc-400 hover:bg-slate-100/60 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-100 font-bold transition-all w-full text-left group"
            id="nav-barcodes-btn"
          >
            <div className="flex items-center gap-3">
              <Barcode size={18} className="text-slate-400 dark:text-zinc-500 group-hover:text-indigo-500 transition-colors" />
              <span className="text-sm">Código de Barras</span>
            </div>
            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 text-slate-400 transition-all transform translate-x-1 group-hover:translate-x-0" />
          </button>
        )}

        {hasPermission('clients') && (
          <button 
            onClick={() => onNavigate('clients')} 
            className="flex items-center justify-between px-4 py-3 rounded-2xl text-slate-600 dark:text-zinc-400 hover:bg-slate-100/60 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-100 font-bold transition-all w-full text-left group"
            id="nav-clients-btn"
          >
            <div className="flex items-center gap-3">
              <UserCircle2 size={18} className="text-slate-400 dark:text-zinc-500 group-hover:text-indigo-500 transition-colors" />
              <span className="text-sm">Fiados & Clientes</span>
            </div>
            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 text-slate-400 transition-all transform translate-x-1 group-hover:translate-x-0" />
          </button>
        )}

        {/* Minha Subscrição / Módulos Button */}
        <button 
          onClick={openSubscriptionPage} 
          className="flex items-center justify-between px-4 py-3 rounded-2xl text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 font-bold transition-all w-full text-left group border border-amber-200/70 dark:border-amber-900/50"
          id="nav-subscription-btn"
        >
          <div className="flex items-center gap-3">
            <Crown size={18} className="text-amber-500 transition-colors" />
            <span className="text-sm">Subscrição & Módulos</span>
          </div>
          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
            isProActive 
              ? 'bg-amber-500 text-white' 
              : 'bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
          }`}>
            {isProActive ? 'PRO' : 'PLANOS'}
          </span>
        </button>

        {hasPermission('reports') && (
          <button 
            onClick={() => onNavigate('reports')} 
            className="flex items-center justify-between px-4 py-3 rounded-2xl text-slate-600 dark:text-zinc-400 hover:bg-slate-100/60 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-100 font-bold transition-all w-full text-left group"
            id="nav-reports-btn"
          >
            <div className="flex items-center gap-3">
              <FileText size={18} className="text-slate-400 dark:text-zinc-500 group-hover:text-indigo-500 transition-colors" />
              <span className="text-sm">Fechos & Relatórios</span>
            </div>
            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 text-slate-400 transition-all transform translate-x-1 group-hover:translate-x-0" />
          </button>
        )}

        {hasPermission('settings') && (
          <button 
            onClick={() => onNavigate('settings')} 
            className="flex items-center justify-between px-4 py-3 rounded-2xl text-slate-600 dark:text-zinc-400 hover:bg-slate-100/60 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-100 font-bold transition-all w-full text-left group"
            id="nav-settings-btn"
          >
            <div className="flex items-center gap-3">
              <SettingsIcon size={18} className="text-slate-400 dark:text-zinc-500 group-hover:text-indigo-500 transition-colors" />
              <span className="text-sm">Configurações</span>
            </div>
            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 text-slate-400 transition-all transform translate-x-1 group-hover:translate-x-0" />
          </button>
        )}
      </div>
    </div>
  );
}
