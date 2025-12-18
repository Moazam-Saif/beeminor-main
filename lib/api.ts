/**
 * API Service for connecting to Express.js backend
 */
import { API_BASE_URL } from './config';

// Helper function for API calls
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: `HTTP error! status: ${response.status}`,
      }));
      throw new Error(errorData.message || 'Request failed');
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// Auth API
export const authAPI = {
  register: async (email: string, password: string, sponsorCode?: string) => {
    return apiRequest<{
      success: boolean;
      message: string;
      user: {
        id: string;
        email: string;
        referralCode: string;
        sponsorCode?: string;
        createdAt: string;
      };
    }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, sponsorCode }),
    });
  },

  login: async (email: string, password: string) => {
    return apiRequest<{
      success: boolean;
      message: string;
      user: {
        id: string;
        email: string;
        referralCode: string;
        sponsorCode?: string;
        createdAt: string;
        lastLogin?: string;
      };
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  checkEmail: async (email: string) => {
    return apiRequest<{
      success: boolean;
      exists: boolean;
    }>(`/api/auth/check-email/${encodeURIComponent(email)}`);
  },
};

// Users API
export const usersAPI = {
  getUser: async (userId: string) => {
    return apiRequest<{
      success: boolean;
      user: {
        id: string;
        email: string;
        referralCode: string;
        sponsorCode?: string;
        createdAt: string;
      };
    }>(`/api/users/${userId}`);
  },

  getUserByReferralCode: async (code: string) => {
    return apiRequest<{
      success: boolean;
      user: {
        id: string;
        email: string;
        referralCode: string;
      };
    }>(`/api/users/referral/${code}`);
  },

  updateUser: async (userId: string, updates: { email?: string; sponsorCode?: string }) => {
    return apiRequest<{
      success: boolean;
      message: string;
      user: {
        id: string;
        email: string;
        referralCode: string;
        sponsorCode?: string;
      };
    }>(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
};

// Game API
export const gameAPI = {
  getGameState: async (userId: string) => {
    return apiRequest<{
      success: boolean;
      gameState: {
        userId: string;
        honey: number;
        flowers: number;
        diamonds: number;
        tickets: number;
        bvrCoins: number;
        bees: Record<string, number>;
        alveoles: Record<number, boolean>;
        invitedFriends: number;
        claimedMissions: number[];
        referrals: any[];
        totalReferralEarnings: number;
        hasPendingFunds: boolean;
        transactions: any[];
        diamondsThisYear: number;
        yearStartDate: string;
      };
    }>(`/api/game/${userId}`);
  },

  updateGameState: async (userId: string, updates: any) => {
    return apiRequest<{
      success: boolean;
      message: string;
      gameState: any;
    }>(`/api/game/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  buyBee: async (userId: string, beeTypeId: string) => {
    return apiRequest<{
      success: boolean;
      message: string;
      gameState: {
        userId: string;
        honey: number;
        flowers: number;
        diamonds: number;
        tickets: number;
        bvrCoins: number;
        bees: Record<string, number>;
        alveoles: Record<number, boolean>;
        invitedFriends: number;
        claimedMissions: number[];
        referrals: any[];
        totalReferralEarnings: number;
        hasPendingFunds: boolean;
        transactions: any[];
        diamondsThisYear: number;
        yearStartDate: string;
      };
    }>(`/api/game/${userId}/buy-bee`, {
      method: 'POST',
      body: JSON.stringify({ beeTypeId }),
    });
  },

  sellHoney: async (userId: string, amount: number) => {
    return apiRequest<{
      success: boolean;
      message: string;
      rewards: {
        diamonds: number;
        flowers: number;
        bvr: number;
      };
      gameState: {
        userId: string;
        honey: number;
        flowers: number;
        diamonds: number;
        tickets: number;
        bvrCoins: number;
        bees: Record<string, number>;
        alveoles: Record<number, boolean>;
        invitedFriends: number;
        claimedMissions: number[];
        referrals: any[];
        totalReferralEarnings: number;
        hasPendingFunds: boolean;
        transactions: any[];
        diamondsThisYear: number;
        yearStartDate: string;
      };
    }>(`/api/game/${userId}/sell-honey`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  },

  buyAlveole: async (userId: string, level: number) => {
    return apiRequest<{
      success: boolean;
      message: string;
      alveole: {
        level: number;
        capacity: number;
        cost: number;
      };
      gameState: {
        userId: string;
        honey: number;
        flowers: number;
        diamonds: number;
        tickets: number;
        bvrCoins: number;
        bees: Record<string, number>;
        alveoles: Record<number, boolean>;
        invitedFriends: number;
        claimedMissions: number[];
        referrals: any[];
        totalReferralEarnings: number;
        hasPendingFunds: boolean;
        transactions: any[];
        diamondsThisYear: number;
        yearStartDate: string;
      };
    }>(`/api/game/${userId}/upgrade-alveole`, {
      method: 'POST',
      body: JSON.stringify({ level }),
    });
  },

  spinRoulette: async (userId: string) => {
    return apiRequest<{
      success: boolean;
      message: string;
      prize: {
        index: number;
        id: string;
        label: string;
        type: 'bee' | 'flowers';
        beeType?: string;
        beeCount?: number;
        flowersAmount?: number;
        rarity: string;
      };
      gameState: {
        userId: string;
        honey: number;
        flowers: number;
        diamonds: number;
        tickets: number;
        bvrCoins: number;
        bees: Record<string, number>;
        alveoles: Record<number, boolean>;
        invitedFriends: number;
        claimedMissions: number[];
        referrals: any[];
        totalReferralEarnings: number;
        hasPendingFunds: boolean;
        transactions: any[];
        diamondsThisYear: number;
        yearStartDate: string;
      };
    }>(`/api/game/${userId}/spin-roulette`, {
      method: 'POST',
    });
  },

  claimMission: async (userId: string, missionId: number) => {
    return apiRequest<{
      success: boolean;
      message: string;
      mission: {
        id: number;
        flowersReward: number;
        ticketsReward: number;
      };
      gameState: {
        userId: string;
        honey: number;
        flowers: number;
        diamonds: number;
        tickets: number;
        bvrCoins: number;
        bees: Record<string, number>;
        alveoles: Record<number, boolean>;
        invitedFriends: number;
        claimedMissions: number[];
        referrals: any[];
        totalReferralEarnings: number;
        hasPendingFunds: boolean;
        transactions: any[];
        diamondsThisYear: number;
        yearStartDate: string;
      };
    }>(`/api/game/${userId}/claim-mission`, {
      method: 'POST',
      body: JSON.stringify({ missionId }),
    });
  },

  exchangeResource: async (userId: string, type: 'DIAMONDS_TO_FLOWERS' | 'BVR_TO_FLOWERS', amount: number) => {
    return apiRequest<{
      success: boolean;
      message: string;
      flowersReceived: number;
      newBalances: {
        diamonds: number;
        bvrCoins: number;
        flowers: number;
      };
    }>(`/api/game/${userId}/exchange`, {
      method: 'POST',
      body: JSON.stringify({ type, amount }),
    });
  },

  processReferral: async (userId: string, purchaseAmount: number, purchaseType: string) => {
    return apiRequest<{
      success: boolean;
      message: string;
      bonusAwarded: boolean;
      bonus?: {
        sponsor: string;
        amount: number;
        type: string;
        purchaseType: string;
      };
      sponsorNewBalance?: {
        flowers: number;
        totalReferralEarnings: number;
        invitedFriends: number;
      };
    }>(`/api/game/${userId}/process-referral`, {
      method: 'POST',
      body: JSON.stringify({ purchaseAmount, purchaseType }),
    });
  },

  linkReferral: async (userId: string) => {
    return apiRequest<{
      success: boolean;
      message: string;
      linked: boolean;
      sponsor?: {
        email: string;
        invitedFriends: number;
      };
    }>(`/api/game/${userId}/link-referral`, {
      method: 'POST',
    });
  },

  purchaseFlowers: async (userId: string, amount: number, priceUSD: number, paymentMethod?: string, transactionId?: string) => {
    return apiRequest<{
      success: boolean;
      message: string;
      purchase: {
        flowers: number;
        price: number;
        ticketsEarned: number;
      };
      gameState: {
        userId: string;
        honey: number;
        flowers: number;
        diamonds: number;
        tickets: number;
        bvrCoins: number;
        bees: Record<string, number>;
        alveoles: Record<number, boolean>;
        invitedFriends: number;
        claimedMissions: number[];
        referrals: any[];
        totalReferralEarnings: number;
        hasPendingFunds: boolean;
        transactions: any[];
        diamondsThisYear: number;
        yearStartDate: string;
      };
    }>(`/api/game/${userId}/purchase-flowers`, {
      method: 'POST',
      body: JSON.stringify({ amount, priceUSD, paymentMethod, transactionId }),
    });
  },

  setPendingFunds: async (userId: string, hasPending: boolean) => {
    return apiRequest<{
      success: boolean;
      message: string;
      hasPendingFunds: boolean;
    }>(`/api/game/${userId}/set-pending-funds`, {
      method: 'POST',
      body: JSON.stringify({ hasPending }),
    });
  },
};

// Leaderboard API
export const leaderboardAPI = {
  getTopDiamonds: async (limit: number = 10) => {
    return apiRequest<{
      success: boolean;
      leaderboard: Array<{
        rank: number;
        userId: string;
        email: string;
        referralCode: string;
        diamonds: number;
      }>;
    }>(`/api/leaderboard/top-diamonds?limit=${limit}`);
  },

  getTopHoney: async (limit: number = 10) => {
    return apiRequest<{
      success: boolean;
      leaderboard: Array<{
        rank: number;
        userId: string;
        email: string;
        referralCode: string;
        honey: number;
      }>;
    }>(`/api/leaderboard/top-honey?limit=${limit}`);
  },

  getTopReferrers: async (limit: number = 10) => {
    return apiRequest<{
      success: boolean;
      leaderboard: Array<{
        rank: number;
        userId: string;
        email: string;
        referralCode: string;
        totalReferralEarnings: number;
        invitedFriends: number;
      }>;
    }>(`/api/leaderboard/top-referrers?limit=${limit}`);
  },

  getUserRank: async (userId: string) => {
    return apiRequest<{
      success: boolean;
      ranks: {
        diamonds: { rank: number; total: number; value: number };
        honey: { rank: number; total: number; value: number };
        referrals: {
          rank: number;
          total: number;
          totalEarnings: number;
          invitedFriends: number;
        };
      };
    }>(`/api/leaderboard/user-rank/${userId}`);
  },

  getGlobalStats: async () => {
    return apiRequest<{
      success: boolean;
      stats: {
        totalUsers: number;
        totalDiamonds: number;
        totalHoney: number;
        totalFlowers: number;
        totalBees: number;
        totalReferrals: number;
        totalReferralEarnings: number;
      };
    }>('/api/leaderboard/stats');
  },
};

// Transactions API
export const transactionsAPI = {
  getTransactions: async (userId: string) => {
    return apiRequest<{
      success: boolean;
      transactions: Array<{
        id: string;
        type: string;
        amount: number;
        currency: string;
        status: string;
        address?: string;
        cryptoAddress?: string;
        notes?: string;
        createdAt: string;
      }>;
    }>(`/api/transactions/${userId}`);
  },

  createTransaction: async (transaction: {
    userId: string;
    type: string;
    amount: number;
    currency: string;
    address?: string;
    cryptoAddress?: string;
    notes?: string;
  }) => {
    return apiRequest<{
      success: boolean;
      message: string;
      transaction: any;
    }>('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  },

  createWithdrawal: async (withdrawal: {
    userId: string;
    amount: number;
    currency: string;
    address?: string;
    cryptoAddress?: string;
    type?: string;
  }) => {
    return apiRequest<{
      success: boolean;
      message: string;
      transaction: any;
      remainingFlowers: number;
    }>('/api/transactions/withdraw', {
      method: 'POST',
      body: JSON.stringify(withdrawal),
    });
  },

  updateTransactionStatus: async (
    transactionId: string,
    status: string,
    adminNotes?: string
  ) => {
    return apiRequest<{
      success: boolean;
      message: string;
      transaction: any;
    }>(`/api/transactions/${transactionId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, adminNotes }),
    });
  },

  getPendingTransactions: async () => {
    return apiRequest<{
      success: boolean;
      transactions: Array<{
        id: string;
        userId: string;
        userEmail: string;
        type: string;
        amount: number;
        currency: string;
        address?: string;
        cryptoAddress?: string;
        notes?: string;
        createdAt: string;
      }>;
    }>('/api/transactions/pending/all');
  },
};

// Referrals API
export const referralsAPI = {
  getReferrals: async (userId: string) => {
    return apiRequest<{
      success: boolean;
      referrals: Array<{
        email: string;
        referralCode: string;
        joinedAt: string;
      }>;
      totalReferrals: number;
      totalEarnings: number;
    }>(`/api/referrals/${userId}`);
  },

  checkReferralCode: async (code: string) => {
    return apiRequest<{
      success: boolean;
      valid: boolean;
      user: {
        email: string;
        referralCode: string;
      } | null;
    }>('/api/referrals/check', {
      method: 'POST',
      body: JSON.stringify({ referralCode: code }),
    });
  },
};

// Support Messages API
export const supportAPI = {
  sendMessage: async (subject: string, message: string, userEmail: string, userId?: string) => {
    return apiRequest<{
      success: boolean;
      message: string;
      messageId: string;
    }>('/api/support/messages', {
      method: 'POST',
      body: JSON.stringify({ subject, message, userEmail, userId }),
    });
  },

  getAllMessages: async () => {
    return apiRequest<{
      success: boolean;
      messages: Array<{
        id: string;
        subject: string;
        message: string;
        userEmail: string;
        userId: string | null;
        read: boolean;
        createdAt: string;
        updatedAt: string;
      }>;
    }>('/api/support/messages');
  },

  getUnreadCount: async () => {
    return apiRequest<{
      success: boolean;
      count: number;
    }>('/api/support/messages/unread');
  },

  markAsRead: async (messageId: string) => {
    return apiRequest<{
      success: boolean;
      message: string;
    }>(`/api/support/messages/${messageId}/read`, {
      method: 'PATCH',
    });
  },

  deleteMessage: async (messageId: string) => {
    return apiRequest<{
      success: boolean;
      message: string;
    }>(`/api/support/messages/${messageId}`, {
      method: 'DELETE',
    });
  },
};

// Export default API object
export default {
  auth: authAPI,
  users: usersAPI,
  game: gameAPI,
  leaderboard: leaderboardAPI,
  transactions: transactionsAPI,
  referrals: referralsAPI,
  support: supportAPI,
};

