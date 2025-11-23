import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback, useMemo } from 'react';

export type User = {
  id: string;
  email: string;
  password: string;
  createdAt: string;
  referralCode: string;
  sponsorCode?: string;
};

export type PasswordResetRequest = {
  email: string;
  code: string;
  expiresAt: string;
};

type AuthState = {
  currentUser: User | null;
  users: User[];
  passwordResetRequests?: PasswordResetRequest[];
};

const STORAGE_KEY = 'auth_state';
const DEV_SPONSOR_CODE = 'DEV_PARENT';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [passwordResetRequests, setPasswordResetRequests] = useState<PasswordResetRequest[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    loadAuthState();
  }, []);

  const generateReferralCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const loadAuthState = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const state: AuthState = JSON.parse(stored);
        setCurrentUser(state.currentUser);
        setUsers(state.users || []);
        setPasswordResetRequests(state.passwordResetRequests || []);
      }
    } catch (error) {
      console.error('Failed to load auth state:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const saveAuthState = useCallback(async (user: User | null, allUsers: User[], resetRequests: PasswordResetRequest[]) => {
    try {
      const state: AuthState = {
        currentUser: user,
        users: allUsers,
        passwordResetRequests: resetRequests,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save auth state:', error);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, sponsorCode?: string) => {
    const emailLower = email.toLowerCase().trim();
    
    const existingUser = users.find((u) => u.email.toLowerCase() === emailLower);
    if (existingUser) {
      return { success: false, error: 'Email already registered' };
    }

    const newUser: User = {
      id: `user_${Date.now()}`,
      email: emailLower,
      password,
      createdAt: new Date().toISOString(),
      referralCode: generateReferralCode(),
      sponsorCode: sponsorCode || DEV_SPONSOR_CODE,
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    setCurrentUser(newUser);
    await saveAuthState(newUser, updatedUsers, passwordResetRequests);

    return { success: true, user: newUser };
  }, [users, passwordResetRequests, saveAuthState]);

  const login = useCallback(async (email: string, password: string) => {
    const emailLower = email.toLowerCase().trim();
    const user = users.find((u) => u.email.toLowerCase() === emailLower && u.password === password);
    
    if (user) {
      setCurrentUser(user);
      await saveAuthState(user, users, passwordResetRequests);
      return { success: true, user };
    }
    
    return { success: false, error: 'Invalid email or password' };
  }, [users, passwordResetRequests, saveAuthState]);

  const logout = useCallback(async () => {
    setCurrentUser(null);
    await saveAuthState(null, users, passwordResetRequests);
  }, [users, passwordResetRequests, saveAuthState]);

  const generateResetCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const requestPasswordReset = useCallback(async (email: string) => {
    const emailLower = email.toLowerCase().trim();
    const user = users.find((u) => u.email.toLowerCase() === emailLower);
    
    if (!user) {
      return { success: false, error: 'Aucun compte trouvé avec cet email' };
    }

    const resetCode = generateResetCode();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    const newRequest: PasswordResetRequest = {
      email: emailLower,
      code: resetCode,
      expiresAt: expiresAt.toISOString(),
    };

    const updatedRequests = passwordResetRequests.filter(
      (r) => r.email !== emailLower
    );
    updatedRequests.push(newRequest);
    setPasswordResetRequests(updatedRequests);
    await saveAuthState(currentUser, users, updatedRequests);

    console.log(`\n[RESET PASSWORD] Email would be sent to: ${email}`);
    console.log(`[RESET PASSWORD] Reset code: ${resetCode}`);
    console.log(`[RESET PASSWORD] Expires at: ${expiresAt.toLocaleString()}\n`);

    return { success: true, code: resetCode };
  }, [users, passwordResetRequests, currentUser, saveAuthState]);

  const resetPassword = useCallback(async (email: string, code: string, newPassword: string) => {
    const emailLower = email.toLowerCase().trim();
    const request = passwordResetRequests.find(
      (r) => r.email === emailLower && r.code === code
    );

    if (!request) {
      return { success: false, error: 'Code de réinitialisation invalide' };
    }

    const now = new Date();
    const expiresAt = new Date(request.expiresAt);
    if (now > expiresAt) {
      return { success: false, error: 'Le code de réinitialisation a expiré' };
    }

    const userIndex = users.findIndex((u) => u.email.toLowerCase() === emailLower);
    if (userIndex === -1) {
      return { success: false, error: 'Utilisateur non trouvé' };
    }

    const updatedUsers = [...users];
    updatedUsers[userIndex] = { ...updatedUsers[userIndex], password: newPassword };
    setUsers(updatedUsers);

    const updatedRequests = passwordResetRequests.filter(
      (r) => r.email !== emailLower
    );
    setPasswordResetRequests(updatedRequests);

    await saveAuthState(currentUser, updatedUsers, updatedRequests);

    return { success: true };
  }, [users, passwordResetRequests, currentUser, saveAuthState]);

  useEffect(() => {
    if (isLoaded) {
      saveAuthState(currentUser, users, passwordResetRequests);
    }
  }, [currentUser, users, passwordResetRequests, isLoaded, saveAuthState]);

  return useMemo(() => ({
    currentUser,
    users,
    isLoaded,
    register,
    login,
    logout,
    requestPasswordReset,
    resetPassword,
    isAuthenticated: currentUser !== null,
  }), [currentUser, users, isLoaded, register, login, logout, requestPasswordReset, resetPassword]);
});
