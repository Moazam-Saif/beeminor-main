import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

type TransactionType = 'deposit' | 'withdrawal' | 'reward' | 'referral' | 'exchange';

interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  description: string;
}

const mockTransactions: Transaction[] = [
  {
    id: 'TX001',
    type: 'reward',
    amount: 500,
    currency: 'Flowers',
    date: '2025-01-20 14:30',
    status: 'completed',
    description: '1 ami invité',
  },
  {
    id: 'TX002',
    type: 'withdrawal',
    amount: 0.05,
    currency: 'SOL',
    date: '2025-01-19 10:15',
    status: 'completed',
    description: 'Retrait vers wallet',
  },
  {
    id: 'TX003',
    type: 'exchange',
    amount: 40000,
    currency: 'Flowers',
    date: '2025-01-18 16:45',
    status: 'completed',
    description: 'Échange SOL → Flowers',
  },
  {
    id: 'TX004',
    type: 'referral',
    amount: 3000,
    currency: 'Flowers',
    date: '2025-01-17 09:20',
    status: 'completed',
    description: 'Bonus 1er achat filleul',
  },
  {
    id: 'TX005',
    type: 'deposit',
    amount: 0.1,
    currency: 'SOL',
    date: '2025-01-16 12:00',
    status: 'completed',
    description: 'Dépôt wallet',
  },
  {
    id: 'TX006',
    type: 'reward',
    amount: 1500,
    currency: 'Flowers',
    date: '2025-01-15 18:30',
    status: 'completed',
    description: '3 amis invités',
  },
  {
    id: 'TX007',
    type: 'withdrawal',
    amount: 0.02,
    currency: 'SOL',
    date: '2025-01-14 11:10',
    status: 'pending',
    description: 'Retrait en cours',
  },
  {
    id: 'TX008',
    type: 'referral',
    amount: 200,
    currency: 'Flowers',
    date: '2025-01-13 15:40',
    status: 'completed',
    description: 'Bonus parrainage',
  },
];

export default function HistoriqueScreen() {
  const [filter, setFilter] = useState<'all' | TransactionType>('all');

  const getTypeLabel = (type: TransactionType) => {
    switch (type) {
      case 'deposit': return '📥 Dépôt';
      case 'withdrawal': return '📤 Retrait';
      case 'reward': return '🎁 Récompense';
      case 'referral': return '👥 Parrainage';
      case 'exchange': return '🔄 Échange';
    }
  };

  const getTypeColor = (type: TransactionType) => {
    switch (type) {
      case 'deposit': return '#4CAF50';
      case 'withdrawal': return '#FF9800';
      case 'reward': return '#9C27B0';
      case 'referral': return '#2196F3';
      case 'exchange': return '#00BCD4';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return '✅ Complété';
      case 'pending': return '⏳ En cours';
      case 'failed': return '❌ Échoué';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'failed': return '#f44336';
      default: return '#666';
    }
  };

  const filteredTransactions = filter === 'all' 
    ? mockTransactions 
    : mockTransactions.filter(t => t.type === filter);

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: "Historique",
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
        <View style={styles.filterContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            <TouchableOpacity
              style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
              onPress={() => setFilter('all')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
                Tous
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filter === 'deposit' && styles.filterButtonActive]}
              onPress={() => setFilter('deposit')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, filter === 'deposit' && styles.filterTextActive]}>
                📥 Dépôts
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filter === 'withdrawal' && styles.filterButtonActive]}
              onPress={() => setFilter('withdrawal')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, filter === 'withdrawal' && styles.filterTextActive]}>
                📤 Retraits
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filter === 'reward' && styles.filterButtonActive]}
              onPress={() => setFilter('reward')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, filter === 'reward' && styles.filterTextActive]}>
                🎁 Récompenses
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filter === 'referral' && styles.filterButtonActive]}
              onPress={() => setFilter('referral')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, filter === 'referral' && styles.filterTextActive]}>
                👥 Parrainages
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>📜 Historique des Transactions</Text>
            <Text style={styles.headerSubtitle}>{filteredTransactions.length} transaction(s)</Text>
          </View>

          {filteredTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionCard}>
              <View style={styles.transactionHeader}>
                <View style={[styles.typeBadge, { backgroundColor: getTypeColor(transaction.type) }]}>
                  <Text style={styles.typeBadgeText}>{getTypeLabel(transaction.type)}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={[styles.statusText, { color: getStatusColor(transaction.status) }]}>
                    {getStatusLabel(transaction.status)}
                  </Text>
                </View>
              </View>

              <Text style={styles.description}>{transaction.description}</Text>

              <View style={styles.transactionDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Montant</Text>
                  <Text style={styles.detailValue}>
                    {transaction.amount} {transaction.currency}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>{transaction.date}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>ID Transaction</Text>
                  <Text style={styles.detailValue}>{transaction.id}</Text>
                </View>
              </View>
            </View>
          ))}

          {filteredTransactions.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyText}>Aucune transaction</Text>
              <Text style={styles.emptySubtext}>Vos transactions apparaîtront ici</Text>
            </View>
          )}
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
  filterContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(74, 124, 38, 0.2)',
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#4a7c26',
  },
  filterButtonActive: {
    backgroundColor: '#4a7c26',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#4a7c26',
  },
  filterTextActive: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  transactionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 13,
    fontWeight: 'bold' as const,
    color: '#fff',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  description: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#2d5016',
    marginBottom: 12,
  },
  transactionDetails: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(74, 124, 38, 0.2)',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: '#666',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#2d5016',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#fff',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
