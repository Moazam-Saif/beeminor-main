import { useGame } from '../../../contexts/GameContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity, Modal, Alert, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';


const { width, height } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const MAX_WEB_WIDTH = 600;

type AnimatedBee = {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
};

export default function HomeScreen() {
  const { honey, getTotalProduction, getTotalBees, getMaxCapacity, isLoaded, sellHoney } = useGame();
  const { t } = useLanguage();
  const beesAnimated = useRef<AnimatedBee[]>([]);
  const [showStats, setShowStats] = useState<boolean>(false);

  useEffect(() => {
    const totalBees = getTotalBees();
    const beesToShow = Math.min(totalBees, 14);

    beesAnimated.current = Array.from({ length: beesToShow }, (_, i) => ({
      id: i,
      x: new Animated.Value(Math.random() * (width - 100) + 50),
      y: new Animated.Value(Math.random() * (height * 0.4) + height * 0.25),
    }));

    beesAnimated.current.forEach((bee) => {
      const animateBee = () => {
        const duration = 3000 + Math.random() * 2000;
        Animated.parallel([
          Animated.timing(bee.x, {
            toValue: Math.random() * (width - 100) + 50,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(bee.y, {
            toValue: Math.random() * (height * 0.4) + height * 0.25,
            duration,
            useNativeDriver: true,
          }),
        ]).start(() => animateBee());
      };
      animateBee();
    });
  }, [getTotalBees]);

  if (!isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{t.loading}</Text>
      </View>
    );
  }

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
      <LinearGradient
        colors={['#2d5016', '#3d6b1f', '#4a7c26']}
        style={styles.forestGradient}
      >
        <View style={[styles.webContainer, { backgroundColor: 'transparent' }]}>
        <View style={styles.forestBackground}>
          <Text style={[styles.tree, { top: 100, left: 20 }]}>🌲</Text>
          <Text style={[styles.tree, { top: 120, left: width * 0.7 }]}>🌲</Text>
          <Text style={[styles.tree, { top: 80, right: 40 }]}>🌳</Text>
          <Text style={[styles.tree, { top: 150, left: width * 0.4 }]}>🌲</Text>
          <Text style={[styles.tree, { top: 140, right: width * 0.25 }]}>🌳</Text>
        </View>

        <View style={[styles.sceneContainer, { paddingTop: isWeb ? 20 : 40 }]}>
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => setShowStats(true)}
          >
            <Text style={styles.infoButtonText}>🐝❓</Text>
          </TouchableOpacity>
          
          <View style={styles.hiveContainer}>
            <Text style={styles.hiveEmoji}>🪹</Text>
          </View>

          <View style={styles.flowersContainer}>
            <Text style={[styles.flower, { top: -40, left: -30 }]}>🌸</Text>
            <Text style={[styles.flower, { top: -35, left: 20 }]}>🌼</Text>
            <Text style={[styles.flower, { top: 0, left: -45 }]}>🌺</Text>
            <Text style={[styles.flower, { top: 0, left: 35 }]}>🌷</Text>
            <Text style={[styles.flower, { top: 30, left: -20 }]}>🌻</Text>
            <Text style={[styles.flower, { top: 35, left: 10 }]}>🌹</Text>
          </View>

          <View style={styles.beesContainer}>
            {beesAnimated.current.map((bee) => (
              <Animated.View
                key={bee.id}
                style={[
                  styles.bee,
                  {
                    transform: [{ translateX: bee.x }, { translateY: bee.y }],
                  },
                ]}
              >
                <Text style={styles.beeEmoji}>🐝</Text>
              </Animated.View>
            ))}
          </View>
        </View>

        <LinearGradient
          colors={['rgba(0,0,0,0)', '#fff9e6', '#fffaed']}
          style={[styles.bottomGradient, { maxWidth: isWeb ? MAX_WEB_WIDTH : undefined, width: '100%', alignSelf: 'center' }]}
        >
          <View style={styles.honeyDisplayContainer}>
            <View style={styles.honeyDisplay}>
              <Text style={styles.honeyEmoji}>🍯</Text>
              <Text style={styles.honeyAmount}>{formatNumber(honey)}</Text>
            </View>
            <TouchableOpacity
              style={styles.sellButton}
              onPress={async () => {
                if (honey < 300) {
                  window.alert('Error: You need at least 300 honey to sell!');
                  return;
                }
                
                const confirmed = window.confirm(`Sell ${Math.floor(honey)} honey for diamonds and flowers?`);
                if (confirmed) {
                  const success = await sellHoney(Math.floor(honey));
                  if (success) {
                    window.alert('Success: Honey sold successfully!');
                  } else {
                    window.alert('Error: Failed to sell honey');
                  }
                }
              }}
            >
              <Text style={styles.sellButtonText}>{t.sellHoney}</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <Modal
          visible={showStats}
          transparent
          animationType="fade"
          onRequestClose={() => setShowStats(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowStats(false)}
          >
            <View style={styles.statsModal}>
              <Text style={styles.statsTitle}>{t.statistics}</Text>

              <View style={styles.statCardModal}>
                <Text style={styles.statLabelModal}>{t.totalProduction}</Text>
                <Text style={styles.statValueModal}>{formatNumber(getTotalProduction())} 🍯/h</Text>
              </View>

              <View style={styles.statCardModal}>
                <Text style={styles.statLabelModal}>{t.totalBees}</Text>
                <Text style={styles.statValueModal}>{getTotalBees()}</Text>
              </View>

              <View style={styles.statCardModal}>
                <Text style={styles.statLabelModal}>{t.honeyPerSec}</Text>
                <Text style={styles.statValueModal}>{formatNumber(getTotalProduction() / 3600)} 🍯/s</Text>
              </View>

              <View style={styles.statCardModal}>
                <Text style={styles.statLabelModal}>{t.maxCapacity}</Text>
                <Text style={styles.statValueModal}>{formatNumber(getMaxCapacity())} 🍯</Text>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowStats(false)}
              >
                <Text style={styles.closeButtonText}>{t.close}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  forestGradient: {
    flex: 1,
  },
  webContainer: {
    flex: 1,
    maxWidth: isWeb ? MAX_WEB_WIDTH : undefined,
    width: '100%',
    alignSelf: 'center',
    overflow: 'hidden',
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: isWeb ? 140 : 160,
    paddingBottom: isWeb ? 15 : 20,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#87CEEB',
  },
  loadingText: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: '#fff',
  },

  forestBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  tree: {
    position: 'absolute',
    fontSize: 60,
    opacity: 0.8,
  },
  flowersContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -30 }, { translateY: -30 }],
  },
  flower: {
    position: 'absolute',
    fontSize: 32,
  },

  honeyDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: isWeb ? 8 : 10,
    gap: isWeb ? 10 : 12,
  },
  honeyDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.95)',
    paddingHorizontal: isWeb ? 16 : 20,
    paddingVertical: isWeb ? 8 : 10,
    borderRadius: isWeb ? 16 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: isWeb ? 2 : 3,
    borderColor: '#FFD700',
  },
  honeyEmoji: {
    fontSize: isWeb ? 28 : 32,
    marginRight: isWeb ? 6 : 8,
  },
  honeyAmount: {
    fontSize: isWeb ? 20 : 24,
    fontWeight: 'bold' as const,
    color: '#8B4513',
  },
  sceneContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  beesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  bee: {
    position: 'absolute',
  },
  beeEmoji: {
    fontSize: 28,
  },
  hiveContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -80 }, { translateY: -80 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  hiveEmoji: {
    fontSize: 160,
  },
  statsContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#FF8C00',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8B4513',
    textAlign: 'center',
  },
  infoButton: {
    position: 'absolute',
    top: isWeb ? 20 : 40,
    left: isWeb ? 15 : 20,
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
    borderRadius: isWeb ? 20 : 25,
    padding: isWeb ? 8 : 10,
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 100,
  },
  infoButtonText: {
    fontSize: isWeb ? 24 : 28,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  statsModal: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    width: isWeb ? Math.min(width * 0.9, 400) : '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  statsTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#8B4513',
    textAlign: 'center',
    marginBottom: 20,
  },
  statCardModal: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  statLabelModal: {
    fontSize: 14,
    color: '#8B4513',
    opacity: 0.8,
    marginBottom: 4,
  },
  statValueModal: {
    fontSize: 22,
    fontWeight: 'bold' as const,
    color: '#8B4513',
  },
  closeButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#FFF',
    textAlign: 'center',
  },
  sellButton: {
    backgroundColor: '#FF8C00',
    paddingHorizontal: isWeb ? 16 : 20,
    paddingVertical: isWeb ? 8 : 10,
    borderRadius: isWeb ? 16 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: isWeb ? 2 : 3,
    borderColor: '#FFA500',
  },
  sellButtonText: {
    fontSize: isWeb ? 14 : 16,
    fontWeight: 'bold' as const,
    color: '#FFF',
  },
});
