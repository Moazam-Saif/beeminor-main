import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "../backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  // Check for explicit environment variable
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }

  // Default to localhost for local development
  // You can override this by setting EXPO_PUBLIC_API_BASE_URL in your .env file
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev) {
    return "http://localhost:3001";
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
