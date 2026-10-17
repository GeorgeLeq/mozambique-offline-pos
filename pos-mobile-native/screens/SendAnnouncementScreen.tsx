import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
} from 'react-native';
import tw from 'twrnc';
import {
  ArrowLeft,
  Send,
  Sparkles,
  AlertTriangle,
  Info,
  Users,
  RefreshCw,
  Clock,
  ShieldAlert,
  DollarSign,
  Package,
  Store,
  Check,
} from 'lucide-react-native';
import { supabase } from '../supabase';
import { useToast } from '../components/Toast';

interface SendAnnouncementScreenProps {
  shopData: { id: string; name: string; code: string };
  targetCashier?: { id: string; name: string; role?: string } | null;
  onBack: () => void;
  onSuccess?: () => void;
}

// Categorized smart contextual suggestion templates for Mozambican POS
const SUGGESTION_CATEGORIES = [
  {
    id: 'cash',
    label: 'Cash & Till',
    icon: DollarSign,
    color: '#10B981',
    suggestions: [
      'Please balance and count your physical cash drawer now.',
      'High cash balance detected in till. Prepare a cash drop for the manager safe.',
      'Always verify customer banknotes for 500 MT and 1000 MT bills carefully.',
      'Verify change calculations on large cash notes before handing to customer.',
      'Confirm petty cash float balance before closing your shift.',
    ],
  },
  {
    id: 'shift',
    label: 'Shift & Store',
    icon: Clock,
    color: '#6366F1',
    suggestions: [
      'Store will close in 15 minutes. Finalize remaining queued customer sales.',
      'Shift handover in 10 minutes: please reconcile your current drawer total.',
      'Morning briefing: ensure printer roll and barcode scanners are ready.',
      'Quick register audit in progress. Do not leave the counter unattended.',
      'Please log out and lock your POS terminal before going on break.',
    ],
  },
  {
    id: 'security',
    label: 'Security & Auth',
    icon: ShieldAlert,
    color: '#F59E0B',
    suggestions: [
      'Customer request exceeds price limit: submit remote authorization request.',
      'Always request photo ID when customer requests debt / fiado registration.',
      'All voided or cancelled receipts must be kept signed in the register drawer.',
      'Manager confirmation required: please wait before finalizing this transaction.',
    ],
  },
  {
    id: 'inventory',
    label: 'Stock & Items',
    icon: Package,
    color: '#06B6D4',
    suggestions: [
      'Barcode scan mismatch on item: check shelf tag or request manager quick-fix.',
      'Promotional discount active today: notify customer of beverage special.',
      'Low inventory on popular SKU: inform floor supervisor to restock shelves.',
      'Ensure accurate weight entry for bulk produce at checkout.',
    ],
  },
];

