import React, { useState, useEffect, useMemo } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { supabase } from '../../supabase';
import {
  Users,
  Plus,
  Search,
  RefreshCw,
  X,
} from 'lucide-react-native';
import tw from 'twrnc';

import { Debt, DebtPayment } from './types';
import StatsBoard from './components/StatsBoard';
import DebtCard from './components/DebtCard';
import CreateDebtModal from './components/CreateDebtModal';
import RecordPaymentModal from './components/RecordPaymentModal';
import EditDebtModal from './components/EditDebtModal';
import DebtDetailsScreen from './DebtDetailsScreen';
import { useToast } from '../../components/Toast';
import { useLanguage } from '../../locales';
import { useTheme } from '../../theme';

interface DebtScreenProps {
  shopData: { id: string; name: string; code: string };
}

// RFC4122 client-side UUID generator to prevent column non-null constraints
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function DebtScreen({ shopData }: DebtScreenProps) {
  const { showToast } = useToast();
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [payments, setPayments] = useState<DebtPayment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'paid' | 'partial'>('unpaid');

  // Modal control
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [viewDetailsDebt, setViewDetailsDebt] = useState<Debt | null>(null);

  useEffect(() => {
    fetchData();
  }, [shopData.id]);

  // Handle hardware / gesture back button
  useEffect(() => {
    const onBackPress = () => {
      if (createModalVisible) {
        setCreateModalVisible(false);
        return true;
      }
      if (paymentModalVisible) {
        setPaymentModalVisible(false);
        setSelectedDebt(null);
        return true;
      }
      if (editModalVisible) {
        setEditModalVisible(false);
        setSelectedDebt(null);
        return true;
      }
      if (viewDetailsDebt) {
        setViewDetailsDebt(null);
        return true;
      }
      return false; // Bubble up to App.tsx to navigate back
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [createModalVisible, paymentModalVisible, editModalVisible, viewDetailsDebt]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch debts for this shop
      const { data: debtsData, error: debtsError } = await supabase
        .from('debts')
        .select('*')
        .eq('shop_id', shopData.id)
        .order('created_at', { ascending: false });

      if (debtsError) throw debtsError;

      // 2. Fetch payments for this shop
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('debt_payments')
        .select('*')
        .eq('shop_id', shopData.id)
        .order('created_at', { ascending: true });

      if (paymentsError) throw paymentsError;

      setDebts(debtsData || []);
      setPayments(paymentsData || []);
    } catch (error: any) {
      console.error('Error fetching debt data:', error);
      Alert.alert(t('Database Connection Failed'), error.message || t('Could not load debts.'));
    } finally {
      setLoading(false);
    }
  };

  // Helper to calculate payments made per debt
  const getPaymentsForDebt = (debtId: string) => {
    return payments.filter((p) => p.debt_id === debtId);
  };

  const getPaidAmount = (debtId: string) => {
    return getPaymentsForDebt(debtId).reduce((sum, p) => sum + Number(p.amount_mt), 0);
  };

  const getRemainingAmount = (debt: Debt) => {
    if (debt.status === 'paid') return 0;
    return Math.max(0, Number(debt.amount_mt) - getPaidAmount(debt.id));
  };

  // Stats calculators
  const statsTotalOriginal = debts.reduce((sum, d) => sum + Number(d.amount_mt), 0);

  const statsTotalOutstanding = debts.reduce((sum, d) => sum + Math.max(0, getRemainingAmount(d)), 0);

  const statsTotalCollected = payments.reduce((sum, p) => sum + Number(p.amount_mt), 0);

  const statsTotalDebtors = debts.filter((d) => getRemainingAmount(d) > 0).length;

  // Form Handlers
  const handleCreateDebt = async (formData: {
    customerName: string;
    amount: string;
    phoneNumber: string;
    address: string;
    items: string;
    cashierName: string;
  }) => {
    const { customerName, amount, phoneNumber, address, items, cashierName } = formData;
    if (!customerName.trim()) {
      Alert.alert(t('Required'), t('Please enter a customer name.'));
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert(t('Required'), t('Please enter a valid debt amount.'));
      return;
    }

    setLoading(true);
    const newDebtId = generateUUID();
    const newDebtObj: Debt = {
      id: newDebtId,
      shop_id: shopData.id,
      customer_name: customerName.trim(),
      amount_mt: parsedAmount,
      status: 'unpaid',
      phone_number: phoneNumber.trim() || undefined,
      address: address.trim() || undefined,
      payment_method: 'Unpaid',
      cashier_name: cashierName.trim() || 'Boss',
      items_json: items.trim() || undefined,
      created_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabase.from('debts').insert(newDebtObj);
      if (error) throw error;

      showToast(`${t('Debt registered successfully.')} (${customerName})`, 'success');
      setCreateModalVisible(false);
      fetchData();
    } catch (error: any) {
      console.error('Error creating debt:', error);
      showToast(error.message || t('Could not save new debt.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDebt = async (formData: {
    customerName: string;
    amount: string;
    phoneNumber: string;
    address: string;
    items: string;
    cashierName: string;
    status: 'unpaid' | 'paid';
  }) => {
    if (!selectedDebt) return;
    const { customerName, amount, phoneNumber, address, items, cashierName, status } = formData;
    if (!customerName.trim()) {
      Alert.alert(t('Required'), t('Please enter a customer name.'));
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert(t('Required'), t('Please enter a valid amount.'));
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('debts')
        .update({
          customer_name: customerName.trim(),
          amount_mt: parsedAmount,
          phone_number: phoneNumber.trim() || null,
          address: address.trim() || null,
          cashier_name: cashierName.trim() || 'Boss',
          items_json: items.trim() || null,
          status,
          paid_at: status === 'paid' ? (selectedDebt.paid_at || new Date().toISOString()) : null,
        })
        .eq('id', selectedDebt.id);

      if (error) throw error;

      showToast(t('Debt record updated successfully.'), 'success');
      setEditModalVisible(false);
      setSelectedDebt(null);
      fetchData();
    } catch (error: any) {
      console.error('Error updating debt:', error);
      showToast(error.message || t('Could not update debt.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDebt = (debt: Debt) => {
    Alert.alert(
      t('Delete Record'),
      `${t('Are you sure you want to permanently delete the debt record for')} ${debt.customer_name}? ${t('This action is irreversible.')}`,
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('DELETE'),
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const { error } = await supabase.from('debts').delete().eq('id', debt.id);
              if (error) throw error;

              Alert.alert(t('Success'), t('Debt record deleted.'));
              fetchData();
            } catch (error: any) {
              console.error('Error deleting debt:', error);
              Alert.alert(t('Error'), error.message || t('Could not delete record.'));
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleRegisterPayment = async (amount: string, method: string) => {
    if (!selectedDebt) return;
    const parsedAmount = parseFloat(amount);
    const remaining = getRemainingAmount(selectedDebt);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert(t('Required'), t('Please enter a valid payment amount.'));
      return;
    }

    if (parsedAmount > remaining + 0.01) {
      Alert.alert(
        t('Overpayment'),
        `${t('The amount entered exceeds the remaining debt of')} ${remaining.toFixed(2)} MT.`
      );
      return;
    }

    setLoading(true);
    const paymentId = generateUUID();
    const newPaymentObj: DebtPayment = {
      id: paymentId,
      shop_id: shopData.id,
      debt_id: selectedDebt.id,
      amount_mt: parsedAmount,
      payment_method: method,
      cashier_name: 'Boss',
      created_at: new Date().toISOString(),
    };

    try {
      // 1. Insert payment record
      const { error: paymentError } = await supabase.from('debt_payments').insert(newPaymentObj);
      if (paymentError) throw paymentError;

      // 2. Check if debt is fully settled
      const totalPaidNow = getPaidAmount(selectedDebt.id) + parsedAmount;
      const isFullyPaid = totalPaidNow >= Number(selectedDebt.amount_mt) - 0.05; // tiny buffer

      if (isFullyPaid) {
        const { error: debtUpdateError } = await supabase
          .from('debts')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            payment_method: method,
          })
          .eq('id', selectedDebt.id);

        if (debtUpdateError) throw debtUpdateError;
      }

      showToast(
        isFullyPaid
          ? t('Full payment registered! Debt is now SETTLED.')
          : t('Partial payment registered successfully.'),
        'success'
      );

      setPaymentModalVisible(false);
      setSelectedDebt(null);
      fetchData();
    } catch (error: any) {
      console.error('Error recording payment:', error);
      showToast(error.message || t('Could not register payment.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filter and search computation
  const filteredDebts = debts.filter((d) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      d.customer_name.toLowerCase().includes(searchLower) ||
      (d.phone_number && d.phone_number.includes(searchQuery)) ||
      (d.address && d.address.toLowerCase().includes(searchLower)) ||
      (d.items_json && d.items_json.toLowerCase().includes(searchLower));

    const paidAmt = getPaidAmount(d.id);
    const remAmt = Number(d.amount_mt) - paidAmt;
    const isPaid = d.status === 'paid' || remAmt <= 0;
    const isPartial = !isPaid && paidAmt > 0;
    const isUnpaid = !isPaid && paidAmt === 0;

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'unpaid' && isUnpaid) ||
      (statusFilter === 'partial' && isPartial) ||
      (statusFilter === 'paid' && isPaid);

    return matchesSearch && matchesStatus;
  });

  const PAGE_SIZE = 15;
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setDisplayCount(PAGE_SIZE);
  }, [searchQuery, statusFilter]);

  const visibleDebts = useMemo(() => {
    return filteredDebts.slice(0, displayCount);
  }, [filteredDebts, displayCount]);

  const handleLoadMore = () => {
    if (displayCount < filteredDebts.length) {
      setDisplayCount((prev) => Math.min(prev + PAGE_SIZE, filteredDebts.length));
    }
  };

  if (viewDetailsDebt) {
    return (
      <DebtDetailsScreen
        debt={viewDetailsDebt}
        payments={getPaymentsForDebt(viewDetailsDebt.id)}
        onBack={() => setViewDetailsDebt(null)}
      />
    );
  }

  return (
    <View style={[tw`flex-1`, { backgroundColor: colors.bg }]}>
      {/* Top Header */}
      <View
        style={[
          tw`px-5 py-3.5 border-b`,
          { backgroundColor: colors.bg, borderBottomColor: colors.border },
        ]}
      >
        <View style={tw`flex-row justify-between items-center`}>
          <View>
            <View style={tw`flex-row items-center gap-1.5`}>
              <View style={tw`w-2 h-2 rounded-full bg-emerald-500`} />
              <Text style={tw`text-[10px] font-bold text-indigo-500 tracking-wider uppercase`}>
                {t('FIADO CONTROL • POS')}
              </Text>
            </View>
            <Text style={[tw`text-xl font-black mt-0.5 tracking-tight`, { color: colors.text }]}>
              {t('Debt Register')}
            </Text>
          </View>

          <View style={tw`flex-row items-center gap-2`}>
            <TouchableOpacity
              style={tw`flex-row items-center gap-1.5 bg-[#4F46E5] active:bg-[#4338CA] px-3 py-2 rounded-xl border border-indigo-500/40`}
              onPress={() => setCreateModalVisible(true)}
              activeOpacity={0.7}
            >
              <Plus size={14} color="#FFFFFF" />
              <Text style={tw`text-white text-xs font-bold uppercase tracking-wider`}>{t('NEW DEBT')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                tw`w-9 h-9 rounded-xl justify-center items-center border`,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={fetchData}
              activeOpacity={0.7}
            >
              <RefreshCw size={15} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Integrated Search Bar inside Header */}
        <View
          style={[
            tw`mt-3 flex-row items-center rounded-xl border px-3 py-2`,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Search size={15} color={colors.textSecondary} style={tw`mr-2`} />
          <TextInput
            style={[tw`flex-1 text-xs p-0`, { color: colors.text }]}
            placeholder={t('Search debtor name, phone, items, address...')}
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Main Content Area - ScrollView holds Stats & Filters so they don't block the screen */}
      <ScrollView
        style={tw`flex-1 px-4`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Stats Board inside scrollview */}
        <View style={tw`mt-3`}>
          <StatsBoard
            totalOriginal={statsTotalOriginal}
            totalOutstanding={statsTotalOutstanding}
            totalCollected={statsTotalCollected}
            totalDebtors={statsTotalDebtors}
          />
        </View>

        {/* Status Filter Pills */}
        <View style={tw`flex-row gap-2 my-3`}>
          {(['unpaid', 'partial', 'paid', 'all'] as const).map((filter) => {
            const filterLabel =
              filter === 'unpaid'
                ? t('Unpaid')
                : filter === 'partial'
                ? t('Partial')
                : filter === 'paid'
                ? t('Paid')
                : t('All');

            const isSelected = statusFilter === filter;

            return (
              <TouchableOpacity
                key={filter}
                style={[
                  tw`flex-1 h-8 rounded-xl justify-center items-center border`,
                  isSelected
                    ? { backgroundColor: '#4F46E5', borderColor: '#4F46E5' }
                    : { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={() => setStatusFilter(filter)}
              >
                <Text
                  style={[
                    tw`text-[10px] font-bold tracking-wider`,
                    { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                  ]}
                >
                  {filterLabel.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Debts List */}
        {loading && debts.length === 0 ? (
          <View style={tw`items-center py-8`}>
            <ActivityIndicator size="small" color="#4F46E5" />
            <Text style={[tw`text-xs mt-3`, { color: colors.textSecondary }]}>{t('Loading debt register...')}</Text>
          </View>
        ) : filteredDebts.length === 0 ? (
          <View
            style={[
              tw`items-center py-10 border rounded-2xl px-5 mt-2`,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Users size={32} color={colors.textSecondary} style={tw`mb-2`} />
            <Text style={[tw`text-sm font-bold`, { color: colors.text }]}>{t('No debts matching your search')}</Text>
            <Text style={[tw`text-xs text-center mt-1 mb-4`, { color: colors.textSecondary }]}>
              {t('Try adjusting your search query')}
            </Text>
            <TouchableOpacity
              style={tw`bg-[#4F46E5] px-4 py-2.5 rounded-xl`}
              onPress={() => setCreateModalVisible(true)}
            >
              <Text style={tw`text-white text-xs font-bold uppercase tracking-wider`}>{t('NEW DEBT')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {visibleDebts.map((debt) => {
              const remaining = getRemainingAmount(debt);
              const paid = getPaidAmount(debt.id);

              return (
                <DebtCard
                  key={debt.id}
                  debt={debt}
                  paid={paid}
                  remaining={remaining}
                  payments={getPaymentsForDebt(debt.id)}
                  onPay={() => {
                    setSelectedDebt(debt);
                    setPaymentModalVisible(true);
                  }}
                  onEdit={() => {
                    setSelectedDebt(debt);
                    setEditModalVisible(true);
                  }}
                  onDelete={() => handleDeleteDebt(debt)}
                  onViewDetails={() => setViewDetailsDebt(debt)}
                />
              );
            })}

            {/* Lazy loading "Load More" indicator */}
            {displayCount < filteredDebts.length && (
              <TouchableOpacity
                style={[
                  tw`border py-3 rounded-xl items-center justify-center mt-2 mb-4`,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={handleLoadMore}
                activeOpacity={0.7}
              >
                <Text style={tw`text-indigo-500 text-xs font-bold`}>
                  {t('Load More')} ({visibleDebts.length} / {filteredDebts.length})
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>

      {/* Modals */}
      <CreateDebtModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onCreate={handleCreateDebt}
      />

      <RecordPaymentModal
        visible={paymentModalVisible}
        debt={selectedDebt}
        remainingAmount={selectedDebt ? getRemainingAmount(selectedDebt) : 0}
        onClose={() => {
          setPaymentModalVisible(false);
          setSelectedDebt(null);
        }}
        onRegisterPayment={handleRegisterPayment}
      />

      <EditDebtModal
        visible={editModalVisible}
        debt={selectedDebt}
        onClose={() => {
          setEditModalVisible(false);
          setSelectedDebt(null);
        }}
        onUpdate={handleUpdateDebt}
      />
    </View>
  );
}
