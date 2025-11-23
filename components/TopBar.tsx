import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Platform, Dimensions } from 'react-native';
import { useGame } from '@/contexts/GameContext';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { Menu, X, Crown } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const MAX_WEB_WIDTH = 600;

export default function TopBar() {
  const { flowers, diamonds, bvrCoins } = useGame();
  const { currentLanguage, changeLanguage } = useLanguage();
  const [showLanguages, setShowLanguages] = useState<boolean>(false);
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const router = useRouter();

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'K';
    }
    return num.toFixed(0);
  };

  const languages: { code: Language; flag: string; name: string }[] = [
    { code: 'fr', flag: '🇫🇷', name: 'Français' },
    { code: 'en', flag: '🇬🇧', name: 'English' },
    { code: 'es', flag: '🇪🇸', name: 'Español' },
    { code: 'de', flag: '🇩🇪', name: 'Deutsch' },
    { code: 'it', flag: '🇮🇹', name: 'Italiano' },
    { code: 'pt', flag: '🇵🇹', name: 'Português' },
    { code: 'ru', flag: '🇷🇺', name: 'Русский' },
    { code: 'ar', flag: '🇸🇦', name: 'العربية' },
    { code: 'id', flag: '🇮🇩', name: 'Indonesia' },
  ];

  const currentLangData = languages.find((l) => l.code === currentLanguage);

  const { t } = useLanguage();

  const menuItems = [
    { label: t.faq, path: '/(tabs)/(home)/faq' },
    { label: t.help, path: '/(tabs)/(home)/aide' },
    { label: t.account, path: '/(tabs)/(home)/compte' },
    { label: t.history, path: '/(tabs)/(home)/historique' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setShowMenu(true)}
        >
          <Menu size={24} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.languageButton}
          onPress={() => setShowLanguages(true)}
        >
          <Text style={styles.languageFlag}>{currentLangData?.flag}</Text>
        </TouchableOpacity>

        <View style={styles.resourceBadge}>
          <Text style={styles.resourceEmoji}>🌸</Text>
          <Text style={styles.resourceText}>{formatNumber(flowers)}</Text>
        </View>
        <View style={styles.resourceBadge}>
          <Text style={styles.resourceEmoji}>💎</Text>
          <Text style={styles.resourceText}>{formatNumber(diamonds)}</Text>
        </View>
        <View style={styles.resourceBadge}>
          <Text style={styles.resourceEmoji}>🪙</Text>
          <Text style={styles.resourceText}>{formatNumber(bvrCoins)}</Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        <TouchableOpacity
          style={styles.crownButton}
          onPress={() => router.push('/(tabs)/(home)/leaderboard')}
        >
          <Crown size={20} color="#FFD700" fill="#FFD700" />
        </TouchableOpacity>
      </View>

      <Modal
        visible={showLanguages}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguages(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLanguages(false)}
        >
          <View style={styles.languageModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.chooseLanguage}</Text>
              <TouchableOpacity onPress={() => setShowLanguages(false)}>
                <X size={24} color="#8B4513" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {languages.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageOption,
                    currentLanguage === lang.code && styles.languageOptionActive,
                  ]}
                  onPress={() => {
                    changeLanguage(lang.code);
                    setShowLanguages(false);
                  }}
                >
                  <Text style={styles.languageOptionFlag}>{lang.flag}</Text>
                  <Text style={styles.languageOptionName}>{lang.name}</Text>
                  {currentLanguage === lang.code && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showMenu}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.menu}</Text>
              <TouchableOpacity onPress={() => setShowMenu(false)}>
                <X size={24} color="#8B4513" />
              </TouchableOpacity>
            </View>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuOption}
                onPress={() => {
                  setShowMenu(false);
                  router.push(item.path as any);
                }}
              >
                <Text style={styles.menuOptionText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: isWeb ? 16 : 12,
    paddingVertical: isWeb ? 12 : 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    maxWidth: isWeb ? MAX_WEB_WIDTH : undefined,
    width: '100%',
    alignSelf: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: isWeb ? 12 : 8,
    flex: 1,
    flexWrap: isWeb ? 'nowrap' : 'wrap',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  crownButton: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  menuButton: {
    padding: isWeb ? 8 : 4,
  },
  languageButton: {
    paddingHorizontal: isWeb ? 12 : 8,
    paddingVertical: isWeb ? 8 : 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  languageFlag: {
    fontSize: isWeb ? 28 : 24,
  },
  resourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: isWeb ? 10 : 6,
    paddingVertical: isWeb ? 6 : 3,
    borderRadius: 12,
    minWidth: isWeb ? 70 : undefined,
  },
  resourceEmoji: {
    fontSize: isWeb ? 18 : 14,
    marginRight: isWeb ? 4 : 2,
  },
  resourceText: {
    fontSize: isWeb ? 14 : 11,
    fontWeight: 'bold' as const,
    color: '#8B4513',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  languageModal: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    width: isWeb ? Math.min(SCREEN_WIDTH * 0.9, 400) : '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  menuModal: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    width: isWeb ? Math.min(SCREEN_WIDTH * 0.9, 400) : '90%',
    maxHeight: '60%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#8B4513',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#FFF8DC',
  },
  languageOptionActive: {
    backgroundColor: '#FFD700',
  },
  languageOptionFlag: {
    fontSize: 28,
    marginRight: 12,
  },
  languageOptionName: {
    fontSize: 18,
    color: '#8B4513',
    flex: 1,
    fontWeight: '600' as const,
  },
  checkmark: {
    fontSize: 20,
    color: '#32CD32',
    fontWeight: 'bold' as const,
  },
  menuOption: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFF8DC',
    marginBottom: 8,
  },
  menuOptionText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#8B4513',
    textAlign: 'center',
  },
});
