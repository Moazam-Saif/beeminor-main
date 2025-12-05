import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useLanguage } from '../../../contexts/LanguageContext';
import { CircleDollarSign, Ticket, ArrowLeftRight, Wallet } from 'lucide-react-native';

const isWeb = Platform.OS === 'web';
const MAX_WEB_WIDTH = 600;

export default function MenuScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <View style={styles.background}>
      <View style={[styles.content, isWeb && { maxWidth: MAX_WEB_WIDTH, width: '100%', alignSelf: 'center' }]}>
        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => router.push('/(tabs)/menu/roulette')}
        >
          <View style={styles.iconContainer}>
            <Ticket color="#fff" size={40} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{t.roulette}</Text>
            <Text style={styles.cardDescription}>
              {t.spinTheWheel}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => router.push('/(tabs)/menu/retrait')}
        >
          <View style={styles.iconContainer}>
            <CircleDollarSign color="#fff" size={40} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{t.withdraw}</Text>
            <Text style={styles.cardDescription}>
              {t.withdrawCrypto}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => router.push('/(tabs)/menu/echange')}
        >
          <View style={styles.iconContainer}>
            <ArrowLeftRight color="#fff" size={40} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{t.exchange}</Text>
            <Text style={styles.cardDescription}>
              {t.exchangeResources}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => router.push('/(tabs)/menu/wallet')}
        >
          <View style={styles.iconContainer}>
            <Wallet color="#fff" size={40} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{t.wallet}</Text>
            <Text style={styles.cardDescription}>
              {t.receiveAndExchange}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#FFF8DC',
  },

  content: {
    flex: 1,
    paddingHorizontal: isWeb ? 24 : 20,
    paddingTop: isWeb ? 40 : 30,
    gap: 20,
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FF8C00',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold' as const,
    color: '#8B4513',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
  },
});
