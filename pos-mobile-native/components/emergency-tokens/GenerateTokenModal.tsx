import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import tw from 'twrnc';
import { Key, X, Sparkles, User, ChevronDown } from 'lucide-react-native';
import { EmployeeOption } from './types';

interface GenerateTokenModalProps {
  visible: boolean;
  employees: EmployeeOption[];
  initialCashierId?: string | null;
  onClose: () => void;
  onSubmit: (code: string, cashierId: string | null) => Promise<void>;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const GenerateTokenModal: React.FC<GenerateTokenModalProps> = ({
  visible,
  employees,
  initialCashierId,
  onClose,
  onSubmit,
  onShowToast,
}) => {
  const [code, setCode] = useState<string>('');
  const [cashierId, setCashierId] = useState<string | null>(initialCashierId || null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState<boolean>(false);

  // Sync initial cashier when modal opens or prop changes
  useEffect(() => {
    if (visible) {
      if (initialCashierId) {
        setCashierId(initialCashierId);
      }
      if (!code) {
        const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
        setCode(randomCode);
      }
    }
  }, [visible, initialCashierId]);

  // Generate secure 6-digit random PIN
  const handleRandomize = () => {
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    setCode(randomCode);
  };

  const handleOpen = () => {
    if (!code) {
      handleRandomize();
    }
  };

  const handleSubmit = async () => {
    if (!code || code.trim().length < 4) {
      onShowToast('PIN must be at least 4 digits', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(code.trim(), cashierId);
      onShowToast(`One-time PIN #${code} generated successfully!`, 'success');
      setCode('');
      setCashierId(null);
      setShowEmployeeDropdown(false);
      onClose();
    } catch (err: any) {
      onShowToast(err?.message || 'Failed to generate token', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCashierName = cashierId
    ? employees.find((e) => e.id === cashierId || e.user_id === cashierId)?.name || 'Selected Cashier'
    : 'Universal (Any Cashier)';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onShow={handleOpen}
      onRequestClose={onClose}
    >
      <View style={tw`flex-1 bg-black/80 justify-center items-center p-4`}>
        <View style={tw`w-full max-w-sm bg-[#121215] border border-zinc-800 rounded-3xl p-5 shadow-2xl`}>
          {/* Header */}
          <View style={tw`flex-row justify-between items-center pb-3 border-b border-zinc-800/80`}>
            <View style={tw`flex-row items-center gap-2.5`}>
              <View style={tw`w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 justify-center items-center`}>
                <Key size={16} color="#F59E0B" />
              </View>
              <View>
                <Text style={tw`text-base font-bold text-white`}>New Emergency PIN</Text>
                <Text style={tw`text-[10px] text-zinc-400`}>Single-use authorization code</Text>
              </View>
            </View>

            <TouchableOpacity
              style={tw`w-7 h-7 rounded-full bg-zinc-900 justify-center items-center border border-zinc-800`}
              onPress={onClose}
            >
              <X size={14} color="#A1A1AA" />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View style={tw`py-4`}>
            {/* PIN Code Field */}
            <View style={tw`mb-4`}>
              <View style={tw`flex-row justify-between items-center mb-1.5`}>
                <Text style={tw`text-xs font-bold text-zinc-300`}>Authorization PIN (6 digits)</Text>
                <TouchableOpacity
                  style={tw`flex-row items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md`}
                  onPress={handleRandomize}
                >
                  <Sparkles size={11} color="#F59E0B" />
                  <Text style={tw`text-[10px] font-bold text-amber-400`}>Randomize</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={tw`bg-[#18181B] border border-zinc-700 rounded-xl px-4 py-3 text-2xl font-mono text-center font-bold text-amber-400 tracking-widest`}
                value={code}
                onChangeText={setCode}
                placeholder="6-digit PIN"
                placeholderTextColor="#52525B"
                keyboardType="number-pad"
                maxLength={8}
                autoFocus
              />
            </View>

            {/* Cashier Target Picker */}
            <View style={tw`mb-2`}>
              <Text style={tw`text-xs font-bold text-zinc-300 mb-1.5`}>Restrict to Cashier (Optional)</Text>
              <TouchableOpacity
                style={tw`bg-[#18181B] border border-zinc-700 rounded-xl px-3.5 py-2.5 flex-row justify-between items-center`}
                onPress={() => setShowEmployeeDropdown(!showEmployeeDropdown)}
              >
                <View style={tw`flex-row items-center gap-2`}>
                  <User size={14} color="#A1A1AA" />
                  <Text style={tw`text-xs text-white font-medium`}>{selectedCashierName}</Text>
                </View>
                <ChevronDown size={14} color="#A1A1AA" />
              </TouchableOpacity>

              {showEmployeeDropdown ? (
                <View style={tw`bg-[#18181B] border border-zinc-700 rounded-xl mt-1.5 overflow-hidden max-h-40`}>
                  <ScrollView nestedScrollEnabled>
                    <TouchableOpacity
                      style={tw`px-3 py-2.5 border-b border-zinc-800 ${cashierId === null ? 'bg-zinc-800/60' : ''}`}
                      onPress={() => {
                        setCashierId(null);
                        setShowEmployeeDropdown(false);
                      }}
                    >
                      <Text style={tw`text-xs font-bold ${cashierId === null ? 'text-emerald-400' : 'text-zinc-300'}`}>
                        Universal (Any Cashier)
                      </Text>
                    </TouchableOpacity>

                    {employees.map((emp) => {
                      const isSelected = cashierId === emp.id || cashierId === emp.user_id;
                      return (
                        <TouchableOpacity
                          key={emp.id}
                          style={tw`px-3 py-2.5 border-b border-zinc-800/50 ${isSelected ? 'bg-zinc-800/60' : ''}`}
                          onPress={() => {
                            setCashierId(emp.id);
                            setShowEmployeeDropdown(false);
                          }}
                        >
                          <Text style={tw`text-xs font-medium ${isSelected ? 'text-emerald-400' : 'text-zinc-300'}`}>
                            {`👤 ${emp.name} (${emp.role || 'Cashier'})`}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              ) : null}
            </View>

            <Text style={tw`text-[10px] text-zinc-500 leading-relaxed mt-2`}>
              This PIN can be entered directly on the POS till for single-use administrative overrides and offline clearances.
            </Text>
          </View>

          {/* Actions */}
          <View style={tw`flex-row gap-2.5 pt-2`}>
            <TouchableOpacity
              style={tw`flex-1 bg-zinc-900 border border-zinc-800 py-3 rounded-xl items-center`}
              onPress={onClose}
              disabled={submitting}
            >
              <Text style={tw`text-xs font-bold text-zinc-400`}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={tw`flex-1 bg-emerald-500 py-3 rounded-xl items-center justify-center shadow-lg shadow-emerald-500/20`}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Text style={tw`text-xs font-bold text-black`}>Save & Send to POS</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
