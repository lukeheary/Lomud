import { type FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { auth } from "@clerk/nextjs/server";
import { db } from "../db";

export async function createContext(opts?: FetchCreateContextFnOptions) {
  const authObj = await auth();

  return {
    auth: authObj,
    db,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
