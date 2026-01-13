import { router } from "./init";
import { businessRouter } from "./routers/business";
import { eventRouter } from "./routers/event";
import { friendsRouter } from "./routers/friends";
import { userRouter } from "./routers/user";

export const appRouter = router({
  business: businessRouter,
  event: eventRouter,
  friends: friendsRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
