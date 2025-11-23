import { useGame, BEE_TYPES } from '@/contexts/GameContext';
import { useLanguage } from '@/contexts/LanguageContext';
import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Image, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, G, Text as SvgText } from 'react-native-svg';

const { width, height } = Dimensions.get('window');
const getWheelSize = () => {
  if (Platform.OS === 'web') {
    return Math.min(width * 0.6, height * 0.5, 400);
  }
  return width * 0.85;
};
const WHEEL_SIZE = getWheelSize();
const RADIUS = WHEEL_SIZE / 2;

type Prize = {
  id: string;
  label: string;
  type: 'bee' | 'flowers';
  beeType?: string;
  beeCount?: number;
  flowersAmount?: number;
  color: string;
  weight: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
};

const PRIZES: Prize[] = [
  { id: '1', label: 'Bébé', type: 'bee', beeType: 'baby', beeCount: 1, color: '#FFE5B4', weight: 25, rarity: 'common' },
  { id: '2', label: '1000', type: 'flowers', flowersAmount: 1000, color: '#FFF5E6', weight: 22, rarity: 'common' },
  { id: '3', label: 'Abeille', type: 'bee', beeType: 'worker', beeCount: 1, color: '#FFD9A0', weight: 20, rarity: 'uncommon' },
  { id: '4', label: '3000', type: 'flowers', flowersAmount: 3000, color: '#FFEFD5', weight: 15, rarity: 'uncommon' },
  { id: '5', label: 'Bébé', type: 'bee', beeType: 'baby', beeCount: 1, color: '#FFE5B4', weight: 25, rarity: 'common' },
  { id: '6', label: 'Elite', type: 'bee', beeType: 'elite', beeCount: 1, color: '#FFDAB9', weight: 8, rarity: 'rare' },
  { id: '7', label: 'Abeille', type: 'bee', beeType: 'worker', beeCount: 1, color: '#FFD9A0', weight: 20, rarity: 'uncommon' },
  { id: '8', label: '1000', type: 'flowers', flowersAmount: 1000, color: '#FFF5E6', weight: 22, rarity: 'common' },
  { id: '9', label: 'Bébé', type: 'bee', beeType: 'baby', beeCount: 1, color: '#FFE5B4', weight: 25, rarity: 'common' },
  { id: '10', label: '5000', type: 'flowers', flowersAmount: 5000, color: '#FFF8DC', weight: 10, rarity: 'rare' },
  { id: '11', label: 'Abeille', type: 'bee', beeType: 'worker', beeCount: 1, color: '#FFD9A0', weight: 20, rarity: 'uncommon' },
  { id: '12', label: 'Royal', type: 'bee', beeType: 'royal', beeCount: 1, color: '#FFE4B5', weight: 5, rarity: 'epic' },
  { id: '13', label: 'Bébé', type: 'bee', beeType: 'baby', beeCount: 1, color: '#FFE5B4', weight: 25, rarity: 'common' },
  { id: '14', label: '10000', type: 'flowers', flowersAmount: 10000, color: '#FFEFD5', weight: 3, rarity: 'epic' },
  { id: '15', label: 'Elite', type: 'bee', beeType: 'elite', beeCount: 1, color: '#FFDAB9', weight: 8, rarity: 'rare' },
  { id: '16', label: 'Reine', type: 'bee', beeType: 'queen', beeCount: 1, color: '#FFD700', weight: 1, rarity: 'legendary' },
];

