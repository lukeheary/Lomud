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
  jsonb,
  doublePrecision,
  boolean,
} from "drizzle-orm/pg-core";

// ============================================================================
// ENUMS
// ============================================================================

// Categories are now stored as jsonb arrays - see src/lib/categories.ts for the list

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

export const genderEnum = pgEnum("gender", [
  "male",
  "female",
  "other",
]);

export const activityTypeEnum = pgEnum("activity_type", [
  "rsvp_going",
  "rsvp_interested",
  "follow_venue",
  "follow_organizer",
  "created_event",
  "checked_in",
]);

export const activityEntityTypeEnum = pgEnum("activity_entity_type", [
  "event",
  "venue",
  "organizer",
  "user",
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
    gender: genderEnum("gender"),
    role: userRoleEnum("role").notNull().default("user"),
    isOnboarding: boolean("is_onboarding").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
    usernameIdx: uniqueIndex("users_username_idx").on(table.username),
  })
);

export const usersRelations = relations(users, ({ many }) => ({
  follows: many(follows),
  venueMembers: many(venueMembers),
  organizerMembers: many(organizerMembers),
  venueFollows: many(venueFollows),
  organizerFollows: many(organizerFollows),
  rsvps: many(rsvps),
  sentFriendRequests: many(friends, { relationName: "sentRequests" }),
  receivedFriendRequests: many(friends, { relationName: "receivedRequests" }),
  activities: many(activityEvents),
}));

// ============================================================================
// VENUES TABLE
// ============================================================================
export const venues = pgTable(
  "venues",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    imageUrl: text("image_url"),
    address: text("address"),
    city: varchar("city", { length: 100 }).notNull(),
    state: varchar("state", { length: 2 }).notNull(),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    website: text("website"),
    instagram: varchar("instagram", { length: 100 }),
    hours: jsonb("hours"), // Store hours as: { monday: { open: "09:00", close: "17:00", closed: false }, ... }
    categories: jsonb("categories").$type<string[]>().default([]),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex("venues_slug_idx").on(table.slug),
    locationIdx: index("venues_location_idx").on(table.city, table.state),
  })
);

export const venuesRelations = relations(venues, ({ many }) => ({
  members: many(venueMembers),
  events: many(events),
  follows: many(venueFollows),
}));

// ============================================================================
// ORGANIZERS TABLE
// ============================================================================
export const organizers = pgTable(
  "organizers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    imageUrl: text("image_url"),
    city: varchar("city", { length: 100 }),
    state: varchar("state", { length: 2 }),
    website: text("website"),
    instagram: varchar("instagram", { length: 100 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex("organizers_slug_idx").on(table.slug),
    locationIdx: index("organizers_location_idx").on(table.city, table.state),
  })
);

export const organizersRelations = relations(organizers, ({ many }) => ({
  members: many(organizerMembers),
  events: many(events),
  follows: many(organizerFollows),
}));

// ============================================================================
// VENUE MEMBERS TABLE
// ============================================================================
export const venueMembers = pgTable(
  "venue_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    venueId: uuid("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userVenueIdx: uniqueIndex("venue_members_user_venue_idx").on(
      table.userId,
      table.venueId
    ),
    userIdx: index("venue_members_user_idx").on(table.userId),
    venueIdx: index("venue_members_venue_idx").on(table.venueId),
  })
);

export const venueMembersRelations = relations(venueMembers, ({ one }) => ({
  user: one(users, {
    fields: [venueMembers.userId],
    references: [users.id],
  }),
  venue: one(venues, {
    fields: [venueMembers.venueId],
    references: [venues.id],
  }),
}));

// ============================================================================
// ORGANIZER MEMBERS TABLE
// ============================================================================
export const organizerMembers = pgTable(
  "organizer_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    organizerId: uuid("organizer_id")
      .notNull()
      .references(() => organizers.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userOrganizerIdx: uniqueIndex("organizer_members_user_organizer_idx").on(
      table.userId,
      table.organizerId
    ),
    userIdx: index("organizer_members_user_idx").on(table.userId),
    organizerIdx: index("organizer_members_organizer_idx").on(table.organizerId),
  })
);

