import { useGame } from '../../../contexts/GameContext';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ExchangeType = 'DIAMONDS_TO_FLOWERS' | 'BVR_TO_FLOWERS';

export default function EchangeScreen() {
  const { diamonds, bvrCoins, flowers, exchangeResource } = useGame();
  const [selectedExchange, setSelectedExchange] = useState<ExchangeType | null>(null);
  const [exchangeAmount, setExchangeAmount] = useState<string>('');
  const insets = useSafeAreaInsets();

  const calculateReceived = (type: ExchangeType, amount: number): number => {
    if (type === 'DIAMONDS_TO_FLOWERS') {
      return amount * 1.1;
    } else if (type === 'BVR_TO_FLOWERS') {
      return amount / 100;
    }
    return 0;
  };

  const handleExchange = async () => {
    const amount = parseFloat(exchangeAmount);

    if (!selectedExchange) {
      window.alert('Erreur: Veuillez sélectionner un type d\'échange');
      return;
    }

    if (isNaN(amount) || amount <= 0) {
      window.alert('Erreur: Veuillez entrer un montant valide');
      return;
    }

    if (selectedExchange === 'DIAMONDS_TO_FLOWERS') {
      if (diamonds < amount) {
        window.alert('Erreur: Vous n\'avez pas assez de diamants');
        return;
      }

      const received = calculateReceived(selectedExchange, amount);
      const confirmed = window.confirm(
        `Vous allez échanger ${amount.toLocaleString()} diamants contre ${received.toLocaleString()} fleurs (bonus de 10% inclus)\n\nConfirmer?`
      );
      
      if (confirmed) {
        const result = await exchangeResource('DIAMONDS_TO_FLOWERS', amount);
        if (result.success) {
          window.alert(`Succès: Vous avez reçu ${result.flowersReceived.toLocaleString()} fleurs!`);
          setExchangeAmount('');
        } else {
          window.alert(`Erreur: ${result.message}`);
        }
      }
    } else if (selectedExchange === 'BVR_TO_FLOWERS') {
      if (bvrCoins < amount) {
        window.alert('Erreur: Vous n\'avez pas assez de BVR');
        return;
      }

      if (amount < 100) {
        window.alert('Erreur: Le montant minimum est de 100 BVR pour obtenir 1 fleur');
        return;
      }

      const received = calculateReceived(selectedExchange, amount);
      const confirmed = window.confirm(
        `Vous allez échanger ${amount.toLocaleString()} BVR contre ${received.toLocaleString()} fleurs\n\nConfirmer?`
      );
      
      if (confirmed) {
        const result = await exchangeResource('BVR_TO_FLOWERS', amount);
        if (result.success) {
          window.alert(`Succès: Vous avez reçu ${result.flowersReceived.toLocaleString()} fleurs!`);
          setExchangeAmount('');
        } else {
          window.alert(`Erreur: ${result.message}`);
        }
      }
    }
  };

  const amount = parseFloat(exchangeAmount) || 0;
  const received = selectedExchange ? calculateReceived(selectedExchange, amount) : 0;

  return (
    <View style={styles.background}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.headerTitle}>Échange</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.balancesCard}>
          <Text style={styles.balancesTitle}>Vos soldes</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceEmoji}>💎</Text>
            <Text style={styles.balanceText}>{diamonds.toLocaleString()} diamants</Text>
          </View>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceEmoji}>🐝</Text>
            <Text style={styles.balanceText}>{bvrCoins.toLocaleString()} BVR</Text>
          </View>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceEmoji}>🌸</Text>
            <Text style={styles.balanceText}>{flowers.toLocaleString()} fleurs</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Type d&apos;échange</Text>
          
          <TouchableOpacity
            style={[
              styles.exchangeCard,
              selectedExchange === 'DIAMONDS_TO_FLOWERS' && styles.exchangeCardSelected,
            ]}
            onPress={() => setSelectedExchange('DIAMONDS_TO_FLOWERS')}
          >
            <View style={styles.exchangeHeader}>
              <Text style={styles.exchangeEmoji}>💎 → 🌸</Text>
              {selectedExchange === 'DIAMONDS_TO_FLOWERS' && (
                <View style={styles.selectedBadge}>
                  <Text style={styles.selectedBadgeText}>✓</Text>
                </View>
              )}
            </View>
            <Text style={styles.exchangeName}>Diamants vers Fleurs</Text>
            <Text style={styles.exchangeRate}>1 diamant = 1.1 fleurs (bonus +10%)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.exchangeCard,
              selectedExchange === 'BVR_TO_FLOWERS' && styles.exchangeCardSelected,
            ]}
            onPress={() => setSelectedExchange('BVR_TO_FLOWERS')}
          >
            <View style={styles.exchangeHeader}>
              <Text style={styles.exchangeEmoji}>🐝 → 🌸</Text>
              {selectedExchange === 'BVR_TO_FLOWERS' && (
                <View style={styles.selectedBadge}>
                  <Text style={styles.selectedBadgeText}>✓</Text>
                </View>
              )}
            </View>
            <Text style={styles.exchangeName}>BVR vers Fleurs</Text>
            <Text style={styles.exchangeRate}>100 BVR = 1 fleur</Text>
          </TouchableOpacity>
        </View>

        {selectedExchange && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Montant à échanger {selectedExchange === 'DIAMONDS_TO_FLOWERS' ? '(diamants)' : '(BVR)'}
            </Text>
            <View style={styles.amountInputContainer}>
              <TextInput
                style={styles.amountInput}
                placeholder="Entrez le montant"
                placeholderTextColor="#999"
                value={exchangeAmount}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9.]/g, '');
                  if (cleaned === '' || !isNaN(parseFloat(cleaned))) {
                    setExchangeAmount(cleaned);
                  }
                }}
                keyboardType="number-pad"
              />
              <Text style={styles.currencyLabel}>
                {selectedExchange === 'DIAMONDS_TO_FLOWERS' ? '💎' : '🐝'}
              </Text>
            </View>
            {selectedExchange === 'BVR_TO_FLOWERS' && (
              <Text style={styles.inputHint}>Minimum: 100 BVR</Text>
            )}
          </View>
        )}

        {amount > 0 && selectedExchange && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Aperçu de l&apos;échange</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Vous donnez</Text>
              <Text style={styles.summaryValue}>
                {amount.toLocaleString()} {selectedExchange === 'DIAMONDS_TO_FLOWERS' ? '💎' : '🐝'}
              </Text>
            </View>
            {selectedExchange === 'DIAMONDS_TO_FLOWERS' && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Bonus (10%)</Text>
                <Text style={[styles.summaryValue, styles.bonusText]}>
                  +{(amount * 0.1).toLocaleString()} 🌸
                </Text>
              </View>
            )}
            <View style={[styles.summaryRow, styles.summaryRowTotal]}>
              <Text style={styles.summaryLabelTotal}>Vous recevrez</Text>
              <Text style={styles.summaryValueTotal}>{received.toLocaleString()} 🌸</Text>
            </View>
          </View>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>ℹ️ Informations</Text>
          <Text style={styles.infoText}>
            • Diamants → Fleurs: 1 diamant = 1.1 fleurs (bonus +10%){'\n'}
            • BVR → Fleurs: 100 BVR = 1 fleur{'\n'}
            • L&apos;échange est instantané{'\n'}
            • Aucuns frais
          </Text>
        </View>

        {selectedExchange && (
          <TouchableOpacity
            style={[
              styles.exchangeButton,
              (amount <= 0) && styles.exchangeButtonDisabled,
            ]}
            onPress={handleExchange}
            disabled={amount <= 0}
            activeOpacity={0.7}
          >
            <Text style={styles.exchangeButtonText}>✓ Confirmer l&apos;échange</Text>
          </TouchableOpacity>
        )}
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  balancesCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  balancesTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#8B4513',
    marginBottom: 16,
    textAlign: 'center',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  balanceEmoji: {
    fontSize: 24,
  },
  balanceText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600' as const,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#8B4513',
    marginBottom: 12,
  },
  exchangeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exchangeCardSelected: {
    borderColor: '#FF8C00',
    backgroundColor: '#FFF5E6',
  },
  exchangeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exchangeEmoji: {
    fontSize: 32,
  },
  selectedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF8C00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBadgeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold' as const,
  },
  exchangeName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#8B4513',
    marginBottom: 4,
  },
  exchangeRate: {
    fontSize: 14,
    color: '#666',
  },
  amountInputContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#8B4513',
    minHeight: 40,
  },
  currencyLabel: {
    fontSize: 24,
    marginLeft: 8,
  },
  inputHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  summaryCard: {
    backgroundColor: '#FFF5E6',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#8B4513',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#8B4513',
  },
  bonusText: {
    color: '#4CAF50',
  },
  summaryRowTotal: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#FFD700',
  },
  summaryLabelTotal: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#8B4513',
  },
  summaryValueTotal: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#FF8C00',
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#1976D2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1565C0',
    lineHeight: 22,
  },
  exchangeButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  exchangeButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  exchangeButtonText: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#fff',
  },
});
