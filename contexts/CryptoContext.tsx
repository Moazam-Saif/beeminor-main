import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';

type CryptoPrices = {
  sol: number;
  ton: number;
};

const BINANCE_API = 'https://api.binance.com/api/v3/ticker/price';
const REFRESH_INTERVAL = 60000;
const MAX_RETRIES = 1;
const RETRY_DELAY = 2000;

export const [CryptoProvider, useCrypto] = createContextHook(() => {
  const [prices, setPrices] = useState<CryptoPrices>({
    sol: 150,
    ton: 5,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  const fetchFromBinance = async (): Promise<CryptoPrices | null> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const [solResponse, tonResponse] = await Promise.all([
        fetch(`${BINANCE_API}?symbol=SOLUSDT`, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' },
        }),
        fetch(`${BINANCE_API}?symbol=TONUSDT`, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' },
        }),
      ]);
      
      clearTimeout(timeoutId);

      if (!solResponse.ok || !tonResponse.ok) {
        return null;
      }

      const [solData, tonData] = await Promise.all([
        solResponse.json(),
        tonResponse.json(),
      ]);

      return {
        sol: parseFloat(solData.price),
        ton: parseFloat(tonData.price),
      };
    } catch {
      return null;
    }
  };



  const fetchPrices = useCallback(async (retryAttempt: number = 0) => {
    if (Platform.OS === 'web') {
      if (retryAttempt === 0) {
        setIsLoading(true);
      }
      setPrices({
        sol: 150,
        ton: 5,
      });
      setLastUpdated(new Date());
      setIsLoading(false);
      return;
    }

    if (retryAttempt === 0) {
      setIsLoading(true);
      setError(null);
    }
    
    try {
      const newPrices = await fetchFromBinance();

      if (newPrices && newPrices.sol > 0 && newPrices.ton > 0) {
        setPrices(newPrices);
        setLastUpdated(new Date());
        setRetryCount(0);
        setError(null);
      } else {
        throw new Error('Failed to fetch prices');
      }
    } catch {
      if (retryAttempt < MAX_RETRIES) {
        setRetryCount(retryAttempt + 1);
        setTimeout(() => {
          fetchPrices(retryAttempt + 1);
        }, RETRY_DELAY);
      } else {
        setError(null);
      }
    } finally {
      if (retryAttempt === 0 || retryAttempt >= MAX_RETRIES) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    
    const interval = setInterval(() => {
      fetchPrices();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchPrices]);

  return useMemo(() => ({
    prices,
    isLoading,
    lastUpdated,
    error,
    retryCount,
    refreshPrices: fetchPrices,
  }), [prices, isLoading, lastUpdated, error, retryCount, fetchPrices]);
});