export const organizerMembersRelations = relations(
  organizerMembers,
  ({ one }) => ({
    user: one(users, {
      fields: [organizerMembers.userId],
      references: [users.id],
    }),
    organizer: one(organizers, {
      fields: [organizerMembers.organizerId],
      references: [organizers.id],
    }),
  })
);

// ============================================================================
// VENUE FOLLOWS TABLE
// ============================================================================
export const venueFollows = pgTable(
  "venue_follows",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    venueId: uuid("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userVenueIdx: uniqueIndex("venue_follows_user_venue_idx").on(
      table.userId,
      table.venueId
    ),
    userIdx: index("venue_follows_user_idx").on(table.userId),
    venueIdx: index("venue_follows_venue_idx").on(table.venueId),
  })
);

export const venueFollowsRelations = relations(venueFollows, ({ one }) => ({
  user: one(users, {
    fields: [venueFollows.userId],
    references: [users.id],
  }),
  venue: one(venues, {
    fields: [venueFollows.venueId],
    references: [venues.id],
  }),
}));

// ============================================================================
// ORGANIZER FOLLOWS TABLE
// ============================================================================
export const organizerFollows = pgTable(
  "organizer_follows",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    organizerId: uuid("organizer_id")
      .notNull()
      .references(() => organizers.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userOrganizerIdx: uniqueIndex("organizer_follows_user_organizer_idx").on(
      table.userId,
      table.organizerId
    ),
    userIdx: index("organizer_follows_user_idx").on(table.userId),
    organizerIdx: index("organizer_follows_organizer_idx").on(table.organizerId),
  })
);

export const organizerFollowsRelations = relations(
  organizerFollows,
  ({ one }) => ({
    user: one(users, {
      fields: [organizerFollows.userId],
      references: [users.id],
    }),
    organizer: one(organizers, {
      fields: [organizerFollows.organizerId],
      references: [organizers.id],
    }),
  })
);

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
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("follows_user_idx").on(table.userId),
  })
);

export const followsRelations = relations(follows, ({ one }) => ({
  user: one(users, {
    fields: [follows.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// EVENTS TABLE
// ============================================================================
export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    venueId: uuid("venue_id").references(() => venues.id, {
      onDelete: "set null",
    }),
    organizerId: uuid("organizer_id").references(() => organizers.id, {
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
    categories: jsonb("categories").$type<string[]>().default([]),
    visibility: eventVisibilityEnum("visibility").notNull().default("public"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    venueIdx: index("events_venue_idx").on(table.venueId),
    organizerIdx: index("events_organizer_idx").on(table.organizerId),
    startAtIdx: index("events_start_at_idx").on(table.startAt),
    locationIdx: index("events_location_idx").on(table.city, table.state),
    // Categories now use GIN index for jsonb array
    visibilityIdx: index("events_visibility_idx").on(table.visibility),
    // Composite index for common query pattern
    startVisibilityIdx: index("events_start_visibility_idx").on(
      table.startAt,
      table.visibility
    ),
  })
);

export const eventsRelations = relations(events, ({ one, many }) => ({
  venue: one(venues, {
    fields: [events.venueId],
    references: [venues.id],
  }),
  organizer: one(organizers, {
    fields: [events.organizerId],
    references: [organizers.id],
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

// ============================================================================
// ACTIVITY TABLE (Append-only)
// ============================================================================
export const activityEvents = pgTable(
  "activity",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorUserId: text("actor_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: activityTypeEnum("type").notNull(),
    entityType: activityEntityTypeEnum("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    actorCreatedAtIdx: index("activity_actor_created_at_idx").on(
      table.actorUserId,
      table.createdAt
    ),
  })
);

export const activityEventsRelations = relations(activityEvents, ({ one }) => ({
  actor: one(users, {
    fields: [activityEvents.actorUserId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [activityEvents.entityId],
    references: [events.id],
  }),
  venue: one(venues, {
    fields: [activityEvents.entityId],
    references: [venues.id],
  }),
  organizer: one(organizers, {
    fields: [activityEvents.entityId],
    references: [organizers.id],
  }),
}));
