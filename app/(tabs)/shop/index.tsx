import { BEE_TYPES, useGame } from '../../../contexts/GameContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const isWeb = Platform.OS === 'web';
const MAX_WEB_WIDTH = 600;

export default function ShopScreen() {
  const { honey, flowers, diamonds, bees, buyBee, buyFlowers, hasPendingFunds } = useGame();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleBuyBee = async (beeTypeId: string) => {
    const success = await buyBee(beeTypeId);
    if (success) {
      console.log(`Purchased bee: ${beeTypeId}`);
    } else {
      console.log('Not enough flowers');
    }
  };

  const handleBuyFlowers = (amount: number, price: number) => {
    if (!hasPendingFunds) {
      const confirmed = window.confirm('Vous devez d\'abord envoyer les fonds nécessaires. Voulez-vous accéder à la page Wallet pour envoyer des fonds ?');
      if (confirmed) {
        router.push('/menu/wallet');
      }
      return;
    }
    const success = buyFlowers(amount, price);
    if (success) {
      console.log(`Purchased ${amount} flowers for ${price}$ and received tickets`);
      window.alert(`Succès: ${amount} fleurs achetées avec succès!`);
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
    <View style={styles.background}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80, maxWidth: isWeb ? MAX_WEB_WIDTH : undefined, width: '100%', alignSelf: 'center' }]}
      >
        <View style={styles.resourcesCard}>
          <Text style={styles.resourcesTitle}>{t.myResources}</Text>
          <View style={styles.resourcesRow}>
            <View style={styles.resourceBadge}>
              <Text style={styles.resourceEmoji}>🌸</Text>
              <Text style={styles.resourceText}>{formatNumber(flowers)}</Text>
            </View>
            <View style={styles.resourceBadge}>
              <Text style={styles.resourceEmoji}>💎</Text>
              <Text style={styles.resourceText}>{formatNumber(diamonds)}</Text>
            </View>
            <View style={styles.resourceBadge}>
              <Text style={styles.resourceEmoji}>🍯</Text>
              <Text style={styles.resourceText}>{formatNumber(honey)}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t.buyFlowers}</Text>

        <TouchableOpacity style={styles.buyFlowersCard} onPress={() => handleBuyFlowers(50000, 6)}>
          <View style={styles.buyFlowersContent}>
            <Text style={styles.buyFlowersEmoji}>🌸</Text>
            <View style={styles.buyFlowersInfo}>
              <Text style={styles.buyFlowersTitle}>{t.smallPack}</Text>
              <Text style={styles.buyFlowersDescription}>50 000 {t.flowers.toLowerCase()}</Text>
            </View>
          </View>
          <View style={styles.buyFlowersPrice}>
            <Text style={styles.buyFlowersPriceText}>6$</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.buyFlowersCard} onPress={() => handleBuyFlowers(100000, 10)}>
          <View style={styles.buyFlowersContent}>
            <Text style={styles.buyFlowersEmoji}>🌸</Text>
            <View style={styles.buyFlowersInfo}>
              <Text style={styles.buyFlowersTitle}>{t.mediumPack}</Text>
              <Text style={styles.buyFlowersDescription}>100 000 {t.flowers.toLowerCase()}</Text>
            </View>
          </View>
          <View style={styles.buyFlowersPrice}>
            <Text style={styles.buyFlowersPriceText}>10$</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.buyFlowersCard} onPress={() => handleBuyFlowers(500000, 50)}>
          <View style={styles.buyFlowersContent}>
            <Text style={styles.buyFlowersEmoji}>🌸</Text>
            <View style={styles.buyFlowersInfo}>
              <Text style={styles.buyFlowersTitle}>{t.largePack}</Text>
              <Text style={styles.buyFlowersDescription}>500 000 {t.flowers.toLowerCase()}</Text>
            </View>
          </View>
          <View style={styles.buyFlowersPrice}>
            <Text style={styles.buyFlowersPriceText}>50$</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.buyFlowersCard} onPress={() => handleBuyFlowers(1000000, 100)}>
          <View style={styles.buyFlowersContent}>
            <Text style={styles.buyFlowersEmoji}>🌸</Text>
            <View style={styles.buyFlowersInfo}>
              <Text style={styles.buyFlowersTitle}>{t.giantPack}</Text>
              <Text style={styles.buyFlowersDescription}>1 000 000 {t.flowers.toLowerCase()}</Text>
            </View>
          </View>
          <View style={styles.buyFlowersPrice}>
            <Text style={styles.buyFlowersPriceText}>100$</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>{t.bees}</Text>

        {BEE_TYPES.map((beeType) => {
          const owned = bees[beeType.id] || 0;
          const canAfford = flowers >= beeType.cost;

          return (
            <View key={beeType.id} style={styles.beeCard}>
              <View style={styles.beeInfo}>
                <View style={styles.beeHeader}>
                  {beeType.imageUrl ? (
                    <Image source={{ uri: beeType.imageUrl }} style={styles.beeImage} />
                  ) : (
                    <Text style={styles.beeEmoji}>{beeType.emoji}</Text>
                  )}
                  <View style={styles.beeTitleContainer}>
                    <Text style={styles.beeName}>{beeType.nameFr}</Text>
                    <Text style={styles.beeProduction}>
                      +{formatNumber(beeType.honeyPerHour)} miel/h
                    </Text>
                  </View>
                </View>
                <Text style={styles.beeOwned}>{t.owned}: {owned}</Text>
              </View>

              <TouchableOpacity
                style={[styles.buyButton, !canAfford && styles.buyButtonDisabled]}
                onPress={() => handleBuyBee(beeType.id)}
                disabled={!canAfford}
              >
                <Text style={styles.buyButtonText}>
                  {formatNumber(beeType.cost)}
                </Text>
                <Text style={styles.buyButtonEmoji}>🌸</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#FFF8DC',
  },

  scrollView: {
    flex: 1,
  },
  content: {
    padding: isWeb ? 24 : 20,
  },
  resourcesCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  resourcesTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#8B4513',
    marginBottom: 16,
    textAlign: 'center',
  },
  resourcesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  resourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8DC',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
  },
  resourceEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  resourceText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#8B4513',
  },
  buyFlowersCard: {
    backgroundColor: '#FFD700',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  buyFlowersContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  buyFlowersEmoji: {
    fontSize: 48,
    marginRight: 16,
  },
  buyFlowersInfo: {
    flex: 1,
  },
  buyFlowersTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#8B4513',
    marginBottom: 4,
  },
  buyFlowersDescription: {
    fontSize: 14,
    color: '#8B4513',
    opacity: 0.8,
  },
  buyFlowersPrice: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  buyFlowersPriceText: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#FF8C00',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold' as const,
    color: '#8B4513',
    marginBottom: 16,
    marginTop: 4,
  },
  beeCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  beeInfo: {
    flex: 1,
  },
  beeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  beeEmoji: {
    fontSize: 48,
    marginRight: 16,
  },
  beeImage: {
    width: 60,
    height: 60,
    marginRight: 16,
  },
  beeTitleContainer: {
    flex: 1,
  },
  beeName: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#8B4513',
    marginBottom: 4,
  },
  beeProduction: {
    fontSize: 14,
    color: '#FF8C00',
    fontWeight: '600' as const,
  },
  beeOwned: {
    fontSize: 14,
    color: '#666',
    marginLeft: 64,
  },
  buyButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  buyButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  buyButtonText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#8B4513',
    marginRight: 6,
  },
  buyButtonEmoji: {
    fontSize: 18,
  },
});
