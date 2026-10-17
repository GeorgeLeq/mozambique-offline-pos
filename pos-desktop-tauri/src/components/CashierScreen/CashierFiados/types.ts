import { DebtRecord } from '../../ClientManager/types';

export type FiadoStatusFilter = 'all' | 'unpaid' | 'paid';

export interface CashierFiadosModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
}

export interface FiadoSettleFormData {
  amount: string;
  method: string;
}

export interface FiadoItemDetail {
  id: string | number;
  product_id?: string | number;
  product_name: string;
  barcode?: string;
  quantity: number;
  price: number;
  total_mt: number;
}
