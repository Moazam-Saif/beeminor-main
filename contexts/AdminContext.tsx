import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback, useMemo } from 'react';

type AdminSession = {
  isAuthenticated: boolean;
  lastLogin: string;
  adminPin?: string;
};

type CryptoAddresses = {
  tonAddress: string;
  solanaAddress: string;
};

const STORAGE_KEY = 'admin_session';
const ADMIN_CREDENTIALS_KEY = 'admin_credentials';
const CRYPTO_ADDRESSES_KEY = 'crypto_addresses';
const ADMIN_EMAIL = 'martinremy100@gmail.com';
const DEFAULT_ADMIN_PIN = '123456';

export const [AdminProvider, useAdmin] = createContextHook(() => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [adminPin, setAdminPin] = useState<string>(DEFAULT_ADMIN_PIN);
  const [tonAddress, setTonAddress] = useState<string>('');
  const [solanaAddress, setSolanaAddress] = useState<string>('');

  useEffect(() => {
    loadCredentials();
    loadSession();
    loadCryptoAddresses();
  }, []);

  const loadCredentials = async () => {
    try {
      const stored = await AsyncStorage.getItem(ADMIN_CREDENTIALS_KEY);
      if (stored) {
        const credentials = JSON.parse(stored);
        setAdminPin(credentials.pin || DEFAULT_ADMIN_PIN);
      }
    } catch (error) {
      console.error('Failed to load admin credentials:', error);
    }
  };

  const loadSession = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const session: AdminSession = JSON.parse(stored);
        const lastLogin = new Date(session.lastLogin);
        const now = new Date();
        const hoursSinceLogin = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceLogin < 24 && session.isAuthenticated) {
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      console.error('Failed to load admin session:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const login = useCallback(async (email: string, pin: string) => {
    if (email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase() && pin === adminPin) {
      const session: AdminSession = {
        isAuthenticated: true,
        lastLogin: new Date().toISOString(),
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      setIsAuthenticated(true);
      return true;
    }
    return false;
  }, [adminPin]);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setIsAuthenticated(false);
  }, []);

  const changePassword = useCallback(async (oldPin: string, newPin: string) => {
    if (oldPin !== adminPin) {
      return { success: false, error: 'Ancien code PIN incorrect' };
    }

    if (newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
      return { success: false, error: 'Le nouveau code PIN doit contenir exactement 6 chiffres' };
    }

    try {
      const credentials = { pin: newPin };
      await AsyncStorage.setItem(ADMIN_CREDENTIALS_KEY, JSON.stringify(credentials));
      setAdminPin(newPin);
      return { success: true };
    } catch (error) {
      console.error('Failed to change password:', error);
      return { success: false, error: 'Erreur lors du changement de mot de passe' };
    }
  }, [adminPin]);

  const loadCryptoAddresses = async () => {
    try {
      const stored = await AsyncStorage.getItem(CRYPTO_ADDRESSES_KEY);
      if (stored) {
        const addresses: CryptoAddresses = JSON.parse(stored);
        setTonAddress(addresses.tonAddress || '');
        setSolanaAddress(addresses.solanaAddress || '');
      }
    } catch (error) {
      console.error('Failed to load crypto addresses:', error);
    }
  };

  const updateCryptoAddresses = useCallback(async (ton: string, solana: string) => {
    try {
      const addresses: CryptoAddresses = {
        tonAddress: ton,
        solanaAddress: solana,
      };
      await AsyncStorage.setItem(CRYPTO_ADDRESSES_KEY, JSON.stringify(addresses));
      setTonAddress(ton);
      setSolanaAddress(solana);
      return { success: true };
    } catch (error) {
      console.error('Failed to update crypto addresses:', error);
      return { success: false, error: 'Erreur lors de la mise à jour des adresses' };
    }
  }, []);

  return useMemo(() => ({
    isAuthenticated,
    isLoaded,
    login,
    logout,
    changePassword,
    tonAddress,
    solanaAddress,
    updateCryptoAddresses,
  }), [isAuthenticated, isLoaded, login, logout, changePassword, tonAddress, solanaAddress, updateCryptoAddresses]);
});
