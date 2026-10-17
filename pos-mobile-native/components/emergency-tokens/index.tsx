import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import tw from 'twrnc';
import {
  Key,
  Plus,
  ArrowLeft,
  RefreshCw,
  ShieldCheck,
  History,
  Radio,
  AlertTriangle,
} from 'lucide-react-native';
import { EmergencyTokensSectionProps, EmergencyToken } from './types';
import { useEmergencyTokens } from './hooks/useEmergencyTokens';
import { ActiveTokenCard } from './ActiveTokenCard';
import { UsedTokenCard } from './UsedTokenCard';
import { GenerateTokenModal } from './GenerateTokenModal';

export const EmergencyTokensSection: React.FC<EmergencyTokensSectionProps> = ({
  shopData,
  employees,
  preselectedCashierId,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'active' | 'used'>('active');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // If a cashier was clicked from the employee list, auto-open modal
  useEffect(() => {
    if (preselectedCashierId) {
      setShowModal(true);
    }
  }, [preselectedCashierId]);

  // Handle hardware / gesture back button
  useEffect(() => {
    const onBackPress = () => {
      if (showModal) {
        setShowModal(false);
        return true;
      }
      if (activeTab === 'used') {
        setActiveTab('active');
        return true;
      }
      if (onBack) {
        onBack();
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [showModal, activeTab, onBack]);

  const handleTokenRedeemed = useCallback((token: EmergencyToken) => {
    showToast(`🔔 POS Redeemed PIN #${token.code} (${token.cashier_name})`, 'success');
  }, [showToast]);

  const {
    activeTokens,
    usedTokens,
    loading,
    refreshing,
    errorMessage,
    fetchTokens,
    createToken,
    revokeToken,
  } = useEmergencyTokens({
    shopId: shopData?.id || '',
    shopCode: shopData?.code || '',
    employees,
    onTokenUsedNotification: handleTokenRedeemed,
  });

  return (
    <View style={tw`flex-1 bg-[#09090B]`}>
      {/* Toast Notification Banner */}
      {toastMessage ? (
        <View
          style={tw`absolute top-3 left-4 right-4 z-50 px-4 py-3 rounded-2xl flex-row items-center gap-2.5 shadow-2xl border ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50'
              : toastMessage.type === 'error'
              ? 'bg-red-950/90 border-red-500/50'
              : 'bg-zinc-900/90 border-zinc-700'
          }`}
        >
          <ShieldCheck
            size={16}
            color={
              toastMessage.type === 'success'
                ? '#10B981'
                : toastMessage.type === 'error'
                ? '#EF4444'
                : '#A1A1AA'
            }
          />
          <Text style={tw`text-xs font-semibold text-white flex-1`}>
            {toastMessage.text}
          </Text>
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={tw`p-4 pb-20`}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchTokens(true)}
            tintColor="#10B981"
            colors={['#10B981']}
          />
        }
      >
        {/* Header Bar */}
        <View style={tw`flex-row items-center justify-between mb-4`}>
          <View style={tw`flex-row items-center gap-3`}>
            {onBack ? (
              <TouchableOpacity
                style={tw`w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 justify-center items-center`}
                onPress={onBack}
              >
                <ArrowLeft size={18} color="#FFFFFF" />
              </TouchableOpacity>
            ) : null}

            <View>
              <View style={tw`flex-row items-center gap-2`}>
                <Text style={tw`text-lg font-bold text-white`}>Emergency PINs</Text>
                <View style={tw`flex-row items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full`}>
                  <Radio size={10} color="#10B981" />
                  <Text style={tw`text-[9px] font-bold text-emerald-400 uppercase tracking-wider`}>
                    POS Synced
                  </Text>
                </View>
              </View>
              <Text style={tw`text-xs text-zinc-400 mt-0.5`}>
                Single-use offline & emergency cashier tokens
              </Text>
            </View>
          </View>

          {/* Header Action Buttons */}
          <View style={tw`flex-row items-center gap-2`}>
            <TouchableOpacity
              style={tw`w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 justify-center items-center`}
              onPress={() => fetchTokens(true)}
            >
              <RefreshCw size={14} color="#10B981" />
            </TouchableOpacity>

            <TouchableOpacity
              style={tw`bg-emerald-500 px-3 py-2 rounded-xl flex-row items-center gap-1.5 shadow-sm shadow-emerald-500/20`}
              onPress={() => setShowModal(true)}
            >
              <Plus size={14} color="#000000" strokeWidth={3} />
              <Text style={tw`text-xs font-bold text-black`}>New PIN</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Database Diagnostic notice if error occurred */}
        {errorMessage ? (
          <View style={tw`bg-amber-950/40 border border-amber-500/30 rounded-2xl p-3.5 mb-4 flex-row items-start gap-2.5`}>
            <AlertTriangle size={18} color="#F59E0B" style={tw`mt-0.5`} />
            <View style={tw`flex-1`}>
              <Text style={tw`text-xs font-bold text-amber-300`}>Connection Notice</Text>
              <Text style={tw`text-[11px] text-amber-200/80 mt-0.5 leading-relaxed`}>{errorMessage}</Text>
              <TouchableOpacity
                style={tw`mt-2 self-start bg-amber-500/20 border border-amber-500/40 px-2.5 py-1 rounded-lg`}
                onPress={() => fetchTokens(true)}
              >
                <Text style={tw`text-[10px] font-bold text-amber-300`}>Retry Query</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Tab Navigation */}
        <View style={tw`flex-row bg-[#121215] border border-zinc-800/80 p-1 rounded-xl mb-5`}>
          <TouchableOpacity
            style={tw`flex-1 py-2.5 rounded-lg items-center ${activeTab === 'active' ? 'bg-zinc-800 shadow-sm' : ''}`}
            onPress={() => setActiveTab('active')}
          >
            <Text style={tw`text-xs font-bold ${activeTab === 'active' ? 'text-white' : 'text-zinc-500'}`}>
              {`Active PINs (${activeTokens.length})`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={tw`flex-1 py-2.5 rounded-lg items-center ${activeTab === 'used' ? 'bg-zinc-800 shadow-sm' : ''}`}
            onPress={() => setActiveTab('used')}
          >
            <Text style={tw`text-xs font-bold ${activeTab === 'used' ? 'text-white' : 'text-zinc-500'}`}>
              {`Used History (${usedTokens.length})`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content List */}
        {loading && !refreshing && activeTokens.length === 0 && usedTokens.length === 0 ? (
          <View style={tw`py-12 items-center justify-center`}>
            <ActivityIndicator size="small" color="#10B981" />
            <Text style={tw`text-xs text-zinc-500 mt-3 font-medium`}>Fetching emergency tokens...</Text>
          </View>
        ) : activeTab === 'active' ? (
          activeTokens.length === 0 ? (
            <View style={tw`bg-[#121215] border border-dashed border-zinc-800 rounded-3xl p-8 items-center justify-center my-4`}>
              <View style={tw`w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 justify-center items-center mb-3`}>
                <Key size={26} color="#F59E0B" />
              </View>
              <Text style={tw`text-base font-bold text-white text-center`}>No Active Emergency PINs</Text>
              <Text style={tw`text-xs text-zinc-400 text-center mt-1.5 max-w-xs leading-relaxed`}>
                Need to authorize a clearance or override at the till? Generate a 6-digit one-time PIN below.
              </Text>
              <TouchableOpacity
                style={tw`mt-5 bg-emerald-500 px-5 py-2.5 rounded-xl flex-row items-center gap-2 shadow-lg shadow-emerald-500/20`}
                onPress={() => setShowModal(true)}
              >
                <Plus size={14} color="#000000" strokeWidth={3} />
                <Text style={tw`text-xs font-bold text-black`}>Generate Emergency PIN</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {activeTokens.map((token) => (
                <ActiveTokenCard
                  key={token.id}
                  token={token}
                  shopName={shopData?.name || 'My Store'}
                  onRevoke={revokeToken}
                  onShowToast={showToast}
                />
              ))}
            </View>
          )
        ) : usedTokens.length === 0 ? (
          <View style={tw`bg-[#121215] border border-dashed border-zinc-800 rounded-3xl p-8 items-center justify-center my-4`}>
            <View style={tw`w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 justify-center items-center mb-3`}>
              <History size={26} color="#71717A" />
            </View>
            <Text style={tw`text-base font-bold text-white text-center`}>No Used Token History</Text>
            <Text style={tw`text-xs text-zinc-500 text-center mt-1.5 max-w-xs leading-relaxed`}>
              Tokens redeemed at the POS till will appear here along with cashier details, purpose, and timestamp.
            </Text>
          </View>
        ) : (
          <View>
            {usedTokens.map((token) => (
              <UsedTokenCard
                key={token.id}
                token={token}
                currency={shopData?.currency || 'MT'}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Generate PIN Modal */}
      <GenerateTokenModal
        visible={showModal}
        employees={employees}
        initialCashierId={preselectedCashierId}
        onClose={() => setShowModal(false)}
        onSubmit={createToken}
        onShowToast={showToast}
      />
    </View>
  );
};

export default EmergencyTokensSection;
export * from './types';
export { useEmergencyTokens } from './hooks/useEmergencyTokens';
