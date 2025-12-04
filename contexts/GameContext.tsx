import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { gameAPI } from '@/lib/api';

export type BeeType = {
  id: string;
  name: string;
  nameFr: string;
  honeyPerHour: number;
  cost: number;
  emoji: string;
  imageUrl?: string;
};

export const BEE_TYPES: BeeType[] = [
  {
    id: 'baby',
    name: 'Baby Bee',
    nameFr: 'Abeille Bébé',
    honeyPerHour: 42,
    cost: 2000,
    emoji: '🐝',
    imageUrl: 'https://r2-pub.rork.com/generated-images/0cb67fac-9945-4aa0-9293-34090f21d482.png',
  },
  {
    id: 'worker',
    name: 'Worker Bee',
    nameFr: 'Abeille',
    honeyPerHour: 220,
    cost: 10000,
    emoji: '🐝',
  },
  {
    id: 'elite',
    name: 'Elite Bee',
    nameFr: 'Abeille Elite',
    honeyPerHour: 1100,
    cost: 50000,
    emoji: '🐝',
    imageUrl: 'https://r2-pub.rork.com/generated-images/6a4677d5-68c9-4074-8fb8-3dab6a23b35c.png',
  },
  {
    id: 'royal',
    name: 'Royal Bee',
    nameFr: 'Abeille Royal',
    honeyPerHour: 6091,
    cost: 250000,
    emoji: '🐝',
    imageUrl: 'https://r2-pub.rork.com/generated-images/c2298206-dec8-46f2-b8c1-d66d7da3f67c.png',
  },
  {
    id: 'queen',
    name: 'Queen Bee',
    nameFr: 'Reine Abeille',
    honeyPerHour: 31979,
    cost: 1200000,
    emoji: '🐝',
    imageUrl: 'https://r2-pub.rork.com/generated-images/34df0abf-f189-43e9-96b8-5c4551e1c05f.png',
  },
];

export type AlveoleLevel = {
  level: number;
  capacity: number;
  cost: number;
  unlocked: boolean;
};

export type Referral = {
  id: string;
  name: string;
  joinDate: string;
  totalDeposits: number;
  firstDepositBonus: number;
  lifetimeEarnings: number;
  hasFirstPurchase: boolean;
};

export type LeaderboardUser = {
  userId: string;
  userEmail?: string;
  totalDiamondsThisYear: number;
  lastUpdated: string;
};

export type TransactionStatus = 'pending' | 'approved' | 'rejected';

export type Transaction = {
  id: string;
  userId: string;
  userEmail: string;
  type: 'withdrawal_diamond' | 'withdrawal_bvr' | 'deposit_crypto';
  amount: number;
  network: string;
  walletAddress: string;
  status: TransactionStatus;
  createdAt: string;
  processedAt?: string;
  usdAmount?: number;
  fees?: number;
  receivedAmount?: number;
  flowersAmount?: number;
  cryptoAmount?: number;
};

export const ALVEOLE_LEVELS: Omit<AlveoleLevel, 'unlocked'>[] = [
  { level: 1, capacity: 1000000, cost: 0 },
  { level: 2, capacity: 3000000, cost: 200000 },
  { level: 3, capacity: 6000000, cost: 500000 },
  { level: 4, capacity: 14000000, cost: 1250000 },
  { level: 5, capacity: 30000000, cost: 3500000 },
  { level: 6, capacity: 48000000, cost: 8000000 },
];

type GameState = {
  honey: number;
  flowers: number;
  diamonds: number;
  bees: Record<string, number>;
  tickets: number;
  bvrCoins: number;
  alveoles: Record<number, boolean>;
  invitedFriends: number;
  claimedMissions: number[];
  referralCode: string;
  referrals: Referral[];
  totalReferralEarnings: number;
  sponsorCode: string;
  isAffiliatedToDev: boolean;
  hasPendingFunds: boolean;
  transactions: Transaction[];
  diamondsThisYear: number;
  yearStartDate: string;
  allUsersLeaderboard: LeaderboardUser[];
};

const STORAGE_KEY = 'bee_game_state';
const USER_ID_KEY = 'current_user_id';

