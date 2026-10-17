import React from 'react';
import { Clock } from 'lucide-react';
import { TimeFilterType } from '../types';

interface RecentSalesTimeSectionProps {
  timeFilter: TimeFilterType;
  setTimeFilter: (value: TimeFilterType) => void;
}

const TIME_SLOTS: { id: TimeFilterType; label: string }[] = [
  { id: 'all', label: 'Qualquer hora / Período Geral' },
  { id: 'today_morning', label: 'Hoje de Manhã (06h-12h)' },
  { id: 'today_afternoon', label: 'Hoje de Tarde (12h-18h)' },
  { id: 'today_night', label: 'Hoje de Noite (18h-06h)' },
  { id: 'yesterday_morning', label: 'Ontem de Manhã' },
  { id: 'yesterday_afternoon', label: 'Ontem de Tarde' },
  { id: 'yesterday_night', label: 'Ontem de Noite' },
  { id: 'last_2_days', label: 'Últimos 2 Dias' },
  { id: 'last_7_days', label: 'Últimos 7 Dias' },
  { id: 'last_15_days', label: 'Últimos 15 Dias' },
];

export function RecentSalesTimeSection({ timeFilter, setTimeFilter }: RecentSalesTimeSectionProps) {
  return (
    <div className="relative">
      <select
        value={timeFilter}
        onChange={(e) => setTimeFilter(e.target.value as TimeFilterType)}
        className="w-full pl-3 pr-8 py-1.5 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
        id="time-triangulation-select"
      >
        {TIME_SLOTS.map((slot) => (
          <option key={slot.id} value={slot.id} className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200">
            {slot.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400 dark:text-zinc-500">
        <Clock size={13} />
      </div>
    </div>
  );
}
