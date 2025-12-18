import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { useAdmin } from '../../../contexts/AdminContext';
import { useGame, BEE_TYPES } from '../../../contexts/GameContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { Shield, LogOut, Database, Settings, TrendingUp, Receipt, Mail } from 'lucide-react-native';
import type { SupportMessage } from '../../../contexts/AdminContext';

export default function AdminPanel() {
  const { isAuthenticated, login, logout } = useAdmin();
  const [email, setEmail] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const { top } = useSafeAreaInsets();

  const handleLogin = async () => {
    const success = await login(email, pin);
    if (success) {
      setEmail('');
      setPin('');
      if (Platform.OS === 'web') {
        alert('Connexion réussie!');
      } else {
        Alert.alert('Succès', 'Connexion réussie!');
      }
    } else {
      if (Platform.OS === 'web') {
        alert('Email ou code PIN incorrect');
      } else {
        Alert.alert('Erreur', 'Email ou code PIN incorrect');
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { paddingTop: top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loginContainer}>
          <Shield color="#FF8C00" size={80} />
          <Text style={styles.loginTitle}>Panel Admin</Text>
          <Text style={styles.loginSubtitle}>Entrez votre email et code PIN</Text>
          
          <TextInput
            style={styles.emailInput}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          
          <TextInput
            style={styles.pinInput}
            value={pin}
            onChangeText={setPin}
            placeholder="Code PIN"
            secureTextEntry
            keyboardType="number-pad"
            maxLength={6}
          />
          
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return <AdminDashboard logout={logout} />;
}

function AdminDashboard({ logout }: { logout: () => Promise<void> }) {
  const game = useGame();
  const admin = useAdmin();
  const { currentLanguage, changeLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState<'stats' | 'resources' | 'config' | 'transactions' | 'messages'>('stats');
  const [pendingTransactions, setPendingTransactions] = useState<any[]>([]);

  // Load pending transactions from backend
  useEffect(() => {
    const loadTransactions = async () => {
      const txns = await game.getPendingTransactions();
      setPendingTransactions(txns);
    };
    loadTransactions();
    
    // Refresh every 10 seconds when on transactions tab
    const interval = setInterval(() => {
      if (activeTab === 'transactions') {
        loadTransactions();
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [activeTab, game]);

  // Load support messages from backend when messages tab is active
  useEffect(() => {
    if (activeTab === 'messages') {
      admin.refreshMessages();
    }
  }, [activeTab, admin]);

  const handleLogout = async () => {
    await logout();
    if (Platform.OS === 'web') {
      alert('Déconnexion réussie');
    } else {
      Alert.alert('Déconnexion', 'Déconnexion réussie');
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Shield color="#FFF" size={24} />
          <Text style={styles.headerTitle}>Panel Admin</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <LogOut color="#FFF" size={20} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'stats' && styles.activeTab]}
          onPress={() => setActiveTab('stats')}
        >
          <TrendingUp color={activeTab === 'stats' ? '#FF8C00' : '#8B4513'} size={18} />
          <Text style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>
            Stats
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'resources' && styles.activeTab]}
          onPress={() => setActiveTab('resources')}
        >
          <Database color={activeTab === 'resources' ? '#FF8C00' : '#8B4513'} size={18} />
          <Text style={[styles.tabText, activeTab === 'resources' && styles.activeTabText]}>
            Ressources
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'transactions' && styles.activeTab]}
          onPress={() => setActiveTab('transactions')}
        >
          <View style={styles.tabIconContainer}>
            <Receipt color={activeTab === 'transactions' ? '#FF8C00' : '#8B4513'} size={18} />
            {pendingTransactions.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingTransactions.length}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.tabText, activeTab === 'transactions' && styles.activeTabText]}>
            Transactions
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'messages' && styles.activeTab]}
          onPress={() => setActiveTab('messages')}
        >
          <View style={styles.tabIconContainer}>
            <Mail color={activeTab === 'messages' ? '#FF8C00' : '#8B4513'} size={18} />
            {admin.supportMessages.filter((msg) => !msg.read).length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{admin.supportMessages.filter((msg) => !msg.read).length}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.tabText, activeTab === 'messages' && styles.activeTabText]}>
            Messages
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'config' && styles.activeTab]}
          onPress={() => setActiveTab('config')}
        >
          <Settings color={activeTab === 'config' ? '#FF8C00' : '#8B4513'} size={18} />
          <Text style={[styles.tabText, activeTab === 'config' && styles.activeTabText]}>
            Config
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'stats' && <StatsTab game={game} />}
        {activeTab === 'resources' && <ResourcesTab game={game} />}
        {activeTab === 'transactions' && <TransactionsTab game={game} />}
        {activeTab === 'messages' && <MessagesTab admin={admin} />}
        {activeTab === 'config' && <ConfigTab game={game} admin={admin} currentLanguage={currentLanguage} changeLanguage={changeLanguage} />}
      </ScrollView>
    </View>
  );
}

