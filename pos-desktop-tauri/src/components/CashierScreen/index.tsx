import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ShoppingBag, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import { AmbientBackground } from '../AmbientBackground';

import { FiadoModal } from './FiadoModal';
import { CashierHeader } from './CashierHeader';
import { ProductGrid } from './ProductGrid';
import { CashierTotal } from './CashierTotal';
import { BlindCloseModal } from './BlindCloseModal';
import { RecentSalesModal } from './RecentSales';
import { TillPayoutModal } from './TillPayoutModal';
import { SuspendedCartsModal, SuspendedCart } from './SuspendedCartsModal';
import { MixedPaymentModal } from './MixedPaymentModal';
import { ChangeCalculatorModal } from './ChangeCalculatorModal';
import { PriceCheckModal } from './PriceCheckModal';
import MobileMoneyConfirmModal from './MobileMoneyConfirmModal';
import { ManualDiscountModal } from './ManualDiscountModal';
import { CartItem } from './hooks/useCart';

import { CashierFiadosModal } from './CashierFiados/index';;
import { SmartExitModal } from './SmartExitModal';
import { CashierAnnouncements } from './CashierAnnouncements';

import { useCart } from './hooks/useCart';
import { useCheckout } from './hooks/useCheckout';
import { useShiftManagement } from './hooks/useShiftManagement';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useCashierScanner } from './hooks/useCashierScanner';
import { usePosAnnouncements } from './hooks/usePosAnnouncements';
import { useI18n } from '../../i18n';

