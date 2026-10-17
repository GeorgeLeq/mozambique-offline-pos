import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Bell, 
  AlertTriangle, 
  ShieldAlert, 
  FileText, 
  Cloud, 
  CheckCircle2, 
  Trash2, 
  CheckCheck, 
  Inbox,
  ChevronLeft,
  ChevronRight,
  Receipt,
  DollarSign,
  Search,
  X,
  Clock,
  Settings,
  Package,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useI18n } from '../i18n';
import { getDB } from '../lib/db';
import { 
  deleteNotificationLocalAndCloud, 
  clearReadNotificationsLocalAndCloud, 
  clearAllNotificationsLocalAndCloud, 
  applyNotificationRetention 
} from '../lib/syncEngine/notifications';

const ITEMS_PER_PAGE = 4;

const getNotificationStyles = (type: string) => {
  switch (type) {
    case 'LOW_STOCK':
      return {
        icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
        bgColor: 'bg-amber-500/10 dark:bg-amber-500/15',
        borderColor: 'border-amber-500/30 dark:border-amber-500/20',
        badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
      };
    case 'SECURITY':
    case 'SECURITY_ALERT':
    case 'LOCKDOWN':
      return {
        icon: <ShieldAlert className="w-4 h-4 text-rose-500 animate-pulse" />,
        bgColor: 'bg-rose-500/10 dark:bg-rose-500/15',
        borderColor: 'border-rose-500/30 dark:border-rose-500/20',
        badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
      };
    case 'REFUND_LIMIT_EXCEEDED':
    case 'REFUND':
      return {
        icon: <Receipt className="w-4 h-4 text-rose-500" />,
        bgColor: 'bg-rose-500/10 dark:bg-rose-500/15',
        borderColor: 'border-rose-500/30 dark:border-rose-500/20',
        badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
      };
    case 'HIGH_VALUE_SALE':
      return {
        icon: <DollarSign className="w-4 h-4 text-emerald-500" />,
        bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/15',
        borderColor: 'border-emerald-500/30 dark:border-emerald-500/20',
        badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
      };
    case 'SYNC':
    case 'BACKUP':
    case 'SYSTEM':
      return {
        icon: <Cloud className="w-4 h-4 text-indigo-500" />,
        bgColor: 'bg-indigo-500/10 dark:bg-indigo-500/15',
        borderColor: 'border-indigo-500/30 dark:border-indigo-500/20',
        badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
      };
    case 'REPORT':
    case 'SHIFT_CLOSE':
    case 'SHIFT_CLOSED':
    case 'TILL_PAYOUT':
      return {
        icon: <FileText className="w-4 h-4 text-violet-500" />,
        bgColor: 'bg-violet-500/10 dark:bg-violet-500/15',
        borderColor: 'border-violet-500/30 dark:border-violet-500/20',
        badgeColor: 'bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300'
      };
    default:
      return {
        icon: <Bell className="w-4 h-4 text-blue-500" />,
        bgColor: 'bg-blue-500/10 dark:bg-blue-500/15',
        borderColor: 'border-blue-500/30 dark:border-blue-500/20',
        badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
      };
  }
};

const formatNotificationTime = (isoString?: string, t?: any) => {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const timeStr = date.toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' });

    if (isToday) return t?.timeToday ? t.timeToday.replace('{{time}}', timeStr) : `Hoje, ${timeStr}`;
    if (isYesterday) return t?.timeYesterday ? t.timeYesterday.replace('{{time}}', timeStr) : `Ontem, ${timeStr}`;
    return `${date.toLocaleDateString('pt-MZ', { day: '2-digit', month: '2-digit' })} ${timeStr}`;
  } catch {
    return isoString;
  }
};

