import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  index,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";

// ============================================================================
// ENUMS
// ============================================================================

export const eventCategoryEnum = pgEnum("event_category", [
  "music",
  "food",
  "art",
  "sports",
  "community",
  "nightlife",
  "other",
]);

export const eventVisibilityEnum = pgEnum("event_visibility", [
  "public",
  "private",
]);

export const rsvpStatusEnum = pgEnum("rsvp_status", [
  "going",
  "interested",
  "not_going",
]);

export const friendStatusEnum = pgEnum("friend_status", [
  "pending",
  "accepted",
]);

export const userRoleEnum = pgEnum("user_role", [
  "user",
  "admin",
]);

// ============================================================================
// USERS TABLE
// ============================================================================
// Synced from Clerk via webhooks
export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(), // Clerk user ID
    email: varchar("email", { length: 255 }).notNull(),
    username: varchar("username", { length: 50 }).notNull().unique(),
    firstName: varchar("first_name", { length: 100 }),
    lastName: varchar("last_name", { length: 100 }),
    imageUrl: text("image_url"),
    city: varchar("city", { length: 100 }),
    state: varchar("state", { length: 2 }),
    role: userRoleEnum("role").notNull().default("user"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
    usernameIdx: uniqueIndex("users_username_idx").on(table.username),
  })
);

export const usersRelations = relations(users, ({ many }) => ({
  businesses: many(businesses),
  follows: many(follows),
  rsvps: many(rsvps),
  sentFriendRequests: many(friends, { relationName: "sentRequests" }),
  receivedFriendRequests: many(friends, { relationName: "receivedRequests" }),
}));

// ============================================================================
// BUSINESSES TABLE
// ============================================================================
export const businesses = pgTable(
  "businesses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    imageUrl: text("image_url"),
    address: text("address"),
    city: varchar("city", { length: 100 }).notNull(),
    state: varchar("state", { length: 2 }).notNull(), // US state code
    website: text("website"),
    instagram: varchar("instagram", { length: 100 }),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex("businesses_slug_idx").on(table.slug),
    locationIdx: index("businesses_location_idx").on(table.city, table.state),
    createdByIdx: index("businesses_created_by_idx").on(table.createdByUserId),
  })
);

export const businessesRelations = relations(businesses, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [businesses.createdByUserId],
    references: [users.id],
  }),
  events: many(events),
  follows: many(follows),
}));

// ============================================================================
// FOLLOWS TABLE
// ============================================================================
export const follows = pgTable(
  "follows",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userBusinessIdx: uniqueIndex("follows_user_business_idx").on(
      table.userId,
      table.businessId
    ),
    userIdx: index("follows_user_idx").on(table.userId),
    businessIdx: index("follows_business_idx").on(table.businessId),
  })
);

export const followsRelations = relations(follows, ({ one }) => ({
  user: one(users, {
    fields: [follows.userId],
    references: [users.id],
  }),
  business: one(businesses, {
    fields: [follows.businessId],
    references: [businesses.id],
  }),
}));

// ============================================================================
// EVENTS TABLE
// ============================================================================
export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id").references(() => businesses.id, {
      onDelete: "set null",
    }),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    imageUrl: text("image_url"),
    startAt: timestamp("start_at").notNull(),
    endAt: timestamp("end_at"),
    venueName: varchar("venue_name", { length: 255 }),
    address: text("address"),
    city: varchar("city", { length: 100 }).notNull(),
    state: varchar("state", { length: 2 }).notNull(),
    category: eventCategoryEnum("category").notNull().default("other"),
    visibility: eventVisibilityEnum("visibility").notNull().default("public"),
    externalId: text("external_id"),
    sourceUrl: text("source_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    businessIdx: index("events_business_idx").on(table.businessId),
    startAtIdx: index("events_start_at_idx").on(table.startAt),
    locationIdx: index("events_location_idx").on(table.city, table.state),
    categoryIdx: index("events_category_idx").on(table.category),
    visibilityIdx: index("events_visibility_idx").on(table.visibility),
    // Composite index for common query pattern
    startVisibilityIdx: index("events_start_visibility_idx").on(
      table.startAt,
      table.visibility
    ),
    sourceExternalIdx: uniqueIndex("events_source_external_idx").on(
      table.sourceUrl,
      table.externalId
    ),
  })
);

export const eventsRelations = relations(events, ({ one, many }) => ({
  business: one(businesses, {
    fields: [events.businessId],
    references: [businesses.id],
  }),
  createdBy: one(users, {
    fields: [events.createdByUserId],
    references: [users.id],
  }),
  rsvps: many(rsvps),
}));

// ============================================================================
// RSVPS TABLE
// ============================================================================
export const rsvps = pgTable(
  "rsvps",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    status: rsvpStatusEnum("status").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userEventIdx: uniqueIndex("rsvps_user_event_idx").on(
      table.userId,
      table.eventId
    ),
    eventStatusIdx: index("rsvps_event_status_idx").on(
      table.eventId,
      table.status
    ),
    userIdx: index("rsvps_user_idx").on(table.userId),
  })
);

export const rsvpsRelations = relations(rsvps, ({ one }) => ({
  user: one(users, {
    fields: [rsvps.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [rsvps.eventId],
    references: [events.id],
  }),
}));

// ============================================================================
// FRIENDS TABLE
// ============================================================================
export const friends = pgTable(
  "friends",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    friendUserId: text("friend_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: friendStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userFriendIdx: uniqueIndex("friends_user_friend_idx").on(
      table.userId,
      table.friendUserId
    ),
    // Ensure no reverse duplicates (A->B and B->A)
    friendUserIdx: uniqueIndex("friends_friend_user_idx").on(
      table.friendUserId,
      table.userId
    ),
    userStatusIdx: index("friends_user_status_idx").on(
      table.userId,
      table.status
    ),
    friendUserStatusIdx: index("friends_friend_user_status_idx").on(
      table.friendUserId,
      table.status
    ),
  })
);

export const friendsRelations = relations(friends, ({ one }) => ({
  user: one(users, {
    fields: [friends.userId],
    references: [users.id],
    relationName: "sentRequests",
  }),
  friend: one(users, {
    fields: [friends.friendUserId],
    references: [users.id],
    relationName: "receivedRequests",
  }),
}));
