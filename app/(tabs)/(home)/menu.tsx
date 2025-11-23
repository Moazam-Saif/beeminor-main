import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { HelpCircle, Mail, User, History, X } from 'lucide-react-native';

export default function MenuScreen() {
  const router = useRouter();

  const menuItems = [
    {
      icon: HelpCircle,
      label: 'FAQ',
      subtitle: 'Questions fréquentes',
      route: '/(tabs)/(home)/faq',
      color: '#4CAF50',
    },
    {
      icon: Mail,
      label: 'Aide',
      subtitle: 'Contactez le support',
      route: '/(tabs)/(home)/aide',
      color: '#2196F3',
    },
    {
      icon: User,
      label: 'Mon Compte',
      subtitle: 'Détails du compte',
      route: '/(tabs)/(home)/compte',
      color: '#FF9800',
    },
    {
      icon: History,
      label: 'Historique',
      subtitle: 'Transactions',
      route: '/(tabs)/(home)/historique',
      color: '#9C27B0',
    },
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: "Menu",
          headerShown: true,
          headerStyle: {
            backgroundColor: '#4a7c26',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold' as const,
          },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.closeButton}
            >
              <X color="#fff" size={24} />
            </TouchableOpacity>
          ),
        }} 
      />
      <LinearGradient
        colors={['#2d5016', '#3d6b1f', '#4a7c26']}
        style={styles.gradient}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>⚙️ Menu</Text>
            <Text style={styles.headerSubtitle}>Gérez votre compte et vos paramètres</Text>
          </View>

          <View style={styles.menuContainer}>
            {menuItems.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.menuItem}
                  onPress={() => router.push(item.route as any)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                    <IconComponent color="#fff" size={24} />
                  </View>
                  <View style={styles.menuItemText}>
                    <Text style={styles.menuItemLabel}>{item.label}</Text>
                    <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                  </View>
                  <Text style={styles.menuItemArrow}>›</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Version 1.0.0</Text>
            <Text style={styles.footerSubtext}>© 2025 Bee Game</Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  closeButton: {
    marginLeft: 16,
    padding: 4,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  menuContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(74, 124, 38, 0.15)',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemLabel: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#2d5016',
    marginBottom: 4,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  menuItemArrow: {
    fontSize: 32,
    color: '#4a7c26',
    fontWeight: '300' as const,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});
