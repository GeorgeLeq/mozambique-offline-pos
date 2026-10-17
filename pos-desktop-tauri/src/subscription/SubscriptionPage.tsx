/**
 * @file SubscriptionPage.tsx
 * @description Dedicated full-page view for Subscription management,
 * displaying active plan in full detail, feature entitlements matrix,
 * Companion App live sync status, commercial plan catalog, and offline unlock.
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, Crown, Sparkles, Check, Lock, Smartphone, 
  KeyRound, ShieldCheck, Copy, RefreshCw, Radio,
  Users, Receipt, Layers, TrendingUp,
  CreditCard, Store, Wifi, Database
} from 'lucide-react';
import { useSubscription } from './subscriptionContext';
import { AmbientBackground } from '../components/AmbientBackground';
import { InternetStatusBadge } from '../components/InternetStatusBadge';
import { FullscreenButton } from '../components/FullscreenButton';
import toast from 'react-hot-toast';

interface SubscriptionPageProps {
  onBack: () => void;
}

export function SubscriptionPage({ onBack }: SubscriptionPageProps) {
  const { 
    plans, 
    entitlements, 
    payments, 
    shopId, 
    deviceId, 
    hardwareFingerprint,
    isProActive, 
    daysRemaining, 
    isFeatureUnlocked, 
    setTargetPlanForPayment, 
    setIsPaymentModalOpen, 
    setIsOfflineUnlockOpen,
    refreshEntitlements 
  } = useSubscription();

  const [activeTab, setActiveTab] = useState<'overview' | 'catalog' | 'history'>('overview');
  const [isSyncingNow, setIsSyncingNow] = useState(false);

  const handleManualSync = async () => {
    setIsSyncingNow(true);
    try {
      const { syncSubscriptionsFromCloud } = await import('../lib/syncEngine/subscriptions');
      const success = await syncSubscriptionsFromCloud();
      await refreshEntitlements();
      if (success) {
        toast.success('Subscrição e permissões sincronizadas com o Supabase!');
      } else {
        toast.error('Não foi possível sincronizar. Verifique a ligação à internet.');
      }
    } catch (e: any) {
      console.error('Manual sync error:', e);
      toast.error('Erro ao sincronizar com a nuvem.');
    } finally {
      setIsSyncingNow(false);
    }
  };

  const handleSelectPlan = (plan: typeof plans[0]) => {
    setTargetPlanForPayment(plan);
    setIsPaymentModalOpen(true);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  // Check specific entitlement statuses
  const isCompanionUnlocked = isFeatureUnlocked('companion_app');
  const isDebtsUnlocked = isFeatureUnlocked('client_debts');
  const isAuditsUnlocked = isFeatureUnlocked('advanced_audits');
  const isCloudBackupUnlocked = isFeatureUnlocked('cloud_backup');
  const isPermissionsUnlocked = isFeatureUnlocked('custom_permissions');
  const isUnlimitedUsersUnlocked = isFeatureUnlocked('unlimited_users');

  // Plan Details List
  const featureMatrix = [
    {
      category: 'Vendas & Caixa Diário',
      icon: Receipt,
      items: [
        {
          name: 'Vendas e Faturação Ilimitadas',
          desc: 'Sem limite diário ou mensal de transações de venda.',
          isUnlocked: true,
          badge: 'Grátis & Ilimitado'
        },
        {
          name: 'Multi-Pagamentos (M-Pesa, E-Mola, POS, Dinheiro)',
          desc: 'Divisão de pagamentos e suporte aos principais métodos de Moçambique.',
          isUnlocked: true,
          badge: 'Ativo'
        },
        {
          name: 'Impressão Térmica de Recibos (80mm / 58mm)',
          desc: 'Emissão rápida de comprovativos e talões de venda.',
          isUnlocked: true,
          badge: 'Ativo'
        },
        {
          name: 'Controlo de Caixa, Sangrias e Entradas',
          desc: 'Abertura, fecho cego e conciliação de caixa diária.',
          isUnlocked: true,
          badge: 'Ativo'
        }
      ]
    },
    {
      category: 'Acesso Remoto & Gestão de Clientes',
      icon: Smartphone,
      items: [
        {
          name: 'App Companion em Tempo Real (Métricas ao Vivo)',
          desc: 'Sincronização automática de Receita Total, Dinheiro ao Vivo e Vendas para o telemóvel do proprietário.',
          isUnlocked: isCompanionUnlocked,
          featureKey: 'companion_app',
          badge: isCompanionUnlocked ? 'Ativo na Nuvem' : 'Requer Companion App'
        },
        {
          name: 'Gestão de Fiados, Dívidas e Clientes',
          desc: 'Controlo de contas correntes, pagamentos parciais e limites de crédito (até 20 clientes no Plano Base, ou 200 no Módulo Pro).',
          isUnlocked: true,
          badge: isDebtsUnlocked ? 'Incluído (Base)' : 'Incluído'
        }
      ]
    },
    {
      category: 'Segurança & Auditoria',
      icon: ShieldCheck,
      items: [
        {
          name: 'Registo Local Imutável SQLite',
          desc: 'Gravação instantânea e à prova de falhas na máquina física.',
          isUnlocked: true,
          badge: 'Segurança Base'
        },
        {
          name: 'Auditoria Avançada de Caixa & Anti-Roubo',
          desc: 'Leituras X/Z, rastreio de anulações, descontos manuais e quebras de stock.',
          isUnlocked: isAuditsUnlocked,
          featureKey: 'advanced_audits',
          badge: isAuditsUnlocked ? 'Desbloqueado' : 'Módulo Pro'
        },
        {
          name: 'Backup em Nuvem & Sincronização Automática (Sync Engine)',
          desc: 'Cópia de segurança contínua de vendas, fechos de caixa e catálogo para o Supabase.',
          isUnlocked: isCloudBackupUnlocked,
          featureKey: 'cloud_backup',
          badge: isCloudBackupUnlocked ? 'Desbloqueado' : 'Módulo Pro'
        }
      ]
    },
    {
      category: 'Utilizadores & Permissões',
      icon: Users,
      items: [
        {
          name: 'Operadores & Caixas Registados',
          desc: isUnlimitedUsersUnlocked ? 'Número ilimitado de caixas e operadores.' : 'Até 3 operadores registados (Plano Essencial).',
          isUnlocked: true,
          badge: isUnlimitedUsersUnlocked ? 'Ilimitado' : 'Até 3 Operadores'
        },
        {
          name: 'Controlo Granular de Permissões por Cargo',
          desc: 'Definição de regras de acesso (anulações, descontos, ver dashboards).',
          isUnlocked: isPermissionsUnlocked,
          featureKey: 'custom_permissions',
          badge: isPermissionsUnlocked ? 'Desbloqueado' : 'Módulo Pro'
        }
      ]
    }
  ];

  return (
    <div className="h-screen overflow-hidden flex flex-col p-4 md:p-6 font-sans select-none transition-colors duration-500 relative bg-slate-50 dark:bg-zinc-950">
      <AmbientBackground />

      {/* Top Header Row */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between w-full max-w-[85vw] mx-auto relative z-10 mb-4 shrink-0"
      >
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-all shadow-xs cursor-pointer"
            title="Voltar"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-zinc-100">
                Minha Subscrição & Detalhes do Plano
              </h1>
              <span className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider border ${
                isProActive 
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800' 
                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
              }`}>
                {isProActive ? 'Plano Pro Ativo' : 'Plano Essencial Grátis'}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-400 font-medium mt-0.5">
              Consulte os recursos ativos, estado do Companion App e gestão de licenças
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <InternetStatusBadge />
          <FullscreenButton />
          <button
            onClick={handleManualSync}
            disabled={isSyncingNow}
            className="px-3.5 py-2 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            title="Sincronizar subscrição e permissões com o Supabase"
          >
            <RefreshCw size={14} className={`text-indigo-500 ${isSyncingNow ? 'animate-spin' : ''}`} />
            <span>{isSyncingNow ? 'A Sincronizar...' : 'Sincronizar'}</span>
          </button>
          <button
            onClick={() => setIsOfflineUnlockOpen(true)}
            className="px-3.5 py-2 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <KeyRound size={15} className="text-indigo-500" />
            <span>Código Offline</span>
          </button>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <div className="w-full max-w-[85vw] mx-auto flex items-center gap-2 mb-4 relative z-10 shrink-0">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850'
          }`}
        >
          <Crown size={15} />
          <span>Plano Atual & Recursos</span>
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'catalog'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850'
          }`}
        >
          <Layers size={15} />
          <span>Planos & Módulos Disponíveis</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'history'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850'
          }`}
        >
          <CreditCard size={15} />
          <span>Comprovativos Enviados ({payments.length})</span>
        </button>
      </div>

      {/* Main Content Area - Scrollable */}
      <div className="w-full max-w-[85vw] mx-auto flex-1 overflow-y-auto space-y-6 relative z-10 pb-8 pr-1">
        
        {activeTab === 'overview' && (
          <>
            {/* Hero Status Banner */}
            <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                    {isProActive ? <Crown size={26} /> : <Sparkles size={26} />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subscrição Ativa</span>
                    <h3 className="text-xl font-black text-slate-900 dark:text-zinc-100">
                      {isProActive 
                        ? `Plano Profissional (${daysRemaining !== null ? `${daysRemaining} dias restantes` : 'Vitalício'})`
                        : 'Plano Essencial (Grátis & Offline-First)'}
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-zinc-400 font-medium max-w-xl leading-relaxed">
                  O seu sistema opera em modo <strong>Offline-First de Alta Velocidade</strong>. Vendas ilimitadas, recibos térmicos e controlo de caixa funcionam localmente com 0% de dependência de internet.
                </p>

                {/* Status Badges */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                    <Database size={13} />
                    <span>Base Local SQLite Imutável</span>
                  </span>

                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                    isCompanionUnlocked
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-800/60'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-zinc-700'
                  }`}>
                    <Smartphone size={13} />
                    <span>Companion App: {isCompanionUnlocked ? 'Sincronização Ao Vivo' : 'Desativado'}</span>
                  </span>
                </div>
              </div>

              {/* Shop ID info pill */}
              <div className="bg-slate-50 dark:bg-zinc-850 p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shrink-0 space-y-2 min-w-[280px]">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-zinc-400 font-medium">ID da Loja:</span>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900 dark:text-zinc-100">
                    <span>{shopId || 'Não registado'}</span>
                    {shopId && (
                      <button 
                        onClick={() => handleCopy(shopId, 'ID da Loja')} 
                        className="hover:text-indigo-600 cursor-pointer"
                        title="Copiar ID"
                      >
                        <Copy size={12} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-zinc-400 font-medium">Terminal Físico:</span>
                  <span className="font-mono text-[11px] text-slate-600 dark:text-zinc-300">
                    {deviceId ? `${deviceId.slice(0, 16)}...` : 'Localhost'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs py-1 border-t border-slate-200/40 dark:border-zinc-800/40">
                  <span className="text-slate-500 dark:text-zinc-400 font-medium">Hardware ID:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-black text-[11px] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.5 rounded border border-indigo-200/60 dark:border-indigo-800/60">
                      {hardwareFingerprint}
                    </span>
                    <button 
                      onClick={() => handleCopy(hardwareFingerprint, 'Hardware Fingerprint')} 
                      className="p-1 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors"
                      title="Copiar Hardware Fingerprint"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-750 flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                  <span className="flex items-center gap-1">
                    <ShieldCheck size={13} />
                    <span>Licença Local Autenticada</span>
                  </span>
                  <button
                    onClick={refreshEntitlements}
                    className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                    title="Atualizar Licenças da Nuvem"
                  >
                    <RefreshCw size={12} />
                  </button>
                </div>
              </div>
            </div>

            {/* Companion App Status Highlight Card */}
            <div className={`p-5 rounded-3xl border transition-all ${
              isCompanionUnlocked
                ? 'bg-gradient-to-r from-indigo-50/80 to-purple-50/50 dark:from-indigo-950/40 dark:to-purple-950/20 border-indigo-200 dark:border-indigo-800/80 shadow-xs'
                : 'bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800'
            }`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className={`p-2.5 rounded-2xl shrink-0 ${
                    isCompanionUnlocked 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-400'
                  }`}>
                    <Smartphone size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-slate-900 dark:text-zinc-100">
                        App Companion do Proprietário (Boss on the Go)
                      </h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isCompanionUnlocked
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                      }`}>
                        {isCompanionUnlocked ? 'Sincronização Ativa' : 'Requer Subscrição'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-zinc-400 font-medium mt-1 leading-relaxed max-w-2xl">
                      {isCompanionUnlocked
                        ? 'O POS envia automaticamente as métricas de Receita Total, Dinheiro ao Vivo em Caixa e Contagem de Vendas para o smartphone do proprietário sempre que ocorrem transações.'
                        : 'Permite ao proprietário consultar a Receita do Dia, Dinheiro em Caixa e Histórico de Vendas em tempo real diretamente do telemóvel.'}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {isCompanionUnlocked ? (
                    <div className="px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-850 border border-indigo-200/80 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 text-xs font-bold flex items-center gap-2">
                      <Radio size={14} className="text-emerald-500 animate-pulse" />
                      <span>Sincronização Automática</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setActiveTab('catalog')}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                    >
                      <Sparkles size={14} />
                      <span>Ativar Companion App</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Current Plan Feature Breakdown Matrix */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-black tracking-tight text-slate-900 dark:text-zinc-100">
                    Detalhes Completos dos Recursos & Módulos do Sistema
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                    Visão transparente de todas as funcionalidades ativas e sob subscrição
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {featureMatrix.map((section, idx) => {
                  const SectionIcon = section.icon;
                  return (
                    <div 
                      key={idx}
                      className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-slate-200/80 dark:border-zinc-800 shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100 dark:border-zinc-800">
                          <div className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                            <SectionIcon size={18} />
                          </div>
                          <h4 className="text-sm font-black text-slate-900 dark:text-zinc-100">
                            {section.category}
                          </h4>
                        </div>

                        <div className="space-y-3.5">
                          {section.items.map((item, itemIdx) => (
                            <div key={itemIdx} className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-2.5">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                                  item.isUnlocked 
                                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' 
                                    : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                                }`}>
                                  {item.isUnlocked ? <Check size={12} strokeWidth={3} /> : <Lock size={11} />}
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                                    {item.name}
                                  </div>
                                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium leading-relaxed">
                                    {item.desc}
                                  </p>
                                </div>
                              </div>

                              <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                item.isUnlocked 
                                  ? 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300' 
                                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                              }`}>
                                {item.badge}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {activeTab === 'catalog' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-black tracking-tight text-slate-900 dark:text-zinc-100">
                  Catálogo de Planos & Módulos Comerciais
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                  Selecione um plano para efetuar o pagamento via M-Pesa / E-Mola
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {plans.map((plan) => {
                const isFeatureLocked = plan.features_included.some(f => !isFeatureUnlocked(f));
                const isUnlocked = !isFeatureLocked;

                return (
                  <div
                    key={plan.id}
                    className={`bg-white dark:bg-zinc-900 rounded-3xl p-6 border transition-all flex flex-col justify-between relative shadow-sm hover:shadow-md ${
                      plan.is_popular 
                        ? 'border-indigo-500 ring-2 ring-indigo-500/20' 
                        : 'border-slate-200/80 dark:border-zinc-800'
                    }`}
                  >
                    {plan.badge && (
                      <span className="absolute -top-3 right-6 bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                        {plan.badge}
                      </span>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-base font-black text-slate-900 dark:text-zinc-100">
                          {plan.name}
                        </h4>
                        {isUnlocked ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                            <Check size={11} strokeWidth={3} />
                            <span>Desbloqueado</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                            <Lock size={11} />
                            <span>Sob Subscrição</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4 font-medium leading-relaxed">
                        {plan.tagline}
                      </p>

                      <div className="mb-5 pb-4 border-b border-slate-100 dark:border-zinc-800">
                        <span className="text-2xl font-black text-slate-900 dark:text-zinc-100">
                          {plan.price_mt.toLocaleString('pt-MZ')} MT
                        </span>
                        <span className="text-xs text-slate-400 dark:text-zinc-500 ml-1.5 font-medium">
                          {plan.period === 'monthly' ? '/ mês' : plan.period === 'quarterly' ? '/ 3 meses' : '/ ano'}
                        </span>
                      </div>

                      <div className="space-y-2.5 mb-6">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          O Que Inclui:
                        </span>
                        {(plan.description || '').split('. ').filter(Boolean).map((feat, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-zinc-300 font-medium">
                            <div className="w-4 h-4 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                              <Check size={11} strokeWidth={3} />
                            </div>
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      {isUnlocked ? (
                        <div className="w-full py-3 px-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                          <Check size={14} strokeWidth={3} />
                          <span>Módulo Ativo e Operacional</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSelectPlan(plan)}
                          className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Smartphone size={15} />
                          <span>Pagar com M-Pesa / E-Mola</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-zinc-100">
                  Histórico de Comprovativos Enviados
                </h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                  Registo de comprovativos M-Pesa e E-Mola submetidos para ativação
                </p>
              </div>
              <button
                onClick={refreshEntitlements}
                className="p-2 text-slate-500 hover:text-indigo-600 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Recarregar Estado"
              >
                <RefreshCw size={16} />
              </button>
            </div>

            {payments.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <Receipt size={32} className="mx-auto mb-2 text-slate-300 dark:text-zinc-600" />
                <p>Nenhum comprovativo de pagamento enviado ainda.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-400 uppercase font-bold text-[10px]">
                      <th className="py-2.5 px-3">Data</th>
                      <th className="py-2.5 px-3">Método</th>
                      <th className="py-2.5 px-3">Código de Transação</th>
                      <th className="py-2.5 px-3">Valor</th>
                      <th className="py-2.5 px-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 font-medium">
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td className="py-2.5 px-3 text-slate-500">
                          {new Date(p.submitted_at).toLocaleDateString('pt-MZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2.5 px-3 uppercase font-bold text-slate-700 dark:text-zinc-300">
                          {p.payment_method}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-zinc-100">
                          {p.reference_code}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-zinc-100">
                          {p.amount_mt.toLocaleString('pt-MZ')} MT
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            p.status === 'approved' 
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' 
                              : p.status === 'rejected'
                              ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                          }`}>
                            {p.status === 'approved' ? 'Aprovado' : p.status === 'rejected' ? 'Recusado' : 'Pendente de Validação'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
