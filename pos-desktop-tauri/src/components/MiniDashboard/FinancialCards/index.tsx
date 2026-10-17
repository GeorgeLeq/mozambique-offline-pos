import React from 'react';
import RotatingRevenueCard from './RotatingRevenueCard';
import PendingDebtsCard from './PendingDebtsCard';
import ExpectedCashCard from './ExpectedCashCard';

export { RotatingRevenueCard, PendingDebtsCard, ExpectedCashCard };

interface FinancialCardsProps {
  todayRevenue: number;
  mpesaRevenue: number;
  emolaRevenue: number;
  cashSalesTotal: number;
  pendingDebts: number;
  expectedCash: number;
  baseCash: number;
  payoutsTotal: number;
  salesGoal?: number;
  rotationSpeed?: number; // Rotation interval in seconds (0 = paused)
  onNavigate: (tab: string) => void;
  formatCurrency: (val: number) => string;
  recentDebtors?: { id: string; customer_name: string; phone_number: string; amount_mt: number; created_at: string }[];
  cashierBreakdown?: any[];
}

export default function FinancialCards({
  todayRevenue,
  mpesaRevenue,
  emolaRevenue,
  cashSalesTotal,
  pendingDebts,
  expectedCash,
  baseCash,
  payoutsTotal,
  salesGoal = 10000,
  rotationSpeed = 15,
  onNavigate,
  formatCurrency,
  recentDebtors = [],
  cashierBreakdown = []
}: FinancialCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Smart Rotating Revenue Card */}
      <RotatingRevenueCard
        todayRevenue={todayRevenue}
        mpesaRevenue={mpesaRevenue}
        emolaRevenue={emolaRevenue}
        cashSalesTotal={cashSalesTotal}
        baseCash={baseCash}
        payoutsTotal={payoutsTotal}
        salesGoal={salesGoal}
        rotationSpeed={rotationSpeed}
        formatCurrency={formatCurrency}
      />

      {/* Pending Debts Card (Fiados Activos) */}
      <PendingDebtsCard
        pendingDebts={pendingDebts}
        recentDebtors={recentDebtors}
        onNavigate={onNavigate}
        formatCurrency={formatCurrency}
      />

      {/* Expected Cash Card (Cofre Estimado) */}
      <ExpectedCashCard
        expectedCash={expectedCash}
        pendingDebts={pendingDebts}
        baseCash={baseCash}
        cashSalesTotal={cashSalesTotal}
        payoutsTotal={payoutsTotal}
        formatCurrency={formatCurrency}
        cashierBreakdown={cashierBreakdown}
        onNavigate={onNavigate}
      />
    </div>
  );
}
