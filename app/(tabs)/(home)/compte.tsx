import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useGame } from '../../../contexts/GameContext';
import { useAuth } from '../../../contexts/AuthContext';

export default function CompteScreen() {
  const { honey, flowers, diamonds, bvrCoins, getTotalBees, getTotalProduction, sponsorCode, isAffiliatedToDev, referrals } = useGame();
  const { currentUser, logout } = useAuth();
  const router = useRouter();

  const userInfo = {
    id: currentUser?.id || 'USER' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    email: currentUser?.email || '',
    dateInscription: currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : '15 Janvier 2025',
    niveauCompte: 'Premium',
    filleuls: referrals.length,
  };

  const handleLogout = () => {
    const confirmed = window.confirm('Are you sure you want to logout?');
    if (confirmed) {
      logout().then(() => {
        window.alert('Logged out successfully!');
        router.replace('/auth');
      }).catch((error) => {
        console.error('Logout error:', error);
        window.alert('Error during logout');
      });
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(2) + 'K';
    }
    return num.toFixed(0);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: "Mon Compte",
          headerShown: true,
          headerStyle: {
            backgroundColor: '#4a7c26',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold' as const,
          },
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
          <View style={styles.profileCard}>
            <View style={styles.profileAvatar}>
              <Text style={styles.avatarEmoji}>👤</Text>
            </View>
            <Text style={styles.userEmail}>{userInfo.email}</Text>
            <Text style={styles.userId}>ID: {userInfo.id}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>✨ {userInfo.niveauCompte}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Statistiques du Compte</Text>
            
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Date d&apos;inscription</Text>
              <Text style={styles.statValue}>{userInfo.dateInscription}</Text>
            </View>

            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total d&apos;abeilles</Text>
              <Text style={styles.statValue}>{getTotalBees()}</Text>
            </View>

            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Production/heure</Text>
              <Text style={styles.statValue}>{formatNumber(getTotalProduction())} 🍯</Text>
            </View>

            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Filleuls actifs</Text>
              <Text style={styles.statValue}>{userInfo.filleuls}</Text>
            </View>

            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Code parrain</Text>
              <Text style={styles.statValue}>{sponsorCode && !isAffiliatedToDev ? sponsorCode : 'Aucun'}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💰 Mes Ressources</Text>
            
            <View style={styles.resourceCard}>
              <Text style={styles.resourceEmoji}>🍯</Text>
              <View style={styles.resourceInfo}>
                <Text style={styles.resourceLabel}>Miel</Text>
                <Text style={styles.resourceAmount}>{formatNumber(honey)}</Text>
              </View>
            </View>

            <View style={styles.resourceCard}>
              <Text style={styles.resourceEmoji}>🌸</Text>
              <View style={styles.resourceInfo}>
                <Text style={styles.resourceLabel}>Flowers</Text>
                <Text style={styles.resourceAmount}>{formatNumber(flowers)}</Text>
              </View>
            </View>

            <View style={styles.resourceCard}>
              <Text style={styles.resourceEmoji}>💎</Text>
              <View style={styles.resourceInfo}>
                <Text style={styles.resourceLabel}>Diamonds</Text>
                <Text style={styles.resourceAmount}>{formatNumber(diamonds)}</Text>
              </View>
            </View>

            <View style={styles.resourceCard}>
              <Text style={styles.resourceEmoji}>🐝</Text>
              <View style={styles.resourceInfo}>
                <Text style={styles.resourceLabel}>BVR</Text>
                <Text style={styles.resourceAmount}>{bvrCoins.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.dangerButton} activeOpacity={0.8} onPress={handleLogout}>
            <Text style={styles.dangerButtonText}>🚪 Déconnexion</Text>
          </TouchableOpacity>
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
  profileCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4a7c26',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarEmoji: {
    fontSize: 48,
  },
  userEmail: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#2d5016',
    marginBottom: 4,
  },
  userId: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#666',
    marginBottom: 8,
  },
  badge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: '#2d5016',
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#2d5016',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(74, 124, 38, 0.2)',
  },
  statLabel: {
    fontSize: 15,
    color: '#4a7c26',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#2d5016',
  },

  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 124, 38, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  resourceEmoji: {
    fontSize: 36,
    marginRight: 16,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceLabel: {
    fontSize: 14,
    color: '#4a7c26',
    marginBottom: 4,
  },
  resourceAmount: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#2d5016',
  },

  dangerButton: {
    backgroundColor: '#d32f2f',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#fff',
  },
});
