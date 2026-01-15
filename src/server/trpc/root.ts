import { router } from "./init";
import { businessRouter } from "./routers/business";
import { venueRouter } from "./routers/venue";
import { organizerRouter } from "./routers/organizer";
import { adminRouter } from "./routers/admin";
import { eventRouter } from "./routers/event";
import { friendsRouter } from "./routers/friends";
import { userRouter } from "./routers/user";

export const appRouter = router({
  business: businessRouter,
  venue: venueRouter,
  organizer: organizerRouter,
  admin: adminRouter,
  event: eventRouter,
  friends: friendsRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
