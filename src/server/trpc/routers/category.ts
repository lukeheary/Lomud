import { router, publicProcedure } from "../init";
import { listCategoryOptions } from "@/server/utils/categories";

export const categoryRouter = router({
  listActive: publicProcedure.query(async ({ ctx }) => {
    return await listCategoryOptions(ctx.db);
  }),
});
