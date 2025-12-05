import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useGame } from '../../../contexts/GameContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, Trophy, Medal } from 'lucide-react-native';

type LeaderboardEntry = {
  rank: number;
  userId: string;
  diamonds: number;
  isCurrentUser: boolean;
};

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { getLeaderboard, referralCode, diamondsThisYear, getCurrentUserRank } = useGame();
  const [refreshing, setRefreshing] = React.useState<boolean>(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const leaderboard = useMemo<LeaderboardEntry[]>(() => {
    const allUsers = getLeaderboard();
    
    const currentUserIndex = allUsers.findIndex(
      (user) => user.userId === referralCode
    );
    const currentUserInTop100 = currentUserIndex !== -1 && currentUserIndex < 100;
    
    const entries: LeaderboardEntry[] = allUsers.slice(0, 100).map((user, index) => ({
      rank: index + 1,
      userId: user.userId,
      diamonds: user.totalDiamondsThisYear,
      isCurrentUser: user.userId === referralCode,
    }));
    
    if (!currentUserInTop100 && diamondsThisYear > 0) {
      const rank = getCurrentUserRank();
      entries.push({
        rank: rank || allUsers.length + 1,
        userId: t.you || 'Vous',
        diamonds: diamondsThisYear,
        isCurrentUser: true,
      });
    }
    
    return entries;
  }, [getLeaderboard, referralCode, diamondsThisYear, getCurrentUserRank, t]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'K';
    }
    return num.toFixed(0);
  };

  const getRankIcon = (rank: number) => {
    const iconSize = Platform.OS === 'web' ? 18 : 24;
    const smallerIconSize = Platform.OS === 'web' ? 16 : 22;
    
    if (rank === 1) {
      return <Crown size={iconSize} color="#FFD700" fill="#FFD700" />;
    }
    if (rank === 2) {
      return <Trophy size={smallerIconSize} color="#C0C0C0" fill="#C0C0C0" />;
    }
    if (rank === 3) {
      return <Medal size={smallerIconSize} color="#CD7F32" fill="#CD7F32" />;
    }
    return null;
  };

  const getRankColors = (rank: number): readonly [string, string, ...string[]] => {
    if (rank === 1) return ['#FFD700', '#FFA500'];
    if (rank === 2) return ['#E8E8E8', '#C0C0C0'];
    if (rank === 3) return ['#F4A460', '#CD7F32'];
    return ['#FFF8DC', '#FFE4B5'];
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4A7C26', '#3d6b1f', '#2d5016']}
        style={styles.gradient}
      >
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + (Platform.OS === 'web' ? 10 : 20) }]}>
          <Crown size={Platform.OS === 'web' ? 36 : 48} color="#FFD700" fill="#FFD700" />
          <Text style={styles.headerTitle}>{t.diamondLeaderboard || 'Classement Diamants'}</Text>
          <Text style={styles.headerSubtitle}>
            {t.topProducers || 'Top Producteurs Annuels'}
          </Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FFD700"
              colors={['#FFD700']}
            />
          }
        >
          {leaderboard.map((entry) => (
            <LinearGradient
              key={entry.rank}
              colors={entry.isCurrentUser ? (['#FF8C00', '#FFA500'] as const) : getRankColors(entry.rank)}
              style={[
                styles.leaderboardItem,
                entry.isCurrentUser && styles.currentUserItem,
                entry.rank <= 3 && styles.topThreeItem,
              ]}
            >
              <View style={styles.rankContainer}>
                {getRankIcon(entry.rank) || (
                  <Text
                    style={[
                      styles.rankText,
                      entry.isCurrentUser && styles.currentUserText,
                    ]}
                  >
                    #{entry.rank}
                  </Text>
                )}
              </View>

              <View style={styles.userInfo}>
                <Text
                  style={[
                    styles.userName,
                    entry.isCurrentUser && styles.currentUserText,
                    entry.rank <= 3 && styles.topThreeText,
                  ]}
                  numberOfLines={1}
                >
                  {entry.userId}
                </Text>
              </View>

              <View style={styles.diamondContainer}>
                <Text style={styles.diamondEmoji}>💎</Text>
                <Text
                  style={[
                    styles.diamondText,
                    entry.isCurrentUser && styles.currentUserText,
                    entry.rank <= 3 && styles.topThreeText,
                  ]}
                >
                  {formatNumber(entry.diamonds)}
                </Text>
              </View>
            </LinearGradient>
          ))}
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
  header: {
    alignItems: 'center',
    paddingBottom: Platform.OS === 'web' ? 10 : 16,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: Platform.OS === 'web' ? 22 : 28,
    fontWeight: 'bold' as const,
    color: '#FFD700',
    marginTop: Platform.OS === 'web' ? 8 : 12,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: Platform.OS === 'web' ? 13 : 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: Platform.OS === 'web' ? 2 : 4,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    padding: Platform.OS === 'web' ? 12 : 16,
    paddingBottom: Platform.OS === 'web' ? 24 : 40,
    flexGrow: 1,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Platform.OS === 'web' ? 8 : 14,
    paddingHorizontal: Platform.OS === 'web' ? 12 : 16,
    borderRadius: Platform.OS === 'web' ? 12 : 16,
    marginBottom: Platform.OS === 'web' ? 6 : 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  topThreeItem: {
    paddingVertical: Platform.OS === 'web' ? 10 : 18,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  currentUserItem: {
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#FFF',
  },
  rankContainer: {
    width: Platform.OS === 'web' ? 40 : 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: Platform.OS === 'web' ? 14 : 18,
    fontWeight: 'bold' as const,
    color: '#8B4513',
  },
  userInfo: {
    flex: 1,
    marginLeft: Platform.OS === 'web' ? 8 : 12,
  },
  userName: {
    fontSize: Platform.OS === 'web' ? 13 : 16,
    fontWeight: '600' as const,
    color: '#8B4513',
  },
  topThreeText: {
    fontSize: Platform.OS === 'web' ? 14 : 18,
    fontWeight: 'bold' as const,
    color: '#8B4513',
  },
  currentUserText: {
    color: '#FFF',
    fontWeight: 'bold' as const,
  },
  diamondContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Platform.OS === 'web' ? 8 : 12,
    paddingVertical: Platform.OS === 'web' ? 4 : 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: Platform.OS === 'web' ? 8 : 12,
  },
  diamondEmoji: {
    fontSize: Platform.OS === 'web' ? 14 : 18,
    marginRight: Platform.OS === 'web' ? 4 : 6,
  },
  diamondText: {
    fontSize: Platform.OS === 'web' ? 13 : 16,
    fontWeight: 'bold' as const,
    color: '#8B4513',
  },
});
