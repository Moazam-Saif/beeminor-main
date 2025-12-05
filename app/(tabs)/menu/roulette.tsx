import { useGame, BEE_TYPES } from '../../../contexts/GameContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Image, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, G, Text as SvgText } from 'react-native-svg';

const { width, height } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const MAX_WEB_WIDTH = 600;
const getWheelSize = () => {
  if (isWeb) {
    return Math.min(MAX_WEB_WIDTH * 0.75, height * 0.45, 360);
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
  const { tickets, spinRoulette } = gameContext;
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [wonPrize, setWonPrize] = useState<Prize | null>(null);
  const rotateValue = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const spinWheel = useCallback(async () => {
    if (isSpinning || tickets <= 0) return;

    setIsSpinning(true);
    setWonPrize(null);

    // Call backend to spin (server determines prize - prevents cheating)
    const result = await spinRoulette();
    
    if (!result.success) {
      setIsSpinning(false);
      console.error('Spin failed:', result.message);
      return;
    }

    const randomPrizeIndex = result.prizeIndex || 0;
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
    });

    console.log('Prize won:', prize.label, 'Index:', randomPrizeIndex);
  }, [isSpinning, tickets, spinRoulette, rotateValue]);

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
            const imageSize = isWeb ? 22 : 40;
            const imageOffset = imageSize / 2;
            const imageX = RADIUS + imageRadius * Math.cos(middleRad) - imageOffset;
            const imageY = RADIUS + imageRadius * Math.sin(middleRad) - imageOffset;

            return (
              <Image
                key={`img-${prize.id}`}
                source={{ uri: imageUrl }}
                style={[
                  styles.wheelImage,
                  {
                    left: imageX,
                    top: imageY,
                    width: imageSize,
                    height: imageSize,
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
      <View style={[styles.header, { paddingTop: isWeb ? 10 : insets.top + 10 }]}>
        <Text style={styles.headerTitle}>{t.roulette}</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { maxWidth: isWeb ? MAX_WEB_WIDTH : undefined, width: '100%', alignSelf: 'center' }]} showsVerticalScrollIndicator={false}>
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
    paddingBottom: isWeb ? 12 : 16,
    backgroundColor: '#FF8C00',
    maxWidth: isWeb ? MAX_WEB_WIDTH : undefined,
    width: '100%',
    alignSelf: 'center',
  },
  headerTitle: {
    fontSize: isWeb ? 24 : 28,
    fontWeight: 'bold' as const,
    color: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  content: {
    alignItems: 'center',
    paddingVertical: isWeb ? 15 : 20,
    width: '100%',
  },
  ticketsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: isWeb ? 16 : 20,
    marginBottom: isWeb ? 16 : 20,
    marginHorizontal: isWeb ? 20 : 0,
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
    marginVertical: isWeb ? 15 : 20,
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
    borderLeftWidth: isWeb ? 12 : 20,
    borderRightWidth: isWeb ? 12 : 20,
    borderTopWidth: isWeb ? 24 : 40,
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
    paddingVertical: isWeb ? 14 : 16,
    borderRadius: 25,
    marginTop: isWeb ? 15 : 20,
    marginHorizontal: isWeb ? 20 : 0,
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
    padding: isWeb ? 16 : 20,
    marginTop: isWeb ? 15 : 20,
    marginHorizontal: isWeb ? 20 : 0,
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
    padding: isWeb ? 14 : 16,
    marginTop: isWeb ? 15 : 20,
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
  wheelImage: {
    position: 'absolute',
  },
  centerButton: {
    position: 'absolute',
    backgroundColor: '#FF8C00',
    paddingHorizontal: isWeb ? 16 : 32,
    paddingVertical: isWeb ? 8 : 16,
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
    fontSize: isWeb ? 12 : 18,
    fontWeight: 'bold' as const,
    color: '#fff',
  },
});
