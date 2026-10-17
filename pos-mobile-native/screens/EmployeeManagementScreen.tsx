import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Linking,
  BackHandler
} from 'react-native';
import { supabase } from '../supabase';
import {
  ArrowLeft,
  MessageCircle,
  Shield,
  ShieldOff,
  Clock,
  Key,
  Users,
  Radio,
  Sparkles
} from 'lucide-react-native';
import tw from 'twrnc';
import EmergencyTokensSection from '../components/emergency-tokens';
import AnnouncementsSection from '../components/announcements';
import SendAnnouncementModal from '../components/announcements/SendAnnouncementModal';

interface EmployeeManagementScreenProps {
  shopData: { id: string; name: string; code: string };
  onBack: () => void;
  onOpenAnnouncementScreen?: (targetCashier?: { id: string; name: string; role?: string } | null) => void;
}

export default function EmployeeManagementScreen({
  shopData,
  onBack,
  onOpenAnnouncementScreen,
}: EmployeeManagementScreenProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'employees' | 'announcements' | 'tokens'>('employees');
  const [selectedCashierForPin, setSelectedCashierForPin] = useState<string | null>(null);
  const [announcementModalVisible, setAnnouncementModalVisible] = useState(false);
  const [selectedCashierForAnnouncement, setSelectedCashierForAnnouncement] = useState<string | null>(null);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('shop_id', shopData.id)
        .order('current_shift_start', { ascending: false });
        
      if (!error && data) {
        setEmployees(data);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [shopData.id]);

  // Handle hardware / gesture back button
  useEffect(() => {
    const onBackPress = () => {
      if (announcementModalVisible) {
        setAnnouncementModalVisible(false);
        setSelectedCashierForAnnouncement(null);
        return true;
      }
      if (activeTab === 'tokens' || activeTab === 'announcements') {
        setActiveTab('employees');
        return true;
      }
      onBack();
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [announcementModalVisible, activeTab, onBack]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEmployees();
  };

  const toggleEmployeeBlock = async (employeeId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    setEmployees(prev => prev.map(e => e.id === employeeId ? { ...e, is_blocked: newStatus } : e));
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_blocked: newStatus })
        .eq('id', employeeId);
      if (error) throw error;
    } catch (err) {
      console.error('Error toggling block status:', err);
      setEmployees(prev => prev.map(e => e.id === employeeId ? { ...e, is_blocked: currentStatus } : e));
    }
  };

  const handleWhatsApp = (phone: string, name: string) => {
    if (!phone) return;
    const message = `Olá ${name}, `;
    Linking.openURL(`whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`);
  };

  const formatTime = (isoString: string) => {
    if (!isoString) return 'Not logged in';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleQuickCreatePinForCashier = (employeeId: string) => {
    setSelectedCashierForPin(employeeId);
    setActiveTab('tokens');
  };

  const handleDirectAnnouncement = (employeeId: string) => {
    const cashier = employees.find((e) => e.id === employeeId);
    if (onOpenAnnouncementScreen) {
      onOpenAnnouncementScreen(cashier ? { id: cashier.id, name: cashier.name, role: cashier.role } : null);
    } else {
      setSelectedCashierForAnnouncement(employeeId);
      setAnnouncementModalVisible(true);
    }
  };

  const handleBroadcastNotice = () => {
    if (onOpenAnnouncementScreen) {
      onOpenAnnouncementScreen(null);
    } else {
      setSelectedCashierForAnnouncement(null);
      setAnnouncementModalVisible(true);
    }
  };

  if (loading) {
    return (
      <View style={tw`flex-1 bg-[#09090B] justify-center items-center`}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-[#09090B]`}>
      {/* Top Header */}
      <View style={tw`flex-row items-center justify-between px-4 pt-3.5 pb-3.5 border-b border-[#27272A] bg-[#09090B]`}>
        <View style={tw`flex-row items-center flex-1`}>
          <TouchableOpacity 
            style={tw`w-9 h-9 rounded-xl bg-[#18181B] border border-[#27272A] justify-center items-center`} 
            onPress={onBack}
            activeOpacity={0.7}
          >
            <ArrowLeft size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={tw`flex-1 ml-2.5`}>
            <Text style={tw`text-[9px] font-bold text-[#6366F1] tracking-wider uppercase`}>
              {shopData.name} • POS
            </Text>
            <Text style={tw`text-lg font-semibold text-white tracking-tight uppercase`}>Staff & Permissions</Text>
          </View>
        </View>

        {/* Header Broadcast Shortcut */}
        <TouchableOpacity
          style={tw`bg-[#4F46E5] active:bg-[#4338CA] px-3.5 py-2 rounded-xl flex-row items-center gap-1.5`}
          onPress={handleBroadcastNotice}
          activeOpacity={0.7}
        >
          <Radio size={13} color="#FFFFFF" />
          <Text style={tw`text-xs font-bold text-white uppercase tracking-wider`}>Broadcast</Text>
        </TouchableOpacity>
      </View>

      {/* Main 3-Tab Switcher */}
      <View style={tw`flex-row bg-[#09090B] px-4 py-2.5 border-b border-[#27272A] gap-2`}>
        <TouchableOpacity
          style={tw`flex-1 py-2 px-2 rounded-xl flex-row items-center justify-center gap-1.5 border ${
            activeTab === 'employees'
              ? 'bg-[#4F46E5] border-[#4F46E5]'
              : 'bg-[#18181B] border-[#27272A]'
          }`}
          onPress={() => setActiveTab('employees')}
          activeOpacity={0.7}
        >
          <Users size={13} color={activeTab === 'employees' ? '#FFFFFF' : '#71717A'} />
          <Text
            style={tw`text-xs font-bold ${
              activeTab === 'employees' ? 'text-white' : 'text-zinc-400'
            }`}
          >
            Staff ({employees.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={tw`flex-1 py-2 px-2 rounded-xl flex-row items-center justify-center gap-1.5 border ${
            activeTab === 'announcements'
              ? 'bg-[#4F46E5] border-[#4F46E5]'
              : 'bg-[#18181B] border-[#27272A]'
          }`}
          onPress={() => setActiveTab('announcements')}
          activeOpacity={0.7}
        >
          <Radio size={13} color={activeTab === 'announcements' ? '#FFFFFF' : '#71717A'} />
          <Text
            style={tw`text-xs font-bold ${
              activeTab === 'announcements' ? 'text-white' : 'text-zinc-400'
            }`}
          >
            Notices
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={tw`flex-1 py-2 px-2 rounded-xl flex-row items-center justify-center gap-1.5 border ${
            activeTab === 'tokens'
              ? 'bg-[#4F46E5] border-[#4F46E5]'
              : 'bg-[#18181B] border-[#27272A]'
          }`}
          onPress={() => {
            setSelectedCashierForPin(null);
            setActiveTab('tokens');
          }}
          activeOpacity={0.7}
        >
          <Key size={13} color={activeTab === 'tokens' ? '#FFFFFF' : '#71717A'} />
          <Text
            style={tw`text-xs font-bold ${
              activeTab === 'tokens' ? 'text-white' : 'text-zinc-400'
            }`}
          >
            PINs
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Contents */}
      {activeTab === 'announcements' ? (
        <View style={tw`flex-1`}>
          <AnnouncementsSection
            shopData={shopData}
            employees={employees}
            preselectedCashierId={selectedCashierForAnnouncement}
            onOpenAnnouncementPage={onOpenAnnouncementScreen}
          />
        </View>
      ) : activeTab === 'tokens' ? (
        <View style={tw`flex-1`}>
          <EmergencyTokensSection
            shopData={shopData}
            employees={employees}
            preselectedCashierId={selectedCashierForPin}
          />
        </View>
      ) : (
        <ScrollView 
          style={tw`flex-1 px-4 pt-4`}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />
          }
        >
          {employees.length === 0 ? (
            <View style={tw`bg-[#18181B] rounded-2xl border border-[#27272A] p-6 items-center justify-center`}>
              <Text style={tw`text-zinc-400 text-sm text-center`}>
                No employees registered for this shop.
              </Text>
            </View>
          ) : (
            employees.map(employee => (
              <View key={employee.id} style={tw`bg-[#18181B] rounded-2xl border ${employee.is_blocked ? 'border-red-500/40' : 'border-[#27272A]'} p-4 mb-3`}>
                <View style={tw`flex-row justify-between items-start mb-3`}>
                  <View style={tw`flex-1`}>
                    <View style={tw`flex-row items-center gap-2`}>
                      <Text style={tw`text-base font-bold text-white`}>{employee.name}</Text>
                      {employee.is_blocked ? (
                        <View style={tw`bg-red-500/15 px-2 py-0.5 rounded-md border border-red-500/30`}>
                          <Text style={tw`text-[9px] font-bold text-red-400 uppercase`}>Blocked</Text>
                        </View>
                      ) : (
                        <View style={tw`bg-emerald-500/15 px-2 py-0.5 rounded-md border border-emerald-500/30`}>
                          <Text style={tw`text-[9px] font-bold text-emerald-400 uppercase`}>Active</Text>
                        </View>
                      )}
                    </View>
                    <Text style={tw`text-[10px] text-zinc-400 mt-1 uppercase font-semibold tracking-wider`}>{employee.role || 'Cashier'}</Text>
                  </View>

                  <View style={tw`flex-row items-center gap-1.5`}>
                    {/* Send Note / Announcement directly to this Cashier */}
                    <TouchableOpacity
                      style={tw`h-8 px-2.5 rounded-xl bg-[#4F46E5]/15 border border-[#4F46E5]/30 flex-row items-center gap-1`}
                      onPress={() => handleDirectAnnouncement(employee.id)}
                      activeOpacity={0.7}
                    >
                      <Radio size={12} color="#6366F1" />
                      <Text style={tw`text-[10px] font-bold text-[#6366F1] uppercase`}>Notice</Text>
                    </TouchableOpacity>

                    {/* One-Time Emergency PIN */}
                    <TouchableOpacity
                      style={tw`h-8 px-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 flex-row items-center gap-1`}
                      onPress={() => handleQuickCreatePinForCashier(employee.id)}
                      activeOpacity={0.7}
                    >
                      <Key size={12} color="#F59E0B" />
                      <Text style={tw`text-[10px] font-bold text-amber-400 uppercase`}>PIN</Text>
                    </TouchableOpacity>

                    {/* WhatsApp */}
                    {!!employee.phone_number && (
                      <TouchableOpacity 
                        style={tw`w-8 h-8 rounded-xl bg-[#25D366]/15 justify-center items-center border border-[#25D366]/30`}
                        onPress={() => handleWhatsApp(employee.phone_number, employee.name)}
                        activeOpacity={0.7}
                      >
                        <MessageCircle size={14} color="#25D366" />
                      </TouchableOpacity>
                    )}

                    {/* Block / Unblock */}
                    <TouchableOpacity
                      style={tw`w-8 h-8 rounded-xl justify-center items-center ${employee.is_blocked ? 'bg-emerald-500/15 border border-emerald-500/30' : 'bg-red-500/15 border border-red-500/30'}`}
                      onPress={() => toggleEmployeeBlock(employee.id, employee.is_blocked)}
                      activeOpacity={0.7}
                    >
                      {employee.is_blocked ? (
                        <Shield size={14} color="#10B981" />
                      ) : (
                        <ShieldOff size={14} color="#EF4444" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Shift info section */}
                <View style={tw`bg-[#09090B] rounded-xl p-2.5 flex-row items-center gap-2 border border-[#27272A]`}>
                  <Clock size={12} color={employee.current_shift_start ? "#10B981" : "#71717A"} />
                  {employee.current_shift_start ? (
                    <Text style={tw`text-[10px] text-zinc-400`}>
                      {`Logged in since `}
                      <Text style={tw`text-white font-mono font-medium`}>{formatTime(employee.current_shift_start)}</Text>
                    </Text>
                  ) : (
                    <Text style={tw`text-[10px] text-zinc-500 font-medium`}>
                      Currently offline / no active shift
                    </Text>
                  )}
                </View>
              </View>
            ))
          )}
          <View style={tw`h-10`} />
        </ScrollView>
      )}

      {/* Direct Announcement Modal */}
      <SendAnnouncementModal
        visible={announcementModalVisible}
        onClose={() => {
          setAnnouncementModalVisible(false);
          setSelectedCashierForAnnouncement(null);
        }}
        shopData={shopData}
        employees={employees}
        preselectedCashierId={selectedCashierForAnnouncement}
      />
    </View>
  );
}


