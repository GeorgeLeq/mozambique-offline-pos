import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import tw from 'twrnc';
import {
  Radio,
  Users,
  User,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  Plus,
  Info,
  Trash2,
} from 'lucide-react-native';
import { supabase } from '../../supabase';
import { useToast } from '../Toast';
import SendAnnouncementModal from './SendAnnouncementModal';

export interface POSAnnouncement {
  id: string;
  shop_id: string;
  cashier_id?: string | null;
  target_name?: string;
  message: string;
  priority?: 'normal' | 'urgent';
  is_acknowledged?: boolean;
  acknowledged_at?: string;
  created_at: string;
}

interface AnnouncementsSectionProps {
  shopData: { id: string; name: string; code: string };
  employees: any[];
  preselectedCashierId?: string | null;
  onOpenAnnouncementPage?: (targetCashier?: { id: string; name: string; role?: string } | null) => void;
}

export default function AnnouncementsSection({
  shopData,
  employees,
  preselectedCashierId,
  onOpenAnnouncementPage,
}: AnnouncementsSectionProps) {
  const { showToast } = useToast();
  const [announcements, setAnnouncements] = useState<POSAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [targetCashierId, setTargetCashierId] = useState<string | null>(null);

  const handleOpenNotice = (cashierId?: string | null) => {
    if (onOpenAnnouncementPage) {
      if (cashierId) {
        const emp = employees.find((e) => e.id === cashierId);
        onOpenAnnouncementPage(emp ? { id: emp.id, name: emp.name, role: emp.role } : null);
      } else {
        onOpenAnnouncementPage(null);
      }
    } else {
      setTargetCashierId(cashierId || null);
      setShowModal(true);
    }
  };

  const fetchAnnouncements = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('pos_announcements')
        .select('*')
        .eq('shop_id', shopData.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setAnnouncements(data);
      } else {
        // Fallback: fetch from notifications table
        const { data: notifData } = await supabase
          .from('notifications')
          .select('*')
          .eq('shop_id', shopData.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (notifData) {
          const mapped: POSAnnouncement[] = notifData.map((n: any) => ({
            id: n.id,
            shop_id: n.shop_id,
            target_name: n.title?.includes('to ') ? n.title.split('to ')[1] : 'All Cashiers',
            message: n.message,
            priority: n.title?.includes('URGENT') ? 'urgent' : 'normal',
            is_acknowledged: false,
            created_at: n.created_at,
          }));
          setAnnouncements(mapped);
        }
      }
    } catch (err) {
      console.error('Error fetching announcements:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [shopData.id]);

  useEffect(() => {
    fetchAnnouncements();

    // Setup Supabase Realtime subscription
    const channel = supabase
      .channel(`announcements-${shopData.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pos_announcements',
          filter: `shop_id=eq.${shopData.id}`,
        },
        () => {
          fetchAnnouncements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shopData.id, fetchAnnouncements]);

  useEffect(() => {
    if (preselectedCashierId) {
      setTargetCashierId(preselectedCashierId);
      setShowModal(true);
    }
  }, [preselectedCashierId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnnouncements();
  };

  const formatTime = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      await supabase.from('pos_announcements').delete().eq('id', id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      showToast('Announcement removed', 'info');
    } catch (err) {
      console.error('Error deleting announcement:', err);
    }
  };

  return (
    <View style={tw`flex-1 bg-[#09090B]`}>
      {/* Action Header Card */}
      <View style={tw`p-4 bg-[#09090B] border-b border-[#27272A]`}>
        <View style={tw`flex-row items-center justify-between mb-3`}>
          <View>
            <Text style={tw`text-sm font-bold text-white uppercase tracking-tight`}>POS Flash Announcements</Text>
            <Text style={tw`text-[10px] text-zinc-400 mt-0.5`}>
              Send instant notices to cashier screens in real-time
            </Text>
          </View>
          <TouchableOpacity
            style={tw`bg-[#4F46E5] active:bg-[#4338CA] px-3.5 py-2 rounded-xl flex-row items-center gap-1.5`}
            onPress={() => handleOpenNotice(null)}
            activeOpacity={0.7}
          >
            <Radio size={14} color="#FFFFFF" />
            <Text style={tw`text-xs font-bold text-white uppercase tracking-wider`}>Broadcast</Text>
          </TouchableOpacity>
        </View>

        {/* Informative Micro-Banner */}
        <View style={tw`bg-[#18181B] rounded-xl p-2.5 flex-row items-center gap-2 border border-[#27272A]`}>
          <Info size={14} color="#6366F1" />
          <Text style={tw`text-[11px] text-zinc-300 flex-1`}>
            Cashiers receive these notices live at their desk without needing a 2-way chat.
          </Text>
        </View>
      </View>

      {/* Announcements List */}
      {loading ? (
        <View style={tw`flex-1 justify-center items-center`}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : (
        <ScrollView
          style={tw`flex-1 px-4 pt-3`}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />
          }
        >
          {announcements.length === 0 ? (
            <View style={tw`bg-[#18181B] rounded-2xl border border-[#27272A] p-8 items-center justify-center my-6`}>
              <View style={tw`w-14 h-14 rounded-2xl bg-[#4F46E5]/15 border border-[#4F46E5]/30 justify-center items-center mb-3`}>
                <Radio size={26} color="#6366F1" />
              </View>
              <Text style={tw`text-white font-bold text-base mb-1`}>No Announcements Yet</Text>
              <Text style={tw`text-zinc-400 text-xs text-center mb-4 max-w-[240px]`}>
                Send a quick notice to all cashiers or a specific desk whenever you need.
              </Text>
              <TouchableOpacity
                style={tw`bg-[#4F46E5] active:bg-[#4338CA] px-4 py-2.5 rounded-xl flex-row items-center gap-2`}
                onPress={() => handleOpenNotice(null)}
                activeOpacity={0.7}
              >
                <Plus size={16} color="#FFFFFF" />
                <Text style={tw`text-xs font-bold text-white uppercase tracking-wider`}>Send First Notice</Text>
              </TouchableOpacity>
            </View>
          ) : (
            announcements.map((ann) => {
              const isGlobal = !ann.cashier_id || ann.target_name === 'All Cashiers';
              const isUrgent = ann.priority === 'urgent';

              return (
                <View
                  key={ann.id}
                  style={tw`bg-[#18181B] rounded-2xl border ${
                    isUrgent ? 'border-red-500/30' : 'border-[#27272A]'
                  } p-4 mb-3`}
                >
                  {/* Top metadata row */}
                  <View style={tw`flex-row items-center justify-between mb-2`}>
                    <View style={tw`flex-row items-center gap-2 flex-1`}>
                      <View
                        style={tw`px-2.5 py-1 rounded-xl flex-row items-center gap-1 ${
                          isGlobal
                            ? 'bg-[#4F46E5]/15 border border-[#4F46E5]/30'
                            : 'bg-purple-500/15 border border-purple-500/30'
                        }`}
                      >
                        {isGlobal ? (
                          <Users size={12} color="#6366F1" />
                        ) : (
                          <User size={12} color="#C084FC" />
                        )}
                        <Text
                          style={tw`text-[10px] font-bold ${
                            isGlobal ? 'text-[#6366F1]' : 'text-purple-300'
                          }`}
                        >
                          {ann.target_name || (isGlobal ? 'All Cashiers' : 'Private')}
                        </Text>
                      </View>

                      {isUrgent && (
                        <View style={tw`px-2 py-0.5 rounded-lg bg-red-500/15 border border-red-500/30 flex-row items-center gap-1`}>
                          <AlertTriangle size={10} color="#EF4444" />
                          <Text style={tw`text-[10px] font-extrabold text-red-400 uppercase`}>
                            Urgent
                          </Text>
                        </View>
                      )}
                    </View>

                    <TouchableOpacity
                      onPress={() => handleDeleteAnnouncement(ann.id)}
                      style={tw`w-7 h-7 rounded-lg bg-zinc-900 justify-center items-center`}
                    >
                      <Trash2 size={12} color="#71717A" />
                    </TouchableOpacity>
                  </View>

                  {/* Message body */}
                  <Text style={tw`text-white text-sm font-medium leading-5 mb-3`}>
                    {ann.message}
                  </Text>

                  {/* Footer status */}
                  <View style={tw`flex-row items-center justify-between pt-2 border-t border-zinc-900/60`}>
                    <View style={tw`flex-row items-center gap-1.5`}>
                      <Clock size={11} color="#71717A" />
                      <Text style={tw`text-[10px] text-zinc-500`}>
                        {formatTime(ann.created_at)}
                      </Text>
                    </View>

                    <View style={tw`flex-row items-center gap-1`}>
                      {ann.is_acknowledged ? (
                        <View style={tw`flex-row items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20`}>
                          <CheckCircle2 size={11} color="#10B981" />
                          <Text style={tw`text-[9px] font-bold text-emerald-400`}>Acknowledged</Text>
                        </View>
                      ) : (
                        <View style={tw`flex-row items-center gap-1 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800`}>
                          <Radio size={10} color="#60A5FA" />
                          <Text style={tw`text-[9px] font-semibold text-zinc-400`}>Delivered to POS</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })
          )}
          <View style={tw`h-10`} />
        </ScrollView>
      )}

      {/* Send Announcement Modal */}
      <SendAnnouncementModal
        visible={showModal}
        onClose={() => {
          setShowModal(false);
          setTargetCashierId(null);
        }}
        shopData={shopData}
        employees={employees}
        preselectedCashierId={targetCashierId}
        onSuccess={fetchAnnouncements}
      />
    </View>
  );
}
