import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, BackHandler, Platform } from 'react-native';
import { supabase } from '../supabase';
import tw from 'twrnc';
import { Bell, Clock } from 'lucide-react-native';
import { useLanguage } from '../locales';

import AuthorizationModal, { AuthorizationRequest } from '../components/AuthorizationModal';

interface NotificationsScreenProps {
  shopData: { id: string; name: string; code: string };
}

interface Notification {
  id: string;
  title: string;
  message: string;
  action_url: string | null;
  created_at: string;
  type: string;
  metadata?: any;
}

export default function NotificationsScreen({ shopData }: NotificationsScreenProps) {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authRequest, setAuthRequest] = useState<AuthorizationRequest | null>(null);

  const PAGE_SIZE = 15;
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);

  const visibleNotifications = useMemo(() => {
    return notifications.slice(0, displayCount);
  }, [notifications, displayCount]);

  const handleLoadMore = () => {
    if (displayCount < notifications.length) {
      setDisplayCount((prev) => Math.min(prev + PAGE_SIZE, notifications.length));
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('shop_id', shopData.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
      } else {
        setNotifications(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle hardware / gesture back button
  useEffect(() => {
    const onBackPress = () => {
      if (authRequest) {
        setAuthRequest(null);
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [authRequest]);

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel('realtime-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `shop_id=eq.${shopData.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shopData.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const renderItem = ({ item }: { item: Notification }) => {
    const date = new Date(item.created_at);
    const isAuthRequest = item.type === 'AUTHORIZATION_REQUEST' || item.action_url === 'remote_authorization';
    
    const handlePress = () => {
      if (isAuthRequest) {
        // Try to parse metadata if it exists, or fall back to some sensible defaults
        const metadata = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : (item.metadata || {});
        
        setAuthRequest({
          id: metadata.id || item.id, // ID of the authorization row
          cashierName: metadata.cashierName || 'Cashier',
          actionDetails: metadata.actionDetails || item.title,
          context: metadata.context || item.message,
          shopId: shopData.id,
        });
      }
    };

    return (
      <TouchableOpacity 
        style={tw`bg-[#18181B] rounded-2xl p-4 mb-3 border ${
          isAuthRequest ? 'border-amber-500/30 bg-amber-500/5' : 'border-[#27272A]'
        }`}
        disabled={!isAuthRequest}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={tw`flex-row justify-between items-start mb-2`}>
          <Text style={tw`text-white font-bold text-base flex-1 pr-2`}>{item.title}</Text>
          <View style={tw`flex-row items-center bg-[#09090B] px-2 py-1 rounded-xl border border-[#27272A]`}>
            <Clock size={11} color="#71717A" />
            <Text style={tw`text-zinc-400 text-[10px] font-mono ml-1`}>
              {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
        <Text style={tw`text-[#A1A1AA] text-sm leading-5 mb-2`}>{item.message}</Text>
        {isAuthRequest && (
          <View style={tw`self-start bg-[#4F46E5]/15 border border-[#4F46E5]/30 px-3 py-1 rounded-full mt-1.5`}>
            <Text style={tw`text-[#6366F1] text-xs font-bold uppercase tracking-wider`}>{t('Review Request')}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={tw`flex-1 bg-[#09090B]`}>
      <View style={tw`flex-row items-center justify-between px-4 pt-3.5 pb-3.5 border-b border-[#27272A] bg-[#09090B]`}>
        <View style={tw`flex-row items-center gap-2.5`}>
          <View style={tw`bg-[#4F46E5]/15 border border-[#4F46E5]/30 p-2 rounded-xl`}>
            <Bell size={18} color="#6366F1" />
          </View>
          <View>
            <Text style={tw`text-[9px] font-bold text-[#6366F1] tracking-wider uppercase`}>{t('NOTIFICATIONS • LIVE')}</Text>
            <Text style={tw`text-lg text-white font-semibold tracking-tight uppercase`}>{t('Alerts & Activity')}</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={tw`flex-1 items-center justify-center px-6`}>
          <View style={tw`w-16 h-16 rounded-2xl bg-[#18181B] border border-[#27272A] items-center justify-center mb-4`}>
            <Bell size={32} color="#71717A" />
          </View>
          <Text style={tw`text-white font-bold text-base mb-1`}>{t('No Notifications Yet')}</Text>
          <Text style={tw`text-zinc-400 text-sm text-center`}>
            {t('New activity alerts and authorization pings will show up here in real-time.')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={visibleNotifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={tw`p-4 pb-12`}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setDisplayCount(PAGE_SIZE);
                onRefresh();
              }}
              tintColor="#4F46E5"
            />
          }
          ListFooterComponent={
            displayCount < notifications.length ? (
              <TouchableOpacity
                style={tw`bg-[#18181B] border border-[#27272A] py-3 rounded-xl items-center justify-center my-2`}
                onPress={handleLoadMore}
                activeOpacity={0.7}
              >
                <Text style={tw`text-indigo-400 text-xs font-bold`}>
                  {t('Load More Activity')} ({visibleNotifications.length} / {notifications.length})
                </Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}

      <AuthorizationModal 
        visible={!!authRequest}
        request={authRequest}
        managerName={shopData.name}
        onClose={() => setAuthRequest(null)}
        onSuccess={() => {
          setAuthRequest(null);
          fetchNotifications(); // Refresh to potentially show updated status
        }}
      />
    </View>
  );
}