export const [GameProvider, useGame] = createContextHook(() => {
  const [honey, setHoney] = useState<number>(100);
  const [flowers, setFlowers] = useState<number>(5000);
  const [diamonds, setDiamonds] = useState<number>(0);
  const [tickets, setTickets] = useState<number>(0);
  const [bvrCoins, setBvrCoins] = useState<number>(0);
  const [invitedFriends, setInvitedFriends] = useState<number>(0);
  const [claimedMissions, setClaimedMissions] = useState<number[]>([]);
  const [referralCode, setReferralCode] = useState<string>('');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [totalReferralEarnings, setTotalReferralEarnings] = useState<number>(0);
  const [sponsorCode, setSponsorCode] = useState<string>('');
  const [isAffiliatedToDev, setIsAffiliatedToDev] = useState<boolean>(false);
  const [bees, setBees] = useState<Record<string, number>>({
    baby: 1,
    worker: 0,
    elite: 0,
    royal: 0,
    queen: 0,
  });
  const [alveoles, setAlveoles] = useState<Record<number, boolean>>({
    1: true,
    2: false,
    3: false,
    4: false,
    5: false,
    6: false,
  });
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [hasPendingFunds, setHasPendingFunds] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [diamondsThisYear, setDiamondsThisYear] = useState<number>(0);
  const [yearStartDate, setYearStartDate] = useState<string>(new Date().getFullYear().toString());
  const [allUsersLeaderboard, setAllUsersLeaderboard] = useState<LeaderboardUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadUserId();
    generateReferralCode();
    initializeMockLeaderboard();
  }, []);

  // Reload game state when userId changes
  useEffect(() => {
    if (currentUserId) {
      loadGameState();
    }
  }, [currentUserId]);

  const loadUserId = async () => {
    try {
      // Load user ID from AsyncStorage (set when user logs in)
      const userId = await AsyncStorage.getItem(USER_ID_KEY);
      if (userId) {
        setCurrentUserId(userId);
      }
    } catch (error) {
      console.error('Failed to load user ID:', error);
    }
  };

  // Function to set user ID (called when user logs in)
  const setUserId = useCallback(async (userId: string | null) => {
    setCurrentUserId(userId);
    if (userId) {
      await AsyncStorage.setItem(USER_ID_KEY, userId);
      // Load game state from backend when user is set
      await syncGameStateFromBackend(userId);
    } else {
      await AsyncStorage.removeItem(USER_ID_KEY);
    }
  }, []);

  const syncGameStateFromBackend = useCallback(async (userId: string) => {
    try {
      const response = await gameAPI.getGameState(userId);
      if (response.success && response.gameState) {
        const state = response.gameState;
        setHoney(state.honey ?? 100);
        setFlowers(state.flowers ?? 5000);
        setDiamonds(state.diamonds ?? 0);
        setTickets(state.tickets ?? 0);
        setBvrCoins(state.bvrCoins ?? 0);
        setInvitedFriends(state.invitedFriends ?? 0);
        setClaimedMissions(state.claimedMissions ?? []);
        setReferrals(state.referrals ?? []);
        setTotalReferralEarnings(state.totalReferralEarnings ?? 0);
        setHasPendingFunds(state.hasPendingFunds ?? false);
        setTransactions(state.transactions ?? []);
        setDiamondsThisYear(state.diamondsThisYear ?? 0);
        setYearStartDate(state.yearStartDate ?? new Date().getFullYear().toString());
        
        if (state.bees) {
          setBees(state.bees);
        }
        if (state.alveoles) {
          setAlveoles(state.alveoles);
        }
      }
    } catch (error) {
      console.error('Failed to sync game state from backend:', error);
      // Fallback to local storage if backend fails
      console.log('Falling back to local storage...');
    }
  }, []);

  const initializeMockLeaderboard = () => {
    const mockUsers: LeaderboardUser[] = [];
    
    const baseDiamonds = 2500000;
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    for (let i = 0; i < 100; i++) {
      const randomId = `Player_${Array.from({length: 3}, () => 
        alphabet[Math.floor(Math.random() * alphabet.length)]
      ).join('')}${Math.floor(Math.random() * 900) + 100}`;
      
      const diamonds = Math.floor(baseDiamonds * Math.pow(0.88, i));
      
      mockUsers.push({
        userId: randomId,
        totalDiamondsThisYear: diamonds,
        lastUpdated: new Date().toISOString(),
      });
    }
    
    setAllUsersLeaderboard((current) => {
      if (current.length === 0) {
        return mockUsers;
      }
      return current;
    });
  };

  const generateReferralCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setReferralCode(code);
  };

  const loadGameState = async () => {
    try {
      // Try loading from backend first if userId exists
      if (currentUserId) {
        try {
          const response = await gameAPI.getGameState(currentUserId);
          if (response.success && response.gameState) {
            const state = response.gameState;
            setHoney(state.honey ?? 100);
            setFlowers(state.flowers ?? 5000);
            setDiamonds(state.diamonds ?? 0);
            setTickets(state.tickets ?? 0);
            setBvrCoins(state.bvrCoins ?? 0);
            setInvitedFriends(state.invitedFriends ?? 0);
            setClaimedMissions(state.claimedMissions ?? []);
            setReferrals(state.referrals ?? []);
            setTotalReferralEarnings(state.totalReferralEarnings ?? 0);
            setHasPendingFunds(state.hasPendingFunds ?? false);
            setTransactions(state.transactions ?? []);
            setDiamondsThisYear(state.diamondsThisYear ?? 0);
            setYearStartDate(state.yearStartDate ?? new Date().getFullYear().toString());
            
            if (state.bees) {
              setBees(state.bees);
            }
            if (state.alveoles) {
              setAlveoles(state.alveoles);
            }
            
            // Save to local storage as backup
            const gameState: GameState = {
              honey: state.honey ?? 100,
              flowers: state.flowers ?? 5000,
              diamonds: state.diamonds ?? 0,
              tickets: state.tickets ?? 0,
              bvrCoins: state.bvrCoins ?? 0,
              bees: state.bees || { baby: 1, worker: 0, elite: 0, royal: 0, queen: 0 },
              alveoles: state.alveoles || { 1: true, 2: false, 3: false, 4: false, 5: false, 6: false },
              invitedFriends: state.invitedFriends ?? 0,
              claimedMissions: state.claimedMissions ?? [],
              referralCode: referralCode,
              referrals: state.referrals ?? [],
              totalReferralEarnings: state.totalReferralEarnings ?? 0,
              sponsorCode: sponsorCode,
              isAffiliatedToDev: isAffiliatedToDev,
              hasPendingFunds: state.hasPendingFunds ?? false,
              transactions: state.transactions ?? [],
              diamondsThisYear: state.diamondsThisYear ?? 0,
              yearStartDate: state.yearStartDate ?? new Date().getFullYear().toString(),
              allUsersLeaderboard: allUsersLeaderboard,
            };
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
            setIsLoaded(true);
            return;
          }
        } catch (error) {
          console.warn('Failed to load from backend, using local storage:', error);
        }
      }

      // Fallback to local storage
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const state: GameState = JSON.parse(stored);
        setHoney(state.honey);
        setFlowers(state.flowers ?? 5000);
        setDiamonds(state.diamonds ?? 0);
        setTickets(state.tickets ?? 0);
        setBvrCoins(state.bvrCoins ?? 0);
        setInvitedFriends(state.invitedFriends ?? 0);
        setClaimedMissions(state.claimedMissions ?? []);
        setReferralCode(state.referralCode || '');
        setReferrals(state.referrals ?? []);
        setTotalReferralEarnings(state.totalReferralEarnings ?? 0);
        setSponsorCode(state.sponsorCode ?? '');
        setIsAffiliatedToDev(state.isAffiliatedToDev ?? false);
        setHasPendingFunds(state.hasPendingFunds ?? false);
        setTransactions(state.transactions ?? []);
        
        const currentYear = new Date().getFullYear().toString();
        if (state.yearStartDate !== currentYear) {
          setDiamondsThisYear(0);
          setYearStartDate(currentYear);
        } else {
          setDiamondsThisYear(state.diamondsThisYear ?? 0);
          setYearStartDate(state.yearStartDate ?? currentYear);
        }
        
        setAllUsersLeaderboard(state.allUsersLeaderboard ?? []);
        
        if (!state.sponsorCode && !state.isAffiliatedToDev) {
          setIsAffiliatedToDev(true);
          setSponsorCode('DEV_PARENT');
        }
        setBees(state.bees);
        setAlveoles(state.alveoles ?? { 1: true, 2: false, 3: false, 4: false, 5: false, 6: false });
      }
    } catch (error) {
      console.error('Failed to load game state:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const getTotalProduction = useCallback(() => {
    let total = 0;
    BEE_TYPES.forEach((beeType) => {
      const count = bees[beeType.id] || 0;
      total += count * beeType.honeyPerHour;
    });
    return total;
  }, [bees]);

  const syncGameStateToBackend = useCallback(async (userId: string) => {
    if (!userId) return;

    try {
      // Convert game state to backend format
      const backendState = {
        honey,
        flowers,
        diamonds,
        tickets,
        bvrCoins,
        bees: new Map(Object.entries(bees)),
        alveoles: new Map(Object.entries(alveoles).map(([k, v]) => [Number(k), v])),
        invitedFriends,
        claimedMissions,
        referrals: referrals.map(r => ({
          email: r.name || '',
          referralCode: r.id || '',
          joinedDate: r.joinDate ? new Date(r.joinDate) : new Date(),
          earnings: r.lifetimeEarnings || 0
        })),
        totalReferralEarnings,
        hasPendingFunds,
        transactions: transactions.map(t => ({
          id: t.id,
          type: t.type,
          amount: t.amount,
          currency: t.network || 'USD',
          status: t.status === 'approved' ? 'completed' : t.status === 'rejected' ? 'failed' : 'pending',
          createdAt: new Date(t.createdAt),
          address: t.walletAddress || null
        })),
        diamondsThisYear,
        yearStartDate
      };

      await gameAPI.updateGameState(userId, backendState);
    } catch (error) {
      console.error('Failed to sync game state to backend:', error);
      // Continue without throwing - local storage is still saved
    }
  }, [honey, flowers, diamonds, tickets, bvrCoins, bees, alveoles, invitedFriends, claimedMissions, referrals, totalReferralEarnings, hasPendingFunds, transactions, diamondsThisYear, yearStartDate]);

  const saveGameState = useCallback(async (
    newHoney: number,
    newFlowers: number,
    newDiamonds: number,
    newTickets: number,
    newBvrCoins: number,
    newBees: Record<string, number>,
    newAlveoles: Record<number, boolean>,
    newInvitedFriends: number,
    newClaimedMissions: number[],
    newReferralCode: string,
    newReferrals: Referral[],
    newTotalReferralEarnings: number,
    newSponsorCode: string,
    newIsAffiliatedToDev: boolean,
    newHasPendingFunds: boolean,
    newTransactions: Transaction[],
    newDiamondsThisYear: number,
    newYearStartDate: string,
    newAllUsersLeaderboard: LeaderboardUser[]
  ) => {
    try {
      const state: GameState = {
        honey: newHoney,
        flowers: newFlowers,
        diamonds: newDiamonds,
        tickets: newTickets,
        bvrCoins: newBvrCoins,
        bees: newBees,
        alveoles: newAlveoles,
        invitedFriends: newInvitedFriends,
        claimedMissions: newClaimedMissions,
        referralCode: newReferralCode,
        referrals: newReferrals,
        totalReferralEarnings: newTotalReferralEarnings,
        sponsorCode: newSponsorCode,
        isAffiliatedToDev: newIsAffiliatedToDev,
        hasPendingFunds: newHasPendingFunds,
        transactions: newTransactions,
        diamondsThisYear: newDiamondsThisYear,
        yearStartDate: newYearStartDate,
        allUsersLeaderboard: newAllUsersLeaderboard,
      };
      
      // Save to local storage
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));

      // Sync to backend if user is authenticated (debounced)
      if (currentUserId) {
        // Clear existing timeout
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        
        // Debounce backend sync (save after 2 seconds of no changes)
        saveTimeoutRef.current = setTimeout(async () => {
          try {
            const backendState = {
              honey: newHoney,
              flowers: newFlowers,
              diamonds: newDiamonds,
              tickets: newTickets,
              bvrCoins: newBvrCoins,
              bees: newBees,
              alveoles: newAlveoles,
              invitedFriends: newInvitedFriends,
              claimedMissions: newClaimedMissions,
              referrals: newReferrals.map(r => ({
                email: r.name || '',
                referralCode: r.id || '',
                joinedDate: r.joinDate ? new Date(r.joinDate) : new Date(),
                earnings: r.lifetimeEarnings || 0
              })),
              totalReferralEarnings: newTotalReferralEarnings,
              hasPendingFunds: newHasPendingFunds,
              transactions: newTransactions.map(t => ({
                id: t.id,
                type: t.type,
                amount: t.amount,
                currency: t.network || 'USD',
                status: t.status === 'approved' ? 'completed' : t.status === 'rejected' ? 'failed' : 'pending',
                createdAt: new Date(t.createdAt),
                address: t.walletAddress || null
              })),
              diamondsThisYear: newDiamondsThisYear,
              yearStartDate: newYearStartDate
            };

            await gameAPI.updateGameState(currentUserId, backendState);
          } catch (error) {
            console.error('Failed to sync game state to backend:', error);
          }
        }, 2000); // 2 second debounce
      }
    } catch (error) {
      console.error('Failed to save game state:', error);
    }
  }, [currentUserId]);

  const getMaxCapacity = useCallback(() => {
    let maxCapacity = 0;
    ALVEOLE_LEVELS.forEach((level) => {
      if (alveoles[level.level]) {
        maxCapacity = Math.max(maxCapacity, level.capacity);
      }
    });
    return maxCapacity;
  }, [alveoles]);

  const getTotalCapacity = useCallback(() => {
    let totalCapacity = 0;
    ALVEOLE_LEVELS.forEach((level) => {
      if (alveoles[level.level]) {
        totalCapacity += level.capacity;
      }
    });
    return totalCapacity;
  }, [alveoles]);

  useEffect(() => {
    if (!isLoaded) return;

    const interval = setInterval(() => {
      setHoney((current) => {
        const maxCapacity = getMaxCapacity();
        if (current >= maxCapacity) {
          return current;
        }
        const production = getTotalProduction();
        const newHoney = Math.min(current + production / 3600, maxCapacity);
        return newHoney;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [bees, isLoaded, getTotalProduction, getMaxCapacity]);

  useEffect(() => {
    if (!isLoaded) return;
    saveGameState(
      honey,
      flowers,
      diamonds,
      tickets,
      bvrCoins,
      bees,
      alveoles,
      invitedFriends,
      claimedMissions,
      referralCode,
      referrals,
      totalReferralEarnings,
      sponsorCode,
      isAffiliatedToDev,
      hasPendingFunds,
      transactions,
      diamondsThisYear,
      yearStartDate,
      allUsersLeaderboard
    );
  }, [
    honey,
    flowers,
    diamonds,
    tickets,
    bvrCoins,
    bees,
    alveoles,
    invitedFriends,
    claimedMissions,
    referralCode,
    referrals,
    totalReferralEarnings,
    sponsorCode,
    isAffiliatedToDev,
    hasPendingFunds,
    transactions,
    diamondsThisYear,
    yearStartDate,
    allUsersLeaderboard,
    isLoaded,
    saveGameState,
  ]);

  const buyBee = useCallback(async (beeTypeId: string) => {
    const beeType = BEE_TYPES.find((b) => b.id === beeTypeId);
    if (!beeType) return false;

    // Optimistic update - check locally first
    if (flowers < beeType.cost) {
      return false;
    }

    // If user is authenticated, use backend validation
    if (currentUserId) {
      try {
        const response = await gameAPI.buyBee(currentUserId, beeTypeId);
        if (response.success && response.gameState) {
          // Update state with backend response
          setFlowers(response.gameState.flowers);
          setBees(response.gameState.bees);
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to buy bee from backend:', error);
        // Fallback to local update if backend fails
      }
    }

    // Fallback: local-only update (for offline or unauthenticated users)
    const newFlowers = flowers - beeType.cost;
    const newBees = {
      ...bees,
      [beeTypeId]: (bees[beeTypeId] || 0) + 1,
    };
    setFlowers(newFlowers);
    setBees(newBees);
    return true;
  }, [flowers, bees, currentUserId]);

  const buyFlowers = useCallback((amount: number, priceUSD: number) => {
    if (!hasPendingFunds) {
      return false;
    }
    const newFlowers = flowers + amount;
    const ticketsEarned = Math.floor(priceUSD / 10);
    setFlowers(newFlowers);
    if (ticketsEarned > 0) {
      setTickets((current) => current + ticketsEarned);
    }
    setHasPendingFunds(false);
    return true;
  }, [flowers, hasPendingFunds]);

  const useTicket = useCallback(() => {
    if (tickets > 0) {
      setTickets((current) => current - 1);
      return true;
    }
    return false;
  }, [tickets]);

  const addBees = useCallback((beeTypeId: string, count: number) => {
    const newBees = {
      ...bees,
      [beeTypeId]: (bees[beeTypeId] || 0) + count,
    };
    setBees(newBees);
  }, [bees]);

  const addFlowers = useCallback((amount: number) => {
    setFlowers((current) => current + amount);
  }, []);

  const removeFlowers = useCallback((amount: number) => {
    setFlowers((current) => Math.max(0, current - amount));
  }, []);

  const addTickets = useCallback((amount: number) => {
    setTickets((current) => current + amount);
  }, []);

  const setFundsPending = useCallback((pending: boolean) => {
    setHasPendingFunds(pending);
  }, []);

  const getTotalBees = useCallback(() => {
    return Object.values(bees).reduce((sum, count) => sum + count, 0);
  }, [bees]);

  const buyAlveole = useCallback((level: number) => {
    const alveoleInfo = ALVEOLE_LEVELS.find((a) => a.level === level);
    if (!alveoleInfo || alveoles[level]) return false;

    if (flowers >= alveoleInfo.cost) {
      setFlowers((current) => current - alveoleInfo.cost);
      setAlveoles((current) => ({ ...current, [level]: true }));
      return true;
    }
    return false;
  }, [flowers, alveoles]);

  const updateLeaderboard = useCallback((userId: string, totalDiamonds: number) => {
    setAllUsersLeaderboard((current) => {
      const existingUserIndex = current.findIndex((user) => user.userId === userId);
      let updated = [...current];
      
      if (existingUserIndex !== -1) {
        updated[existingUserIndex] = {
          ...updated[existingUserIndex],
          totalDiamondsThisYear: totalDiamonds,
          lastUpdated: new Date().toISOString(),
        };
      } else {
        updated.push({
          userId,
          totalDiamondsThisYear: totalDiamonds,
          lastUpdated: new Date().toISOString(),
        });
      }
      
      updated.sort((a, b) => b.totalDiamondsThisYear - a.totalDiamondsThisYear);
      return updated.slice(0, 100);
    });
  }, []);

  const sellHoney = useCallback(async (amount: number) => {
    // Optimistic check - validate locally first
    if (honey < amount) return false;
    if (amount < 300) return false;

    // If user is authenticated, use backend validation
    if (currentUserId) {
      try {
        const response = await gameAPI.sellHoney(currentUserId, amount);
        if (response.success && response.gameState) {
          // Update state with backend response
          setHoney(response.gameState.honey);
          setDiamonds(response.gameState.diamonds);
          setFlowers(response.gameState.flowers);
          setBvrCoins(response.gameState.bvrCoins);
          setDiamondsThisYear(response.gameState.diamondsThisYear);
          
          // Update leaderboard
          updateLeaderboard(referralCode, response.gameState.diamondsThisYear);
          
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to sell honey from backend:', error);
        // Fallback to local update if backend fails
      }
    }

    // Fallback: local-only update (for offline or unauthenticated users)
    const diamondsEarned = Math.floor(amount / 300);
    const flowersEarned = diamondsEarned;
    const bvrEarned = diamondsEarned * 2;

    setHoney((current) => current - amount);
    setDiamonds((current) => current + diamondsEarned);
    setFlowers((current) => current + flowersEarned);
    setBvrCoins((current) => current + bvrEarned);
    setDiamondsThisYear((current) => current + diamondsEarned);

    updateLeaderboard(referralCode, diamondsThisYear + diamondsEarned);

    return true;
  }, [honey, referralCode, diamondsThisYear, updateLeaderboard, currentUserId]);

  const inviteFriend = useCallback(() => {
    setInvitedFriends((current) => current + 1);
    setFlowers((current) => current + 200);
    setTotalReferralEarnings((current) => current + 200);

    const newReferral: Referral = {
      id: `ref_${Date.now()}`,
      name: `Filleul ${invitedFriends + 1}`,
      joinDate: new Date().toLocaleDateString('fr-FR'),
      totalDeposits: 0,
      firstDepositBonus: 0,
      lifetimeEarnings: 200,
      hasFirstPurchase: false,
    };
    setReferrals((current) => [newReferral, ...current]);
  }, [invitedFriends]);

  const setSponsor = useCallback((code: string) => {
    if (sponsorCode === '' && !isAffiliatedToDev) {
      if (code === '') {
        setSponsorCode('DEV_PARENT');
        setIsAffiliatedToDev(true);
      } else {
        setSponsorCode(code);
        setIsAffiliatedToDev(false);
      }
    }
  }, [sponsorCode, isAffiliatedToDev]);

  const resetGameState = useCallback(() => {
    setUserId(null);
    setHoney(1000);
    setFlowers(0);
    setDiamonds(0);
    setTickets(0);
    setBvrCoins(0);
    setBees({});
    setAlveoles({});
    setInvitedFriends(0);
    setClaimedMissions([]);
    setReferralCode('');
    setReferrals([]);
    setTotalReferralEarnings(0);
    setSponsorCode('');
    setIsAffiliatedToDev(false);
    setHasPendingFunds(false);
    setTransactions([]);
    setDiamondsThisYear(0);
    setLeaderboard([]);
    setIsLoaded(false);
  }, []);

  const claimMission = useCallback((missionId: number, flowersReward: number, ticketsReward: number) => {
    if (claimedMissions.includes(missionId)) return false;

    setClaimedMissions((current) => [...current, missionId]);
    setFlowers((current) => current + flowersReward);
    setTickets((current) => current + ticketsReward);
    return true;
  }, [claimedMissions]);

  const addReferralDeposit = useCallback((referralId: string, depositAmount: number) => {
    setReferrals((current) => {
      return current.map((ref) => {
        if (ref.id === referralId) {
          const isFirstDeposit = !ref.hasFirstPurchase;
          let bonusFlowers = 0;

          if (isFirstDeposit) {
            bonusFlowers = 3000 + Math.floor(depositAmount * 0.06 * 10000);
          } else {
            bonusFlowers = Math.floor(depositAmount * 0.06 * 10000);
          }

          setFlowers((curr) => curr + bonusFlowers);
          setTotalReferralEarnings((curr) => curr + bonusFlowers);

          return {
            ...ref,
            totalDeposits: ref.totalDeposits + depositAmount,
            firstDepositBonus: isFirstDeposit ? bonusFlowers : ref.firstDepositBonus,
            lifetimeEarnings: ref.lifetimeEarnings + bonusFlowers,
            hasFirstPurchase: true,
          };
        }
        return ref;
      });
    });
  }, []);

  const submitWithdrawal = useCallback((transaction: Omit<Transaction, 'id' | 'status' | 'createdAt'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: `txn_${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setTransactions((current) => [newTransaction, ...current]);
    return newTransaction;
  }, []);

  const approveTransaction = useCallback((transactionId: string, sponsorUserEmail?: string) => {
    setTransactions((current) =>
      current.map((txn) => {
        if (txn.id === transactionId && txn.status === 'pending') {
          if (txn.type === 'withdrawal_diamond') {
            setDiamonds((curr) => Math.max(0, curr - txn.amount));
          } else if (txn.type === 'withdrawal_bvr') {
            setBvrCoins((curr) => Math.max(0, curr - txn.amount));
          } else if (txn.type === 'deposit_crypto' && txn.flowersAmount !== undefined) {
            setFlowers((curr) => curr + (txn.flowersAmount ?? 0));
            
            if (txn.usdAmount) {
              const ticketsEarned = Math.floor(txn.usdAmount / 10);
              if (ticketsEarned > 0) {
                setTickets((curr) => curr + ticketsEarned);
              }
              
              if (sponsorCode && sponsorCode !== 'DEV_PARENT' && !isAffiliatedToDev) {
                const affiliationPercentage = 0.06;
                const affiliationAmount = Math.floor(txn.usdAmount * affiliationPercentage * 10000);
                
                console.log(`[AFFILIATION] Dépôt approuvé: ${txn.usdAmount}$ - Commission: ${affiliationAmount} fleurs pour le parrain ${sponsorCode}`);
                console.log(`[AFFILIATION] ⚠️ ATTENTION: Le système d'affiliation nécessite un backend pour créditer automatiquement le parrain.`);
                console.log(`[AFFILIATION] Action manuelle requise: Créditer ${affiliationAmount} fleurs au parrain avec le code ${sponsorCode} (email du parrain: ${sponsorUserEmail || 'non fourni'})`);
              } else if (isAffiliatedToDev || sponsorCode === 'DEV_PARENT') {
                const devAffiliationPercentage = 0.06;
                const devAffiliationAmount = Math.floor(txn.usdAmount * devAffiliationPercentage * 10000);
                
                console.log(`[AFFILIATION DEV] Dépôt approuvé: ${txn.usdAmount}$ - Commission: ${devAffiliationAmount} fleurs pour le développeur`);
                console.log(`[AFFILIATION DEV] ⚠️ ATTENTION: Le système d'affiliation nécessite un backend pour créditer automatiquement le développeur.`);
              }
            }
          }
          return {
            ...txn,
            status: 'approved' as TransactionStatus,
            processedAt: new Date().toISOString(),
          };
        }
        return txn;
      })
    );
  }, [sponsorCode, isAffiliatedToDev]);

  const rejectTransaction = useCallback((transactionId: string) => {
    setTransactions((current) =>
      current.map((txn) =>
        txn.id === transactionId && txn.status === 'pending'
          ? {
              ...txn,
              status: 'rejected' as TransactionStatus,
              processedAt: new Date().toISOString(),
            }
          : txn
      )
    );
  }, []);

  const getPendingTransactions = useCallback(() => {
    return transactions.filter((txn) => txn.status === 'pending');
  }, [transactions]);

  const getLeaderboard = useCallback(() => {
    return allUsersLeaderboard;
  }, [allUsersLeaderboard]);

  const getCurrentUserRank = useCallback(() => {
    const userIndex = allUsersLeaderboard.findIndex((user) => user.userId === referralCode);
    return userIndex !== -1 ? userIndex + 1 : null;
  }, [allUsersLeaderboard, referralCode]);

  return useMemo(() => ({
    honey,
    flowers,
    diamonds,
    tickets,
    bvrCoins,
    bees,
    alveoles,
    isLoaded,
    buyBee,
    buyFlowers,
    useTicket,
    addBees,
    addFlowers,
    addTickets,
    getTotalProduction,
    getTotalBees,
    buyAlveole,
    sellHoney,
    getMaxCapacity,
    getTotalCapacity,
    setDiamonds,
    setBvrCoins,
    setFlowers,
    invitedFriends,
    claimedMissions,
    inviteFriend,
    claimMission,
    referralCode,
    referrals,
    totalReferralEarnings,
    addReferralDeposit,
    sponsorCode,
    isAffiliatedToDev,
    setSponsor,
    hasPendingFunds,
    removeFlowers,
    setFundsPending,
    transactions,
    submitWithdrawal,
    approveTransaction,
    rejectTransaction,
    getPendingTransactions,
    diamondsThisYear,
    getLeaderboard,
    getCurrentUserRank,
    updateLeaderboard,
    setUserId, // Expose setUserId to connect with AuthContext
  }), [
    honey,
    flowers,
    diamonds,
    tickets,
    bvrCoins,
    bees,
    alveoles,
    isLoaded,
    buyBee,
    buyFlowers,
    useTicket,
    addBees,
    addFlowers,
    addTickets,
    getTotalProduction,
    getTotalBees,
    buyAlveole,
    sellHoney,
    getMaxCapacity,
    getTotalCapacity,
    invitedFriends,
    claimedMissions,
    inviteFriend,
    claimMission,
    referralCode,
    referrals,
    totalReferralEarnings,
    addReferralDeposit,
    sponsorCode,
    isAffiliatedToDev,
    setSponsor,
    hasPendingFunds,
    removeFlowers,
    setFundsPending,
    transactions,
    submitWithdrawal,
    approveTransaction,
    rejectTransaction,
    getPendingTransactions,
    diamondsThisYear,
    getLeaderboard,
    getCurrentUserRank,
    updateLeaderboard,
    setUserId,
    resetGameState, // Add resetGameState for logout functionality
  ]);
});
