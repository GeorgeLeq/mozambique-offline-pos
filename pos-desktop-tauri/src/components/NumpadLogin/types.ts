export interface PendingCashUser {
  id: string;
  name: string;
  role: string;
  pin: string;
}

export interface NumpadAuthHookResult {
  pin: string;
  error: boolean;
  isLoading: boolean;
  handleNumberClick: (num: string) => void;
  handleDelete: () => void;
  handleClear: () => void;
  handleLogin: (currentPin: string) => Promise<void>;
  pendingUser: PendingCashUser | null;
  isCashPromptOpen: boolean;
  cashInputValue: string;
  setCashInputValue: (val: string | ((prev: string) => string)) => void;
  handleConfirmCashShift: () => Promise<void>;
  handleCancelCashShift: () => void;
}