function StatsTab({ game }: { game: ReturnType<typeof useGame> }) {
  const [globalStats, setGlobalStats] = useState<any>(null);
  const totalProduction = game.getTotalProduction();
  const totalBees = game.getTotalBees();
  const maxCapacity = game.getMaxCapacity();

  // Load global stats from backend
  useEffect(() => {
    const loadGlobalStats = async () => {
      try {
        const { API_BASE_URL } = await import('../../../lib/config');
        const response = await fetch(`${API_BASE_URL}/api/leaderboard/stats`);
        const data = await response.json();
        if (data.success) {
          setGlobalStats(data.stats);
        }
      } catch (error) {
        console.error('Failed to load global stats:', error);
      }
    };
    loadGlobalStats();
    
    // Refresh every 10 seconds
    const interval = setInterval(loadGlobalStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const totalAlveolesPurchased = useMemo(() => {
    return Object.values(game.alveoles).filter(isUnlocked => isUnlocked).length - 1;
  }, [game.alveoles]);

  const depositTransactions = useMemo(() => {
    return game.transactions.filter(txn => txn.type === 'deposit_crypto' && txn.status === 'approved');
  }, [game.transactions]);

  const withdrawalTransactions = useMemo(() => {
    return game.transactions.filter(txn => 
      (txn.type === 'withdrawal_diamond' || txn.type === 'withdrawal_bvr') && 
      txn.status === 'approved'
    );
  }, [game.transactions]);

  const totalDeposited = useMemo(() => {
    return depositTransactions.reduce((sum, txn) => sum + (txn.usdAmount || 0), 0);
  }, [depositTransactions]);

  const totalWithdrawn = useMemo(() => {
    return withdrawalTransactions.reduce((sum, txn) => sum + (txn.usdAmount || 0), 0);
  }, [withdrawalTransactions]);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🌍 Statistiques Globales (Tous les Utilisateurs)</Text>
      
      {globalStats && (
        <>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>👥 Total Utilisateurs</Text>
            <Text style={styles.statValue}>{globalStats.totalUsers.toLocaleString('fr-FR')}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>💎 Total Diamants</Text>
            <Text style={styles.statValue}>{globalStats.totalDiamonds.toLocaleString('fr-FR')}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>🍯 Total Miel</Text>
            <Text style={styles.statValue}>{globalStats.totalHoney.toLocaleString('fr-FR')}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>🌸 Total Fleurs</Text>
            <Text style={styles.statValue}>{globalStats.totalFlowers.toLocaleString('fr-FR')}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>🐝 Total Abeilles</Text>
            <Text style={styles.statValue}>{globalStats.totalBees.toLocaleString('fr-FR')}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>👨‍👩‍👧‍👦 Total Parrainages</Text>
            <Text style={styles.statValue}>{globalStats.totalReferrals.toLocaleString('fr-FR')}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>💰 Total Gains Parrainage</Text>
            <Text style={styles.statValue}>{globalStats.totalReferralEarnings.toLocaleString('fr-FR')} fleurs</Text>
          </View>
        </>
      )}

      <Text style={styles.sectionTitle}>📊 Statistiques Utilisateur Actuel</Text>
      
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Production totale</Text>
        <Text style={styles.statValue}>{totalProduction.toLocaleString('fr-FR')} miel/h</Text>
      </View>

      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Total d&apos;abeilles</Text>
        <Text style={styles.statValue}>{totalBees.toLocaleString('fr-FR')}</Text>
      </View>

      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Capacité maximale</Text>
        <Text style={styles.statValue}>{maxCapacity.toLocaleString('fr-FR')} miel</Text>
      </View>

      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Utilisation de la capacité</Text>
        <Text style={styles.statValue}>
          {((game.honey / maxCapacity) * 100).toFixed(1)}%
        </Text>
      </View>

      <Text style={styles.sectionTitle}>🏠 Alvéoles Achetés</Text>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Nombre d&apos;alvéoles achetés par l&apos;utilisateur</Text>
        <Text style={styles.statValue}>{totalAlveolesPurchased}</Text>
      </View>

      <Text style={styles.sectionTitle}>👥 Suivi Utilisateur</Text>
      
      <View style={styles.userStatsCard}>
        <View style={styles.userStatsRow}>
          <Text style={styles.userStatsLabel}>💰 Montant global reçu:</Text>
          <Text style={styles.userStatsValue}>${totalDeposited.toFixed(2)}</Text>
        </View>
        <View style={styles.userStatsRow}>
          <Text style={styles.userStatsLabel}>💸 Montant global retiré:</Text>
          <Text style={styles.userStatsValue}>${totalWithdrawn.toFixed(2)}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>💰 Transactions Financières</Text>
      
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Total des dépôts</Text>
        <Text style={styles.statValue}>${totalDeposited.toFixed(2)}</Text>
      </View>

      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Nombre de dépôts</Text>
        <Text style={styles.statValue}>{depositTransactions.length}</Text>
      </View>

      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Total des retraits</Text>
        <Text style={styles.statValue}>${totalWithdrawn.toFixed(2)}</Text>
      </View>

      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Nombre de retraits</Text>
        <Text style={styles.statValue}>{withdrawalTransactions.length}</Text>
      </View>

      <Text style={styles.sectionTitle}>🐝 Détail des Abeilles</Text>
      {BEE_TYPES.map((bee) => {
        const count = game.bees[bee.id] || 0;
        const production = count * bee.honeyPerHour;
        
        return (
          <View key={bee.id} style={styles.beeCard}>
            <Text style={styles.beeName}>{bee.nameFr}</Text>
            <View style={styles.beeStats}>
              <Text style={styles.beeCount}>Quantité: {count}</Text>
              <Text style={styles.beeProduction}>
                Production: {production.toLocaleString('fr-FR')} miel/h
              </Text>
            </View>
          </View>
        );
      })}

      <Text style={styles.sectionTitle}>👥 Parrainages</Text>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Amis invités</Text>
        <Text style={styles.statValue}>{game.invitedFriends}</Text>
      </View>

      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Gains totaux des parrainages</Text>
        <Text style={styles.statValue}>
          {game.totalReferralEarnings.toLocaleString('fr-FR')} fleurs
        </Text>
      </View>

      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Nombre de filleuls</Text>
        <Text style={styles.statValue}>{game.referrals.length}</Text>
      </View>
    </View>
  );
}

function ResourcesTab({ game }: { game: ReturnType<typeof useGame> }) {
  const auth = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [flowersInput, setFlowersInput] = useState<string>('');
  const [removeFlowersInput, setRemoveFlowersInput] = useState<string>('');
  const [ticketsInput, setTicketsInput] = useState<string>('');

  const selectedUser = useMemo(() => {
    return auth.users.find((u) => u.id === selectedUserId);
  }, [auth.users, selectedUserId]);

  const getUserStats = useCallback((userId: string) => {
    const userTransactions = game.transactions.filter((txn) => txn.userId === userId);
    
    const totalDeposited = userTransactions
      .filter((txn) => txn.type === 'deposit_crypto' && txn.status === 'approved')
      .reduce((sum, txn) => sum + (txn.usdAmount || 0), 0);
    
    const totalWithdrawn = userTransactions
      .filter((txn) => 
        (txn.type === 'withdrawal_diamond' || txn.type === 'withdrawal_bvr') && 
        txn.status === 'approved'
      )
      .reduce((sum, txn) => sum + (txn.usdAmount || 0), 0);
    
    return { totalDeposited, totalWithdrawn };
  }, [game.transactions]);

  const handleAddFlowers = async () => {
    if (!selectedUserId) {
      if (Platform.OS === 'web') {
        alert('Veuillez sélectionner un utilisateur');
      } else {
        Alert.alert('Erreur', 'Veuillez sélectionner un utilisateur');
      }
      return;
    }

    const amount = parseInt(flowersInput);
    if (!isNaN(amount) && amount > 0) {
      try {
        const { API_BASE_URL } = await import('../../../lib/config');
        const response = await fetch(`${API_BASE_URL}/api/game/${selectedUserId}/admin/add-resources`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ flowers: amount })
        });
        const data = await response.json();
        
        if (data.success) {
          setFlowersInput('');
          if (Platform.OS === 'web') {
            alert(`${amount} fleurs ajoutées à l'utilisateur ${selectedUser?.email}!`);
          } else {
            Alert.alert('Succès', `${amount} fleurs ajoutées à l'utilisateur ${selectedUser?.email}!`);
          }
        }
      } catch (error) {
        console.error('Error adding flowers:', error);
        alert('Erreur lors de l\'ajout des fleurs');
      }
    }
  };

  const handleRemoveFlowers = async () => {
    if (!selectedUserId) {
      if (Platform.OS === 'web') {
        alert('Veuillez sélectionner un utilisateur');
      } else {
        Alert.alert('Erreur', 'Veuillez sélectionner un utilisateur');
      }
      return;
    }

    const amount = parseInt(removeFlowersInput);
    if (!isNaN(amount) && amount > 0) {
      try {
        const { API_BASE_URL } = await import('../../../lib/config');
        const response = await fetch(`${API_BASE_URL}/api/game/${selectedUserId}/admin/add-resources`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ flowers: -amount })
        });
        const data = await response.json();
        
        if (data.success) {
          setRemoveFlowersInput('');
          if (Platform.OS === 'web') {
            alert(`${amount} fleurs retirées à l'utilisateur ${selectedUser?.email}!`);
          } else {
            Alert.alert('Succès', `${amount} fleurs retirées à l'utilisateur ${selectedUser?.email}!`);
          }
        }
      } catch (error) {
        console.error('Error removing flowers:', error);
        alert('Erreur lors du retrait des fleurs');
      }
    }
  };

  const handleAddTickets = async () => {
    if (!selectedUserId) {
      if (Platform.OS === 'web') {
        alert('Veuillez sélectionner un utilisateur');
      } else {
        Alert.alert('Erreur', 'Veuillez sélectionner un utilisateur');
      }
      return;
    }

    const amount = parseInt(ticketsInput);
    if (!isNaN(amount) && amount > 0) {
      try {
        const { API_BASE_URL } = await import('../../../lib/config');
        const response = await fetch(`${API_BASE_URL}/api/game/${selectedUserId}/admin/add-resources`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tickets: amount })
        });
        const data = await response.json();
        
        if (data.success) {
          setTicketsInput('');
          if (Platform.OS === 'web') {
            alert(`${amount} tickets roulette ajoutés à l'utilisateur ${selectedUser?.email}!`);
          } else {
            Alert.alert('Succès', `${amount} tickets roulette ajoutés à l'utilisateur ${selectedUser?.email}!`);
          }
        }
      } catch (error) {
        console.error('Error adding tickets:', error);
        alert('Erreur lors de l\'ajout des tickets');
      }
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>👥 Utilisateurs Inscrits</Text>
      
      <ScrollView horizontal style={styles.userTableContainer}>
        <View style={styles.userTable}>
          <View style={styles.userTableHeader}>
            <Text style={[styles.userTableHeaderText, styles.userTableColId]}>ID</Text>
            <Text style={[styles.userTableHeaderText, styles.userTableColEmail]}>Email</Text>
            <Text style={[styles.userTableHeaderText, styles.userTableColDate]}>Date d&apos;inscription</Text>
            <Text style={[styles.userTableHeaderText, styles.userTableColAmount]}>Montant envoyé</Text>
            <Text style={[styles.userTableHeaderText, styles.userTableColAmount]}>Montant retiré</Text>
            <Text style={[styles.userTableHeaderText, styles.userTableColAction]}>Action</Text>
          </View>
          {auth.users.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Aucun utilisateur inscrit</Text>
            </View>
          ) : (
            auth.users.map((user) => {
              const stats = getUserStats(user.id);
              return (
                <View 
                  key={user.id} 
                  style={[
                    styles.userTableRow,
                    selectedUserId === user.id && styles.userTableRowSelected
                  ]}
                >
                  <Text style={[styles.userTableCellText, styles.userTableColId]} numberOfLines={1}>
                    {user.id}
                  </Text>
                  <Text style={[styles.userTableCellText, styles.userTableColEmail]} numberOfLines={1}>
                    {user.email}
                  </Text>
                  <Text style={[styles.userTableCellText, styles.userTableColDate]}>
                    {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                  </Text>
                  <Text style={[styles.userTableCellText, styles.userTableColAmount]}>
                    ${stats.totalDeposited.toFixed(2)}
                  </Text>
                  <Text style={[styles.userTableCellText, styles.userTableColAmount]}>
                    ${stats.totalWithdrawn.toFixed(2)}
                  </Text>
                  <View style={[styles.userTableCellView, styles.userTableColAction]}>
                    <TouchableOpacity
                      style={[
                        styles.selectUserButton,
                        selectedUserId === user.id && styles.selectUserButtonActive
                      ]}
                      onPress={() => setSelectedUserId(user.id)}
                    >
                      <Text style={[
                        styles.selectUserButtonText,
                        selectedUserId === user.id && styles.selectUserButtonTextActive
                      ]}>
                        {selectedUserId === user.id ? '✓ Sélectionné' : 'Sélectionner'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {selectedUser && (
        <View style={styles.selectedUserCard}>
          <Text style={styles.selectedUserTitle}>Utilisateur sélectionné</Text>
          <Text style={styles.selectedUserEmail}>{selectedUser.email}</Text>
          <Text style={styles.selectedUserId}>ID: {selectedUser.id}</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>🌸 Modifier les Fleurs</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Ajouter des Fleurs</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={flowersInput}
            onChangeText={setFlowersInput}
            placeholder="Montant"
            keyboardType="number-pad"
            editable={!!selectedUserId}
          />
          <TouchableOpacity 
            style={[styles.addButton, !selectedUserId && styles.actionButtonDisabled]} 
            onPress={handleAddFlowers}
            disabled={!selectedUserId}
          >
            <Text style={styles.addButtonText}>Ajouter</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Retirer des Fleurs</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={removeFlowersInput}
            onChangeText={setRemoveFlowersInput}
            placeholder="Montant"
            keyboardType="number-pad"
            editable={!!selectedUserId}
          />
          <TouchableOpacity 
            style={[
              styles.addButton, 
              styles.removeButton,
              !selectedUserId && styles.actionButtonDisabled
            ]} 
            onPress={handleRemoveFlowers}
            disabled={!selectedUserId}
          >
            <Text style={styles.addButtonText}>Retirer</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.sectionTitle}>🎰 Gestion des Tickets Roulette</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Donner des Tickets Roulette</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={ticketsInput}
            onChangeText={setTicketsInput}
            placeholder="Nombre de tickets"
            keyboardType="number-pad"
            editable={!!selectedUserId}
          />
          <TouchableOpacity 
            style={[styles.addButton, !selectedUserId && styles.actionButtonDisabled]} 
            onPress={handleAddTickets}
            disabled={!selectedUserId}
          >
            <Text style={styles.addButtonText}>Donner</Text>
          </TouchableOpacity>
        </View>
        {selectedUserId && (
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxText}>
              ℹ️ Les tickets de roulette seront ajoutés au compte de {selectedUser?.email}. Chaque ticket permet une rotation de la roulette.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}



function TransactionsTab({ game }: { game: ReturnType<typeof useGame> }) {
  const [pendingTransactions, setPendingTransactions] = useState<any[]>([]);
  const [processedTransactions, setProcessedTransactions] = useState<any[]>([]);

  // Load transactions from backend
  useEffect(() => {
    const loadTransactions = async () => {
      // Load pending transactions
      const pending = await game.getPendingTransactions();
      setPendingTransactions(pending);
      
      // Load processed transaction history from backend
      try {
        const { API_BASE_URL } = await import('../../../lib/config');
        const response = await fetch(`${API_BASE_URL}/api/transactions/history/all`);
        const data = await response.json();
        if (data.success) {
          setProcessedTransactions(data.transactions.map((txn: any) => ({
            id: txn.id,
            userId: txn.userId,
            userEmail: txn.userEmail,
            type: txn.type,
            amount: txn.amount,
            currency: txn.currency,
            status: txn.status,
            address: txn.address || txn.cryptoAddress,
            notes: txn.notes,
            processedAt: txn.processedAt,
            createdAt: txn.createdAt,
            updatedAt: txn.updatedAt
          })));
        }
      } catch (error) {
        console.error('Error loading transaction history:', error);
      }
    };
    loadTransactions();
    
    // Refresh every 5 seconds
    const interval = setInterval(loadTransactions, 5000);
    return () => clearInterval(interval);
  }, [game]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF8C00';
      case 'approved':
        return '#4CAF50';
      case 'rejected':
        return '#DC143C';
      default:
        return '#666';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return '⏳ En attente';
      case 'approved':
        return '✅ Approuvée';
      case 'rejected':
        return '❌ Rejetée';
      default:
        return status;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'withdrawal_diamond':
        return '💎 Retrait Diamants';
      case 'withdrawal_bvr':
        return '🐝 Retrait BVR';
      case 'deposit_crypto':
        return '💰 Dépôt Crypto';
      case 'deposit':
        return '💰 Dépôt';
      case 'referral_bonus':
        return '🎁 Bonus Parrainage';
      case 'referral_deposit':
        return '🎁 Dépôt Parrainage';
      case 'transfer_received':
        return '💸 Transfert Reçu';
      case 'transfer_sent':
        return '💸 Transfert Envoyé';
      default:
        return type || 'Transaction';
    }
  };

  const handleApprove = async (transactionId: string) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Êtes-vous sûr de vouloir approuver cette transaction?');
      if (confirmed) {
        await game.approveTransaction(transactionId);
        alert('Transaction approuvée!');
        // Refresh transactions list
        const txns = await game.getPendingTransactions();
        setPendingTransactions(txns);
      }
    } else {
      Alert.alert(
        'Approuver la transaction',
        'Êtes-vous sûr de vouloir approuver cette transaction?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Approuver',
            onPress: async () => {
              await game.approveTransaction(transactionId);
              Alert.alert('Succès', 'Transaction approuvée!');
              // Refresh transactions list
              const txns = await game.getPendingTransactions();
              setPendingTransactions(txns);
            },
          },
        ]
      );
    }
  };

  const handleReject = async (transactionId: string) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Êtes-vous sûr de vouloir rejeter cette transaction?');
      if (confirmed) {
        await game.rejectTransaction(transactionId);
        alert('Transaction rejetée et fleurs remboursées!');
        // Refresh transactions list
        const txns = await game.getPendingTransactions();
        setPendingTransactions(txns);
      }
    } else {
      Alert.alert(
        'Rejeter la transaction',
        'Êtes-vous sûr de vouloir rejeter cette transaction?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Rejeter',
            style: 'destructive',
            onPress: async () => {
              await game.rejectTransaction(transactionId);
              Alert.alert('Info', 'Transaction rejetée et fleurs remboursées!');
              // Refresh transactions list
              const txns = await game.getPendingTransactions();
              setPendingTransactions(txns);
            },
          },
        ]
      );
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>💳 Transactions en attente ({pendingTransactions.length})</Text>
      
      {pendingTransactions.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Aucune transaction en attente</Text>
        </View>
      ) : (
        pendingTransactions.map((txn) => (
          <View key={txn.id} style={styles.transactionCard}>
            <View style={styles.transactionHeader}>
              <Text style={styles.transactionType}>{getTypeLabel(txn.type)}</Text>
              <Text style={[styles.transactionStatus, { color: getStatusColor(txn.status) }]}>
                {getStatusLabel(txn.status)}
              </Text>
            </View>

            <View style={styles.transactionDetail}>
              <Text style={styles.transactionLabel}>Montant:</Text>
              <Text style={styles.transactionValue}>
                {txn.type === 'deposit_crypto' && txn.flowersAmount 
                  ? `${txn.flowersAmount.toLocaleString()} fleurs`
                  : txn.type === 'withdrawal_bvr'
                  ? `${txn.amount.toLocaleString()} BVR`
                  : `${txn.amount.toLocaleString()} fleurs`}
              </Text>
            </View>

            <View style={styles.transactionDetail}>
              <Text style={styles.transactionLabel}>Devise:</Text>
              <Text style={styles.transactionValue}>{txn.network || 'USD'}</Text>
            </View>

            {txn.usdAmount && (
              <View style={styles.transactionDetail}>
                <Text style={styles.transactionLabel}>USD:</Text>
                <Text style={styles.transactionValue}>${txn.usdAmount.toFixed(2)}</Text>
              </View>
            )}

            {txn.fees && (
              <View style={styles.transactionDetail}>
                <Text style={styles.transactionLabel}>Frais:</Text>
                <Text style={styles.transactionValue}>${txn.fees.toFixed(2)}</Text>
              </View>
            )}

            {txn.receivedAmount && (
              <View style={styles.transactionDetail}>
                <Text style={styles.transactionLabel}>Reçu:</Text>
                <Text style={styles.transactionValue}>${txn.receivedAmount.toFixed(2)}</Text>
              </View>
            )}

            <View style={styles.transactionDetail}>
              <Text style={styles.transactionLabel}>Réseau:</Text>
              <Text style={styles.transactionValue}>{txn.network}</Text>
            </View>

            {txn.type !== 'deposit_crypto' && (
              <View style={styles.transactionDetail}>
                <Text style={styles.transactionLabel}>Adresse:</Text>
                <Text style={styles.transactionValueSmall} numberOfLines={1}>
                  {txn.walletAddress}
                </Text>
              </View>
            )}

            <View style={styles.transactionDetail}>
              <Text style={styles.transactionLabel}>Date:</Text>
              <Text style={styles.transactionValue}>
                {new Date(txn.createdAt).toLocaleString('fr-FR')}
              </Text>
            </View>

            <View style={styles.transactionDetail}>
              <Text style={styles.transactionLabel}>ID Utilisateur:</Text>
              <Text style={styles.transactionValueSmall} numberOfLines={1}>
                {txn.userId}
              </Text>
            </View>

            <View style={styles.transactionDetail}>
              <Text style={styles.transactionLabel}>Email:</Text>
              <Text style={styles.transactionValueSmall} numberOfLines={1}>
                {txn.userEmail}
              </Text>
            </View>

            {txn.status === 'pending' && (
              <View style={styles.transactionActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => handleApprove(txn.id)}
                >
                  <Text style={styles.actionButtonText}>✅ Approuver</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleReject(txn.id)}
                >
                  <Text style={styles.actionButtonText}>❌ Rejeter</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))
      )}

      <Text style={styles.sectionTitle}>📜 Historique ({processedTransactions.length})</Text>
      
      {processedTransactions.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Aucune transaction traitée</Text>
        </View>
      ) : (
        processedTransactions.slice(0, 10).map((txn) => (
          <View key={txn.id} style={[styles.transactionCard, styles.processedTransactionCard]}>
            <View style={styles.transactionHeader}>
              <Text style={styles.transactionType}>{getTypeLabel(txn.type)}</Text>
              <Text style={[styles.transactionStatus, { color: getStatusColor(txn.status) }]}>
                {getStatusLabel(txn.status)}
              </Text>
            </View>

            <View style={styles.transactionDetail}>
              <Text style={styles.transactionLabel}>Montant:</Text>
              <Text style={styles.transactionValue}>
                {txn.amount.toLocaleString()} {txn.currency || 'fleurs'}
              </Text>
            </View>

            {txn.address && (
              <View style={styles.transactionDetail}>
                <Text style={styles.transactionLabel}>Adresse:</Text>
                <Text style={styles.transactionValueSmall} numberOfLines={1}>
                  {txn.address}
                </Text>
              </View>
            )}

            <View style={styles.transactionDetail}>
              <Text style={styles.transactionLabel}>Date création:</Text>
              <Text style={styles.transactionValue}>
                {new Date(txn.createdAt).toLocaleString('fr-FR')}
              </Text>
            </View>

            <View style={styles.transactionDetail}>
              <Text style={styles.transactionLabel}>ID Utilisateur:</Text>
              <Text style={styles.transactionValueSmall} numberOfLines={1}>
                {txn.userId}
              </Text>
            </View>

            {txn.userEmail && (
              <View style={styles.transactionDetail}>
                <Text style={styles.transactionLabel}>Email:</Text>
                <Text style={styles.transactionValueSmall} numberOfLines={1}>
                  {txn.userEmail}
                </Text>
              </View>
            )}

            {txn.processedAt && (
              <View style={styles.transactionDetail}>
                <Text style={styles.transactionLabel}>Traitée le:</Text>
                <Text style={styles.transactionValue}>
                  {new Date(txn.processedAt).toLocaleString('fr-FR')}
                </Text>
              </View>
            )}

            {txn.notes && (
              <View style={styles.transactionDetail}>
                <Text style={styles.transactionLabel}>Notes:</Text>
                <Text style={styles.transactionValueSmall}>
                  {txn.notes}
                </Text>
              </View>
            )}
          </View>
        ))
      )}
    </View>
  );
}

