import React from 'react';
import { View, Text } from 'react-native';
import tw from 'twrnc';
import { CheckCircle2, ShieldCheck, User } from 'lucide-react-native';
import { EmergencyToken } from './types';

interface UsedTokenCardProps {
  token: EmergencyToken;
  currency?: string;
}

export const UsedTokenCard: React.FC<UsedTokenCardProps> = ({ token, currency = 'MT' }) => {
  const formatDate = (isoStr?: string | null) => {
    if (!isoStr) return 'Recently';
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + d.toLocaleDateString([], { day: '2-digit', month: 'short' });
    } catch {
      return isoStr;
    }
  };

  return (
    <View style={tw`bg-[#121215] border border-zinc-800/80 rounded-2xl p-4 mb-3 opacity-90`}>
      {/* Header: Used badge & Date */}
      <View style={tw`flex-row justify-between items-center pb-2.5 border-b border-zinc-800/60`}>
        <View style={tw`flex-row items-center gap-1.5`}>
          <CheckCircle2 size={13} color="#71717A" />
          <Text style={tw`text-[11px] font-bold text-zinc-400 uppercase tracking-wider`}>
            Redeemed at POS
          </Text>
        </View>

        <Text style={tw`text-[10px] text-zinc-500 font-medium`}>
          {`Used: ${formatDate(token.used_at || token.created_at)}`}
        </Text>
      </View>

      {/* Code & User */}
      <View style={tw`flex-row justify-between items-center py-3`}>
        <View style={tw`flex-1`}>
          <Text style={tw`text-base font-bold text-zinc-400 font-mono line-through`}>
            {`PIN #${token.code}`}
          </Text>
          <View style={tw`flex-row items-center gap-1.5 mt-1`}>
            <User size={12} color="#71717A" />
            <Text style={tw`text-xs text-zinc-300 font-medium`}>
              {token.cashier_name || 'Cashier'}
            </Text>
          </View>
        </View>

        {/* Audit Details: Purpose & Override Amount */}
        <View style={tw`items-end`}>
          <View style={tw`bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg`}>
            <Text style={tw`text-[10px] font-semibold text-zinc-400`}>
              {token.used_for || 'Override Approved'}
            </Text>
          </View>
          {token.used_amount !== null && token.used_amount !== undefined && Number(token.used_amount) > 0 ? (
            <Text style={tw`text-[10px] text-emerald-400 font-mono mt-1 font-semibold`}>
              {`Amount: ${Number(token.used_amount).toFixed(2)} ${currency}`}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
};
