import { SaleItem } from '../types';

export type WizardStep = 'pin' | 'condition' | 'reversal';
export type ItemCondition = 'shelf' | 'damaged';

export interface RefundPolicySettings {
  refundTimeLimit: string;
  refundAuthLevel: string;
  refundMethod: string;
  authTriggerVoid: boolean;
  authTriggerRefund: boolean;
}

export interface RecentSalesRefundWizardProps {
  isOpen: boolean;
  onClose: () => void;
  refundItem: SaleItem | null;
  refundReceiptId: string;
  onRefundComplete: () => void;
}
