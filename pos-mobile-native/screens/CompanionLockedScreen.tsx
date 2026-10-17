import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
  BackHandler,
} from 'react-native';
import tw from 'twrnc';
import {
  Lock,
  RefreshCw,
  MessageCircle,
  LogOut,
  Store,
  TrendingUp,
  ShieldCheck,
  Zap,
  Users,
} from 'lucide-react-native';
import { supabase } from '../supabase';
import { useToast } from '../components/Toast';

export interface CompanionLockedScreenProps {
  shopData: {
    id: string;
    name: string;
    code: string;
    companion_app_enabled?: boolean;
    companion_app_expires_at?: string | null;
  };
  onUnlocked: (updatedShopData: any) => void;
  onLogout: () => void;
  supportWhatsAppNumber?: string; // Optional custom support number (e.g. "258840000000")
}

export default function CompanionLockedScreen({
  shopData,
  onUnlocked,
  onLogout,
  supportWhatsAppNumber = '258841234567', // Mozambique default format
}: CompanionLockedScreenProps) {
  const [checking, setChecking] = useState(false);
  const { showToast } = useToast();

  // Hardware Back Handler: Exit app or prompt logout
  useEffect(() => {
    const onBackPress = () => {
      Alert.alert(
        'Sign Out',
        'Would you like to sign out from this shop?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Out', style: 'destructive', onPress: onLogout },
        ]
      );
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [onLogout]);

  // Real-time Postgres Listener on the shops table:
  // When Command Central flips companion_app_enabled = true, unlock automatically!
  useEffect(() => {
    if (!shopData?.id) return;

    const channel = supabase
      .channel(`shop-access-${shopData.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'shops',
          filter: `id=eq.${shopData.id}`,
        },
        (payload) => {
          if (payload.new) {
            const isEnabled = payload.new.companion_app_enabled === true;
            if (isEnabled) {
              showToast('🎉 Mobile Companion access activated! Welcome to Aura Boss.', 'success');
              onUnlocked({
                ...shopData,
                ...payload.new,
                companion_app_enabled: true,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shopData, onUnlocked, showToast]);

  // Manual Check Button
  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('id, name, code, companion_app_enabled, companion_app_expires_at')
        .eq('id', shopData.id)
        .single();

      if (error) {
        // If column doesn't exist yet in user's DB
        if (error.message?.includes('column') || error.code === '42703') {
          showToast('Database column not configured yet. Run the SQL migration in Supabase.', 'error');
          return;
        }
        throw error;
      }

      if (data?.companion_app_enabled === true) {
        showToast('🎉 Mobile Companion access activated! Welcome.', 'success');
        onUnlocked({
          ...shopData,
          ...data,
          companion_app_enabled: true,
        });
      } else {
        showToast('Activation pending on Command Central. Please contact support.', 'info');
      }
    } catch (err: any) {
      console.error('Error verifying subscription status:', err);
      showToast(err.message || 'Could not reach server. Please try again.', 'error');
    } finally {
      setChecking(false);
    }
  };

  // Open WhatsApp with pre-filled message
  const handleContactWhatsApp = () => {
    const text = encodeURIComponent(
      `Hello Aura Support, I would like to activate the Boss Companion App for my shop:\n\n` +
      `🏪 Shop: ${shopData.name}\n` +
      `🔑 Shop Code: ${shopData.code}\n\n` +
      `Please let me know the activation details.`
    );
    const cleanNumber = supportWhatsAppNumber.replace(/[^0-9]/g, '');
    const url = `whatsapp://send?phone=${cleanNumber}&text=${text}`;
    const webFallbackUrl = `https://wa.me/${cleanNumber}?text=${text}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          return Linking.openURL(webFallbackUrl);
        }
      })
      .catch((err) => {
        console.error('Error opening WhatsApp:', err);
        Alert.alert(
          'WhatsApp Contact',
          `Please message support directly at: +${cleanNumber}\nShop Code: ${shopData.code}`
        );
      });
  };

  return (
    <View style={tw`flex-1 bg-[#09090B]`}>
      <ScrollView
        style={tw`flex-1 px-5 pt-8`}
        contentContainerStyle={tw`pb-12`}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Lock Badge */}
        <View style={tw`items-center mt-4 mb-6`}>
          <View style={tw`w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 items-center justify-center mb-4`}>
            <Lock size={38} color="#F59E0B" />
          </View>
          <Text style={tw`text-2xl font-black text-white text-center tracking-tight`}>
            Companion App Inactive
          </Text>
          <Text style={tw`text-zinc-400 text-xs text-center mt-2 px-4 leading-5`}>
            Mobile executive access has not been activated for this store. Your desktop POS continues to operate normally.
          </Text>
        </View>

        {/* Shop Identifier Card */}
        <View style={tw`bg-[#18181B] rounded-2xl border border-[#27272A] p-4 mb-6`}>
          <View style={tw`flex-row items-center justify-between`}>
            <View style={tw`flex-row items-center flex-1 mr-2`}>
              <View style={tw`w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 items-center justify-center mr-3`}>
                <Store size={20} color="#6366F1" />
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-white font-bold text-sm tracking-wide`} numberOfLines={1}>
                  {shopData.name}
                </Text>
                <Text style={tw`text-zinc-500 text-[11px] font-mono mt-0.5`}>
                  ID: {shopData.code}
                </Text>
              </View>
            </View>

            <View style={tw`bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20`}>
              <Text style={tw`text-amber-400 text-[10px] font-bold tracking-wider uppercase`}>
                LOCKED
              </Text>
            </View>
          </View>
        </View>

        {/* Value Proposition / Feature Highlights */}
        <View style={tw`bg-[#121215] rounded-2xl border border-[#27272A] p-5 mb-6`}>
          <Text style={tw`text-white font-bold text-xs uppercase tracking-wider mb-3 text-zinc-300`}>
            What Aura Boss Companion Unlocks:
          </Text>

          <View style={tw`flex-row items-start mb-3.5`}>
            <View style={tw`w-7 h-7 rounded-lg bg-emerald-500/10 items-center justify-center mr-3 mt-0.5`}>
              <TrendingUp size={16} color="#10B981" />
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-zinc-200 text-xs font-semibold`}>Live Revenue & Cash Drawer</Text>
              <Text style={tw`text-zinc-500 text-[11px] mt-0.5 leading-4`}>
                Watch real-time sales, cash vs. M-Pesa tallies, and expected drawer totals from anywhere.
              </Text>
            </View>
          </View>

          <View style={tw`flex-row items-start mb-3.5`}>
            <View style={tw`w-7 h-7 rounded-lg bg-indigo-500/10 items-center justify-center mr-3 mt-0.5`}>
              <ShieldCheck size={16} color="#6366F1" />
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-zinc-200 text-xs font-semibold`}>Remote Authorizations</Text>
              <Text style={tw`text-zinc-500 text-[11px] mt-0.5 leading-4`}>
                One-tap push approval for cashier discount requests, ticket voids, and price adjustments.
              </Text>
            </View>
          </View>

          <View style={tw`flex-row items-start mb-3.5`}>
            <View style={tw`w-7 h-7 rounded-lg bg-purple-500/10 items-center justify-center mr-3 mt-0.5`}>
              <Zap size={16} color="#A855F7" />
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-zinc-200 text-xs font-semibold`}>Emergency One-Time PINs</Text>
              <Text style={tw`text-zinc-500 text-[11px] mt-0.5 leading-4`}>
                Generate single-use 6-digit tokens without ever revealing your master store PIN.
              </Text>
            </View>
          </View>

          <View style={tw`flex-row items-start`}>
            <View style={tw`w-7 h-7 rounded-lg bg-sky-500/10 items-center justify-center mr-3 mt-0.5`}>
              <Users size={16} color="#0EA5E9" />
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-zinc-200 text-xs font-semibold`}>Staff Shift Tracking & Fiado Debts</Text>
              <Text style={tw`text-zinc-500 text-[11px] mt-0.5 leading-4`}>
                Monitor who is clocked in and register customer credit settlements on the fly.
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={tw`gap-3 mb-6`}>
          {/* WhatsApp Activation Button */}
          <TouchableOpacity
            style={tw`bg-[#25D366] py-3.5 px-4 rounded-xl flex-row items-center justify-center shadow-lg`}
            activeOpacity={0.8}
            onPress={handleContactWhatsApp}
          >
            <MessageCircle size={18} color="#FFFFFF" style={tw`mr-2`} />
            <Text style={tw`text-white font-bold text-sm tracking-wide`}>
              Activate on WhatsApp
            </Text>
          </TouchableOpacity>

          {/* Check Status / Refresh Button */}
          <TouchableOpacity
            style={tw`bg-[#18181B] border border-[#27272A] py-3 px-4 rounded-xl flex-row items-center justify-center`}
            activeOpacity={0.8}
            onPress={handleCheckStatus}
            disabled={checking}
          >
            {checking ? (
              <ActivityIndicator size="small" color="#6366F1" style={tw`mr-2`} />
            ) : (
              <RefreshCw size={16} color="#A1A1AA" style={tw`mr-2`} />
            )}
            <Text style={tw`text-zinc-200 font-semibold text-xs tracking-wide`}>
              {checking ? 'Verifying Activation...' : 'I Have Paid / Check Status'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sign Out Option */}
        <TouchableOpacity
          style={tw`py-3 flex-row items-center justify-center`}
          onPress={onLogout}
        >
          <LogOut size={14} color="#71717A" style={tw`mr-1.5`} />
          <Text style={tw`text-zinc-500 text-xs font-medium`}>
            Sign Out / Switch Shop
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
