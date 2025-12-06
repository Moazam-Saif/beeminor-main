import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "../backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  // Check for explicit environment variable
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  
  if (envUrl && (envUrl.startsWith('http://') || envUrl.startsWith('https://'))) {
    // Valid absolute URL - remove trailing slash
    return envUrl.replace(/\/$/, '');
  }

  // Default to localhost for local development
  // You can override this by setting EXPO_PUBLIC_API_BASE_URL in your .env file
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev) {
    return "http://localhost:3001";
  }

  // In production web, if window exists, we might be in a browser
  if (typeof window !== 'undefined') {
    console.error('tRPC Base URL not found or invalid:', envUrl);
    console.error('Make sure EXPO_PUBLIC_API_BASE_URL is set in Netlify dashboard');
  }

  throw new Error(
    "No base url found, please set EXPO_PUBLIC_API_BASE_URL"
  );
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
    }),
  ],
});
