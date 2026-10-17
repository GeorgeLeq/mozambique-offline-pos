export type DebtPayment = {
  id: string;
  debt_id: string;
  amount_mt: number;
  payment_method: string;
  created_at: string;
  receipt_id: string | null;
  cashier_name: string | null;
};

export type DebtRecord = {
  id: string;
  customer_name: string;
  amount_mt: number;
  status: 'unpaid' | 'paid';
  phone_number: string | null;
  address: string | null;
  payment_method: string | null;
  created_at: string;
  paid_at: string | null;
  receipt_id: string | null;
  cashier_name: string | null;
  items_json: string | null;
  sync_status?: number;
  original_amount?: number;
  total_paid?: number;
  payment_history?: DebtPayment[];
  is_deleted?: number;
  deleted_at?: string | null;
};
