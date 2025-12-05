import { useGame } from '../../../contexts/GameContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Share, Clipboard, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Users, Gift, Ticket, Copy, DollarSign, TrendingUp, Award } from 'lucide-react-native';

const isWeb = Platform.OS === 'web';
const MAX_WEB_WIDTH = 600;

type Mission = {
  id: number;
  friendsRequired: number;
  flowersReward: number;
  ticketsReward: number;
};

const MISSIONS: Mission[] = [
  { id: 1, friendsRequired: 1, flowersReward: 500, ticketsReward: 0 },
  { id: 2, friendsRequired: 3, flowersReward: 1500, ticketsReward: 0 },
  { id: 3, friendsRequired: 10, flowersReward: 4000, ticketsReward: 0 },
  { id: 4, friendsRequired: 50, flowersReward: 12000, ticketsReward: 1 },
  { id: 5, friendsRequired: 100, flowersReward: 30000, ticketsReward: 2 },
  { id: 6, friendsRequired: 300, flowersReward: 70000, ticketsReward: 3 },
  { id: 7, friendsRequired: 500, flowersReward: 160000, ticketsReward: 5 },
];

export default function TachesScreen() {
  const { invitedFriends, claimedMissions, claimMission, inviteFriend, referralCode, referrals, totalReferralEarnings } = useGame();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'missions' | 'referrals'>('missions');

  // Get the app URL from environment or use default
  const getInviteLink = () => {
    // In production, this should be your deployed frontend URL
    const appUrl = process.env.EXPO_PUBLIC_APP_URL || 'https://beegame.app';
    return `${appUrl}/invite/${referralCode}`;
  };

  const handleInviteFriend = async () => {
    try {
      const inviteLink = getInviteLink();
      const result = await Share.share({
        message: `🐝 Rejoins-moi dans Bee Game et gagne des fleurs ! 🌸\n\nUtilise mon code de parrainage: ${referralCode}\n${inviteLink}\n\n🎁 Bonus: 200 fleurs à chaque invitation !`,
      });

      if (result.action === Share.sharedAction) {
        inviteFriend();
        window.alert(`${t.success}\n\n${t.inviteFriendBonus} +200 ${t.flowers.toLowerCase()} ${t.perFriend}`);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleCopyReferralCode = () => {
    Clipboard.setString(referralCode);
    window.alert(`${t.copyReferralCode}\n\n${t.copied}`);
  };

  const handleCopyInviteLink = () => {
    const inviteLink = getInviteLink();
    Clipboard.setString(inviteLink);
    window.alert(`${t.copyReferralCode}\n\n${t.inviteLink} ${t.copied.toLowerCase()}`);
  };

  const handleClaimReward = async (mission: Mission) => {
    if (claimedMissions.includes(mission.id)) {
      window.alert(`${t.claimed}\n\n${t.alreadyClaimed}`);
      return;
    }

    if (invitedFriends < mission.friendsRequired) {
      window.alert(
        `${t.missionIncomplete}\n\n${mission.friendsRequired - invitedFriends} ${t.friendsInvited.toLowerCase()} ${t.inProgress.toLowerCase()}`
      );
      return;
    }

    const success = await claimMission(mission.id, mission.flowersReward, mission.ticketsReward);
    if (success) {
      let message = `+${mission.flowersReward} fleurs`;
      if (mission.ticketsReward > 0) {
        message += ` et +${mission.ticketsReward} ticket${mission.ticketsReward > 1 ? 's' : ''} roulette`;
      }
      window.alert(`${t.rewardClaimed}\n\n${message}`);
    } else {
      window.alert(`${t.error}\n\n${t.claimFailed || 'Failed to claim mission'}`);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FFE5B4', '#FFF8DC', '#FFFACD']} style={styles.gradient}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20, maxWidth: isWeb ? MAX_WEB_WIDTH : undefined, width: '100%', alignSelf: 'center' }]}
        >
          <View style={styles.header}>
            <View style={styles.statsRow}>
              <View style={styles.statsCard}>
                <Users size={28} color="#FF8C00" />
                <Text style={styles.statsNumber}>{invitedFriends}</Text>
                <Text style={styles.statsLabel}>{t.referrals}</Text>
              </View>
              <View style={styles.statsCard}>
                <TrendingUp size={28} color="#32CD32" />
                <Text style={styles.statsNumber}>{formatNumber(totalReferralEarnings)}</Text>
                <Text style={styles.statsLabel}>{t.totalEarnings}</Text>
              </View>
            </View>

            <View style={styles.referralCodeCard}>
              <Text style={styles.referralCodeLabel}>{t.myReferralCode}</Text>
              <View style={styles.referralCodeContainer}>
                <Text style={styles.referralCodeText}>{referralCode}</Text>
                <TouchableOpacity onPress={handleCopyReferralCode} style={styles.copyButton}>
                  <Copy size={20} color="#FF8C00" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={handleCopyInviteLink} style={styles.copyLinkButton}>
                <Text style={styles.copyLinkText}>{t.copyInviteLink}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.inviteButton} onPress={handleInviteFriend}>
              <LinearGradient
                colors={['#FF8C00', '#FF6347']}
                style={styles.inviteGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Users size={20} color="#FFF" />
                <Text style={styles.inviteButtonText}>{t.inviteFriendBonus} (+200 {t.flowers.toLowerCase()})</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'missions' && styles.tabActive]}
              onPress={() => setActiveTab('missions')}
            >
              <Text style={[styles.tabText, activeTab === 'missions' && styles.tabTextActive]}>{t.missions}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'referrals' && styles.tabActive]}
              onPress={() => setActiveTab('referrals')}
            >
              <Text style={[styles.tabText, activeTab === 'referrals' && styles.tabTextActive]}>{t.referrals}</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'missions' ? (
            <View style={styles.missionsContainer}>
              <View style={styles.infoCard}>
                <Award size={24} color="#FF8C00" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoTitle}>{t.referralBonus}</Text>
                  <Text style={styles.infoText}>• 200 {t.flowers.toLowerCase()} {t.perFriend}</Text>
                  <Text style={styles.infoText}>• 3000 {t.flowers.toLowerCase()} {t.firstPurchaseBonus}</Text>
                  <Text style={styles.infoText}>• 6% à vie sur tous les dépôts du filleul</Text>
                </View>
              </View>

            {MISSIONS.map((mission) => {
              const isClaimed = claimedMissions.includes(mission.id);
              const isCompleted = invitedFriends >= mission.friendsRequired;
              const progress = Math.min((invitedFriends / mission.friendsRequired) * 100, 100);

              return (
                <View key={mission.id} style={styles.missionCard}>
                  <View style={styles.missionHeader}>
                    <View style={styles.missionIconContainer}>
                      <Text style={styles.missionIcon}>🎯</Text>
                    </View>
                    <View style={styles.missionInfo}>
                      <Text style={styles.missionTitle}>
                        {t.inviteFriends} {mission.friendsRequired} {t.friendsInvited.toLowerCase()}
                      </Text>
                      <Text style={styles.missionProgress}>
                        {invitedFriends}/{mission.friendsRequired}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBar, { width: `${progress}%` }]} />
                  </View>

                  <View style={styles.rewardsContainer}>
                    <View style={styles.reward}>
                      <Gift size={18} color="#FF8C00" />
                      <Text style={styles.rewardText}>{formatNumber(mission.flowersReward)} {t.flowers.toLowerCase()}</Text>
                    </View>
                    {mission.ticketsReward > 0 && (
                      <View style={styles.reward}>
                        <Ticket size={18} color="#9370DB" />
                        <Text style={styles.rewardText}>
                          {mission.ticketsReward} ticket{mission.ticketsReward > 1 ? 's' : ''}
                        </Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.claimButton,
                      isClaimed && styles.claimButtonClaimed,
                      !isCompleted && !isClaimed && styles.claimButtonDisabled,
                    ]}
                    onPress={() => handleClaimReward(mission)}
                    disabled={isClaimed || !isCompleted}
                  >
                    <Text
                      style={[
                        styles.claimButtonText,
                        (isClaimed || !isCompleted) && styles.claimButtonTextDisabled,
                      ]}
                    >
                      {isClaimed ? `✓ ${t.claimed}` : isCompleted ? t.claim : t.inProgress}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
            </View>
          ) : (
            <View style={styles.referralsContainer}>
              <Text style={styles.sectionTitle}>{t.referrals} ({referrals.length})</Text>
              {referrals.length === 0 ? (
                <View style={styles.emptyState}>
                  <Users size={64} color="#D3D3D3" />
                  <Text style={styles.emptyStateText}>{t.noReferrals}</Text>
                  <Text style={styles.emptyStateSubtext}>{t.inviteToEarn}</Text>
                </View>
              ) : (
                referrals.map((referral) => (
                  <View key={referral.id} style={styles.referralCard}>
                    <View style={styles.referralHeader}>
                      <View style={styles.referralIconContainer}>
                        <Users size={24} color="#FF8C00" />
                      </View>
                      <View style={styles.referralInfo}>
                        <Text style={styles.referralName}>{referral.name}</Text>
                        <Text style={styles.referralDate}>{t.joinedOn} {referral.joinDate}</Text>
                      </View>
                      {referral.hasFirstPurchase && (
                        <View style={styles.badgeContainer}>
                          <DollarSign size={16} color="#32CD32" />
                        </View>
                      )}
                    </View>
                    <View style={styles.referralStats}>
                      <View style={styles.referralStat}>
                        <Text style={styles.referralStatLabel}>{t.totalDeposits}</Text>
                        <Text style={styles.referralStatValue}>{referral.totalDeposits.toFixed(2)} $</Text>
                      </View>
                      <View style={styles.referralStat}>
                        <Text style={styles.referralStatLabel}>{t.firstDeposit}</Text>
                        <Text style={styles.referralStatValue}>{referral.firstDepositBonus} {t.flowers.toLowerCase()}</Text>
                      </View>
                      <View style={styles.referralStat}>
                        <Text style={styles.referralStatLabel}>{t.lifetimeEarnings}</Text>
                        <Text style={styles.referralStatValue}>{referral.lifetimeEarnings} {t.flowers.toLowerCase()}</Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: isWeb ? 20 : 16,
  },
  header: {
    marginBottom: 24,
    gap: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statsCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsNumber: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: '#FF8C00',
    marginTop: 4,
  },
  statsLabel: {
    fontSize: 12,
    color: '#8B4513',
    marginTop: 2,
  },
  referralCodeCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  referralCodeLabel: {
    fontSize: 14,
    color: '#8B4513',
    marginBottom: 8,
  },
  referralCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8DC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  referralCodeText: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#FF8C00',
    letterSpacing: 2,
  },
  copyButton: {
    padding: 8,
  },
  copyLinkButton: {
    backgroundColor: '#FFE5B4',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  copyLinkText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FF8C00',
  },
  inviteButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  inviteGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  inviteButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold' as const,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: '#FF8C00',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#8B4513',
  },
  tabTextActive: {
    color: '#FFF',
  },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#8B4513',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#8B4513',
    marginBottom: 4,
  },
  missionsContainer: {
    gap: 16,
  },
  referralsContainer: {
    gap: 16,
  },
  emptyState: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#8B4513',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#8B4513',
    textAlign: 'center',
    marginTop: 8,
  },
  referralCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  referralHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  referralIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFE5B4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  referralInfo: {
    flex: 1,
  },
  referralName: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#8B4513',
    marginBottom: 4,
  },
  referralDate: {
    fontSize: 12,
    color: '#999',
  },
  badgeContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  referralStats: {
    flexDirection: 'row',
    gap: 12,
  },
  referralStat: {
    flex: 1,
    backgroundColor: '#FFF8DC',
    borderRadius: 8,
    padding: 8,
  },
  referralStatLabel: {
    fontSize: 10,
    color: '#8B4513',
    marginBottom: 4,
  },
  referralStatValue: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: '#FF8C00',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#8B4513',
    marginBottom: 8,
  },
  missionCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  missionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  missionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFE5B4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  missionIcon: {
    fontSize: 32,
  },
  missionInfo: {
    flex: 1,
  },
  missionTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#8B4513',
    marginBottom: 4,
  },
  missionProgress: {
    fontSize: 16,
    color: '#FF8C00',
    fontWeight: '600' as const,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FF8C00',
    borderRadius: 4,
  },
  rewardsContainer: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  reward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF8DC',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  rewardText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#8B4513',
  },
  claimButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  claimButtonClaimed: {
    backgroundColor: '#90EE90',
  },
  claimButtonDisabled: {
    backgroundColor: '#D3D3D3',
  },
  claimButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold' as const,
  },
  claimButtonTextDisabled: {
    color: '#888',
  },
});