export default function CashierScreen({ onOpenBackoffice }: { onOpenBackoffice: () => void }) {
  const { currentUser, logout } = useAuth();
  const t = useI18n();
  
  // Modals state
  const [isFiadoModalOpen, setIsFiadoModalOpen] = useState(false);
  const [isBlindCloseModalOpen, setIsBlindCloseModalOpen] = useState(false);
  const [isRecentSalesOpen, setIsRecentSalesOpen] = useState(false);
  const [isTillPayoutOpen, setIsTillPayoutOpen] = useState(false);
  
  const [isCashierFiadosOpen, setIsCashierFiadosOpen] = useState(false);
  const [isSmartExitOpen, setIsSmartExitOpen] = useState(false);
  
  const [isSuspendedCartsOpen, setIsSuspendedCartsOpen] = useState(false);
  const [isMixedPaymentOpen, setIsMixedPaymentOpen] = useState(false);
  const [isChangeCalculatorOpen, setIsChangeCalculatorOpen] = useState(false);
  const [isPriceCheckOpen, setIsPriceCheckOpen] = useState(false);
  const [isMobileMoneyConfirmOpen, setIsMobileMoneyConfirmOpen] = useState(false);
  const [mobileMoneyProvider, setMobileMoneyProvider] = useState<'m-pesa' | 'e-mola'>('m-pesa');

  // New features state
  const [isRefundMode, setIsRefundMode] = useState(false);
  const [suspendedCarts, setSuspendedCarts] = useState<SuspendedCart[]>([]);
  const [selectedDiscountItem, setSelectedDiscountItem] = useState<CartItem | null>(null);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);

  // Load suspended carts from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('smartpos_suspended_carts');
      if (saved) {
        setSuspendedCarts(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load suspended carts', e);
    }
  }, []);

  // POS Announcements state & realtime subscription
  const {
    announcements,
    unreadCount: announcementUnreadCount,
    activeUrgentModal,
    isDrawerOpen: isAnnouncementsDrawerOpen,
    setIsDrawerOpen: setIsAnnouncementsDrawerOpen,
    acknowledgeAnnouncement,
    acknowledgeAll: acknowledgeAllAnnouncements
  } = usePosAnnouncements(currentUser);

  // Save suspended carts when changed
  useEffect(() => {
    localStorage.setItem('smartpos_suspended_carts', JSON.stringify(suspendedCarts));
  }, [suspendedCarts]);

  const { cart, setCart, updateQuantity, removeItem, applyDiscount, applyManualDiscount, clearCart } = useCart(currentUser);
  const { isCheckingOut, handleCheckout } = useCheckout(cart, setCart, currentUser, setIsFiadoModalOpen);
  
  // Cart scroll management for rapid scanning of long item lists
  const cartContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottomPill, setShowScrollBottomPill] = useState(false);
  const prevCartLengthRef = useRef(cart.length);

  // Auto-scroll to the newest scanned item
  useEffect(() => {
    if (cart.length > prevCartLengthRef.current) {
      // New item added: smoothly scroll to bottom
      if (cartContainerRef.current) {
        cartContainerRef.current.scrollTo({
          top: cartContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
    prevCartLengthRef.current = cart.length;
  }, [cart.length]);

  const handleCartScroll = () => {
    if (!cartContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = cartContainerRef.current;
    // Show pill if user scrolled up more than 90px from the bottom
    const isScrolledUp = scrollHeight - (scrollTop + clientHeight) > 90;
    setShowScrollBottomPill(isScrolledUp && cart.length > 4);
  };

  const scrollToBottom = () => {
    if (cartContainerRef.current) {
      cartContainerRef.current.scrollTo({
        top: cartContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };
  
  const { dailyTotal, shiftStats, handleCloseShift } = useShiftManagement(
    currentUser,
    cart,
    isBlindCloseModalOpen,
    isTillPayoutOpen,
    setIsBlindCloseModalOpen,
    logout
  );

  const { isScanning } = useCashierScanner(currentUser, setCart, isRefundMode);

  useKeyboardShortcuts(cart, updateQuantity, removeItem, clearCart, () => setIsChangeCalculatorOpen(true));

  const totalDue = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price_mt || item.price || 0) * item.quantity, 0);
  }, [cart]);


  // Hold Cart handler
  const handleHoldCart = () => {
    if (cart.length === 0) return;
    const newSuspended: SuspendedCart = {
      id: crypto.randomUUID(),
      name: `Venda ${suspendedCarts.length + 1}`,
      timestamp: Date.now(),
      cart: [...cart],
      total: totalDue
    };
    setSuspendedCarts(prev => [newSuspended, ...prev]);
    clearCart();
  };

  const handleResumeCart = (suspendedCart: SuspendedCart) => {
    setCart(suspendedCart.cart);
    setSuspendedCarts(prev => prev.filter(c => c.id !== suspendedCart.id));
    setIsSuspendedCartsOpen(false);
  };

  const handleDeleteSuspended = (id: string) => {
    setSuspendedCarts(prev => prev.filter(c => c.id !== id));
  };

  // Trigger Mobile Money confirmation modal
  const triggerMobileMoneyConfirm = (provider: 'm-pesa' | 'e-mola') => {
    setMobileMoneyProvider(provider);
    setIsMobileMoneyConfirmOpen(true);
  };

  return (
    <div className="h-screen w-screen flex flex-col lg:flex-row gap-0 select-none bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-white overflow-hidden relative z-0 transition-colors duration-500">
      <AmbientBackground />

      {/* LEFT PANEL: Cart Table & Cashier Controls */}
      <div 
        className="flex-1 bg-white/60 dark:bg-zinc-950/60  flex flex-col overflow-hidden relative z-10 border-r border-slate-200/80 dark:border-zinc-900 transition-colors duration-500"
      >
        <CashierHeader 
          currentUser={currentUser} 
          isScanning={isScanning} 
          onOpenRecentSales={() => setIsRecentSalesOpen(true)}
          onOpenTillPayout={() => setIsTillPayoutOpen(true)}
          cartLength={cart.length}
          onHoldCart={handleHoldCart}
          onResumeCart={() => setIsSuspendedCartsOpen(true)}
          suspendedCount={suspendedCarts.length}
          onOpenPriceCheck={() => setIsPriceCheckOpen(true)}
          onOpenFiados={() => setIsCashierFiadosOpen(true)}
          isRefundMode={isRefundMode}
          toggleRefundMode={() => setIsRefundMode(!isRefundMode)}
          announcementCount={announcementUnreadCount}
          onOpenAnnouncements={() => setIsAnnouncementsDrawerOpen(true)}
          hasUrgentAnnouncement={Boolean(activeUrgentModal)}
        />

        <div 
          ref={cartContainerRef}
          onScroll={handleCartScroll}
          className="flex-1 overflow-auto hide-scrollbar relative"
        >
          {cart.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="h-full flex flex-col items-center justify-center text-slate-450 dark:text-zinc-600 space-y-4 p-8"
            >
              <div className="w-20 h-20 bg-slate-100/80 dark:bg-zinc-900/60 shadow-inner rounded-3xl flex items-center justify-center border border-slate-200/80 dark:border-zinc-800">
                <ShoppingBag size={36} strokeWidth={1.5} className="text-slate-400 dark:text-zinc-500" />
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-slate-700 dark:text-zinc-300">{t.readyToScan || 'Pronto para escanear artigos'}</p>
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">{t.readyToScanDesc || 'Passe o leitor de código de barras ou use a pesquisa de preço acima.'}</p>
              </div>
            </motion.div>
          ) : (
            <ProductGrid 
              cart={cart} 
              updateQuantity={updateQuantity} 
              removeItem={removeItem} 
              applyDiscount={applyDiscount}
              onOpenDiscountModal={(item) => {
                setSelectedDiscountItem(item);
                setIsDiscountModalOpen(true);
              }}
            />
          )}

          {/* Floating Jump to Latest Scanned Item Button */}
          <AnimatePresence>
            {showScrollBottomPill && (
              <motion.button
                initial={{ opacity: 0, y: 15, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                onClick={scrollToBottom}
                id="cart-scroll-to-latest-btn"
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2.5 bg-slate-900/90 dark:bg-zinc-800/95 hover:bg-slate-950 dark:hover:bg-zinc-700 text-white rounded-full shadow-2xl  border border-slate-700/60 dark:border-zinc-600 text-xs font-bold transition-all cursor-pointer group"
              >
                <ArrowDown size={14} className="group-hover:translate-y-0.5 transition-transform text-indigo-400" />
                <span>{t.jumpToLatest || 'Ir para o mais recente'}</span>
                <span className="bg-indigo-500/20 text-indigo-300 font-mono text-[10px] px-2 py-0.5 rounded-full border border-indigo-400/30">
                  {cart.length} {t.itemsCount || 'artigos'}
                </span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* RIGHT PANEL: Summary & Checkout */}
      <CashierTotal
        totalDue={totalDue}
        cartLength={cart.length}
        currentUser={currentUser}
        onOpenBackoffice={onOpenBackoffice}
        onCloseShift={() => {
          const isIsento = currentUser?.needs_shift_cash === 0 || currentUser?.role === 'Admin' || currentUser?.role === 'Gerente';
          if (isIsento) {
            setIsSmartExitOpen(true);
          } else {
            setIsBlindCloseModalOpen(true);
          }
        }}
        onCheckoutCash={() => setIsChangeCalculatorOpen(true)}
        onCheckoutFiado={() => setIsFiadoModalOpen(true)}
        onCheckoutMPesa={() => triggerMobileMoneyConfirm('m-pesa')}
        onCheckoutEMola={() => triggerMobileMoneyConfirm('e-mola')}
        onCheckoutMixed={() => setIsMixedPaymentOpen(true)}
      />

      {/* Fiado Modal */}
      <FiadoModal 
        isOpen={isFiadoModalOpen}
        onClose={() => setIsFiadoModalOpen(false)}
        onConfirm={(info) => handleCheckout('fiado', info)}
        totalDue={totalDue}
      />

      {/* Blind Close Modal */}
      <BlindCloseModal
        isOpen={isBlindCloseModalOpen}
        onClose={() => setIsBlindCloseModalOpen(false)}
        onConfirmClose={handleCloseShift}
      />

      <RecentSalesModal
        isOpen={isRecentSalesOpen}
        onClose={() => setIsRecentSalesOpen(false)}
      />

      <TillPayoutModal
        isOpen={isTillPayoutOpen}
        onClose={() => setIsTillPayoutOpen(false)}
        userId={currentUser?.id || ''}
      />

      <SuspendedCartsModal
        isOpen={isSuspendedCartsOpen}
        onClose={() => setIsSuspendedCartsOpen(false)}
        suspendedCarts={suspendedCarts}
        onResume={handleResumeCart}
        onDelete={handleDeleteSuspended}
      />

      <MixedPaymentModal
        isOpen={isMixedPaymentOpen}
        onClose={() => setIsMixedPaymentOpen(false)}
        totalDue={totalDue}
        onConfirm={(details) => {
          setIsMixedPaymentOpen(false);
          handleCheckout('mixed', undefined, details);
        }}
      />

      <ChangeCalculatorModal
        isOpen={isChangeCalculatorOpen}
        onClose={() => setIsChangeCalculatorOpen(false)}
        totalDue={totalDue}
        onConfirm={() => {
          setIsChangeCalculatorOpen(false);
          handleCheckout('cash');
        }}
      />

      <PriceCheckModal
        isOpen={isPriceCheckOpen}
        onClose={() => setIsPriceCheckOpen(false)}
      />

      {/* Manual Discount Modal */}
      <ManualDiscountModal
        isOpen={isDiscountModalOpen}
        onClose={() => {
          setIsDiscountModalOpen(false);
          setSelectedDiscountItem(null);
        }}
        item={selectedDiscountItem}
        onApplyDiscount={applyManualDiscount}
      />

      {/* Mobile Money Confirm Modal */}
      <MobileMoneyConfirmModal
        isOpen={isMobileMoneyConfirmOpen}
        onClose={() => setIsMobileMoneyConfirmOpen(false)}
        totalDue={totalDue}
        provider={mobileMoneyProvider}
        onConfirm={(transactionId) => {
          setIsMobileMoneyConfirmOpen(false);
          handleCheckout(mobileMoneyProvider, undefined, undefined, transactionId);
        }}
      />

      {/* Cashier Fiados Management Modal */}
      <CashierFiadosModal
        isOpen={isCashierFiadosOpen}
        onClose={() => setIsCashierFiadosOpen(false)}
        currentUser={currentUser}
      />

      {/* Smart Exit Interceptor Prompt */}
      <SmartExitModal
        isOpen={isSmartExitOpen}
        onClose={() => setIsSmartExitOpen(false)}
        currentUser={currentUser}
        shiftStats={shiftStats}
        dailyTotal={dailyTotal}
        onTriggerCloseShift={() => setIsBlindCloseModalOpen(true)}
        onJustExit={logout}
      />

      {/* POS Announcements & Flash Notices Modal / Drawer */}
      <CashierAnnouncements
        announcements={announcements}
        unreadCount={announcementUnreadCount}
        activeUrgentModal={activeUrgentModal}
        isDrawerOpen={isAnnouncementsDrawerOpen}
        onCloseDrawer={() => setIsAnnouncementsDrawerOpen(false)}
        onAcknowledge={acknowledgeAnnouncement}
        onAcknowledgeAll={acknowledgeAllAnnouncements}
      />
    </div>
  );
}
