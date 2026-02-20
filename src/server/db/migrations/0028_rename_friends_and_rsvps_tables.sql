DO $$
BEGIN
  IF to_regclass('public.rsvps') IS NOT NULL THEN
    ALTER TABLE "rsvps" RENAME TO "event_rsvps";
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.friends') IS NOT NULL THEN
    ALTER TABLE "friends" RENAME TO "user_friends";
  END IF;
END $$;
