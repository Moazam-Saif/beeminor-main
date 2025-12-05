import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { supportAPI } from '../lib/api';

type AdminSession = {
  isAuthenticated: boolean;
  lastLogin: string;
  adminPin?: string;
};

type CryptoAddresses = {
  tonAddress: string;
  solanaAddress: string;
};

export type SupportMessage = {
  id: string;
  subject: string;
  message: string;
  userEmail: string;
  createdAt: string;
  read: boolean;
};

const STORAGE_KEY = 'admin_session';
const ADMIN_CREDENTIALS_KEY = 'admin_credentials';
const CRYPTO_ADDRESSES_KEY = 'crypto_addresses';
const SUPPORT_MESSAGES_KEY = 'support_messages';
const SUPPORT_EMAIL_KEY = 'support_email';
const ADMIN_EMAIL = 'martinremy100@gmail.com';
const DEFAULT_ADMIN_PIN = '123456';

export const [AdminProvider, useAdmin] = createContextHook(() => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [adminPin, setAdminPin] = useState<string>(DEFAULT_ADMIN_PIN);
  const [tonAddress, setTonAddress] = useState<string>('');
  const [solanaAddress, setSolanaAddress] = useState<string>('');
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [supportEmail, setSupportEmail] = useState<string>('support@beegame.app');

  useEffect(() => {
    loadCredentials();
    loadSession();
    loadCryptoAddresses();
    loadSupportMessages();
    loadSupportEmail();
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

  const loadSupportMessages = async () => {
    try {
      // Try to load from backend first
      const response = await supportAPI.getAllMessages();
      if (response.success && response.messages) {
        setSupportMessages(response.messages);
        // Cache in localStorage as backup
        await AsyncStorage.setItem(SUPPORT_MESSAGES_KEY, JSON.stringify(response.messages));
      }
    } catch (error) {
      console.error('Failed to load support messages from backend, trying local storage:', error);
      // Fallback to local storage if backend fails
      try {
        const stored = await AsyncStorage.getItem(SUPPORT_MESSAGES_KEY);
        if (stored) {
          const messages: SupportMessage[] = JSON.parse(stored);
          setSupportMessages(messages);
        }
      } catch (localError) {
        console.error('Failed to load support messages from local storage:', localError);
      }
    }
  };

  const loadSupportEmail = async () => {
    try {
      const stored = await AsyncStorage.getItem(SUPPORT_EMAIL_KEY);
      if (stored) {
        setSupportEmail(stored);
      }
    } catch (error) {
      console.error('Failed to load support email:', error);
    }
  };

  const addSupportMessage = useCallback(async (subject: string, message: string, userEmail: string, userId?: string) => {
    try {
      // Send to backend
      const response = await supportAPI.sendMessage(subject, message, userEmail, userId);
      
      if (response.success) {
        // Reload messages from backend to get updated list
        await loadSupportMessages();
        return { success: true };
      } else {
        throw new Error('Backend API returned error');
      }
    } catch (error) {
      console.error('Failed to send support message to backend, saving locally:', error);
      // Fallback to local storage if backend fails
      try {
        const newMessage: SupportMessage = {
          id: Date.now().toString(),
          subject,
          message,
          userEmail,
          createdAt: new Date().toISOString(),
          read: false,
        };
        const updatedMessages = [newMessage, ...supportMessages];
        await AsyncStorage.setItem(SUPPORT_MESSAGES_KEY, JSON.stringify(updatedMessages));
        setSupportMessages(updatedMessages);
        return { success: true };
      } catch (localError) {
        console.error('Failed to save message locally:', localError);
        return { success: false };
      }
    }
  }, [supportMessages]);

  const markMessageAsRead = useCallback(async (messageId: string) => {
    try {
      // Update on backend
      const response = await supportAPI.markAsRead(messageId);
      
      if (response.success) {
        // Update local state
        const updatedMessages = supportMessages.map((msg) =>
          msg.id === messageId ? { ...msg, read: true } : msg
        );
        setSupportMessages(updatedMessages);
        await AsyncStorage.setItem(SUPPORT_MESSAGES_KEY, JSON.stringify(updatedMessages));
        return { success: true };
      } else {
        throw new Error('Backend API returned error');
      }
    } catch (error) {
      console.error('Failed to mark message as read on backend, updating locally:', error);
      // Fallback to local update
      try {
        const updatedMessages = supportMessages.map((msg) =>
          msg.id === messageId ? { ...msg, read: true } : msg
        );
        await AsyncStorage.setItem(SUPPORT_MESSAGES_KEY, JSON.stringify(updatedMessages));
        setSupportMessages(updatedMessages);
        return { success: true };
      } catch (localError) {
        console.error('Failed to update locally:', localError);
        return { success: false };
      }
    }
  }, [supportMessages]);

  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      // Delete on backend
      const response = await supportAPI.deleteMessage(messageId);
      
      if (response.success) {
        // Update local state
        const updatedMessages = supportMessages.filter((msg) => msg.id !== messageId);
        setSupportMessages(updatedMessages);
        await AsyncStorage.setItem(SUPPORT_MESSAGES_KEY, JSON.stringify(updatedMessages));
        return { success: true };
      } else {
        throw new Error('Backend API returned error');
      }
    } catch (error) {
      console.error('Failed to delete message on backend, deleting locally:', error);
      // Fallback to local delete
      try {
        const updatedMessages = supportMessages.filter((msg) => msg.id !== messageId);
        await AsyncStorage.setItem(SUPPORT_MESSAGES_KEY, JSON.stringify(updatedMessages));
        setSupportMessages(updatedMessages);
        return { success: true };
      } catch (localError) {
        console.error('Failed to delete locally:', localError);
        return { success: false };
      }
    }
  }, [supportMessages]);

  const updateSupportEmail = useCallback(async (email: string) => {
    try {
      await AsyncStorage.setItem(SUPPORT_EMAIL_KEY, email);
      setSupportEmail(email);
      return { success: true };
    } catch (error) {
      console.error('Failed to update support email:', error);
      return { success: false, error: 'Erreur lors de la mise à jour de l\'email' };
    }
  }, []);

  const refreshMessages = useCallback(async () => {
    await loadSupportMessages();
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
    supportMessages,
    supportEmail,
    addSupportMessage,
    markMessageAsRead,
    deleteMessage,
    updateSupportEmail,
    refreshMessages,
  }), [isAuthenticated, isLoaded, login, logout, changePassword, tonAddress, solanaAddress, updateCryptoAddresses, supportMessages, supportEmail, addSupportMessage, markMessageAsRead, deleteMessage, updateSupportEmail, refreshMessages]);
});
