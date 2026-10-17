import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import tw from 'twrnc';
import { supabase } from '../supabase';
import { ShieldCheck, X, KeyRound, CheckCircle2 } from 'lucide-react-native';
import { useLanguage } from '../locales';

export interface AuthorizationRequest {
  id: string; // The ID of the row to update
  cashierName: string;
  actionDetails: string;
  context: string;
  shopId: string;
}

interface AuthorizationModalProps {
  visible: boolean;
  request: AuthorizationRequest | null;
  onClose: () => void;
  onSuccess: () => void;
  managerName: string; // From session.name
  managerPin?: string; // Optional: we might need to verify the pin locally if we have it, or query the db
}

export default function AuthorizationModal({ visible, request, onClose, onSuccess, managerName }: AuthorizationModalProps) {
  const { t } = useLanguage();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleApprove = async () => {
    if (pin.length < 4) {
      Alert.alert(t('Required'), t('Please enter your 4-digit PIN to authorize.'));
      return;
    }

    if (!request) return;

    setLoading(true);

    try {
      // 1. Verify PIN
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('master_pin')
        .eq('id', request.shopId)
        .single();

      if (shopError || !shopData || shopData.master_pin !== pin) {
        Alert.alert(t('Access Denied'), t('Invalid PIN. Authorization failed.'));
        setLoading(false);
        return;
      }

      // 2. Update the Authorization Row in Supabase
      const { error: updateError } = await supabase
        .from('remote_authorizations')
        .update({ 
          status: 'approved', 
          authorized_by: managerName,
          updated_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (updateError) {
        console.error('Update error:', updateError);
        Alert.alert(t('Error'), t('Failed to update authorization status. Ensure the table "remote_authorizations" exists.'));
      } else {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setPin('');
          onSuccess();
        }, 2000);
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert(t('Error'), err.message);
    } finally {
      if (!success) {
        setLoading(false);
      }
    }
  };

  const handleReject = async () => {
    if (!request) return;

    setLoading(true);
    try {
      const { error: updateError } = await supabase
        .from('remote_authorizations')
        .update({ 
          status: 'rejected', 
          authorized_by: managerName,
          updated_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (updateError) {
        console.error('Update error:', updateError);
        Alert.alert(t('Error'), t('Failed to update authorization status.'));
      } else {
        Alert.alert(t('Rejected'), t('The authorization request was rejected.'));
        onSuccess(); // Close and refresh
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert(t('Error'), err.message);
    } finally {
      setLoading(false);
    }
  };

  const addPinDigit = (digit: string) => {
    if (pin.length < 4) setPin(pin + digit);
  };

  const removePinDigit = () => {
    setPin(pin.slice(0, -1));
  };

  if (!request) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={tw`flex-1 justify-end bg-black/80`}>
        <View style={tw`bg-[#09090B] rounded-t-3xl border-t border-zinc-800 p-6`}>
          
          <View style={tw`flex-row justify-between items-center mb-6`}>
            <View style={tw`flex-row items-center gap-2`}>
              <View style={tw`bg-emerald-500/10 p-2 rounded-full`}>
                <ShieldCheck size={20} color="#10B981" />
              </View>
              <Text style={tw`text-white text-lg font-bold tracking-wider`}>{t('AUTHORIZATION REQUIRED')}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={tw`p-2`}>
              <X size={20} color="#71717A" />
            </TouchableOpacity>
          </View>

          {success ? (
            <View style={tw`items-center justify-center py-12`}>
              <CheckCircle2 size={64} color="#10B981" />
              <Text style={tw`text-white text-xl font-bold mt-4`}>{t('Approved Successfully')}</Text>
              <Text style={tw`text-zinc-500 text-sm mt-2`}>{t('The POS has been notified.')}</Text>
            </View>
          ) : (
            <>
              {/* Request Details */}
              <View style={tw`bg-[#18181B] rounded-xl p-4 border border-zinc-800 mb-6`}>
                <View style={tw`mb-3`}>
                  <Text style={tw`text-zinc-500 text-xs font-semibold mb-1`}>{t('WHO')}</Text>
                  <Text style={tw`text-white text-base`}>{request.cashierName}</Text>
                </View>
                <View style={tw`mb-3`}>
                  <Text style={tw`text-zinc-500 text-xs font-semibold mb-1`}>{t('WHAT')}</Text>
                  <Text style={tw`text-amber-400 text-base font-medium`}>{request.actionDetails}</Text>
                </View>
                <View>
                  <Text style={tw`text-zinc-500 text-xs font-semibold mb-1`}>{t('CONTEXT')}</Text>
                  <Text style={tw`text-white text-base`}>{request.context}</Text>
                </View>
              </View>

              {/* PIN Input */}
              <Text style={tw`text-center text-zinc-400 text-sm mb-4`}>{t('Enter PIN to Approve')}</Text>
              <View style={tw`flex-row justify-center items-center mb-6 gap-4`}>
                {[...Array(4)].map((_, i) => (
                  <View
                    key={i}
                    style={tw`w-4 h-4 rounded-full border ${
                      pin.length > i ? 'bg-emerald-500 border-emerald-500' : 'bg-zinc-900 border-zinc-700'
                    }`}
                  />
                ))}
              </View>

              {/* Numpad */}
              <View style={tw`mb-6 gap-2`}>
                <View style={tw`flex-row justify-between gap-2`}>
                  {['1', '2', '3'].map((num) => (
                    <TouchableOpacity key={num} onPress={() => addPinDigit(num)} style={tw`flex-1 h-12 bg-zinc-900 rounded-lg justify-center items-center`}>
                      <Text style={tw`text-white text-xl`}>{num}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={tw`flex-row justify-between gap-2`}>
                  {['4', '5', '6'].map((num) => (
                    <TouchableOpacity key={num} onPress={() => addPinDigit(num)} style={tw`flex-1 h-12 bg-zinc-900 rounded-lg justify-center items-center`}>
                      <Text style={tw`text-white text-xl`}>{num}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={tw`flex-row justify-between gap-2`}>
                  {['7', '8', '9'].map((num) => (
                    <TouchableOpacity key={num} onPress={() => addPinDigit(num)} style={tw`flex-1 h-12 bg-zinc-900 rounded-lg justify-center items-center`}>
                      <Text style={tw`text-white text-xl`}>{num}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={tw`flex-row justify-between gap-2`}>
                  <View style={tw`flex-1 h-12`} />
                  <TouchableOpacity onPress={() => addPinDigit('0')} style={tw`flex-1 h-12 bg-zinc-900 rounded-lg justify-center items-center`}>
                    <Text style={tw`text-white text-xl`}>0</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={removePinDigit} style={tw`flex-1 h-12 bg-zinc-900 rounded-lg justify-center items-center`}>
                    <Text style={tw`text-red-500 text-xl`}>⌫</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={tw`gap-3`}>
                <TouchableOpacity
                  style={tw`h-14 bg-emerald-500 rounded-xl justify-center items-center ${loading ? 'opacity-50' : ''}`}
                  onPress={handleApprove}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={tw`text-black font-bold text-lg`}>{t('AUTHORIZE')}</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={tw`h-14 bg-transparent border border-red-500/50 rounded-xl justify-center items-center ${loading ? 'opacity-50' : ''}`}
                  onPress={handleReject}
                  disabled={loading}
                >
                  <Text style={tw`text-red-500 font-bold text-lg`}>{t('REJECT')}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
          <SafeAreaView />
        </View>
      </View>
    </Modal>
  );
}

