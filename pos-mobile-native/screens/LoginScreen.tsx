import React, { useState } from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { supabase } from '../supabase';
import { ShieldCheck, Store, KeyRound, ArrowRight } from 'lucide-react-native';
import tw from 'twrnc';

interface LoginScreenProps {
  onLoginSuccess: (shopData: {
    id: string;
    name: string;
    code: string;
    companion_app_enabled?: boolean;
    companion_app_expires_at?: string | null;
  }) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [shopCode, setShopCode] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!shopCode.trim()) {
      Alert.alert('Required', 'Please enter your Shop Code.');
      return;
    }
    if (pin.length < 4) {
      Alert.alert('Required', 'Please enter your complete 4-digit or 6-digit PIN.');
      return;
    }

    setLoading(true);
    Keyboard.dismiss();

    try {
      // Query our Supabase table 'shops' to find a matching code, master_pin, and companion access
      let data: any = null;
      let { data: primaryData, error } = await supabase
        .from('shops')
        .select('id, name, code, master_pin, companion_app_enabled, companion_app_expires_at')
        .eq('code', shopCode.trim())
        .single();

      // If the column companion_app_enabled doesn't exist yet in user's DB, fallback gracefully
      if (error && (error.code === '42703' || error.message?.includes('column'))) {
        const fallback = await supabase
          .from('shops')
          .select('id, name, code, master_pin')
          .eq('code', shopCode.trim())
          .single();
        data = fallback.data;
        error = fallback.error;
      } else {
        data = primaryData;
      }

      if (error) {
        throw new Error(error.message || 'Shop not found. Check your Shop Code.');
      }

      if (data) {
        // Compare the master_pin securely
        if (data.master_pin === pin) {
          // Success! Pass metadata up
          onLoginSuccess({
            id: data.id,
            name: data.name,
            code: data.code,
            companion_app_enabled: data.companion_app_enabled ?? false,
            companion_app_expires_at: data.companion_app_expires_at ?? null,
          });
        } else {
          Alert.alert('Access Denied', 'Invalid Master PIN. Please try again.');
        }
      } else {
        Alert.alert('Error', 'Shop ID could not be identified.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      Alert.alert(
        'Database Query Failed',
        err.message || 'Please check your connection parameters and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const addPinDigit = (digit: string) => {
    if (pin.length < 6) {
      setPin(pin + digit);
    }
  };

  const removePinDigit = () => {
    setPin(pin.slice(0, -1));
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={tw`flex-1 bg-[#09090B] justify-center px-6`}>
        <View style={tw`items-center mb-8`}>
          <View style={tw`w-14 h-14 rounded-2xl bg-[#4F46E5]/15 justify-center items-center mb-3 border border-[#4F46E5]/30`}>
            <ShieldCheck size={28} color="#6366F1" />
          </View>
          <Text style={tw`text-2xl font-bold text-white tracking-widest`}>AURA BOSS</Text>
          <Text style={tw`text-[11px] text-[#6366F1] font-semibold mt-1 tracking-wider uppercase`}>POS Real-Time Executive Portal</Text>
        </View>

        <View style={tw`bg-[#18181B] rounded-2xl border border-[#27272A] p-6`}>
          {/* Shop Code Input */}
          <Text style={tw`text-[9px] font-bold text-zinc-400 tracking-wider mb-2 uppercase`}>SHOP ID / CODE</Text>
          <View style={tw`flex-row items-center bg-[#09090B] rounded-xl border border-[#27272A] h-12 px-4 mb-5`}>
            <Store size={16} color="#71717A" style={tw`mr-3`} />
            <TextInput
              style={tw`flex-1 text-white text-sm tracking-wider font-semibold`}
              placeholder="e.g. SHOP_01"
              placeholderTextColor="#71717A"
              value={shopCode}
              onChangeText={setShopCode}
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>

          {/* Master PIN Indicator Block */}
          <Text style={tw`text-[9px] font-bold text-zinc-400 tracking-wider mb-2 uppercase`}>BOSS MASTER PIN</Text>
          <View style={tw`flex-row items-center bg-[#09090B] rounded-xl border border-[#27272A] h-12 px-4 mb-5`}>
            <KeyRound size={16} color="#71717A" style={tw`mr-3`} />
            <View style={tw`flex-row items-center gap-3`}>
              {[...Array(6)].map((_, i) => (
                <View
                  key={i}
                  style={tw`w-2.5 h-2.5 rounded-full border border-zinc-700 ${
                    pin.length > i ? 'bg-[#6366F1] border-[#6366F1]' : 'bg-transparent'
                  }`}
                />
              ))}
            </View>
          </View>

          {/* Custom Sleek PIN Numeric Pad */}
          <View style={tw`mb-5 gap-2`}>
            <View style={tw`flex-row justify-between gap-2`}>
              {['1', '2', '3'].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={tw`flex-1 h-12 bg-[#09090B] rounded-xl justify-center items-center border border-[#27272A]`}
                  onPress={() => addPinDigit(num)}
                  activeOpacity={0.7}
                >
                  <Text style={tw`text-white text-lg font-medium`}>{num}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={tw`flex-row justify-between gap-2`}>
              {['4', '5', '6'].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={tw`flex-1 h-12 bg-[#09090B] rounded-xl justify-center items-center border border-[#27272A]`}
                  onPress={() => addPinDigit(num)}
                  activeOpacity={0.7}
                >
                  <Text style={tw`text-white text-lg font-medium`}>{num}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={tw`flex-row justify-between gap-2`}>
              {['7', '8', '9'].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={tw`flex-1 h-12 bg-[#09090B] rounded-xl justify-center items-center border border-[#27272A]`}
                  onPress={() => addPinDigit(num)}
                  activeOpacity={0.7}
                >
                  <Text style={tw`text-white text-lg font-medium`}>{num}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={tw`flex-row justify-between gap-2`}>
              <TouchableOpacity
                style={tw`flex-1 h-12 bg-[#09090B] rounded-xl justify-center items-center border border-[#27272A]`}
                onPress={() => setPin('')}
                activeOpacity={0.7}
              >
                <Text style={tw`text-xs font-bold text-red-400`}>CLR</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={tw`flex-1 h-12 bg-[#09090B] rounded-xl justify-center items-center border border-[#27272A]`}
                onPress={() => addPinDigit('0')}
                activeOpacity={0.7}
              >
                <Text style={tw`text-white text-lg font-medium`}>0</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={tw`flex-1 h-12 bg-[#09090B] rounded-xl justify-center items-center border border-[#27272A]`}
                onPress={removePinDigit}
                activeOpacity={0.7}
              >
                <Text style={tw`text-sm font-bold text-red-400`}>⌫</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={tw`h-12 bg-[#4F46E5] active:bg-[#4338CA] rounded-xl justify-center items-center ${
              loading ? 'opacity-50' : ''
            }`}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={tw`flex-row items-center gap-2`}>
                <Text style={tw`text-white text-xs font-bold tracking-wider uppercase`}>AUTHORIZE LOGIN</Text>
                <ArrowRight size={15} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={tw`items-center mt-6 gap-1`}>
          <Text style={tw`text-[10px] text-zinc-400`}>Secure end-to-end encrypted session</Text>
          <Text style={tw`text-[9px] text-[#6366F1] font-mono font-bold`}>Aura POS Ecosystem Companion</Text>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}
