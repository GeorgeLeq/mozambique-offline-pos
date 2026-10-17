import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
} from 'react-native';
import { X, Check, Globe } from 'lucide-react-native';
import tw from 'twrnc';
import { useLanguage, SUPPORTED_LANGUAGES, SupportedLanguage } from '../locales';

interface LanguageSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function LanguageSelectorModal({
  visible,
  onClose,
}: LanguageSelectorModalProps) {
  const { language, setLanguage, t } = useLanguage();
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;

  const handleSelect = async (code: SupportedLanguage) => {
    await setLanguage(code);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View
          style={[
            tw`flex-1 bg-black/80`,
            isTablet
              ? tw`justify-center items-center px-6`
              : tw`justify-end`,
          ]}
        >
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View
              style={[
                tw`bg-[#121214] border border-[#27272A] p-5 shadow-2xl`,
                isTablet
                  ? tw`w-full max-w-md rounded-2xl`
                  : tw`w-full rounded-t-3xl pb-8`,
              ]}
            >
              {/* Header */}
              <View style={tw`flex-row justify-between items-center pb-3 border-b border-[#27272A]`}>
                <View style={tw`flex-row items-center gap-2.5`}>
                  <View style={tw`w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 items-center justify-center`}>
                    <Globe size={16} color="#818CF8" />
                  </View>
                  <View>
                    <Text style={tw`text-base text-white font-bold tracking-tight`}>
                      {t('Select Language')}
                    </Text>
                    <Text style={tw`text-[11px] text-zinc-400 mt-0.5`}>
                      {t('Choose your preferred display language')}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={tw`w-7 h-7 rounded-lg bg-[#27272A]/60 items-center justify-center`}
                >
                  <X size={15} color="#A1A1AA" />
                </TouchableOpacity>
              </View>

              {/* Language Options */}
              <View style={tw`mt-4 gap-2.5`}>
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const isSelected = language === lang.code;
                  return (
                    <TouchableOpacity
                      key={lang.code}
                      style={[
                        tw`flex-row items-center justify-between p-3.5 rounded-xl border`,
                        isSelected
                          ? tw`bg-indigo-500/15 border-indigo-500`
                          : tw`bg-[#18181B] border-[#27272A] active:bg-[#202024]`,
                      ]}
                      onPress={() => handleSelect(lang.code)}
                      activeOpacity={0.7}
                    >
                      <View style={tw`flex-row items-center gap-3`}>
                        <Text style={tw`text-2xl`}>{lang.flag}</Text>
                        <View>
                          <Text
                            style={[
                              tw`text-sm font-bold`,
                              isSelected ? tw`text-white` : tw`text-zinc-200`,
                            ]}
                          >
                            {lang.nativeName}
                          </Text>
                          <Text style={tw`text-[11px] text-zinc-500`}>
                            {lang.name}
                          </Text>
                        </View>
                      </View>

                      {isSelected ? (
                        <View style={tw`w-6 h-6 rounded-full bg-indigo-500 items-center justify-center`}>
                          <Check size={14} color="#FFFFFF" strokeWidth={3} />
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Dismiss Button */}
              <TouchableOpacity
                style={tw`mt-4 bg-[#27272A] py-2.5 rounded-xl items-center justify-center`}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={tw`text-xs text-zinc-300 font-bold`}>
                  {t('Done')}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
