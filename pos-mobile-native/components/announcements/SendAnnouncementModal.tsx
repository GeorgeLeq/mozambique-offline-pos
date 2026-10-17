import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import tw from 'twrnc';
import {
  Radio,
  Send,
  X,
  AlertTriangle,
  Users,
  User,
  CheckCircle2,
  Sparkles,
  Info,
} from 'lucide-react-native';
import { supabase } from '../../supabase';
import { useToast } from '../Toast';
import { useLanguage } from '../../locales';

interface SendAnnouncementModalProps {
  visible: boolean;
  onClose: () => void;
  shopData: { id: string; name: string; code: string };
  employees: any[];
  preselectedCashierId?: string | null;
  onSuccess?: () => void;
}

const QUICK_TEMPLATES = [
  '📢 Please count your cash drawer balance now.',
  '⚠️ Store will be closing in 15 minutes.',
  '💵 Please inspect all 500 MT banknotes carefully.',
  '📞 Call the manager on WhatsApp when you are free.',
  '🛑 System update soon: please finalize open orders.',
];

export default function SendAnnouncementModal({
  visible,
  onClose,
  shopData,
  employees,
  preselectedCashierId,
  onSuccess,
}: SendAnnouncementModalProps) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [selectedTarget, setSelectedTarget] = useState<'all' | string>('all');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      if (preselectedCashierId) {
        setSelectedTarget(preselectedCashierId);
      } else {
        setSelectedTarget('all');
      }
      setMessage('');
      setPriority('normal');
    }
  }, [visible, preselectedCashierId]);

  const getTargetName = () => {
    if (selectedTarget === 'all') return t('All Cashiers');
    const emp = employees.find((e) => e.id === selectedTarget);
    return emp ? emp.name : t('Selected Cashier');
  };

  const handleSend = async () => {
    if (!message.trim()) {
      showToast(t('Please type a message or select a template.'), 'error');
      return;
    }

    setSubmitting(true);
    const cashierId = selectedTarget === 'all' ? null : selectedTarget;
    const targetName = getTargetName();

    try {
      // 1. Try to insert into pos_announcements
      const { error: annError } = await supabase.from('pos_announcements').insert({
        shop_id: shopData.id,
        cashier_id: cashierId,
        target_name: targetName,
        message: message.trim(),
        priority: priority,
        is_acknowledged: false,
      });

      if (annError) {
        console.warn('pos_announcements insert failed, falling back to notifications:', annError);
        // Fallback to notifications table
        await supabase.from('notifications').insert({
          shop_id: shopData.id,
          title: priority === 'urgent' ? `URGENT NOTICE to ${targetName}` : `Announcement to ${targetName}`,
          message: message.trim(),
          action_url: 'announcement',
        });
      }

      showToast(
        selectedTarget === 'all'
          ? t('Broadcast sent to all cashier desks!')
          : `${t('Announcement sent to')} ${targetName}!`,
        'success'
      );

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error sending announcement:', err);
      showToast(t('Failed to send announcement. Please try again.'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={tw`flex-1 bg-black/80 justify-end`}
      >
        <View style={tw`bg-[#09090B] border-t border-zinc-800 rounded-t-3xl p-5 max-h-[90%]`}>
          {/* Header */}
          <View style={tw`flex-row items-center justify-between pb-3 border-b border-zinc-900`}>
            <View style={tw`flex-row items-center gap-2.5`}>
              <View style={tw`w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 justify-center items-center`}>
                <Radio size={18} color="#3B82F6" />
              </View>
              <View>
                <Text style={tw`text-base font-bold text-white`}>{t('Send POS Announcement')}</Text>
                <Text style={tw`text-[10px] text-zinc-400`}>{t('One-way instant notice to cashier screen')}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={tw`w-8 h-8 rounded-full bg-zinc-900 justify-center items-center`}
            >
              <X size={16} color="#A1A1AA" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={tw`py-3`}>
            {/* Recipient Selector */}
            <Text style={tw`text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2`}>
              {t('Recipient Target')}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`flex-row mb-4`}>
              {/* All Registers Chip */}
              <TouchableOpacity
                style={tw`py-2 px-3 rounded-xl mr-2 flex-row items-center gap-1.5 border ${
                  selectedTarget === 'all'
                    ? 'bg-blue-500/20 border-blue-500'
                    : 'bg-[#18181B] border-zinc-800'
                }`}
                onPress={() => setSelectedTarget('all')}
              >
                <Users size={14} color={selectedTarget === 'all' ? '#60A5FA' : '#71717A'} />
                <Text
                  style={tw`text-xs font-bold ${
                    selectedTarget === 'all' ? 'text-blue-400' : 'text-zinc-400'
                  }`}
                >
                  {t('Broadcast to All')}
                </Text>
              </TouchableOpacity>

              {/* Individual Cashier Chips */}
              {employees.map((emp) => {
                const isSelected = selectedTarget === emp.id;
                return (
                  <TouchableOpacity
                    key={emp.id}
                    style={tw`py-2 px-3 rounded-xl mr-2 flex-row items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-blue-500/20 border-blue-500'
                        : 'bg-[#18181B] border-zinc-800'
                    }`}
                    onPress={() => setSelectedTarget(emp.id)}
                  >
                    <User size={14} color={isSelected ? '#60A5FA' : '#71717A'} />
                    <Text
                      style={tw`text-xs font-bold ${
                        isSelected ? 'text-blue-400' : 'text-zinc-400'
                      }`}
                    >
                      {emp.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Priority Selector */}
            <Text style={tw`text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2`}>
              {t('Notice Urgency')}
            </Text>
            <View style={tw`flex-row gap-2 mb-4`}>
              <TouchableOpacity
                style={tw`flex-1 py-2.5 px-3 rounded-xl flex-row items-center justify-center gap-1.5 border ${
                  priority === 'normal'
                    ? 'bg-blue-500/10 border-blue-500/40'
                    : 'bg-[#18181B] border-zinc-800'
                }`}
                onPress={() => setPriority('normal')}
              >
                <Info size={14} color={priority === 'normal' ? '#60A5FA' : '#71717A'} />
                <Text
                  style={tw`text-xs font-bold ${
                    priority === 'normal' ? 'text-blue-400' : 'text-zinc-500'
                  }`}
                >
                  {t('Standard Banner')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={tw`flex-1 py-2.5 px-3 rounded-xl flex-row items-center justify-center gap-1.5 border ${
                  priority === 'urgent'
                    ? 'bg-red-500/10 border-red-500/40'
                    : 'bg-[#18181B] border-zinc-800'
                }`}
                onPress={() => setPriority('urgent')}
              >
                <AlertTriangle size={14} color={priority === 'urgent' ? '#EF4444' : '#71717A'} />
                <Text
                  style={tw`text-xs font-bold ${
                    priority === 'urgent' ? 'text-red-400' : 'text-zinc-500'
                  }`}
                >
                  {t('Urgent (Require OK)')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quick Templates */}
            <Text style={tw`text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2`}>
              {t('Quick Templates')}
            </Text>
            <View style={tw`flex-row flex-wrap gap-1.5 mb-4`}>
              {QUICK_TEMPLATES.map((tmpl, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={tw`bg-[#18181B] border border-zinc-800/80 rounded-lg px-2.5 py-1.5`}
                  onPress={() => setMessage(t(tmpl))}
                >
                  <Text style={tw`text-[11px] text-zinc-300`}>{t(tmpl)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Message Input */}
            <Text style={tw`text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2`}>
              {t('Message Body')}
            </Text>
            <TextInput
              style={tw`bg-[#18181B] border border-zinc-800 rounded-xl p-3.5 text-white text-sm min-h-[90px] mb-4`}
              placeholder={t('Type your message for the cashier desk...')}
              placeholderTextColor="#52525B"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={message}
              onChangeText={setMessage}
            />

            {/* Send Button */}
            <TouchableOpacity
              style={tw`bg-blue-600 rounded-xl py-3.5 flex-row items-center justify-center gap-2 mb-4 ${
                submitting ? 'opacity-60' : ''
              }`}
              onPress={handleSend}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Send size={16} color="#FFFFFF" />
                  <Text style={tw`text-white font-bold text-sm`}>
                    {selectedTarget === 'all'
                      ? t('Broadcast to All Registers')
                      : `${t('Send to')} ${getTargetName()}`}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
