import { RestockLog, DeletedProductItem } from '../utils/historyExport';

export type RestockTabType = 'history' | 'trash';

export interface RestockHistoryProps {
  isAdminUnlocked?: boolean;
  onPromptAdminPin?: (onSuccess: () => void, scope: 'products' | 'orders' | 'history') => void;
  orderSubTab?: 'pending' | 'history';
  onSelectOrderSubTab?: (tab: 'pending' | 'history') => void;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
  activeTab?: 'checker' | 'inventory' | 'orders';
  onSelectTab?: (tab: 'checker' | 'inventory' | 'orders') => void;
}

export type { RestockLog, DeletedProductItem };
