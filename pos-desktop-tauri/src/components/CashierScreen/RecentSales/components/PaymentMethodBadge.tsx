import React from 'react';
import { Wallet, Smartphone, BookOpen, CreditCard } from 'lucide-react';

interface PaymentMethodBadgeProps {
  method: string;
}

export function PaymentMethodBadge({ method }: PaymentMethodBadgeProps) {
  const m = (method || '').toLowerCase();
  
  if (m.includes('cash') || m.includes('din')) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <Wallet size={11} /> DIN (Numerário)
      </span>
    );
  }
  
  if (m.includes('mpesa') || m.includes('m-pesa')) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
        <Smartphone size={11} /> M-Pesa
      </span>
    );
  }
  
  if (m.includes('emola') || m.includes('e-mola')) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <Smartphone size={11} /> e-Mola
      </span>
    );
  }
  
  if (m.includes('fiado')) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
        <BookOpen size={11} /> Fiado (Crédito)
      </span>
    );
  }
  
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
      <CreditCard size={11} /> {method || 'Misto / POS'}
    </span>
  );
}
