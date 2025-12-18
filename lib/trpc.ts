import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "../backend/trpc/app-router";
import superjson from "superjson";
import { API_BASE_URL } from './config';

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${API_BASE_URL}/api/trpc`,
      transformer: superjson,
    }),
  ],
});
