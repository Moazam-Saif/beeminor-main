import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { gameAPI, transactionsAPI } from '../lib/api';

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
  const isSavingRef = useRef<boolean>(false); // Track if save is in progress
  const isSyncingFromBackendRef = useRef<boolean>(false); // Track if currently syncing FROM backend
  const blockSaveUntilRef = useRef<number>(0); // Block all saves until this timestamp
  const lastSyncTimestampRef = useRef<number>(0); // Track last successful sync

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

  const syncGameStateFromBackend = useCallback(async (userId: string, force = false) => {
    try {
      // If there's a pending save or save in progress, don't overwrite with potentially stale backend data
      if (!force && (saveTimeoutRef.current || isSavingRef.current)) {
        console.log('⏳ Skipping sync - local changes pending or save in progress');
        return;
      }
      
      // Don't sync too frequently (minimum 30 seconds between syncs unless forced)
      const now = Date.now();
      if (!force && now - lastSyncTimestampRef.current < 30000) {
        console.log('⏳ Skipping sync - synced recently');
        return;
      }

      // Set flag to prevent auto-save during sync
      isSyncingFromBackendRef.current = true;

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
        lastSyncTimestampRef.current = Date.now();
        console.log('✅ Synced from backend - Flowers:', state.flowers);
      }
    } catch (error) {
      console.error('Failed to sync game state from backend:', error);
      // Fallback to local storage if backend fails
      console.log('Falling back to local storage...');
    } finally {
      // Clear the sync flag after all state updates complete
      setTimeout(() => {
        isSyncingFromBackendRef.current = false;
      }, 100);
    }
  }, []);

  // Function to set user ID (called when user logs in)
  const setUserId = useCallback(async (userId: string | null) => {
    setCurrentUserId(userId);
    if (userId) {
      await AsyncStorage.setItem(USER_ID_KEY, userId);
      // Load game state from backend when user is set (force = true on login)
      await syncGameStateFromBackend(userId, true);
    } else {
      await AsyncStorage.removeItem(USER_ID_KEY);
    }
  }, [syncGameStateFromBackend]);

  // Periodic sync: refresh from backend every 2 minutes (reduced frequency to minimize conflicts)
  // Only syncs if there are no pending local changes and enough time has passed
  useEffect(() => {
    if (!currentUserId) return;

    const syncInterval = setInterval(() => {
      syncGameStateFromBackend(currentUserId, false);
    }, 120000); // 120 seconds (2 minutes) - even less aggressive for production

    return () => clearInterval(syncInterval);
  }, [currentUserId, syncGameStateFromBackend]);

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
            
            // Link referral on first login (if user has sponsor and not yet linked)
            if (sponsorCode && state.referrals.length === 0) {
              try {
                await gameAPI.linkReferral(currentUserId);
              } catch (linkError) {
                console.log('Referral link note:', linkError);
                // Non-blocking
              }
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
    // CRITICAL: Check block FIRST before any processing
    if (currentUserId && Date.now() < blockSaveUntilRef.current) {
      console.log('🚫 Save blocked - critical operation in progress');
      return;
    }
    
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
        
        // Debounce backend sync (save after 500ms of no changes)
        saveTimeoutRef.current = setTimeout(async () => {
          isSavingRef.current = true;
          try {
            console.log('💾 Saving to backend - Honey:', newHoney);
            // First, get current state from backend to check for server-side updates
            const serverState = await gameAPI.getGameState(currentUserId);
            
            // Check if server was updated more recently (e.g., admin approved deposit)
            const serverLastUpdated = serverState.success && (serverState.gameState as any).lastUpdated 
              ? new Date((serverState.gameState as any).lastUpdated).getTime() 
              : 0;
            const localLastSync = lastSyncTimestampRef.current || 0;
            
            // If server updated after our last sync, use server values for flowers/bvrCoins
            const useServerFlowers = serverState.success && serverLastUpdated > localLastSync;
            
            const backendState = {
              honey: newHoney,
              flowers: useServerFlowers ? serverState.gameState.flowers : newFlowers,
              diamonds: newDiamonds,
              tickets: newTickets,
              bvrCoins: useServerFlowers ? serverState.gameState.bvrCoins : newBvrCoins,
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
            
            // If server had updates, sync local state and update our last sync timestamp
            if (useServerFlowers) {
              setFlowers(serverState.gameState.flowers);
              setBvrCoins(serverState.gameState.bvrCoins);
              lastSyncTimestampRef.current = serverLastUpdated; // Update sync timestamp to server's time
              console.log('🔄 Synced server-updated values - flowers:', serverState.gameState.flowers);
            }
            console.log('✅ Saved to backend successfully - Honey:', newHoney);
            lastSyncTimestampRef.current = Date.now();
          } catch (error) {
            console.error('❌ Failed to sync game state to backend:', error);
          } finally {
            // Clear flags after save attempt
            saveTimeoutRef.current = null;
            isSavingRef.current = false;
          }
        }, 500) as any;
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
    
    // Skip auto-save if we're currently syncing FROM backend
    // This prevents overwriting server updates with stale local state
    if (isSyncingFromBackendRef.current) {
      console.log('⏭️ Skipping auto-save - syncing from backend');
      return;
    }
    
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
          
          // Process referral bonus for sponsor (10% of purchase)
          try {
            await gameAPI.processReferral(currentUserId, beeType.cost, 'bee_purchase');
          } catch (refError) {
            console.log('Referral processing note:', refError);
            // Non-blocking - purchase succeeded regardless
          }
          
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

  const buyFlowers = useCallback(async (amount: number, priceUSD: number) => {
    if (!hasPendingFunds) {
      return false;
    }

    // If user is authenticated, use backend
    if (currentUserId) {
      try {
        const response = await gameAPI.purchaseFlowers(currentUserId, amount, priceUSD);
        if (response.success && response.gameState) {
          // Update state with backend response
          setFlowers(response.gameState.flowers);
          setTickets(response.gameState.tickets);
          setHasPendingFunds(response.gameState.hasPendingFunds);
          setTransactions(response.gameState.transactions);
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to purchase flowers from backend:', error);
        // Fallback to local update if backend fails
      }
    }

    // Fallback: local-only update (for offline or unauthenticated users)
    const newFlowers = flowers + amount;
    const ticketsEarned = Math.floor(priceUSD / 10);
    setFlowers(newFlowers);
    if (ticketsEarned > 0) {
      setTickets((current) => current + ticketsEarned);
    }
    setHasPendingFunds(false);
    return true;
  }, [flowers, hasPendingFunds, currentUserId]);

  const useTicket = useCallback(() => {
    if (tickets > 0) {
      setTickets((current) => current - 1);
      return true;
    }
    return false;
  }, [tickets]);

  const spinRoulette = useCallback(async () => {
    // Optimistic check - validate locally first
    if (tickets <= 0) {
      return { success: false, message: 'No tickets available' };
    }

    // If user is authenticated, use backend for prize selection (prevents cheating)
    if (currentUserId) {
      try {
        const response = await gameAPI.spinRoulette(currentUserId);
        if (response.success && response.gameState && response.prize) {
          // Update state with backend response
          setTickets(response.gameState.tickets);
          setFlowers(response.gameState.flowers);
          setBees(response.gameState.bees);
          
          return { 
            success: true, 
            prize: response.prize,
            prizeIndex: response.prize.index
          };
        }
        return { success: false, message: response.message || 'Spin failed' };
      } catch (error) {
        console.error('Failed to spin roulette from backend:', error);
        return { success: false, message: 'Network error' };
      }
    }

    // Fallback: local-only spin (for unauthenticated users - still use ticket)
    setTickets((current) => current - 1);
    return { 
      success: true, 
      message: 'Spin completed (local mode)',
      prizeIndex: 0 // Default fallback prize
    };
  }, [tickets, currentUserId]);

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

  const setFundsPending = useCallback(async (pending: boolean) => {
    // If user is authenticated, use backend
    if (currentUserId) {
      try {
        const response = await gameAPI.setPendingFunds(currentUserId, pending);
        if (response.success) {
          setHasPendingFunds(response.hasPendingFunds);
          return true;
        }
      } catch (error) {
        console.error('Failed to set pending funds from backend:', error);
        // Fallback to local update if backend fails
      }
    }

    // Fallback: local-only update
    setHasPendingFunds(pending);
    return true;
  }, [currentUserId]);

  const getTotalBees = useCallback(() => {
    return Object.values(bees).reduce((sum, count) => sum + count, 0);
  }, [bees]);

  const buyAlveole = useCallback(async (level: number) => {
    const alveoleInfo = ALVEOLE_LEVELS.find((a) => a.level === level);
    if (!alveoleInfo || alveoles[level]) return false;

    // Optimistic check - validate locally first
    if (flowers < alveoleInfo.cost) {
      return false;
    }

    // If user is authenticated, use backend validation
    if (currentUserId) {
      try {
        const response = await gameAPI.buyAlveole(currentUserId, level);
        if (response.success && response.gameState) {
          // Update state with backend response
          setFlowers(response.gameState.flowers);
          setAlveoles(response.gameState.alveoles);
          
          // Process referral bonus for sponsor (10% of purchase)
          try {
            await gameAPI.processReferral(currentUserId, alveoleInfo.cost, 'alveole_upgrade');
          } catch (refError) {
            console.log('Referral processing note:', refError);
            // Non-blocking - purchase succeeded regardless
          }
          
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to buy alveole from backend:', error);
        // Fallback to local update if backend fails
      }
    }

    // Fallback: local-only update (for offline or unauthenticated users)
    setFlowers((current) => current - alveoleInfo.cost);
    setAlveoles((current) => ({ ...current, [level]: true }));
    return true;
  }, [flowers, alveoles, currentUserId]);

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
    setAllUsersLeaderboard([]);
    setIsLoaded(false);
  }, []);

  const exchangeResource = useCallback(async (type: 'DIAMONDS_TO_FLOWERS' | 'BVR_TO_FLOWERS', amount: number) => {
    // Validate amount
    if (amount <= 0) {
      return { success: false, message: 'Invalid amount' };
    }

    // Validate sufficient balance
    if (type === 'DIAMONDS_TO_FLOWERS' && diamonds < amount) {
      return { success: false, message: 'Insufficient diamonds' };
    }
    if (type === 'BVR_TO_FLOWERS' && bvrCoins < amount) {
      return { success: false, message: 'Insufficient BVR' };
    }
    if (type === 'BVR_TO_FLOWERS' && amount < 100) {
      return { success: false, message: 'Minimum 100 BVR required' };
    }

    // If user is authenticated, use backend
    if (currentUserId) {
      try {
        const response = await gameAPI.exchangeResource(currentUserId, type, amount);
        if (response.success && response.newBalances) {
          console.log('💱 Exchange successful, updating state:', response.newBalances);
          
          // Update state with backend response
          setDiamonds(response.newBalances.diamonds);
          setBvrCoins(response.newBalances.bvrCoins);
          setFlowers(response.newBalances.flowers);
          
          // Force immediate sync from backend to ensure consistency
          await syncGameStateFromBackend(currentUserId);
          
          return { success: true, flowersReceived: response.flowersReceived };
        }
        return { success: false, message: response.message || 'Exchange failed' };
      } catch (error) {
        console.error('Failed to exchange from backend:', error);
        return { success: false, message: 'Failed to connect to server' };
      }
    }

    // Fallback: local-only update (should not happen in production)
    let flowersReceived = 0;
    if (type === 'DIAMONDS_TO_FLOWERS') {
      flowersReceived = amount * 1.1;
      setDiamonds((current) => current - amount);
      setFlowers((current) => current + flowersReceived);
    } else if (type === 'BVR_TO_FLOWERS') {
      flowersReceived = amount / 100;
      setBvrCoins((current) => current - amount);
      setFlowers((current) => current + flowersReceived);
    }

    return { success: true, flowersReceived };
  }, [diamonds, bvrCoins, currentUserId, syncGameStateFromBackend]);

  const claimMission = useCallback(async (missionId: number, flowersReward: number, ticketsReward: number) => {
    // Optimistic check - validate locally first
    if (claimedMissions.includes(missionId)) return false;

    // If user is authenticated, use backend validation
    if (currentUserId) {
      try {
        const response = await gameAPI.claimMission(currentUserId, missionId);
        if (response.success && response.gameState) {
          // Update state with backend response
          setClaimedMissions(response.gameState.claimedMissions);
          setFlowers(response.gameState.flowers);
          setTickets(response.gameState.tickets);
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to claim mission from backend:', error);
        // Fallback to local update if backend fails
      }
    }

    // Fallback: local-only update (for offline or unauthenticated users)
    setClaimedMissions((current) => [...current, missionId]);
    setFlowers((current) => current + flowersReward);
    setTickets((current) => current + ticketsReward);
    return true;
  }, [claimedMissions, currentUserId]);

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

  // Function to block saves before critical operations
  const blockSaves = useCallback((durationMs: number = 5000) => {
    blockSaveUntilRef.current = Date.now() + durationMs;
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    console.log(`🔒 Saves blocked for ${durationMs}ms`);
  }, []);

  // Function to unblock saves after critical operations
  const unblockSaves = useCallback(() => {
    blockSaveUntilRef.current = Date.now();
    console.log('🔓 Saves unblocked');
  }, []);

  const forceSyncAfterTransaction = useCallback(async () => {
    if (currentUserId) {
      console.log('🔄 Forcing sync after transaction...');
      await syncGameStateFromBackend(currentUserId, true);
    }
  }, [currentUserId, syncGameStateFromBackend]);

  const submitWithdrawal = useCallback(async (transaction: Omit<Transaction, 'id' | 'status' | 'createdAt'>) => {
    // Create withdrawal via backend
    console.log('🟣 submitWithdrawal called with:', transaction);

    // CRITICAL: Block all saves for the entire withdrawal process
    blockSaveUntilRef.current = Date.now() + 15000; // 15 seconds
    console.log('🔒 Blocking saves for 15 seconds during withdrawal');

    // Cancel any pending auto-save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    // Determine currency and amount based on transaction type
    const isBVR = transaction.type === 'withdrawal_bvr';
    const currency = isBVR ? 'BVR' : 'USD';
    const amount = transaction.amount;

    // Prepare payload for backend
    const payload = {
      userId: transaction.userId,
      amount: amount,
      currency: currency,
      cryptoAddress: transaction.walletAddress,
      type: transaction.type,
      ...(transaction.flowersAmount !== undefined && { flowersAmount: transaction.flowersAmount }),
      ...(transaction.network && { network: transaction.network }),
      ...(transaction.usdAmount !== undefined && { usdAmount: transaction.usdAmount }),
      ...(transaction.fees !== undefined && { fees: transaction.fees }),
      ...(transaction.receivedAmount !== undefined && { receivedAmount: transaction.receivedAmount }),
      ...(transaction.userEmail && { userEmail: transaction.userEmail }),
    };
    console.log('🟣 Withdrawal payload to backend:', payload);

    const response = await transactionsAPI.createWithdrawal(payload);

    console.log('🟣 Backend response:', response);

    if (!response.success) {
      console.error('🟣 Backend returned success: false');
      throw new Error(response.message || 'Withdrawal submission failed');
    }

    // Update local state with backend response
    const newTransaction: Transaction = {
      ...transaction,
      id: response.transaction.id,
      status: 'pending',
      createdAt: response.transaction.createdAt,
    };
    setTransactions((current) => [newTransaction, ...current]);
    
    console.log('🟣 Syncing game state from backend...');
    // Sync game state to get updated balance (flowers or bvrCoins)
    if (currentUserId) {
      await new Promise(resolve => setTimeout(resolve, 200));
      await syncGameStateFromBackend(currentUserId, true);
    }
    console.log('🟣 Withdrawal complete, save block expires in 15s');
    
    return newTransaction;
  }, [currentUserId, syncGameStateFromBackend]);

  const approveTransaction = useCallback(async (transactionId: string) => {
    try {
      // CRITICAL: Block ALL saves for 5 seconds
      blockSaveUntilRef.current = Date.now() + 5000;
      console.log('🔒 Blocking saves for 5 seconds');
      
      // Cancel any pending auto-save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      
      // Call backend to approve transaction
      const response = await transactionsAPI.updateTransactionStatus(transactionId, 'completed', 'Approved by admin');
      
      if (response.success) {
        // Update local state
        setTransactions((current) =>
          current.map((txn) =>
            txn.id === transactionId
              ? {
                  ...txn,
                  status: 'approved' as TransactionStatus,
                  processedAt: new Date().toISOString(),
                }
              : txn
          )
        );
        
        // Refresh game state from backend with force=true to bypass debounce checks
        // This ensures we get the updated flowers/bvrCoins immediately
        if (currentUserId) {
          // Wait a brief moment for backend to fully process the approval
          await new Promise(resolve => setTimeout(resolve, 100));
          await syncGameStateFromBackend(currentUserId, true);
          console.log('🔓 Save block will expire in 5 seconds');
        }
      }
    } catch (error) {
      console.error('Transaction approval failed:', error);
      // Fallback to local-only
      setTransactions((current) =>
        current.map((txn) => {
          if (txn.id === transactionId && txn.status === 'pending') {
            if (txn.type === 'withdrawal_diamond') {
              setDiamonds((curr) => Math.max(0, curr - txn.amount));
            } else if (txn.type === 'withdrawal_bvr') {
              setBvrCoins((curr) => Math.max(0, curr - txn.amount));
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
    }
  }, [currentUserId, syncGameStateFromBackend]);

  const rejectTransaction = useCallback(async (transactionId: string) => {
    try {
      // CRITICAL: Block ALL saves for 5 seconds
      blockSaveUntilRef.current = Date.now() + 5000;
      console.log('🔒 Blocking saves for 5 seconds');
      
      // Cancel any pending auto-save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      
      // Call backend to reject transaction (will refund flowers if withdrawal)
      const response = await transactionsAPI.updateTransactionStatus(transactionId, 'cancelled', 'Rejected by admin');
      
      if (response.success) {
        // Update local state
        setTransactions((current) =>
          current.map((txn) =>
            txn.id === transactionId
              ? {
                  ...txn,
                  status: 'rejected' as TransactionStatus,
                  processedAt: new Date().toISOString(),
                }
              : txn
          )
        );
        
        // Refresh game state from backend with force=true to bypass debounce checks
        // This ensures we get the refunded flowers/bvrCoins immediately
        if (currentUserId) {
          // Wait a brief moment for backend to fully process the rejection/refund
          await new Promise(resolve => setTimeout(resolve, 100));
          await syncGameStateFromBackend(currentUserId, true);
          console.log('🔓 Save block will expire in 5 seconds');
        }
      }
    } catch (error) {
      console.error('Transaction rejection failed:', error);
      // Fallback to local-only
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
    }
  }, [currentUserId, syncGameStateFromBackend]);

  const getPendingTransactions = useCallback(async () => {
    try {
      // Fetch from backend instead of local state
      const response = await transactionsAPI.getPendingTransactions();
      if (response.success) {
        // Map backend transactions to frontend format
        return response.transactions.map(t => ({
          id: t.id,
          userId: t.userId,
          userEmail: t.userEmail,
          type: t.type as 'withdrawal_diamond' | 'withdrawal_bvr' | 'deposit_crypto',
          amount: t.amount,
          network: t.currency || 'USD',
          walletAddress: t.cryptoAddress || t.address || '',
          status: 'pending' as TransactionStatus,
          createdAt: t.createdAt,
          usdAmount: t.amount
        }));
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch pending transactions:', error);
      // Fallback to local state
      return transactions.filter((txn) => txn.status === 'pending');
    }
  }, [transactions]);

  const getLeaderboard = useCallback(() => {
    return allUsersLeaderboard;
  }, [allUsersLeaderboard]);

  const getCurrentUserRank = useCallback(() => {
    const userIndex = allUsersLeaderboard.findIndex((user) => user.userId === referralCode);
    return userIndex !== -1 ? userIndex + 1 : null;
  }, [allUsersLeaderboard, referralCode]);

  // Manual refresh function for pull-to-refresh
  const refreshGameState = useCallback(async () => {
    if (currentUserId) {
      await syncGameStateFromBackend(currentUserId);
    }
  }, [currentUserId, syncGameStateFromBackend]);

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
    spinRoulette,
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
    exchangeResource,
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
    refreshGameState, // Manual refresh for cross-device sync
    blockSaves, // Block auto-saves before critical operations
    unblockSaves, // Unblock saves after critical operations
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
    refreshGameState,
    blockSaves,
    unblockSaves,
  ]);
});
