import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { GameProvider } from '../contexts/GameContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { AdminProvider } from '../contexts/AdminContext';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { CryptoProvider } from '../contexts/CryptoContext';
import { trpc, trpcClient } from '../lib/trpc';
import { AuthGameBridge } from '../components/AuthGameBridge';

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isAuthenticated, isLoaded } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [navigationReady, setNavigationReady] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/auth');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)/(home)');
    }
    
    setNavigationReady(true);
  }, [isAuthenticated, isLoaded, segments, router]);

  useEffect(() => {
    if (navigationReady && isLoaded) {
      setTimeout(() => {
        SplashScreen.hideAsync().catch(() => {});
      }, 100);
    }
  }, [navigationReady, isLoaded]);

  if (!isLoaded || !navigationReady) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <LanguageProvider>
            <AuthProvider>
              <CryptoProvider>
                <GameProvider>
                  <AuthGameBridge />
                  <AdminProvider>
                    <RootLayoutNav />
                  </AdminProvider>
                </GameProvider>
              </CryptoProvider>
            </AuthProvider>
          </LanguageProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
