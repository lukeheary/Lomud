import { createTRPCReact } from "@trpc/react-query";
import { type AppRouter } from "@/server/trpc/root";
import { type inferRouterOutputs } from "@trpc/server";

export const trpc = createTRPCReact<AppRouter>();

// Export RouterOutputs type for easy access throughout the app
export type RouterOutputs = inferRouterOutputs<AppRouter>;
