import React from 'react';
import { Users, UserCheck, Shield } from 'lucide-react';
import { useEmployeesI18n } from '../../i18n';

interface EmployeeStatsProps {
  totalStaff: number;
  cashiersCount: number;
  adminsCount: number;
}

export function EmployeeStats({ totalStaff, cashiersCount, adminsCount }: EmployeeStatsProps) {
  const t = useEmployeesI18n();

  return (
    <div className="grid grid-cols-3 gap-4 lg:w-auto w-full">
      <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-white/5 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-md">
        <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
          <Users size={18} />
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
            {t.statsTotal || 'Total'}
          </div>
          <div className="text-lg font-bold text-slate-800 dark:text-zinc-100">{totalStaff}</div>
        </div>
      </div>
      <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-white/5 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-md">
        <div className="p-2 bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-xl">
          <UserCheck size={18} />
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
            {t.statsCashiers || t.filterCashiers || 'Operadores'}
          </div>
          <div className="text-lg font-bold text-slate-800 dark:text-zinc-100">{cashiersCount}</div>
        </div>
      </div>
      <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-white/5 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-md">
        <div className="p-2 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl">
          <Shield size={18} />
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
            {t.statsAdmins || t.filterAdmins || 'Admins'}
          </div>
          <div className="text-lg font-bold text-slate-800 dark:text-zinc-100">{adminsCount}</div>
        </div>
      </div>
    </div>
  );
}
