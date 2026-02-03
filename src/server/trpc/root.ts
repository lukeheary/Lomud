import { router } from "./init";
import { placeRouter } from "./routers/place";
import { adminRouter } from "./routers/admin";
import { eventRouter } from "./routers/event";
import { friendsRouter } from "./routers/friends";
import { userRouter } from "./routers/user";

export const appRouter = router({
  place: placeRouter,
  admin: adminRouter,
  event: eventRouter,
  friends: friendsRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