export default function RouletteScreen() {
  const gameContext = useGame();
  const { t } = useLanguage();
  const { tickets, addBees, addFlowers } = gameContext;
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [wonPrize, setWonPrize] = useState<Prize | null>(null);
  const rotateValue = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const getWeightedRandomPrize = useCallback(() => {
    const totalWeight = PRIZES.reduce((sum, prize) => sum + prize.weight, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < PRIZES.length; i++) {
      random -= PRIZES[i].weight;
      if (random <= 0) {
        return i;
      }
    }
    return 0;
  }, []);

  const spinWheel = useCallback(() => {
    if (isSpinning || tickets <= 0) return;

    const success = gameContext.useTicket();
    if (!success) return;

    setIsSpinning(true);
    setWonPrize(null);

    const randomPrizeIndex = getWeightedRandomPrize();
    const prize = PRIZES[randomPrizeIndex];

    const degreesPerSegment = 360 / PRIZES.length;
    const targetDegree = 360 * 5 + (360 - (randomPrizeIndex * degreesPerSegment + degreesPerSegment / 2));

    rotateValue.setValue(0);

    Animated.timing(rotateValue, {
      toValue: targetDegree,
      duration: 4000,
      useNativeDriver: true,
    }).start(() => {
      setWonPrize(prize);
      setIsSpinning(false);

      if (prize.type === 'bee' && prize.beeType && prize.beeCount) {
        addBees(prize.beeType, prize.beeCount);
      } else if (prize.type === 'flowers' && prize.flowersAmount) {
        addFlowers(prize.flowersAmount);
      }
    });

    console.log('Prize won:', prize.label, 'Weight:', prize.weight, 'Index:', randomPrizeIndex);
  }, [isSpinning, tickets, gameContext, rotateValue, addBees, addFlowers, getWeightedRandomPrize]);

  const rotation = rotateValue.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  const createWedgePath = (startAngle: number, endAngle: number) => {
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = RADIUS + RADIUS * Math.cos(startRad);
    const y1 = RADIUS + RADIUS * Math.sin(startRad);
    const x2 = RADIUS + RADIUS * Math.cos(endRad);
    const y2 = RADIUS + RADIUS * Math.sin(endRad);

    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

    return `M ${RADIUS} ${RADIUS} L ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  };

  const getImageUrlForBeeType = (beeTypeId: string) => {
    const beeType = BEE_TYPES.find((b) => b.id === beeTypeId);
    return beeType?.imageUrl || null;
  };

  const getEmojiForPrize = (prize: Prize) => {
    if (prize.type === 'bee') {
      const beeType = BEE_TYPES.find((b) => b.id === prize.beeType);
      return beeType?.emoji || '🐝';
    }
    return '🌸';
  };

  const getRarityIndicator = (rarity: Prize['rarity']) => {
    switch (rarity) {
      case 'legendary':
        return '⭐⭐⭐';
      case 'epic':
        return '⭐⭐';
      case 'rare':
        return '⭐';
      case 'uncommon':
        return '•';
      default:
        return '';
    }
  };

  const getProbabilityPercentage = (prize: Prize) => {
    const totalWeight = PRIZES.reduce((sum, p) => sum + p.weight, 0);
    return ((prize.weight / totalWeight) * 100).toFixed(1);
  };

  const renderWheel = () => {
    const segmentAngle = 360 / PRIZES.length;

    return (
      <View style={styles.wheelContainer}>
        <View style={styles.pointer} />
        <Animated.View
          style={[
            styles.wheel,
            {
              transform: [{ rotate: rotation }],
            },
          ]}
        >
          <Svg width={WHEEL_SIZE} height={WHEEL_SIZE}>
            <G>
              {PRIZES.map((prize, index) => {
                const startAngle = index * segmentAngle - 90;
                const endAngle = (index + 1) * segmentAngle - 90;
                const middleAngle = (startAngle + endAngle) / 2;
                const middleRad = (middleAngle * Math.PI) / 180;

                const textRadius = RADIUS * 0.65;
                const textX = RADIUS + textRadius * Math.cos(middleRad);
                const textY = RADIUS + textRadius * Math.sin(middleRad);

                const emojiRadius = RADIUS * 0.45;
                const emojiX = RADIUS + emojiRadius * Math.cos(middleRad);
                const emojiY = RADIUS + emojiRadius * Math.sin(middleRad);

                const path = createWedgePath(startAngle, endAngle);
                const imageUrl = prize.type === 'bee' && prize.beeType ? getImageUrlForBeeType(prize.beeType) : null;

                const rarityIndicator = getRarityIndicator(prize.rarity);

                return (
                  <G key={prize.id}>
                    <Path d={path} fill={prize.color} stroke="#8B4513" strokeWidth={2} />
                    {!imageUrl && (
                      <SvgText
                        x={emojiX}
                        y={emojiY}
                        fontSize="28"
                        textAnchor="middle"
                        fill="#000"
                      >
                        {getEmojiForPrize(prize)}
                      </SvgText>
                    )}
                    <SvgText
                      x={textX}
                      y={textY}
                      fontSize="11"
                      fontWeight="bold"
                      textAnchor="middle"
                      fill="#8B4513"
                    >
                      {prize.label}
                    </SvgText>
                    {rarityIndicator && (
                      <SvgText
                        x={textX}
                        y={textY + 12}
                        fontSize="8"
                        textAnchor="middle"
                        fill="#D4AF37"
                      >
                        {rarityIndicator}
                      </SvgText>
                    )}
                  </G>
                );
              })}
            </G>
          </Svg>
          {PRIZES.map((prize, index) => {
            const imageUrl = prize.type === 'bee' && prize.beeType ? getImageUrlForBeeType(prize.beeType) : null;
            if (!imageUrl) return null;

            const segmentAngle = 360 / PRIZES.length;
            const middleAngle = (index * segmentAngle + (index + 1) * segmentAngle) / 2 - 90;
            const middleRad = (middleAngle * Math.PI) / 180;

            const imageRadius = RADIUS * 0.45;
            const imageX = RADIUS + imageRadius * Math.cos(middleRad) - 20;
            const imageY = RADIUS + imageRadius * Math.sin(middleRad) - 20;

            return (
              <Image
                key={`img-${prize.id}`}
                source={{ uri: imageUrl }}
                style={[
                  styles.wheelImage,
                  {
                    left: imageX,
                    top: imageY,
                  },
                ]}
              />
            );
          })}
        </Animated.View>
        <TouchableOpacity
          style={[styles.centerButton, (isSpinning || tickets <= 0) && styles.centerButtonDisabled]}
          onPress={spinWheel}
          disabled={isSpinning || tickets <= 0}
          activeOpacity={0.7}
        >
          <Text style={styles.centerButtonLabel}>{isSpinning ? '...' : 'SPIN'}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.background}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.headerTitle}>{t.roulette}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={styles.ticketsCard}>
          <Text style={styles.ticketsLabel}>{t.ticketsAvailable}</Text>
          <View style={styles.ticketsDisplay}>
            <Text style={styles.ticketsEmoji}>🎟️</Text>
            <Text style={styles.ticketsCount}>{tickets}</Text>
          </View>
        </View>

        {renderWheel()}

        <TouchableOpacity
          style={[styles.spinButton, (isSpinning || tickets <= 0) && styles.spinButtonDisabled]}
          onPress={spinWheel}
          disabled={isSpinning || tickets <= 0}
        >
          <Text style={styles.spinButtonText}>
            {isSpinning ? t.spinning : tickets <= 0 ? t.noTickets : t.spinWheel}
          </Text>
        </TouchableOpacity>

        {wonPrize && (
          <View style={styles.prizeCard}>
            <Text style={styles.prizeTitle}>{t.youWon}</Text>
            <Text style={styles.prizeLabel}>{wonPrize.label}</Text>
            {wonPrize.type === 'flowers' && (
              <Text style={styles.prizeDetail}>+{wonPrize.flowersAmount} {t.flowers.toLowerCase()}</Text>
            )}
          </View>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{t.howToGetTickets}</Text>
          <Text style={styles.infoText}>
            {t.buyFlowersTicketInfo}
          </Text>
        </View>

        <View style={styles.probabilityCard}>
          <Text style={styles.probabilityTitle}>{t.winChances || 'Chances de gagner'}</Text>
          {PRIZES.filter((prize, index, self) => 
            self.findIndex(p => p.label === prize.label && p.type === prize.type) === index
          ).sort((a, b) => b.weight - a.weight).map((prize) => {
            const rarityIndicator = getRarityIndicator(prize.rarity);
            const probability = getProbabilityPercentage(prize);
            
            return (
              <View key={`prob-${prize.id}`} style={styles.probabilityRow}>
                <View style={styles.probabilityLeft}>
                  <Text style={styles.probabilityEmoji}>{getEmojiForPrize(prize)}</Text>
                  <Text style={styles.probabilityLabel}>{prize.label}</Text>
                  {rarityIndicator ? <Text style={styles.probabilityRarity}>{rarityIndicator}</Text> : null}
                </View>
                <Text style={styles.probabilityValue}>{probability}%</Text>
              </View>
            );
          })}
        </View>
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#FFF8DC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FF8C00',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  content: {
    alignItems: 'center',
    paddingVertical: 20,
    width: '100%',
  },
  ticketsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
  },
  ticketsLabel: {
    fontSize: 16,
    color: '#8B4513',
    marginBottom: 8,
    fontWeight: '600' as const,
  },
  ticketsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketsEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  ticketsCount: {
    fontSize: 36,
    fontWeight: 'bold' as const,
    color: '#FF8C00',
  },
  wheelContainer: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    backgroundColor: '#fff',
    borderRadius: WHEEL_SIZE / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 15,
  },
  wheel: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    borderRadius: WHEEL_SIZE / 2,
    overflow: 'hidden',
  },
  pointer: {
    position: 'absolute',
    top: -5,
    width: 0,
    height: 0,
    borderLeftWidth: 20,
    borderRightWidth: 20,
    borderTopWidth: 40,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#D4AF37',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 10,
  },
  spinButton: {
    backgroundColor: '#FF8C00',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 25,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  spinButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  spinButtonText: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#fff',
  },
  prizeCard: {
    backgroundColor: '#FFD700',
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    alignItems: 'center',
  },
  prizeTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#8B4513',
    marginBottom: 8,
  },
  prizeLabel: {
    fontSize: 18,
    color: '#8B4513',
    fontWeight: '600' as const,
  },
  prizeDetail: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#8B4513',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  probabilityCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: Platform.OS === 'web' ? 400 : undefined,
    alignSelf: 'center',
  },
  probabilityTitle: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#8B4513',
    marginBottom: 12,
    textAlign: 'center',
  },
  probabilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  probabilityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  probabilityEmoji: {
    fontSize: 18,
  },
  probabilityLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600' as const,
  },
  probabilityRarity: {
    fontSize: 10,
    color: '#D4AF37',
  },
  probabilityValue: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: '#FF8C00',
  },
  wheelImage: {
    position: 'absolute',
    width: 40,
    height: 40,
  },
  centerButton: {
    position: 'absolute',
    backgroundColor: '#FF8C00',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  centerButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  centerButtonLabel: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#fff',
  },
});
