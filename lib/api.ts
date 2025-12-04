/**
 * API Service for connecting to Express.js backend
 */

const getBaseUrl = () => {
  // Check for explicit environment variable
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }

  // Default to localhost for local development
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev) {
    return "http://localhost:3001";
  }

  throw new Error(
    "No base url found, please set EXPO_PUBLIC_API_BASE_URL"
  );
};

const API_BASE_URL = getBaseUrl();

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

// Export default API object
export default {
  auth: authAPI,
  users: usersAPI,
  game: gameAPI,
  leaderboard: leaderboardAPI,
  transactions: transactionsAPI,
  referrals: referralsAPI,
};