function MessagesTab({ admin }: { admin: ReturnType<typeof useAdmin> }) {
  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);
  const [supportEmailInput, setSupportEmailInput] = useState<string>(admin.supportEmail);

  useEffect(() => {
    setSupportEmailInput(admin.supportEmail);
  }, [admin.supportEmail]);

  const handleSelectMessage = async (message: SupportMessage) => {
    setSelectedMessage(message);
    if (!message.read) {
      await admin.markMessageAsRead(message.id);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Êtes-vous sûr de vouloir supprimer ce message?');
      if (confirmed) {
        await admin.deleteMessage(messageId);
        if (selectedMessage?.id === messageId) {
          setSelectedMessage(null);
        }
        alert('Message supprimé!');
      }
    } else {
      Alert.alert(
        'Supprimer le message',
        'Êtes-vous sûr de vouloir supprimer ce message?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: async () => {
              await admin.deleteMessage(messageId);
              if (selectedMessage?.id === messageId) {
                setSelectedMessage(null);
              }
              Alert.alert('Succès', 'Message supprimé!');
            },
          },
        ]
      );
    }
  };

  const handleUpdateSupportEmail = async () => {
    if (!supportEmailInput.trim()) {
      if (Platform.OS === 'web') {
        alert('Veuillez entrer une adresse email valide');
      } else {
        Alert.alert('Erreur', 'Veuillez entrer une adresse email valide');
      }
      return;
    }

    const result = await admin.updateSupportEmail(supportEmailInput);

    if (result.success) {
      if (Platform.OS === 'web') {
        alert('Email de support mis à jour avec succès!');
      } else {
        Alert.alert('Succès', 'Email de support mis à jour avec succès!');
      }
    } else {
      if (Platform.OS === 'web') {
        alert(result.error || 'Erreur lors de la mise à jour de l\'email');
      } else {
        Alert.alert('Erreur', result.error || 'Erreur lors de la mise à jour de l\'email');
      }
    }
  };

  const handleRefreshMessages = async () => {
    await admin.refreshMessages();
    if (Platform.OS === 'web') {
      alert('Messages rechargés depuis le serveur!');
    } else {
      Alert.alert('Succès', 'Messages rechargés depuis le serveur!');
    }
  };

  const unreadMessages = admin.supportMessages.filter((msg) => !msg.read);
  const readMessages = admin.supportMessages.filter((msg) => msg.read);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>⚙️ Configuration du Support</Text>
        <TouchableOpacity 
          style={[styles.actionButton, styles.refreshButton]} 
          onPress={handleRefreshMessages}
        >
          <Text style={styles.actionButtonText}>🔄 Recharger</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.passwordSection}>
        <Text style={styles.passwordLabel}>Email de Support</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Adresse Email</Text>
          <TextInput
            style={styles.addressInput}
            value={supportEmailInput}
            onChangeText={setSupportEmailInput}
            placeholder="support@beegame.app"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <TouchableOpacity 
          style={[styles.actionButton, styles.updateAddressButton]} 
          onPress={handleUpdateSupportEmail}
        >
          <Text style={styles.actionButtonText}>💾 Mettre à jour l&apos;email</Text>
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Text style={styles.infoBoxText}>
            ℹ️ Cet email sera affiché dans la page d&apos;aide de l&apos;application.
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>📨 Messages non lus ({unreadMessages.length})</Text>
      
      {unreadMessages.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Aucun message non lu</Text>
        </View>
      ) : (
        unreadMessages.map((msg) => (
          <TouchableOpacity
            key={msg.id}
            style={[styles.messageCard, styles.unreadMessageCard]}
            onPress={() => handleSelectMessage(msg)}
          >
            <View style={styles.messageHeader}>
              <Text style={styles.messageSubject}>{msg.subject}</Text>
              <Text style={styles.messageDate}>
                {new Date(msg.createdAt).toLocaleDateString('fr-FR')}
              </Text>
            </View>
            <Text style={styles.messageUserEmail}>De: {msg.userEmail}</Text>
            <Text style={styles.messagePreview} numberOfLines={2}>
              {msg.message}
            </Text>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteMessageButton]}
              onPress={() => handleDeleteMessage(msg.id)}
            >
              <Text style={styles.actionButtonText}>❌ Supprimer</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))
      )}

      <Text style={styles.sectionTitle}>📧 Messages lus ({readMessages.length})</Text>
      
      {readMessages.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Aucun message lu</Text>
        </View>
      ) : (
        readMessages.slice(0, 20).map((msg) => (
          <TouchableOpacity
            key={msg.id}
            style={styles.messageCard}
            onPress={() => handleSelectMessage(msg)}
          >
            <View style={styles.messageHeader}>
              <Text style={styles.messageSubject}>{msg.subject}</Text>
              <Text style={styles.messageDate}>
                {new Date(msg.createdAt).toLocaleDateString('fr-FR')}
              </Text>
            </View>
            <Text style={styles.messageUserEmail}>De: {msg.userEmail}</Text>
            <Text style={styles.messagePreview} numberOfLines={2}>
              {msg.message}
            </Text>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteMessageButton]}
              onPress={() => handleDeleteMessage(msg.id)}
            >
              <Text style={styles.actionButtonText}>❌ Supprimer</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))
      )}

      {selectedMessage && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Message Complet</Text>
              <TouchableOpacity
                onPress={() => setSelectedMessage(null)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalLabel}>Sujet:</Text>
              <Text style={styles.modalValue}>{selectedMessage.subject}</Text>
              
              <Text style={styles.modalLabel}>De:</Text>
              <Text style={styles.modalValue}>{selectedMessage.userEmail}</Text>
              
              <Text style={styles.modalLabel}>Date:</Text>
              <Text style={styles.modalValue}>
                {new Date(selectedMessage.createdAt).toLocaleString('fr-FR')}
              </Text>
              
              <Text style={styles.modalLabel}>Message:</Text>
              <Text style={styles.modalMessageText}>{selectedMessage.message}</Text>
            </ScrollView>

            <TouchableOpacity
              style={[styles.actionButton, styles.closeModalButton]}
              onPress={() => setSelectedMessage(null)}
            >
              <Text style={styles.actionButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

function ConfigTab({ 
  game, 
  admin,
  currentLanguage, 
  changeLanguage 
}: { 
  game: ReturnType<typeof useGame>;
  admin: ReturnType<typeof useAdmin>;
  currentLanguage: string;
  changeLanguage: (lang: any) => Promise<void>;
}) {
  const [oldPin, setOldPin] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [tonAddressInput, setTonAddressInput] = useState<string>(admin.tonAddress);
  const [solanaAddressInput, setSolanaAddressInput] = useState<string>(admin.solanaAddress);

  useEffect(() => {
    setTonAddressInput(admin.tonAddress);
    setSolanaAddressInput(admin.solanaAddress);
  }, [admin.tonAddress, admin.solanaAddress]);

  const languages = [
    { code: 'fr', name: 'Français' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'de', name: 'Deutsch' },
    { code: 'it', name: 'Italiano' },
    { code: 'pt', name: 'Português' },
    { code: 'ru', name: 'Русский' },
  ];

  const handleChangePassword = async () => {
    if (!oldPin || !newPin || !confirmPin) {
      if (Platform.OS === 'web') {
        alert('Veuillez remplir tous les champs');
      } else {
        Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      }
      return;
    }

    if (newPin !== confirmPin) {
      if (Platform.OS === 'web') {
        alert('Les nouveaux codes PIN ne correspondent pas');
      } else {
        Alert.alert('Erreur', 'Les nouveaux codes PIN ne correspondent pas');
      }
      return;
    }

    const result = await admin.changePassword(oldPin, newPin);
    
    if (result.success) {
      setOldPin('');
      setNewPin('');
      setConfirmPin('');
      if (Platform.OS === 'web') {
        alert('Code PIN modifié avec succès!');
      } else {
        Alert.alert('Succès', 'Code PIN modifié avec succès!');
      }
    } else {
      if (Platform.OS === 'web') {
        alert(result.error || 'Erreur lors du changement de code PIN');
      } else {
        Alert.alert('Erreur', result.error || 'Erreur lors du changement de code PIN');
      }
    }
  };

  const handleUpdateCryptoAddresses = async () => {
    const result = await admin.updateCryptoAddresses(tonAddressInput, solanaAddressInput);
    
    if (result.success) {
      if (Platform.OS === 'web') {
        alert('Adresses crypto mises à jour avec succès!');
      } else {
        Alert.alert('Succès', 'Adresses crypto mises à jour avec succès!');
      }
    } else {
      if (Platform.OS === 'web') {
        alert(result.error || 'Erreur lors de la mise à jour des adresses');
      } else {
        Alert.alert('Erreur', result.error || 'Erreur lors de la mise à jour des adresses');
      }
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🔐 Sécurité Admin</Text>

      <View style={styles.passwordSection}>
        <Text style={styles.passwordLabel}>Changer le code PIN</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Ancien code PIN</Text>
          <TextInput
            style={styles.pinInputConfig}
            value={oldPin}
            onChangeText={setOldPin}
            placeholder="••••••"
            secureTextEntry
            keyboardType="number-pad"
            maxLength={6}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Nouveau code PIN</Text>
          <TextInput
            style={styles.pinInputConfig}
            value={newPin}
            onChangeText={setNewPin}
            placeholder="••••••"
            secureTextEntry
            keyboardType="number-pad"
            maxLength={6}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Confirmer le nouveau code PIN</Text>
          <TextInput
            style={styles.pinInputConfig}
            value={confirmPin}
            onChangeText={setConfirmPin}
            placeholder="••••••"
            secureTextEntry
            keyboardType="number-pad"
            maxLength={6}
          />
        </View>

        <TouchableOpacity 
          style={[styles.actionButton, styles.changePasswordButton]} 
          onPress={handleChangePassword}
        >
          <Text style={styles.actionButtonText}>🔐 Changer le code PIN</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>💰 Adresses Crypto</Text>
      
      <View style={styles.passwordSection}>
        <Text style={styles.passwordLabel}>Adresses de réception pour les dépôts</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>💎 Adresse TON</Text>
          <TextInput
            style={styles.addressInput}
            value={tonAddressInput}
            onChangeText={setTonAddressInput}
            placeholder="Entrez l'adresse TON"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>☀️ Adresse Solana</Text>
          <TextInput
            style={styles.addressInput}
            value={solanaAddressInput}
            onChangeText={setSolanaAddressInput}
            placeholder="Entrez l'adresse Solana"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <TouchableOpacity 
          style={[styles.actionButton, styles.updateAddressButton]} 
          onPress={handleUpdateCryptoAddresses}
        >
          <Text style={styles.actionButtonText}>💾 Sauvegarder les adresses</Text>
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Text style={styles.infoBoxText}>
            ℹ️ Ces adresses seront utilisées pour recevoir les dépôts crypto des utilisateurs qui échangent contre des fleurs.
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>⚙️ Configuration de l&apos;App</Text>

      <Text style={styles.configLabel}>Langue de l&apos;application</Text>
      <View style={styles.languageGrid}>
        {languages.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[
              styles.languageButton,
              currentLanguage === lang.code && styles.languageButtonActive,
            ]}
            onPress={() => changeLanguage(lang.code as any)}
          >
            <Text
              style={[
                styles.languageButtonText,
                currentLanguage === lang.code && styles.languageButtonTextActive,
              ]}
            >
              {lang.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>ℹ️ Informations</Text>
      <View style={styles.infoCard}>
        <Text style={styles.infoText}>Email admin: martinremy100@gmail.com</Text>
        <Text style={styles.infoText}>Session valide: 24 heures</Text>
        <Text style={styles.infoText}>Version: 1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8DC',
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loginTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#8B4513',
    marginTop: 20,
  },
  loginSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    marginBottom: 30,
  },
  emailInput: {
    width: '100%',
    maxWidth: 300,
    height: 50,
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#FFF',
    marginBottom: 15,
  },
  pinInput: {
    width: '100%',
    maxWidth: 300,
    height: 50,
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 18,
    backgroundColor: '#FFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  loginButton: {
    width: '100%',
    maxWidth: 300,
    height: 50,
    backgroundColor: '#FF8C00',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600' as const,
  },
  header: {
    backgroundColor: '#FF8C00',
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFF',
  },
  logoutButton: {
    padding: 10,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 2,
    borderBottomColor: '#FFD700',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#FF8C00',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#8B4513',
  },
  activeTabText: {
    color: '#FF8C00',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#8B4513',
    marginTop: 20,
    marginBottom: 15,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 15,
  },
  refreshButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 0,
  },
  statCard: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FF8C00',
  },
  beeCard: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  beeName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#8B4513',
    marginBottom: 8,
  },
  beeStats: {
    gap: 4,
  },
  beeCount: {
    fontSize: 14,
    color: '#666',
  },
  beeProduction: {
    fontSize: 14,
    color: '#FF8C00',
    fontWeight: '600' as const,
  },
  userStatsCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  userStatsLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#8B4513',
    flex: 1,
  },
  userStatsValue: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#4CAF50',
    flex: 2,
    textAlign: 'right',
  },
  userStatsValueSmall: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#4CAF50',
    flex: 2,
    textAlign: 'right',
  },
  resourceCard: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FFD700',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resourceLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#8B4513',
  },
  resourceValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#FF8C00',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#8B4513',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
    height: 45,
    borderWidth: 1,
    borderColor: '#FFD700',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#FFF',
  },
  addButton: {
    backgroundColor: '#FF8C00',
    paddingHorizontal: 20,
    height: 45,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  removeButton: {
    backgroundColor: '#DC143C',
  },
  fundsCard: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FFD700',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fundsLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#8B4513',
  },
  fundsStatus: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  actionButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.5,
  },
  configLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#8B4513',
    marginBottom: 10,
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  languageButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFD700',
    backgroundColor: '#FFF',
  },
  languageButtonActive: {
    backgroundColor: '#FF8C00',
    borderColor: '#FF8C00',
  },
  languageButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#8B4513',
  },
  languageButtonTextActive: {
    color: '#FFF',
  },
  actionButton: {
    backgroundColor: '#FF8C00',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  dangerButton: {
    backgroundColor: '#DC143C',
  },
  dangerButtonText: {
    color: '#FFF',
  },
  infoCard: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  tabIconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: '#DC143C',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700' as const,
  },
  transactionCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  processedTransactionCard: {
    borderColor: '#E0E0E0',
    opacity: 0.8,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#8B4513',
  },
  transactionStatus: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  transactionDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  transactionValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#8B4513',
    flex: 2,
    textAlign: 'right',
  },
  transactionValueSmall: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#8B4513',
    flex: 2,
    textAlign: 'right',
  },
  transactionActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#DC143C',
  },
  emptyCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  passwordSection: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  passwordLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#8B4513',
    marginBottom: 15,
  },
  pinInputConfig: {
    height: 50,
    borderWidth: 1,
    borderColor: '#FFD700',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 18,
    backgroundColor: '#FFF',
    textAlign: 'center',
    letterSpacing: 8,
  },
  changePasswordButton: {
    backgroundColor: '#4169E1',
    marginTop: 10,
  },
  addressInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#FFD700',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 14,
    backgroundColor: '#FFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  updateAddressButton: {
    backgroundColor: '#4CAF50',
    marginTop: 10,
  },
  infoBox: {
    backgroundColor: '#FFF5E6',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  infoBoxText: {
    fontSize: 13,
    color: '#8B4513',
    lineHeight: 18,
  },
  userTableContainer: {
    maxHeight: 400,
  },
  userTable: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFD700',
    overflow: 'hidden',
  },
  userTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#FF8C00',
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  userTableHeaderText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFF',
  },
  userTableColId: {
    width: 200,
    paddingHorizontal: 8,
  },
  userTableColEmail: {
    width: 250,
    paddingHorizontal: 8,
  },
  userTableColDate: {
    width: 150,
    paddingHorizontal: 8,
  },
  userTableColAmount: {
    width: 150,
    paddingHorizontal: 8,
  },
  userTableColAction: {
    width: 150,
    paddingHorizontal: 8,
  },
  userTableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  userTableRowSelected: {
    backgroundColor: '#FFF5E6',
  },
  userTableCellText: {
    fontSize: 13,
    color: '#666',
  },
  userTableCellView: {
    // Add any view-specific styles if needed
  },
  selectUserButton: {
    backgroundColor: '#FF8C00',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  selectUserButtonActive: {
    backgroundColor: '#4CAF50',
  },
  selectUserButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  selectUserButtonTextActive: {
    color: '#FFF',
  },
  selectedUserCard: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 16,
    marginVertical: 15,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  selectedUserTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#8B4513',
    marginBottom: 8,
  },
  selectedUserEmail: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#4CAF50',
    marginBottom: 4,
  },
  selectedUserId: {
    fontSize: 12,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  messageCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadMessageCard: {
    borderColor: '#FF8C00',
    borderWidth: 2,
    backgroundColor: '#FFF9F0',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  messageSubject: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#8B4513',
    flex: 1,
  },
  messageDate: {
    fontSize: 12,
    color: '#999',
  },
  messageUserEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  messagePreview: {
    fontSize: 14,
    color: '#8B4513',
    marginBottom: 10,
    lineHeight: 20,
  },
  deleteMessageButton: {
    backgroundColor: '#DC143C',
  },
  modalOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    maxWidth: 600,
    width: '100%',
    maxHeight: '80%',
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
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#FFD700',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#8B4513',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#8B4513',
    fontWeight: '700' as const,
  },
  modalBody: {
    flex: 1,
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#666',
    marginTop: 15,
    marginBottom: 5,
  },
  modalValue: {
    fontSize: 16,
    color: '#8B4513',
    marginBottom: 10,
  },
  modalMessageText: {
    fontSize: 15,
    color: '#8B4513',
    lineHeight: 22,
    paddingTop: 5,
  },
  closeModalButton: {
    backgroundColor: '#4169E1',
  },
});