export default function SendAnnouncementScreen({
  shopData,
  targetCashier,
  onBack,
  onSuccess,
}: SendAnnouncementScreenProps) {
  const { showToast } = useToast();
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
  const [submitting, setSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('cash');
  const [suggestionPoolIndex, setSuggestionPoolIndex] = useState(0);

  const isIndividual = Boolean(targetCashier && targetCashier.id);
  const recipientName = isIndividual ? targetCashier!.name : 'All Cashiers & Registers';

  // Handle hardware back
  useEffect(() => {
    const handleBack = () => {
      onBack();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', handleBack);
    return () => sub.remove();
  }, [onBack]);

  // Intelligent Contextual Auto-Generator
  const handleAutoGenerate = () => {
    const hour = new Date().getHours();
    let timeContext: string[] = [];

    if (hour < 11) {
      timeContext = [
        'Good morning! Confirm cash float (fundo de maneio) in till before ringing sales.',
        'Morning checklist: inspect thermal paper rolls and barcode reader connectivity.',
      ];
    } else if (hour >= 11 && hour < 16) {
      timeContext = [
        'Peak hours: keep customer checkout queues moving efficiently.',
        'Midday check: please verify mobile money (M-Pesa / e-Mola) SMS confirmations.',
      ];
    } else {
      timeContext = [
        'Store closing soon: print end-of-day summary and count drawer cash.',
        'Evening reconciliation: secure high-value stock and check all pending fiado records.',
      ];
    }

    const currentCatObj = SUGGESTION_CATEGORIES.find((c) => c.id === selectedCategory);
    const categoryPool = currentCatObj ? currentCatObj.suggestions : [];
    
    // If target cashier is individual, personalize the suggestion
    const personalizedCategoryPool = isIndividual
      ? categoryPool.map((s) => `Attention ${targetCashier!.name}: ${s}`)
      : categoryPool;

    const combinedPool = [...personalizedCategoryPool, ...timeContext];

    const nextIndex = (suggestionPoolIndex + 1) % combinedPool.length;
    setSuggestionPoolIndex(nextIndex);
    setMessage(combinedPool[nextIndex]);
    showToast('✨ Smart suggestion auto-composed!', 'info');
  };

  const handleSend = async () => {
    if (!message.trim()) {
      showToast('Please enter a message or auto-generate a suggestion.', 'error');
      return;
    }

    setSubmitting(true);
    const cashierId = isIndividual ? targetCashier!.id : null;
    const targetName = recipientName;

    try {
      // 1. Insert into pos_announcements
      const { error: annError } = await supabase.from('pos_announcements').insert({
        shop_id: shopData.id,
        cashier_id: cashierId,
        target_name: targetName,
        message: message.trim(),
        priority: priority,
        is_acknowledged: false,
      });

      if (annError) {
        console.warn('pos_announcements insert fallback:', annError);
        // Fallback to notifications table
        await supabase.from('notifications').insert({
          shop_id: shopData.id,
          title:
            priority === 'urgent'
              ? `URGENT NOTICE to ${targetName}`
              : `Announcement to ${targetName}`,
          message: message.trim(),
          action_url: 'announcement',
        });
      }

      showToast(
        isIndividual
          ? `💬 Direct notice dispatched to ${targetName}!`
          : '📢 Broadcast transmitted to all cashier registers!',
        'success'
      );

      if (onSuccess) onSuccess();
      onBack();
    } catch (err: any) {
      console.error('Error sending announcement:', err);
      showToast('Failed to send announcement. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const currentCategoryData = SUGGESTION_CATEGORIES.find((c) => c.id === selectedCategory);

  return (
    <View style={tw`flex-1 bg-[#09090B]`}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={tw`flex-1`}
      >
        {/* Header Banner */}
        <View style={tw`flex-row items-center justify-between px-4 pt-3.5 pb-3.5 border-b border-[#27272A] bg-[#09090B]`}>
          <View style={tw`flex-row items-center gap-2 flex-1`}>
            <TouchableOpacity
              style={tw`w-9 h-9 rounded-xl bg-[#18181B] border border-[#27272A] justify-center items-center`}
              onPress={onBack}
              activeOpacity={0.7}
            >
              <ArrowLeft size={18} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={tw`flex-1 ml-1`}>
              <Text style={tw`text-[9px] font-bold text-[#6366F1] tracking-wider uppercase`}>
                {isIndividual ? `DIRECT DISPATCH • ${targetCashier!.name}` : 'GLOBAL POS BROADCAST'}
              </Text>
              <Text style={tw`text-lg font-semibold text-white tracking-tight uppercase`}>
                {isIndividual ? 'Cashier Notice' : 'All Registers'}
              </Text>
            </View>
          </View>

          {/* Quick Auto-Suggest Header Button */}
          <TouchableOpacity
            style={tw`bg-[#4F46E5]/15 border border-[#4F46E5]/30 px-3 py-2 rounded-xl flex-row items-center gap-1.5`}
            onPress={handleAutoGenerate}
            activeOpacity={0.7}
          >
            <Sparkles size={13} color="#6366F1" />
            <Text style={tw`text-xs font-bold text-[#6366F1] uppercase tracking-wider`}>Auto Generate</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={tw`flex-1 px-4 pt-4`}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Recipient Target Banner: ONLY shown when broadcasting globally.
              When sending to an individual, we DO NOT show the recipient target card per user request! */}
          {!isIndividual && (
            <View style={tw`bg-[#18181B] border border-[#27272A] rounded-2xl p-4 mb-4`}>
              <Text style={tw`text-[9px] font-bold text-[#6366F1] uppercase tracking-wider mb-2`}>
                RECIPIENT DESTINATION
              </Text>
              <View style={tw`flex-row items-center gap-3`}>
                <View style={tw`w-11 h-11 rounded-xl bg-[#4F46E5]/15 border border-[#4F46E5]/30 justify-center items-center`}>
                  <Users size={20} color="#6366F1" />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-sm font-bold text-white uppercase tracking-tight`}>
                    Broadcast to All Active Registers
                  </Text>
                  <Text style={tw`text-xs text-zinc-400 mt-0.5`}>
                    Instant banner displayed synchronously across all shop cashier screens.
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Notice Priority Selection */}
          <View style={tw`mb-4`}>
            <Text style={tw`text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-2`}>
              NOTICE PRIORITY & PROTOCOL
            </Text>
            <View style={tw`flex-row gap-2.5`}>
              <TouchableOpacity
                style={tw`flex-1 py-3 px-3 rounded-xl flex-row items-center justify-center gap-2 border ${
                  priority === 'normal'
                    ? 'bg-[#4F46E5]/15 border-[#4F46E5]'
                    : 'bg-[#18181B] border-[#27272A]'
                }`}
                onPress={() => setPriority('normal')}
                activeOpacity={0.7}
              >
                <Info size={15} color={priority === 'normal' ? '#6366F1' : '#71717A'} />
                <View>
                  <Text
                    style={tw`text-xs font-bold ${
                      priority === 'normal' ? 'text-[#6366F1]' : 'text-zinc-300'
                    }`}
                  >
                    Standard Banner
                  </Text>
                  <Text style={tw`text-[9px] text-zinc-500`}>Top POS notification</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={tw`flex-1 py-3 px-3 rounded-xl flex-row items-center justify-center gap-2 border ${
                  priority === 'urgent'
                    ? 'bg-red-500/15 border-red-500'
                    : 'bg-[#18181B] border-[#27272A]'
                }`}
                onPress={() => setPriority('urgent')}
                activeOpacity={0.7}
              >
                <AlertTriangle size={15} color={priority === 'urgent' ? '#EF4444' : '#71717A'} />
                <View>
                  <Text
                    style={tw`text-xs font-bold ${
                      priority === 'urgent' ? 'text-red-400' : 'text-zinc-300'
                    }`}
                  >
                    Urgent Alert
                  </Text>
                  <Text style={tw`text-[9px] text-zinc-500`}>Requires cashier acknowledge</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Auto-Generation Suggestion Studio */}
          <View style={tw`bg-[#18181B] border border-[#27272A] rounded-2xl p-4 mb-4`}>
            <View style={tw`flex-row items-center justify-between mb-3`}>
              <View style={tw`flex-row items-center gap-2`}>
                <View style={tw`w-7 h-7 rounded-lg bg-[#4F46E5]/20 border border-[#4F46E5]/30 items-center justify-center`}>
                  <Sparkles size={14} color="#6366F1" />
                </View>
                <View>
                  <Text style={tw`text-xs font-bold text-white uppercase tracking-wider`}>
                    Auto-Generation Suggestions
                  </Text>
                  <Text style={tw`text-[10px] text-zinc-400`}>
                    Instant 1-tap POS operational notices
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={tw`flex-row items-center gap-1 bg-[#09090B] border border-[#27272A] px-2.5 py-1.5 rounded-xl`}
                onPress={handleAutoGenerate}
                activeOpacity={0.7}
              >
                <RefreshCw size={11} color="#6366F1" />
                <Text style={tw`text-[10px] font-bold text-[#6366F1] uppercase`}>Shuffle</Text>
              </TouchableOpacity>
            </View>

            {/* Suggestion Category Filter Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={tw`flex-row mb-3`}
            >
              {SUGGESTION_CATEGORIES.map((cat) => {
                const isCatSelected = selectedCategory === cat.id;
                const IconComponent = cat.icon;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={tw`py-2 px-3 rounded-xl mr-2 flex-row items-center gap-1.5 border ${
                      isCatSelected
                        ? 'bg-[#4F46E5] border-[#4F46E5]'
                        : 'bg-[#09090B] border-[#27272A]'
                    }`}
                    onPress={() => setSelectedCategory(cat.id)}
                    activeOpacity={0.7}
                  >
                    <IconComponent
                      size={12}
                      color={isCatSelected ? '#FFFFFF' : '#71717A'}
                    />
                    <Text
                      style={tw`text-xs font-bold ${
                        isCatSelected ? 'text-white' : 'text-zinc-400'
                      }`}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Smart Suggestions Under Category */}
            <View style={tw`gap-2`}>
              {currentCategoryData?.suggestions.map((sug, idx) => {
                const isSelected = message === sug;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={tw`bg-[#09090B] border ${
                      isSelected ? 'border-[#4F46E5] bg-[#4F46E5]/5' : 'border-[#27272A]'
                    } rounded-xl p-3 flex-row items-center justify-between`}
                    onPress={() => {
                      setMessage(sug);
                      showToast('Template auto-filled into notice content', 'info');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={tw`text-xs ${isSelected ? 'text-white font-medium' : 'text-zinc-300'} flex-1 pr-2 leading-4`}>
                      {sug}
                    </Text>
                    <View style={tw`px-2.5 py-1 rounded-lg ${isSelected ? 'bg-[#4F46E5]' : 'bg-[#18181B] border border-[#27272A]'}`}>
                      <Text style={tw`text-[10px] font-bold ${isSelected ? 'text-white' : 'text-[#6366F1]'} uppercase tracking-wider`}>
                        {isSelected ? 'Selected' : 'Use'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Message Input Box */}
          <View style={tw`mb-5`}>
            <View style={tw`flex-row items-center justify-between mb-2`}>
              <Text style={tw`text-[9px] font-bold text-zinc-400 uppercase tracking-wider`}>
                NOTICE CONTENT (SENT LIVE TO POS)
              </Text>
              {message.length > 0 && (
                <TouchableOpacity onPress={() => setMessage('')} activeOpacity={0.7}>
                  <Text style={tw`text-[10px] font-bold text-red-400 uppercase tracking-wider`}>Clear Text</Text>
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              style={tw`bg-[#18181B] border border-[#27272A] rounded-2xl p-4 text-white text-sm min-h-[110px] leading-5`}
              placeholder="Type your message or pick an auto-generated suggestion above..."
              placeholderTextColor="#71717A"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={message}
              onChangeText={setMessage}
            />
          </View>

          {/* Send CTA Button */}
          <TouchableOpacity
            style={tw`bg-[#4F46E5] active:bg-[#4338CA] rounded-xl py-3.5 flex-row items-center justify-center gap-2 mb-10 ${
              submitting || !message.trim() ? 'opacity-50' : ''
            }`}
            onPress={handleSend}
            disabled={submitting || !message.trim()}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Send size={16} color="#FFFFFF" />
                <Text style={tw`text-white font-bold text-xs uppercase tracking-wider`}>
                  {isIndividual
                    ? `DISPATCH TO ${targetCashier!.name}`
                    : 'BROADCAST TO ALL CASHIERS'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