export function NotificationMenu({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const t = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'unread' | 'urgent' | 'cash' | 'stock' | 'system'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [retentionDays, setRetentionDays] = useState<number>(30);
  const [showSettingsPopover, setShowSettingsPopover] = useState(false);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [confirmDeleteRead, setConfirmDeleteRead] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadNotifications();
    loadRetentionSetting();

    // Gentle background poll (60s instead of 10s) and only when window is visible
    const interval = setInterval(() => {
      if (!document.hidden) {
        loadNotifications();
      }
    }, 60000);

    const handleRefresh = () => {
      if (!document.hidden) {
        loadNotifications();
      }
    };

    window.addEventListener('pos-sync-status', handleRefresh);
    document.addEventListener('visibilitychange', handleRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('pos-sync-status', handleRefresh);
      document.removeEventListener('visibilitychange', handleRefresh);
    };
  }, []);

  const loadRetentionSetting = async () => {
    try {
      const db = await getDB();
      const rows = await db.select("SELECT value FROM settings WHERE key = 'notif_retention_days'") as { value: string }[];
      if (rows && rows.length > 0) {
        setRetentionDays(parseInt(rows[0].value, 10) || 30);
      }
    } catch {
      setRetentionDays(30);
    }
  };

  const loadNotifications = async () => {
    try {
      const db = await getDB();
      const notifs = await db.select('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 100');
      setNotifications(notifs || []);
    } catch (e) {
      console.warn('Failed to load notifications', e);
    }
  };

  const handleMarkAsRead = async (id: string, actionUrl?: string) => {
    try {
      const db = await getDB();
      await db.execute('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      
      if (actionUrl) {
        onNavigate(actionUrl);
        setIsOpen(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const db = await getDB();
      await db.execute('UPDATE notifications SET is_read = 1');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (e) {
      console.error('Failed to mark all as read', e);
    }
  };

  const handleDeleteSingle = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setNotifications(prev => prev.filter(n => n.id !== id));
      await deleteNotificationLocalAndCloud(id);
    } catch (e) {
      console.error('Failed to delete notification', e);
    }
  };

  const handleClearRead = async () => {
    try {
      setIsDeleting(true);
      setNotifications(prev => prev.filter(n => !n.is_read));
      await clearReadNotificationsLocalAndCloud();
      setConfirmDeleteRead(false);
    } catch (e) {
      console.error('Failed to clear read notifications', e);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearAll = async () => {
    try {
      setIsDeleting(true);
      setNotifications([]);
      await clearAllNotificationsLocalAndCloud();
      setConfirmDeleteAll(false);
    } catch (e) {
      console.error('Failed to clear all notifications', e);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateRetention = async (days: number) => {
    try {
      setRetentionDays(days);
      await applyNotificationRetention(days);
      await loadNotifications();
      setShowSettingsPopover(false);
    } catch (e) {
      console.error('Failed to update retention days', e);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const readCount = notifications.length - unreadCount;

  // Filter & Search Logic
  const filteredNotifications = useMemo(() => {
    return notifications.filter(notif => {
      // 1. Category filter
      if (categoryFilter === 'unread' && notif.is_read) return false;
      if (categoryFilter === 'urgent') {
        const isUrgent = ['LOW_STOCK', 'SECURITY', 'SECURITY_ALERT', 'LOCKDOWN', 'REFUND_LIMIT_EXCEEDED'].includes(notif.type);
        if (!isUrgent) return false;
      }
      if (categoryFilter === 'cash') {
        const isCash = ['SHIFT_CLOSE', 'SHIFT_CLOSED', 'HIGH_VALUE_SALE', 'REPORT', 'TILL_PAYOUT', 'REFUND'].includes(notif.type);
        if (!isCash) return false;
      }
      if (categoryFilter === 'stock') {
        const isStock = ['LOW_STOCK', 'RESTOCK'].includes(notif.type);
        if (!isStock) return false;
      }
      if (categoryFilter === 'system') {
        const isSystem = ['SYNC', 'BACKUP', 'SYSTEM', 'AUDIT'].includes(notif.type);
        if (!isSystem) return false;
      }

      // 2. Search query matching across title, message, type, action_url
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = (notif.title || '').toLowerCase().includes(q);
        const msgMatch = (notif.message || '').toLowerCase().includes(q);
        const typeMatch = (notif.type || '').toLowerCase().includes(q);
        const urlMatch = (notif.action_url || '').toLowerCase().includes(q);
        return titleMatch || msgMatch || typeMatch || urlMatch;
      }

      return true;
    });
  }, [notifications, categoryFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const paginatedNotifications = filteredNotifications.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleCategoryChange = (cat: typeof categoryFilter) => {
    setCategoryFilter(cat);
    setCurrentPage(1);
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setShowSettingsPopover(false);
          setConfirmDeleteAll(false);
          setConfirmDeleteRead(false);
        }}
        className="w-12 h-12 flex items-center justify-center bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm hover:shadow-md transition-all relative group cursor-pointer"
        id="btn-notifications-toggle"
        title={t.notificationCenterTitle}
      >
        <Bell className="text-slate-600 dark:text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 w-5 h-5 transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-lg border-2 border-white dark:border-zinc-900 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Portaled Zero-Scroll Modal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-[99998] bg-black/20 backdrop-blur-2xs"
                onClick={() => {
                  setIsOpen(false);
                  setShowSettingsPopover(false);
                  setConfirmDeleteAll(false);
                  setConfirmDeleteRead(false);
                }}
              />

              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="fixed top-20 right-6 w-[430px] max-w-[calc(100vw-1.5rem)] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[2rem] shadow-2xl overflow-hidden z-[99999] flex flex-col h-[590px]"
                onClick={(e) => e.stopPropagation()}
                id="panel-notifications-container"
              >
                {/* Header */}
                <div className="p-4 px-5 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between bg-slate-50/70 dark:bg-zinc-950/50 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                      <Bell size={16} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2 text-sm leading-tight">
                        {t.notificationsHeader}
                        {unreadCount > 0 && (
                          <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                            {(unreadCount === 1 ? t.notificationsNew : t.notificationsNewPlural).replace('{{count}}', String(unreadCount))}
                          </span>
                        )}
                      </h3>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">{t.notificationsSubHeader}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Retention Setting Toggle */}
                    <button
                      onClick={() => setShowSettingsPopover(!showSettingsPopover)}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${showSettingsPopover ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'}`}
                      title={t.configAutoPruneTooltip}
                    >
                      <Settings size={15} />
                    </button>

                    {/* Mark all as read */}
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-all text-xs font-bold cursor-pointer"
                        title={t.markAllAsReadTooltip}
                      >
                        <CheckCheck size={16} />
                      </button>
                    )}

                    {/* Close modal */}
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300 transition-colors text-xs font-bold cursor-pointer ml-0.5"
                      title={t.closeBtn}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Sub-Header: Settings Popover for Auto-Delete Retention */}
                <AnimatePresence>
                  {showSettingsPopover && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="bg-indigo-50/70 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-900/40 px-4 py-3 shrink-0 overflow-hidden"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                          <Clock size={13} className="text-indigo-600 dark:text-indigo-400" />
                          {t.autoDeleteOldNotifs}
                        </span>
                        <span className="text-[10px] font-mono text-indigo-700 dark:text-indigo-400 font-bold">
                          SQLite + Supabase
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-zinc-400 mb-2.5 leading-tight">
                        {t.autoDeleteDescription}
                      </p>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { label: t.daysOption15, value: 15 },
                          { label: t.daysOption30, value: 30 },
                          { label: t.daysOption90, value: 90 },
                          { label: t.daysOptionNever, value: 0 }
                        ].map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => handleUpdateRetention(opt.value)}
                            className={`py-1 px-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${retentionDays === opt.value ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 hover:border-indigo-400'}`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Universal Search Bar */}
                <div className="p-3 border-b border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
                  <div className="relative flex items-center">
                    <Search className="absolute left-3 w-4 h-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder={t.searchNotifsPlaceholder}
                      className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/80 rounded-xl text-xs font-medium text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
                        title={t.clearSearchTooltip}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Category Pills & Bulk Action Bar - 1-Tap Policy (No horizontal scroll) */}
                <div className="px-3 py-2 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/40 dark:bg-zinc-900/40 shrink-0">
                  <div className="grid grid-cols-5 gap-1.5 w-full">
                    <button
                      onClick={() => handleCategoryChange('all')}
                      className={`py-1.5 px-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer text-center truncate flex items-center justify-center gap-1 ${categoryFilter === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white dark:bg-zinc-800/70 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200/50 dark:border-zinc-700/50'}`}
                      title={t.catAll.replace('{{count}}', String(notifications.length))}
                    >
                      <Bell size={12} className="shrink-0" />
                      <span className="truncate">{t.catAll.replace('{{count}}', String(notifications.length))}</span>
                    </button>
                    <button
                      onClick={() => handleCategoryChange('unread')}
                      className={`py-1.5 px-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer text-center truncate flex items-center justify-center gap-1 ${categoryFilter === 'unread' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white dark:bg-zinc-800/70 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200/50 dark:border-zinc-700/50'}`}
                      title={t.catUnread.replace('{{count}}', String(unreadCount))}
                    >
                      <Inbox size={12} className="shrink-0" />
                      <span className="truncate">{t.catUnread.replace('{{count}}', String(unreadCount))}</span>
                    </button>
                    <button
                      onClick={() => handleCategoryChange('urgent')}
                      className={`py-1.5 px-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer text-center truncate flex items-center justify-center gap-1 ${categoryFilter === 'urgent' ? 'bg-rose-600 text-white shadow-xs' : 'bg-white dark:bg-zinc-800/70 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200/50 dark:border-zinc-700/50'}`}
                      title={t.catUrgent}
                    >
                      <AlertTriangle size={12} className="text-rose-500 group-hover:text-white shrink-0" />
                      <span className="truncate">{t.catUrgent}</span>
                    </button>
                    <button
                      onClick={() => handleCategoryChange('cash')}
                      className={`py-1.5 px-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer text-center truncate flex items-center justify-center gap-1 ${categoryFilter === 'cash' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white dark:bg-zinc-800/70 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200/50 dark:border-zinc-700/50'}`}
                      title={t.catCash}
                    >
                      <DollarSign size={12} className="text-emerald-500 shrink-0" />
                      <span className="truncate">{t.catCash}</span>
                    </button>
                    <button
                      onClick={() => handleCategoryChange('stock')}
                      className={`py-1.5 px-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer text-center truncate flex items-center justify-center gap-1 ${categoryFilter === 'stock' ? 'bg-amber-600 text-white shadow-xs' : 'bg-white dark:bg-zinc-800/70 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200/50 dark:border-zinc-700/50'}`}
                      title={t.catStock}
                    >
                      <Package size={12} className="text-amber-500 shrink-0" />
                      <span className="truncate">{t.catStock}</span>
                    </button>
                  </div>
                </div>

                {/* Bulk Cleanup Banner (If items exist) */}
                {notifications.length > 0 && (
                  <div className="px-4 py-1.5 bg-slate-100/60 dark:bg-zinc-950/40 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-zinc-400 shrink-0">
                    <span className="truncate">
                      {searchQuery 
                        ? t.foundCount.replace('{{count}}', String(filteredNotifications.length))
                        : t.listedCount.replace('{{count}}', String(filteredNotifications.length))}
                    </span>
                    <div className="flex items-center gap-2">
                      {readCount > 0 && (
                        <button
                          onClick={() => setConfirmDeleteRead(true)}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-bold transition-colors cursor-pointer"
                        >
                          {t.clearReadBtn.replace('{{count}}', String(readCount))}
                        </button>
                      )}
                      <button
                        onClick={() => setConfirmDeleteAll(true)}
                        className="text-rose-500 hover:text-rose-700 font-bold transition-colors cursor-pointer"
                      >
                        {t.clearAllBtn}
                      </button>
                    </div>
                  </div>
                )}

                {/* Confirm Delete Read Modal */}
                {confirmDeleteRead && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 flex items-center justify-between gap-2 shrink-0">
                    <div className="text-xs text-amber-900 dark:text-amber-200">
                      {t.confirmClearRead.replace('{{count}}', String(readCount))}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setConfirmDeleteRead(false)}
                        className="px-2 py-1 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 cursor-pointer"
                      >
                        {t.noBtn}
                      </button>
                      <button
                        onClick={handleClearRead}
                        disabled={isDeleting}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        {isDeleting ? t.clearingText : t.yesClearBtn}
                      </button>
                    </div>
                  </div>
                )}

                {/* Confirm Delete All Modal */}
                {confirmDeleteAll && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/60 flex items-center justify-between gap-2 shrink-0">
                    <div className="text-xs text-rose-900 dark:text-rose-200">
                      {t.confirmClearAll.replace('{{count}}', String(notifications.length))}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setConfirmDeleteAll(false)}
                        className="px-2 py-1 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 cursor-pointer"
                      >
                        {t.cancelBtn}
                      </button>
                      <button
                        onClick={handleClearAll}
                        disabled={isDeleting}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        {isDeleting ? t.deletingText : t.deleteAllBtn}
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Zero-Scroll Paginated List (Strict Fixed Height) */}
                <div className="flex-1 overflow-hidden divide-y divide-slate-100 dark:divide-zinc-800/60 flex flex-col justify-start">
                  {paginatedNotifications.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-10 px-6 text-center">
                      <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-zinc-800/50 flex items-center justify-center mb-3">
                        <Inbox className="w-6 h-6 text-slate-400 dark:text-zinc-600" />
                      </div>
                      <p className="text-slate-800 dark:text-zinc-200 text-sm font-bold">{t.noNotifsTitle}</p>
                      <p className="text-slate-400 dark:text-zinc-500 text-xs mt-1 max-w-[220px] leading-relaxed">
                        {searchQuery 
                          ? t.noNotifsSearch
                          : t.noNotifsClean}
                      </p>
                    </div>
                  ) : (
                    paginatedNotifications.map(notif => {
                      const styles = getNotificationStyles(notif.type);
                      const isUnread = !notif.is_read;

                      return (
                        <div
                          key={notif.id}
                          onClick={() => handleMarkAsRead(notif.id, notif.action_url)}
                          className={`w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-all flex gap-3 relative group/item cursor-pointer border-l-3 ${isUnread ? 'border-indigo-600 bg-indigo-50/15 dark:bg-indigo-500/5' : 'border-transparent'}`}
                        >
                          {/* Left Icon Container */}
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${styles.bgColor} ${styles.borderColor}`}>
                            {styles.icon}
                          </div>

                          {/* Content Area */}
                          <div className="flex-1 min-w-0 pr-7">
                            <div className="flex items-center justify-between gap-1">
                              <p className={`text-xs font-bold tracking-tight truncate ${isUnread ? 'text-slate-900 dark:text-zinc-100 font-extrabold' : 'text-slate-700 dark:text-zinc-300'}`}>
                                {notif.title}
                              </p>
                              {isUnread && (
                                <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                              )}
                            </div>

                            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-snug line-clamp-2">
                              {notif.message}
                            </p>

                            <div className="flex items-center justify-between mt-1.5">
                              <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-bold font-mono tracking-wide uppercase flex items-center gap-1">
                                <Clock size={10} />
                                {formatNotificationTime(notif.created_at, t)}
                              </span>

                              {notif.action_url && (
                                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5 group-hover/item:translate-x-0.5 transition-transform">
                                  {t.viewAction} <ArrowRight size={10} />
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Delete Single Action */}
                          <div className="absolute right-2 top-2 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center gap-1">
                            <button
                              onClick={(e) => handleDeleteSingle(notif.id, e)}
                              className="p-1.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-400 hover:text-rose-600 dark:text-zinc-500 dark:hover:text-rose-400 shadow-xs transition-colors cursor-pointer"
                              title={t.deleteNotifTooltip}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Fixed Pagination Bar (Zero-Scroll Navigation) */}
                {filteredNotifications.length > ITEMS_PER_PAGE && (
                  <div className="px-4 py-2 border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50/60 dark:bg-zinc-950/40 flex items-center justify-between text-xs font-bold text-slate-500 dark:text-zinc-400 shrink-0">
                    <span className="text-[10px] font-mono">
                      {t.paginationInfo
                        .replace('{{page}}', String(safePage))
                        .replace('{{total}}', String(totalPages))
                        .replace('{{count}}', String(filteredNotifications.length))}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={safePage === 1}
                        className="p-1 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                        title={t.previousBtn}
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={safePage === totalPages}
                        className="p-1 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                        title={t.nextBtn}
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Footer status */}
                <div className="p-2.5 border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50/80 dark:bg-zinc-950/70 text-center flex items-center justify-between px-4 text-[10px] text-slate-400 dark:text-zinc-500 font-semibold tracking-wider font-mono shrink-0">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={11} className="text-emerald-500" />
                    <span>
                      {t.autoCleanupLabel.replace(
                        '{{days}}',
                        retentionDays > 0 ? `${retentionDays} ${t.daysOption15.split(' ')[1] || 'Dias'}` : t.autoCleanupDisabled
                      )}
                    </span>
                  </div>
                  <span>Offline-First</span>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
