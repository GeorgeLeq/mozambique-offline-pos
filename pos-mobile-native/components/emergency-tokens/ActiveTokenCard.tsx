import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Linking, Clipboard } from 'react-native';
import tw from 'twrnc';
import { Copy, Check, MessageCircle, Trash2, User, Key, ShieldCheck } from 'lucide-react-native';
import { EmergencyToken } from './types';

interface ActiveTokenCardProps {
  token: EmergencyToken;
  shopName?: string;
  onRevoke: (tokenId: string) => Promise<void>;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const ActiveTokenCard: React.FC<ActiveTokenCardProps> = ({
  token,
  shopName = 'Store',
  onRevoke,
  onShowToast,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [revoking, setRevoking] = useState<boolean>(false);

  const handleCopy = () => {
    try {
      Clipboard.setString(token.code);
      setCopied(true);
      onShowToast(`PIN #${token.code} copied to clipboard!`, 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onShowToast(`PIN: ${token.code}`, 'info');
    }
  };

  // Bilingual WhatsApp share message (Portuguese & English)
  const handleShareWhatsApp = () => {
    const cashierLabel = token.cashier_name || 'Qualquer Caixa / Any Cashier';
    const message = 
      `🔑 *PIN DE AUTORIZAÇÃO DE EMERGÊNCIA / EMERGENCY AUTHORIZATION PIN*\n\n` +
      `🏪 *Loja / Store:* ${shopName}\n` +
      `👤 *Caixa / Cashier:* ${cashierLabel}\n` +
      `🔢 *Código / PIN:* *${token.code}*\n\n` +
      `⚠️ *Nota / Note:* Este PIN é de uso único. Após ser validado no POS, ele expira automaticamente.\n` +
      `This PIN is for single-use only. Once verified on the POS, it expires automatically.`;

    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Linking.openURL(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`);
        }
      })
      .catch(() => {
        handleCopy();
      });
  };

  const handleConfirmRevoke = () => {
    Alert.alert(
      'Revogar PIN de Emergência',
      `Tem certeza que deseja revogar e excluir o PIN #${token.code}? Ele não poderá mais ser usado no POS.\n\nAre you sure you want to revoke PIN #${token.code}?`,
      [
        { text: 'Cancelar / Cancel', style: 'cancel' },
        {
          text: 'Revogar / Revoke',
          style: 'destructive',
          onPress: async () => {
            try {
              setRevoking(true);
              await onRevoke(token.id);
              onShowToast(`PIN #${token.code} revogado com sucesso!`, 'info');
            } catch (err: any) {
              onShowToast(err?.message || 'Failed to revoke PIN', 'error');
            } finally {
              setRevoking(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + d.toLocaleDateString([], { day: '2-digit', month: 'short' });
    } catch {
      return isoStr;
    }
  };

  return (
    <View style={tw`bg-[#121215] border border-amber-500/30 rounded-2xl p-4.5 mb-3 shadow-lg`}>
      {/* Top Bar: Status & Time */}
      <View style={tw`flex-row justify-between items-center pb-3 border-b border-zinc-800/80`}>
        <View style={tw`flex-row items-center gap-1.5`}>
          <View style={tw`w-2 h-2 rounded-full bg-emerald-400`} />
          <Text style={tw`text-[11px] font-bold text-emerald-400 uppercase tracking-wider`}>
            Ready for POS
          </Text>
        </View>

        <Text style={tw`text-[10px] text-zinc-500 font-medium`}>
          {formatDate(token.created_at)}
        </Text>
      </View>

      {/* Main PIN Display */}
      <View style={tw`flex-row justify-between items-center py-4`}>
        <View style={tw`flex-1`}>
          <Text style={tw`text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mb-1`}>
            One-Time Emergency Code
          </Text>
          <View style={tw`flex-row items-center gap-2`}>
            <Key size={18} color="#F59E0B" />
            <Text style={tw`text-2xl font-bold text-white font-mono tracking-widest`}>
              {`#${token.code}`}
            </Text>
          </View>
        </View>

        {/* Action Buttons: Copy & WhatsApp */}
        <View style={tw`flex-row items-center gap-2`}>
          <TouchableOpacity
            style={tw`h-10 px-3.5 rounded-xl flex-row items-center gap-1.5 ${copied ? 'bg-emerald-500/20 border border-emerald-500/40' : 'bg-zinc-900 border border-zinc-800'}`}
            onPress={handleCopy}
            activeOpacity={0.7}
          >
            {copied ? (
              <>
                <Check size={14} color="#10B981" />
                <Text style={tw`text-xs font-bold text-emerald-400`}>Copied</Text>
              </>
            ) : (
              <>
                <Copy size={14} color="#E4E4E7" />
                <Text style={tw`text-xs font-bold text-zinc-200`}>Copy</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={tw`w-10 h-10 rounded-xl bg-[#25D366]/15 border border-[#25D366]/30 justify-center items-center`}
            onPress={handleShareWhatsApp}
            activeOpacity={0.7}
          >
            <MessageCircle size={18} color="#25D366" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer Info: Assigned Cashier & Revoke */}
      <View style={tw`flex-row items-center justify-between pt-3 border-t border-zinc-800/80`}>
        <View style={tw`flex-row items-center gap-1.5 flex-1 pr-2`}>
          <User size={13} color="#A1A1AA" />
          <Text style={tw`text-xs text-zinc-300 font-medium`} numberOfLines={1}>
            {token.cashier_name || 'Universal (Any Cashier)'}
          </Text>
        </View>

        <TouchableOpacity
          style={tw`flex-row items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20`}
          onPress={handleConfirmRevoke}
          disabled={revoking}
          activeOpacity={0.7}
        >
          <Trash2 size={12} color="#EF4444" />
          <Text style={tw`text-[10px] font-bold text-red-400`}>
            {revoking ? 'Revoking...' : 'Revoke'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
