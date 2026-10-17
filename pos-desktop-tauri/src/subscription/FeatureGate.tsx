/**
 * @file FeatureGate.tsx
 * @description Declarative component wrapper that conditionally renders content
 * or a lock placeholder based on local offline feature entitlement.
 */

import React from 'react';
import { FeatureKey } from './types';
import { useFeatureGate } from './useFeatureGate';
import { Lock, Sparkles, ArrowRight } from 'lucide-react';

interface FeatureGateProps {
  feature: FeatureKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showDefaultLockScreen?: boolean;
  title?: string;
  description?: string;
}

export function FeatureGate({
  feature,
  children,
  fallback,
  showDefaultLockScreen = true,
  title,
  description
}: FeatureGateProps) {
  const { isUnlocked, triggerLockModal } = useFeatureGate(feature);

  if (isUnlocked) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showDefaultLockScreen) {
    return null;
  }

  return (
    <div className="flex-1 w-full h-full flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xl shadow-slate-200/50 dark:shadow-black/50 flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-5 shadow-xs">
          <Lock size={32} />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 text-xs font-bold mb-3 border border-indigo-200/60 dark:border-indigo-800/50">
          <Sparkles size={13} />
          <span>Módulo Pro Comercial</span>
        </div>

        <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-zinc-100 mb-2">
          {title || 'Módulo Protegido por Subscrição'}
        </h3>

        <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed mb-6 font-medium">
          {description || 'Este recurso faz parte do pacote Pro. Ative a funcionalidade para o seu terminal e aumente a produtividade e controle do seu negócio.'}
        </p>

        <button
          onClick={() => triggerLockModal(title, description)}
          className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Ver Planos & Desbloquear</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
