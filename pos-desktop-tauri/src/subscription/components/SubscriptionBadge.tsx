/**
 * @file SubscriptionBadge.tsx
 * @description Header badge displaying active subscription tier (Free, Pro, or Expiring)
 * and triggering the dedicated Subscription Page.
 */

import React from 'react';
import { Crown, Sparkles, Clock, ShieldCheck } from 'lucide-react';
import { useSubscription } from '../subscriptionContext';

interface SubscriptionBadgeProps {
  className?: string;
  showText?: boolean;
}

export function SubscriptionBadge({ className = '', showText = true }: SubscriptionBadgeProps) {
  const { isProActive, daysRemaining, openSubscriptionPage } = useSubscription();

  // If Pro is active and expiring within 5 days
  const isExpiringSoon = isProActive && daysRemaining !== null && daysRemaining <= 5;

  return (
    <button
      onClick={openSubscriptionPage}
      className={`px-2.5 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold shadow-xs cursor-pointer select-none group ${
        isExpiringSoon
          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800/80 hover:bg-amber-100'
          : isProActive
          ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/60'
          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/60 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/40'
      } ${className}`}
      title={
        isExpiringSoon
          ? `Subscrição Pro expira em ${daysRemaining} dias. Clique para renovar.`
          : isProActive
          ? `Plano Pro Ativo${daysRemaining !== null ? ` (${daysRemaining} dias restantes)` : ''}. Clique para gerir.`
          : 'Plano Essencial Grátis • Clique para ver Módulos Pro e Planos'
      }
    >
      {isExpiringSoon ? (
        <Clock size={13} className="text-amber-500 animate-pulse" />
      ) : isProActive ? (
        <Crown size={13} className="text-indigo-600 dark:text-indigo-400 group-hover:rotate-12 transition-transform" />
      ) : (
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <Sparkles size={12} className="text-emerald-600 dark:text-emerald-400" />
        </div>
      )}

      {showText && (
        <span className="tracking-tight">
          {isExpiringSoon
            ? `Renovar (${daysRemaining}d)`
            : isProActive
            ? daysRemaining !== null ? `Pro (${daysRemaining}d)` : 'Pro Ativo'
            : 'Grátis'}
        </span>
      )}
    </button>
  );
}
