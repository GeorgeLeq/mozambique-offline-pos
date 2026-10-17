import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, Text, Animated, StyleSheet, TouchableOpacity } from 'react-native';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react-native';
import tw from 'twrnc';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  const hideToast = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setToast(null));
  }, [fadeAnim]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString();
    setToast({ id, message, type });

    // Animate in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Auto dismiss after 3.5 seconds
    const timer = setTimeout(() => {
      hideToast();
    }, 3500);

    return () => clearTimeout(timer);
  }, [fadeAnim, hideToast]);

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={16} color="#10B981" />;
      case 'error':
        return <AlertCircle size={16} color="#EF4444" />;
      case 'info':
      default:
        return <Info size={16} color="#3B82F6" />;
    }
  };

  const getBorderColor = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'border-[#10B981]/30';
      case 'error':
        return 'border-[#EF4444]/30';
      case 'info':
      default:
        return 'border-[#3B82F6]/30';
    }
  };

  const translateY = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 0],
  });

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ translateY }],
            },
          ]}
        >
          <View
            style={tw`flex-row items-center gap-3 bg-[#09090B] border ${getBorderColor(
              toast.type
            )} rounded-xl px-4 py-3.5 shadow-2xl max-w-full mx-4`}
          >
            {getIcon(toast.type)}
            <Text style={tw`flex-1 text-xs font-semibold text-zinc-100 leading-4 font-sans`}>
              {toast.message}
            </Text>
            <TouchableOpacity onPress={hideToast} style={tw`p-1`}>
              <X size={14} color="#71717A" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50, // Safe distance below notch / status bar
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
