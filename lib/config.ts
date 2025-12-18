/**
 * Centralized configuration for API endpoints
 */

export const getApiBaseUrl = (): string => {
  // Priority 1: Check environment variable
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  
  if (envUrl && envUrl.trim() !== '') {
    // Remove trailing slash
    return envUrl.replace(/\/$/, '');
  }

  // Priority 2: Check if running in production mode
  const isDev = process.env.NODE_ENV !== 'production';
  
  if (isDev) {
    // Local development
    return 'http://localhost:3001';
  }

  // Priority 3: Production fallback
  // IMPORTANT: Update this with your actual production backend URL
  return 'https://beeminor-main-production-b904.up.railway.app';
};

export const API_BASE_URL = getApiBaseUrl();
