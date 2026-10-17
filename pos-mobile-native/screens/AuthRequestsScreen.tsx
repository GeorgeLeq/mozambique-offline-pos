import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, BackHandler } from 'react-native';
import { supabase } from '../supabase';
import tw from 'twrnc';
import { ShieldAlert, Clock, ChevronRight } from 'lucide-react-native';
import AuthorizationModal, { AuthorizationRequest } from '../components/AuthorizationModal';

interface AuthRequestsScreenProps {
  shopData: { id: string; name: string; code: string };
}

interface RemoteAuthorization {
  id: string;
  shop_id: string;
  cashier_name: string;
  request_type: string;
  amount: number;
  description: string;
  status: string;
  created_at: string;
}

export default function AuthRequestsScreen({ shopData }: AuthRequestsScreenProps) {
  const [requests, setRequests] = useState<RemoteAuthorization[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AuthorizationRequest | null>(null);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('remote_authorizations')
        .select('*')
        .eq('shop_id', shopData.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching auth requests:', error);
      } else {
        setRequests(data || []);
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
      if (selectedRequest) {
        setSelectedRequest(null);
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [selectedRequest]);

  useEffect(() => {
    fetchRequests();

    const channel = supabase
      .channel('realtime-auth-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'remote_authorizations',
          filter: `shop_id=eq.${shopData.id}`,
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shopData.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const handlePress = (item: RemoteAuthorization) => {
    setSelectedRequest({
      id: item.id,
      cashierName: item.cashier_name || 'Cashier',
      actionDetails: item.request_type,
      context: item.description,
      shopId: shopData.id,
    });
  };

  const renderItem = ({ item }: { item: RemoteAuthorization }) => {
    const date = new Date(item.created_at);
    return (
      <TouchableOpacity 
        style={tw`bg-[#18181B] rounded-2xl p-4 mb-3 border border-amber-500/30 bg-amber-500/5`}
        onPress={() => handlePress(item)}
        activeOpacity={0.7}
      >
        <View style={tw`flex-row justify-between items-start mb-2`}>
          <Text style={tw`text-white font-bold text-base flex-1 pr-2`}>{item.request_type}</Text>
          <View style={tw`flex-row items-center bg-[#09090B] px-2 py-1 rounded-xl border border-[#27272A]`}>
            <Clock size={11} color="#71717A" />
            <Text style={tw`text-zinc-400 text-[10px] font-mono ml-1`}>
              {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
        <Text style={tw`text-[#A1A1AA] text-sm leading-5 mb-3`}>{item.description}</Text>
        
        <View style={tw`flex-row justify-between items-center pt-2.5 border-t border-[#27272A]`}>
          <View style={tw`flex-row items-center`}>
            <View style={tw`w-6 h-6 rounded-full bg-[#4F46E5]/20 border border-[#4F46E5]/30 items-center justify-center mr-2`}>
              <Text style={tw`text-[10px] font-bold text-[#6366F1]`}>{item.cashier_name.charAt(0)}</Text>
            </View>
            <Text style={tw`text-zinc-300 text-xs font-medium`}>{item.cashier_name}</Text>
          </View>
          <View style={tw`flex-row items-center gap-1 bg-[#4F46E5]/15 border border-[#4F46E5]/30 px-2.5 py-1 rounded-xl`}>
            <Text style={tw`text-[#6366F1] text-xs font-bold uppercase tracking-wider`}>Review</Text>
            <ChevronRight size={13} color="#6366F1" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={tw`flex-1 bg-[#09090B]`}>
      <View style={tw`flex-row items-center justify-between px-4 pt-3.5 pb-3.5 border-b border-[#27272A] bg-[#09090B]`}>
        <View style={tw`flex-row items-center gap-2.5`}>
          <View style={tw`bg-[#4F46E5]/15 border border-[#4F46E5]/30 p-2 rounded-xl`}>
            <ShieldAlert size={18} color="#6366F1" />
          </View>
          <View>
            <Text style={tw`text-[9px] font-bold text-[#6366F1] tracking-wider uppercase`}>SECURITY AUDIT</Text>
            <Text style={tw`text-lg text-white font-semibold tracking-tight uppercase`}>Authorizations</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : requests.length === 0 ? (
        <View style={tw`flex-1 items-center justify-center px-6`}>
          <View style={tw`w-16 h-16 rounded-2xl bg-[#18181B] border border-[#27272A] items-center justify-center mb-4`}>
            <ShieldAlert size={32} color="#71717A" />
          </View>
          <Text style={tw`text-white font-bold text-base mb-1`}>No Pending Requests</Text>
          <Text style={tw`text-zinc-400 text-sm text-center`}>
            All cashier authorization requests have been resolved.
          </Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={tw`p-4`}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />
          }
        />
      )}

      <AuthorizationModal 
        visible={!!selectedRequest}
        request={selectedRequest}
        managerName={shopData.name}
        onClose={() => setSelectedRequest(null)}
        onSuccess={() => {
          setSelectedRequest(null);
          fetchRequests();
        }}
      />
    </View>
  );
}
