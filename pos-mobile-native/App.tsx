import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator, BackHandler, ToastAndroid, Platform } from 'react-native';
import { TrendingUp, Users, ShoppingCart, Truck, Zap } from 'lucide-react-native';
import tw from 'twrnc';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import DebtScreen from './screens/DebtScreen';
import EmployeeManagementScreen from './screens/EmployeeManagementScreen';
import InventoryScreen from './screens/InventoryScreen';
import DeliveriesScreen from './screens/DeliveriesScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import SendAnnouncementScreen from './screens/SendAnnouncementScreen';
import CompanionLockedScreen from './screens/CompanionLockedScreen';

import { ToastProvider, useToast } from './components/Toast';
import { supabase } from './supabase';
import { usePushNotifications } from './hooks/usePushNotifications';
import ScreenContainer from './components/ScreenContainer';
import { getSafeBottomPadding } from './utils/layout';
import { LanguageProvider, useLanguage } from './locales';
import { ThemeProvider, useTheme } from './theme';

type ScreenType = 'dashboard' | 'debts' | 'employees' | 'inventory' | 'deliveries' | 'notifications' | 'create_announcement';

function RealtimeNotificationListener({ shopId }: { shopId: string }) {
  const { showToast } = useToast();

  useEffect(() => {
    if (!shopId) return;

    const handledIds = new Set<string>();

    const channel = supabase
      .channel(`global-notifications-${shopId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `shop_id=eq.${shopId}`,
        },
        (payload) => {
          if (payload.new) {
            const id = payload.new.id;
            if (handledIds.has(id)) return;
            handledIds.add(id);
            setTimeout(() => handledIds.delete(id), 10000);

            const title = payload.new.title || 'Alert';
            const message = payload.new.message || '';
            const type = payload.new.type;
            const actionUrl = payload.new.action_url;

            if (type === 'AUTHORIZATION_REQUEST' || actionUrl === 'remote_authorization') {
              let authId = null;
              try {
                const metadata = typeof payload.new.metadata === 'string'
                  ? JSON.parse(payload.new.metadata)
                  : (payload.new.metadata || {});
                authId = metadata.id;
              } catch (e) {}

              if (authId) {
                const dupKey = `auth-${authId}`;
                if (handledIds.has(dupKey)) return;
                handledIds.add(dupKey);
                setTimeout(() => handledIds.delete(dupKey), 10000);
              }
              showToast(`🔑 Request: ${title} - ${message}`, 'info');
            } else {
              showToast(`📢 ${title}: ${message}`, 'info');
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'remote_authorizations',
          filter: `shop_id=eq.${shopId}`,
        },
        (payload) => {
          if (payload.new) {
            const id = payload.new.id;
            const dupKey = `auth-${id}`;
            if (handledIds.has(dupKey)) return;
            handledIds.add(dupKey);
            setTimeout(() => handledIds.delete(dupKey), 10000);

            const cashier = payload.new.cashier_name || 'Cashier';
            const reqType = payload.new.request_type || 'Request';
            const desc = payload.new.description || '';

            showToast(`🔑 Auth Request: ${reqType} by ${cashier} (${desc})`, 'info');
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'emergency_tokens',
          filter: `shop_id=eq.${shopId}`,
        },
        (payload) => {
          if (payload.new && payload.new.is_used) {
            const code = payload.new.code || '';
            const purpose = payload.new.used_for || 'POS Override';
            const dupKey = `token-used-${payload.new.id}`;
            if (handledIds.has(dupKey)) return;
            handledIds.add(dupKey);
            setTimeout(() => handledIds.delete(dupKey), 10000);

            showToast(`🎟️ One-Time PIN #${code} was used on POS for ${purpose}!`, 'info');
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'expected_deliveries',
          filter: `shop_id=eq.${shopId}`,
        },
        (payload) => {
          if (payload.new) {
            const supplier = payload.new.supplier_name || 'Supplier';
            const po = payload.new.po_number || '';
            showToast(`🚚 New Expected Delivery: ${supplier} (PO #${po})`, 'info');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shopId, showToast]);

  return null;
}

function MainApp() {
  const { t } = useLanguage();
  const { isDark, colors } = useTheme();
  const [shopData, setShopData] = useState<any>(null);
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('dashboard');
  const [screenHistory, setScreenHistory] = useState<ScreenType[]>(['dashboard']);
  const [announcementTarget, setAnnouncementTarget] = useState<{ id: string; name: string; role?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const lastBackPressTimeRef = useRef<number>(0);

  // Navigation function that records screen stack history
  const navigateTo = useCallback((screen: ScreenType) => {
    setCurrentScreen(screen);
    setScreenHistory((prev) => {
      if (prev[prev.length - 1] === screen) return prev;
      return [...prev, screen];
    });
  }, []);

  const handleOpenAnnouncement = useCallback((target?: { id: string; name: string; role?: string } | null) => {
    setAnnouncementTarget(target || null);
    navigateTo('create_announcement');
  }, [navigateTo]);

  // Back navigation function
  const goBack = useCallback(() => {
    setScreenHistory((prev) => {
      if (prev.length > 1) {
        const nextHistory = prev.slice(0, -1);
        const prevScreen = nextHistory[nextHistory.length - 1];
        setCurrentScreen(prevScreen);
        return nextHistory;
      } else if (currentScreen !== 'dashboard') {
        setCurrentScreen('dashboard');
        return ['dashboard'];
      }
      return prev;
    });
  }, [currentScreen]);

  // Root Android Hardware / Gesture Back Button Handler
  useEffect(() => {
    const handleHardwareBack = () => {
      // 1. If not logged in, allow native back behavior
      if (!shopData) return false;

      // 2. If not on dashboard, go back to previous screen in stack
      if (currentScreen !== 'dashboard' || screenHistory.length > 1) {
        goBack();
        return true; // Consume event, prevent app exit
      }

      // 3. If on dashboard with no back history: confirm exit with 2-second double-tap
      const now = Date.now();
      if (now - lastBackPressTimeRef.current < 2000) {
        // Second press within 2s -> exit gracefully
        BackHandler.exitApp();
        return true;
      }

      lastBackPressTimeRef.current = now;
      if (Platform.OS === 'android') {
        ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);
      }
      return true; // Prevent abrupt app exit
    };

    const backSubscription = BackHandler.addEventListener(
      'hardwareBackPress',
      handleHardwareBack
    );

    return () => {
      backSubscription.remove();
    };
  }, [shopData, currentScreen, screenHistory, goBack]);

  // Setup push notifications and save push tokens to the database
  const { clickedNotification } = usePushNotifications(shopData?.id);

  useEffect(() => {
    if (clickedNotification) {
      try {
        const data = clickedNotification.notification?.request?.content?.data;
        if (data) {
          if (data.url === 'expected_deliveries' || data.type === 'EXPECTED_DELIVERY') {
            navigateTo('deliveries');
          } else {
            navigateTo('notifications');
          }
        }
      } catch (err) {
        console.error('Error navigating via notification click:', err);
      }
    }
  }, [clickedNotification, navigateTo]);

  useEffect(() => {
    checkSavedLogin();
  }, []);

  const checkSavedLogin = async () => {
    try {
      const saved = await AsyncStorage.getItem('boss_shop_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        setShopData(parsed);

        // Proactively refresh shop companion access status from Supabase
        if (parsed.id) {
          try {
            const { data } = await supabase
              .from('shops')
              .select('id, name, code, companion_app_enabled, companion_app_expires_at')
              .eq('id', parsed.id)
              .single();

            if (data) {
              const updated = {
                ...parsed,
                ...data,
                companion_app_enabled: data.companion_app_enabled ?? false,
              };
              setShopData(updated);
              await AsyncStorage.setItem('boss_shop_data', JSON.stringify(updated));
            }
          } catch (syncErr) {
            // Offline or network error, retain existing state
          }
        }
      }
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = async (data: any) => {
    setShopData(data);
    setCurrentScreen('dashboard');
    setScreenHistory(['dashboard']);
    try {
      await AsyncStorage.setItem('boss_shop_data', JSON.stringify(data));
    } catch (e) {}
  };

  const handleLogout = async () => {
    setShopData(null);
    setScreenHistory(['dashboard']);
    try {
      await AsyncStorage.removeItem('boss_shop_data');
    } catch (e) {}
  };

  if (loading) {
    return (
      <ToastProvider>
        <View style={tw`flex-1 bg-black justify-center items-center`}>
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      </ToastProvider>
    );
  }

  if (!shopData) {
    return (
      <ToastProvider>
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      </ToastProvider>
    );
  }

  // Option 2 Subscription Lock Guard:
  // If companion_app_enabled is false, or if time-limited expiration has passed
  const isCompanionEnabled = shopData.companion_app_enabled === true;
  const isExpired = shopData.companion_app_expires_at
    ? new Date(shopData.companion_app_expires_at).getTime() < Date.now()
    : false;

  if (!isCompanionEnabled || isExpired) {
    return (
      <ToastProvider>
        <ScreenContainer withTopInset={true}>
          <CompanionLockedScreen
            shopData={shopData}
            onUnlocked={(updatedShop) => {
              setShopData(updatedShop);
              AsyncStorage.setItem('boss_shop_data', JSON.stringify(updatedShop)).catch(() => {});
            }}
            onLogout={handleLogout}
          />
        </ScreenContainer>
      </ToastProvider>
    );
  }

  const isNavVisible = currentScreen !== 'employees' && currentScreen !== 'create_announcement';
  const bottomPadding = getSafeBottomPadding();

  return (
    <ToastProvider>
      {shopData?.id ? <RealtimeNotificationListener shopId={shopData.id} /> : null}
      <ScreenContainer withTopInset={true}>
        <View style={tw`flex-1`}>
          {currentScreen === 'dashboard' ? (
            <DashboardScreen 
              shopData={shopData} 
              onLogout={handleLogout} 
              onViewAllEmployees={() => navigateTo('employees')}
              onOpenAnnouncement={handleOpenAnnouncement}
              onViewDeliveries={() => navigateTo('deliveries')}
            />
          ) : null}
          {currentScreen === 'debts' ? (
            <DebtScreen shopData={shopData} />
          ) : null}
          {currentScreen === 'employees' ? (
            <EmployeeManagementScreen 
              shopData={shopData} 
              onBack={goBack} 
              onOpenAnnouncementScreen={handleOpenAnnouncement}
            />
          ) : null}
          {currentScreen === 'inventory' ? (
            <InventoryScreen 
              shopData={shopData} 
              onBack={goBack}
            />
          ) : null}
          {currentScreen === 'deliveries' ? (
            <DeliveriesScreen shopData={shopData} />
          ) : null}
          {currentScreen === 'notifications' ? (
            <NotificationsScreen shopData={shopData} />
          ) : null}
          {currentScreen === 'create_announcement' ? (
            <SendAnnouncementScreen
              shopData={shopData}
              targetCashier={announcementTarget}
              onBack={goBack}
              onSuccess={() => {
                setAnnouncementTarget(null);
              }}
            />
          ) : null}
        </View>

        {isNavVisible ? (
          <View
            style={[
              {
                backgroundColor: colors.card,
                borderTopColor: colors.border,
                borderTopWidth: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-around',
                paddingHorizontal: 8,
                paddingTop: 8,
                paddingBottom: Math.max(bottomPadding, 8),
                minHeight: 64,
              },
            ]}
          >
            <TouchableOpacity 
              style={tw`flex-1 items-center justify-center py-1 rounded-xl ${
                currentScreen === 'dashboard' ? (isDark ? 'bg-[#4F46E5]/10' : 'bg-[#4F46E5]/15') : ''
              }`}
              onPress={() => navigateTo('dashboard')}
            >
              <TrendingUp size={18} color={currentScreen === 'dashboard' ? '#6366F1' : (isDark ? '#71717A' : '#94A3B8')} />
              <Text style={tw`text-[9px] mt-1 font-bold tracking-wider ${
                currentScreen === 'dashboard' ? 'text-[#6366F1]' : (isDark ? 'text-zinc-500' : 'text-zinc-500')
              }`}>{t('DASHBOARD')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={tw`flex-1 items-center justify-center py-1 rounded-xl ${
                currentScreen === 'inventory' ? (isDark ? 'bg-[#4F46E5]/10' : 'bg-[#4F46E5]/15') : ''
              }`}
              onPress={() => navigateTo('inventory')}
            >
              <ShoppingCart size={18} color={currentScreen === 'inventory' ? '#6366F1' : (isDark ? '#71717A' : '#94A3B8')} />
              <Text style={tw`text-[9px] mt-1 font-bold tracking-wider ${
                currentScreen === 'inventory' ? 'text-[#6366F1]' : (isDark ? 'text-zinc-500' : 'text-zinc-500')
              }`}>{t('INVENTORY')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={tw`flex-1 items-center justify-center py-1 rounded-xl ${
                currentScreen === 'debts' ? (isDark ? 'bg-[#4F46E5]/10' : 'bg-[#4F46E5]/15') : ''
              }`}
              onPress={() => navigateTo('debts')}
            >
              <Users size={18} color={currentScreen === 'debts' ? '#6366F1' : (isDark ? '#71717A' : '#94A3B8')} />
              <Text style={tw`text-[9px] mt-1 font-bold tracking-wider ${
                currentScreen === 'debts' ? 'text-[#6366F1]' : (isDark ? 'text-zinc-500' : 'text-zinc-500')
              }`}>{t('FIADO')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={tw`flex-1 items-center justify-center py-1 rounded-xl ${
                currentScreen === 'deliveries' ? (isDark ? 'bg-[#4F46E5]/10' : 'bg-[#4F46E5]/15') : ''
              }`}
              onPress={() => navigateTo('deliveries')}
            >
              <Truck size={18} color={currentScreen === 'deliveries' ? '#6366F1' : (isDark ? '#71717A' : '#94A3B8')} />
              <Text style={tw`text-[9px] mt-1 font-bold tracking-wider ${
                currentScreen === 'deliveries' ? 'text-[#6366F1]' : (isDark ? 'text-zinc-500' : 'text-zinc-500')
              }`}>{t('DELIVERIES')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={tw`flex-1 items-center justify-center py-1 rounded-xl ${
                currentScreen === 'notifications' ? (isDark ? 'bg-[#4F46E5]/10' : 'bg-[#4F46E5]/15') : ''
              }`}
              onPress={() => navigateTo('notifications')}
            >
              <Zap size={18} color={currentScreen === 'notifications' ? '#6366F1' : (isDark ? '#71717A' : '#94A3B8')} />
              <Text style={tw`text-[9px] mt-1 font-bold tracking-wider ${
                currentScreen === 'notifications' ? 'text-[#6366F1]' : (isDark ? 'text-zinc-500' : 'text-zinc-500')
              }`}>{t('ALERTS')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScreenContainer>
    </ToastProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <MainApp />
      </LanguageProvider>
    </ThemeProvider>
  );
}

