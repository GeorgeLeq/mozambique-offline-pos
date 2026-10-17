import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import tw from 'twrnc';

import { DashboardScreenProps } from './types';
import { useDashboardData } from './hooks/useDashboardData';
import { useLanguage } from '../../locales';
import { useTheme } from '../../theme';
import DashboardHeader from './components/DashboardHeader';
import CurrentPlanCard from './components/CurrentPlanCard';
import TodayDeliveriesWidget from './components/TodayDeliveriesWidget';
import RevenueCard from './components/RevenueCard';
import PaymentBreakdownCards from './components/PaymentBreakdownCards';
import DrawerCashCard from './components/DrawerCashCard';
import QuickActionBanners from './components/QuickActionBanners';
import EmployeePreviewSection from './components/EmployeePreviewSection';
import SendAnnouncementModal from '../../components/announcements/SendAnnouncementModal';

export default function DashboardScreen({
  shopData,
  onLogout,
  onViewAllEmployees,
  onOpenAnnouncement,
  onViewDeliveries,
}: DashboardScreenProps) {
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);

  const {
    loading,
    refreshing,
    metrics,
    employees,
    activeTokensCount,
    onRefresh,
    toggleEmployeeBlock,
  } = useDashboardData(shopData);

  const handleBroadcastClick = () => {
    if (onOpenAnnouncement) {
      onOpenAnnouncement(null);
    } else {
      setShowAnnouncementModal(true);
    }
  };

  const formatLastSync = (isoString?: string) => {
    if (!isoString) return null;
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return null;
    }
  };

  if (loading) {
    return (
      <View style={[tw`flex-1 justify-center items-center`, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  const syncTime = formatLastSync(metrics.lastUpdatedAt);

  return (
    <View style={[tw`flex-1`, { backgroundColor: colors.bg }]}>
      {/* Top Header */}
      <DashboardHeader
        shopData={shopData}
        onRefresh={onRefresh}
        onLogout={onLogout}
      />

      {/* Main Content Area */}
      <ScrollView
        style={tw`flex-1 px-4 pt-3.5`}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366F1"
          />
        }
      >
        {/* Date Indicator Badge */}
        <View style={tw`flex-row items-center justify-between bg-[#4F46E5]/10 border border-[#4F46E5]/25 rounded-xl py-2 px-3 mb-4`}>
          <View style={tw`flex-row items-center gap-2`}>
            <View style={tw`w-1.5 h-1.5 rounded-full bg-[#10B981]`} />
            <Text style={tw`text-[9px] font-bold text-[#6366F1] tracking-wider uppercase`}>
              {t('POS LIVE AUDIT')} • {new Date().toLocaleDateString(language === 'en' ? 'en-US' : language === 'pt' ? 'pt-PT' : language === 'fr' ? 'fr-FR' : 'sw-TZ', { weekday: 'short', month: 'short', day: 'numeric' })}
            </Text>
          </View>
          {syncTime ? (
            <Text style={tw`text-[9px] font-mono text-zinc-400`}>
              {t('Synced')} {syncTime}
            </Text>
          ) : null}
        </View>

        {/* Current Subscription Plan & Quota Card */}
        <CurrentPlanCard shopData={shopData} />

        {/* Today's Expected Deliveries Widget */}
        {onViewDeliveries ? (
          <TodayDeliveriesWidget
            shopData={shopData}
            onViewDeliveries={onViewDeliveries}
          />
        ) : null}

        {/* Card A: Receita Total */}
        <RevenueCard
          receitaTotal={metrics.receitaTotal}
          salesCount={metrics.salesCount}
          averageTicket={metrics.averageTicket}
          lastUpdatedAt={metrics.lastUpdatedAt}
        />

        {/* Cards B, C, D: Payment Method Breakdown (Dinheiro, M-Pesa, e-Mola, Cards) */}
        <PaymentBreakdownCards
          dinheiroVivo={metrics.dinheiroVivo}
          mpesa={metrics.mpesa}
          emola={metrics.emola}
          cardSales={metrics.cardSales}
          otherSales={metrics.otherSales}
        />

        {/* Card E: Dinheiro em Caixa (Drawer Expected Cash) */}
        <DrawerCashCard
          dinheiroEmCaixa={metrics.dinheiroEmCaixa}
          baseCash={metrics.baseCash}
          dinheiroVivo={metrics.dinheiroVivo}
          totalPayouts={metrics.totalPayouts}
        />

        {/* Quick Remote Actions Banners (Broadcast & Emergency PINs) */}
        <QuickActionBanners
          activeTokensCount={activeTokensCount}
          onOpenAnnouncementModal={handleBroadcastClick}
          onOpenEmployeeManagement={onViewAllEmployees}
        />

        {/* Remote Employee Management Section */}
        <EmployeePreviewSection
          employees={employees}
          onViewAllEmployees={onViewAllEmployees}
          onToggleEmployeeBlock={toggleEmployeeBlock}
        />
      </ScrollView>

      {/* Send Announcement Modal */}
      <SendAnnouncementModal
        visible={showAnnouncementModal}
        onClose={() => setShowAnnouncementModal(false)}
        shopData={shopData}
        employees={employees}
      />
    </View>
  );
}
export * from './types';
