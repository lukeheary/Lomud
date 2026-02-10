import { z } from "zod";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../init";
import {
  events,
  follows,
  friends,
  placeFollows,
  placeMembers,
  places,
  cities,
  metroAreas,
  rsvps,
  users,
} from "../../db/schema";
import { and, desc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { logActivity } from "../../utils/activity-logger";
import { CATEGORIES, filterValidCategories } from "@/lib/categories";

export const eventRouter = router({
  createEvent: protectedProcedure
    .input(
      z.object({
        venueId: z.string().uuid().optional(),
        organizerId: z.string().uuid().optional(),
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        coverImageUrl: z.string().url().optional(),
        eventUrl: z.string().url().optional(),
        source: z.string().max(50).optional(),
        externalId: z.string().optional(),
        startAt: z.date(),
        endAt: z.date().optional(),
        venueName: z.string().max(255).optional(),
        address: z.string().optional(),
        city: z.string().min(1).max(100),
        state: z.string().length(2),
        categories: z.array(z.string()).optional().default([]),
        visibility: z.enum(["public", "private"]).default("public"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.auth.userId),
      });
      const isAdmin = user?.role === "admin";

      // If venueId provided, verify user is place member or admin
      if (input.venueId && !isAdmin) {
        const isMember = await ctx.db.query.placeMembers.findFirst({
          where: and(
            eq(placeMembers.userId, ctx.auth.userId),
            eq(placeMembers.placeId, input.venueId)
          ),
        });

        if (!isMember) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You are not a member of this venue",
          });
        }
      }

      // If organizerId provided, verify user is place member or admin
      if (input.organizerId && !isAdmin) {
        const isMember = await ctx.db.query.placeMembers.findFirst({
          where: and(
            eq(placeMembers.userId, ctx.auth.userId),
            eq(placeMembers.placeId, input.organizerId)
          ),
        });

        if (!isMember) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You are not a member of this organizer",
          });
        }
      }

      // Validate startAt < endAt if endAt provided
      if (input.endAt && input.startAt >= input.endAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "End time must be after start time",
        });
      }

      // Filter to only valid categories
      const validCategories = filterValidCategories(input.categories || []);

      const [event] = await ctx.db
        .insert(events)
        .values({
          title: input.title,
          venueName: input.venueName ?? null,
          city: input.city,
          state: input.state,
          categories: validCategories,
          startAt: input.startAt,
          visibility: input.visibility,
          createdByUserId: ctx.auth.userId,
          description: input.description ?? null,
          address: input.address ?? null,
          endAt: input.endAt ?? null,
          venueId: input.venueId ?? null,
          organizerId: input.organizerId ?? null,
          coverImageUrl: input.coverImageUrl ?? null,
          eventUrl: input.eventUrl ?? null,
          source: input.source ?? null,
          externalId: input.externalId ?? null,
        } as any)
        .returning();

      if (event) {
        void logActivity({
          actorUserId: ctx.auth.userId,
          type: "created_event",
          entityType: "event",
          entityId: event.id,
          metadata: {},
        });
      }

      return event;
    }),

  batchCreateEvents: adminProcedure
    .input(
      z.object({
        venueId: z.string().uuid().optional(),
        events: z.array(
          z.object({
            title: z.string().min(1).max(255),
            description: z.string().optional(),
            coverImageUrl: z.string().url().optional(),
            eventUrl: z.string().url().optional(),
            source: z.string().max(50).optional(),
            externalId: z.string().optional(),
            startAt: z.date(),
            endAt: z.date().optional(),
            venueName: z.string().max(255).optional(),
            address: z.string().optional(),
            city: z.string().min(1).max(100),
            state: z.string().length(2),
            categories: z.array(z.string()).optional().default([]),
            visibility: z.enum(["public", "private"]).default("public"),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.events.length === 0) {
        return { created: 0 };
      }

      const eventsWithExternal = input.events.filter(
        (event) => event.source && event.externalId
      );

      const existingKeys = new Set<string>();

      if (eventsWithExternal.length > 0) {
        const bySource = new Map<string, Set<string>>();

        eventsWithExternal.forEach((event) => {
          if (!event.source || !event.externalId) return;
          const set = bySource.get(event.source) ?? new Set<string>();
          set.add(event.externalId);
          bySource.set(event.source, set);
        });

        for (const [source, ids] of bySource.entries()) {
          const rows = await ctx.db.query.events.findMany({
            where: and(
              eq(events.source, source),
              inArray(events.externalId, Array.from(ids))
            ),
            columns: {
              source: true,
              externalId: true,
            },
          });

          rows.forEach((row) => {
            if (row.source && row.externalId) {
              existingKeys.add(`${row.source}::${row.externalId}`);
            }
          });
        }
      }

      const seenKeys = new Set<string>();
      const filteredEvents = input.events.filter((event) => {
        if (event.source && event.externalId) {
          const key = `${event.source}::${event.externalId}`;
          if (existingKeys.has(key)) return false;
          if (seenKeys.has(key)) return false;
          seenKeys.add(key);
        }
        return true;
      });

      if (filteredEvents.length === 0) {
        return { created: 0 };
      }

      const values = filteredEvents.map((event) => ({
        title: event.title,
        description: event.description ?? null,
        coverImageUrl: event.coverImageUrl ?? null,
        eventUrl: event.eventUrl ?? null,
        source: event.source ?? null,
        externalId: event.externalId ?? null,
        startAt: event.startAt,
        endAt: event.endAt ?? null,
        venueName: event.venueName ?? null,
        address: event.address ?? null,
        city: event.city,
        state: event.state,
        categories: filterValidCategories(event.categories || []),
        visibility: event.visibility,
        createdByUserId: ctx.auth.userId,
        venueId: input.venueId ?? null,
      }));

      const created = await ctx.db
        .insert(events)
        .values(values as any)
        .onConflictDoNothing({
          target: [events.source, events.externalId],
        })
        .returning();

      return { created: created.length };
    }),

  listEventsByRange: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
        followedOnly: z.boolean().default(false),
        friendsGoingOnly: z.boolean().default(false),
        category: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        radiusMiles: z.number().min(1).max(200).optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const currentUser = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.auth.userId),
      });

      // Build where conditions
      const conditions = [
        gte(events.startAt, input.startDate),
        lte(events.startAt, input.endDate),
        eq(events.visibility, "public"),
      ];

      // Add category filter - check if the category is in the jsonb array
      if (input.category) {
        conditions.push(
          sql`${events.categories} @> ${JSON.stringify([input.category])}::jsonb`
        );
      }

      // Add location filters
      if (input.city) {
        // Look up metro area first for coordinates and radius
        const metro = await ctx.db.query.metroAreas.findFirst({
          where: eq(metroAreas.name, input.city),
        });

        let originCity: { latitude: number; longitude: number } | undefined;
        if (metro?.latitude != null && metro?.longitude != null) {
          originCity = { latitude: metro.latitude, longitude: metro.longitude };
        } else {
          const resolvedState = input.state ?? currentUser?.state ?? undefined;
          const cityConditions = [eq(cities.name, input.city)];
          if (resolvedState) {
            cityConditions.push(eq(cities.state, resolvedState));
          }
          let cityRecord = await ctx.db.query.cities.findFirst({
            where: and(...cityConditions),
          });
          if (!cityRecord && resolvedState) {
            cityRecord = await ctx.db.query.cities.findFirst({
              where: eq(cities.name, input.city),
            });
          }
          if (cityRecord?.latitude != null && cityRecord?.longitude != null) {
            originCity = { latitude: cityRecord.latitude, longitude: cityRecord.longitude };
          }
        }

        if (originCity) {
          const radiusMiles = input.radiusMiles ?? metro?.radiusMiles ?? 20;

          const distanceSql = sql`
            (
              3959 * 2 * asin(
                sqrt(
                  pow(sin(radians(${originCity.latitude} - ${cities.latitude}) / 2), 2) +
                  cos(radians(${originCity.latitude})) * cos(radians(${cities.latitude})) *
                  pow(sin(radians(${originCity.longitude} - ${cities.longitude}) / 2), 2)
                )
              )
            )
          `;

          const nearbyEventIds = await ctx.db
            .select({ id: events.id })
            .from(events)
            .innerJoin(
              cities,
              and(eq(cities.name, events.city), eq(cities.state, events.state))
            )
            .where(
              and(
                gte(events.startAt, input.startDate),
                lte(events.startAt, input.endDate),
                eq(events.visibility, "public"),
                sql`${distanceSql} <= ${radiusMiles}`
              )
            );

          if (nearbyEventIds.length === 0) {
            return [];
          }

          conditions.push(
            inArray(
              events.id,
              nearbyEventIds.map((row) => row.id)
            )
          );
        } else {
          conditions.push(eq(events.city, input.city));
          if (input.state) {
            conditions.push(eq(events.state, input.state));
          }
        }
      } else if (input.state) {
        conditions.push(eq(events.state, input.state));
      }

      // Add search filter
      if (input.search) {
        conditions.push(
          or(
            ilike(events.title, `%${input.search}%`),
            ilike(events.venueName, `%${input.search}%`)
          )!
        );
      }

      // Filter by followed places (venues and organizers)
      if (input.followedOnly) {
        const userBusinessFollows = await ctx.db.query.follows.findMany({
          where: eq(follows.userId, ctx.auth.userId),
        });
        const userPlaceFollows = await ctx.db.query.placeFollows.findMany({
          where: eq(placeFollows.userId, ctx.auth.userId),
        });

        // Get followed places and separate by type
        const followedPlaceIds = userPlaceFollows.map((f) => f.placeId);

        if (followedPlaceIds.length > 0) {
          // Get the places to check their types
          const followedPlaces = await ctx.db.query.places.findMany({
            where: inArray(places.id, followedPlaceIds),
          });

          const followedVenueIds = followedPlaces
            .filter((p) => p.type === "venue")
            .map((p) => p.id);
          const followedOrganizerIds = followedPlaces
            .filter((p) => p.type === "organizer")
            .map((p) => p.id);

          const followConditions = [];
          if (followedVenueIds.length > 0) {
            followConditions.push(inArray(events.venueId, followedVenueIds));
          }
          if (followedOrganizerIds.length > 0) {
            followConditions.push(
              inArray(events.organizerId, followedOrganizerIds)
            );
          }

          if (followConditions.length > 0) {
            conditions.push(or(...followConditions)!);
          } else {
            // User follows nothing, return empty
            return [];
          }
        } else {
          // User follows nothing, return empty
          return [];
        }
      }

      // Filter by events friends are going to
      if (input.friendsGoingOnly) {
        const userFriends = await ctx.db.query.friends.findMany({
          where: and(
            eq(friends.userId, ctx.auth.userId),
            eq(friends.status, "accepted")
          ),
        });

        const friendIds = userFriends.map((f) => f.friendUserId);

        if (friendIds.length > 0) {
          const friendRsvps = await ctx.db.query.rsvps.findMany({
            where: and(
              inArray(rsvps.userId, friendIds),
              eq(rsvps.status, "going")
            ),
          });

          const eventIdsWithFriends = friendRsvps.map((r) => r.eventId);

          if (eventIdsWithFriends.length > 0) {
            conditions.push(inArray(events.id, eventIdsWithFriends));
          } else {
            // No friends going to any events
            return [];
          }
        } else {
          // User has no friends
          return [];
        }
      }

      // Fetch events with all conditions
      const eventList = await ctx.db.query.events.findMany({
        where: and(...conditions),
        orderBy: [events.startAt],
        limit: input.limit,
        offset: input.offset,
        with: {
          venue: true,
          organizer: true,
          createdBy: true,
        },
      });

      // Fetch user's RSVPs for these events
      const eventIds = eventList.map((e) => e.id);
      const userRsvps =
        eventIds.length > 0
          ? await ctx.db.query.rsvps.findMany({
            where: and(
              eq(rsvps.userId, ctx.auth.userId),
              inArray(rsvps.eventId, eventIds)
            ),
          })
          : [];

      // Create a map of event IDs to RSVPs
      const rsvpMap = new Map(userRsvps.map((r) => [r.eventId, r]));

      // Fetch user's friends (bidirectional - where user is either sender or receiver)
      const userFriends = await ctx.db.query.friends.findMany({
        where: and(
          or(
            eq(friends.userId, ctx.auth.userId),
            eq(friends.friendUserId, ctx.auth.userId)
          ),
          eq(friends.status, "accepted")
        ),
      });

      const friendIds = userFriends.map((f) =>
        f.userId === ctx.auth.userId ? f.friendUserId : f.userId
      );

      // Fetch friends' RSVPs (going status only)
      const friendsRsvps =
        eventIds.length > 0 && friendIds.length > 0
          ? await ctx.db.query.rsvps.findMany({
            where: and(
              inArray(rsvps.eventId, eventIds),
              inArray(rsvps.userId, friendIds),
              eq(rsvps.status, "going")
            ),
            with: {
              user: true,
            },
          })
          : [];

      // Create a map of event IDs to attendees (current user + friends)
      const attendeesMap = new Map<string, typeof friendsRsvps>();

      // Add current user if they're going to any events
      for (const userRsvp of userRsvps) {
        if (userRsvp.status === "going" && currentUser) {
          if (!attendeesMap.has(userRsvp.eventId)) {
            attendeesMap.set(userRsvp.eventId, []);
          }
          // Add current user to the beginning of the array
          attendeesMap.get(userRsvp.eventId)!.push({
            ...userRsvp,
            user: currentUser,
          } as any);
        }
      }

      // Add friends to the map
      for (const rsvp of friendsRsvps) {
        if (!attendeesMap.has(rsvp.eventId)) {
          attendeesMap.set(rsvp.eventId, []);
        }
        attendeesMap.get(rsvp.eventId)!.push(rsvp);
      }

      // Attach user RSVP and friends going to each event

      return eventList.map((event) => ({
        ...event,
        userRsvp: rsvpMap.get(event.id) || null,
        friendsGoing: attendeesMap.get(event.id) || [],
      }));
    }),

  getEventById: publicProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const event = await ctx.db.query.events.findFirst({
        where: eq(events.id, input.eventId),
        with: {
          venue: true,
          organizer: true,
          createdBy: true,
        },
      });

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

      // Get user's RSVP if authenticated
      let userRsvp = null;
      if (ctx.auth.userId) {
        userRsvp = await ctx.db.query.rsvps.findFirst({
          where: and(
            eq(rsvps.eventId, input.eventId),
            eq(rsvps.userId, ctx.auth.userId)
          ),
        });
      }

      return {
        ...event,
        userRsvp,
      };
    }),

  setRsvpStatus: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        status: z.enum(["going", "interested", "not_going"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify event exists
      const event = await ctx.db.query.events.findFirst({
        where: eq(events.id, input.eventId),
      });

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

      // Upsert RSVP
      const [rsvp] = await ctx.db
        .insert(rsvps)
        .values({
          userId: ctx.auth.userId,
          eventId: input.eventId,
          status: input.status,
        })
        .onConflictDoUpdate({
          target: [rsvps.userId, rsvps.eventId],
          set: {
            status: input.status,
            updatedAt: new Date(),
          },
        })
        .returning();

      if (rsvp && (input.status === "going" || input.status === "interested")) {
        void logActivity({
          actorUserId: ctx.auth.userId,
          type: input.status === "going" ? "rsvp_going" : "rsvp_interested",
          entityType: "event",
          entityId: input.eventId,
          metadata: { status: input.status },
        });
      }

      return rsvp;
    }),

  deleteRsvp: protectedProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(rsvps)
        .where(
          and(
            eq(rsvps.eventId, input.eventId),
            eq(rsvps.userId, ctx.auth.userId)
          )
        );

      return { success: true };
    }),

  listEventAttendees: publicProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        statusFilter: z.enum(["going", "interested", "not_going"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(rsvps.eventId, input.eventId)];

      if (input.statusFilter) {
        conditions.push(eq(rsvps.status, input.statusFilter));
      }

      return await ctx.db.query.rsvps.findMany({
        where: and(...conditions),
        with: {
          user: true,
        },
        orderBy: [desc(rsvps.createdAt)],
      });
    }),

  getUserRsvp: protectedProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const rsvp = await ctx.db.query.rsvps.findFirst({
        where: and(
          eq(rsvps.eventId, input.eventId),
          eq(rsvps.userId, ctx.auth.userId)
        ),
      });

      return rsvp;
    }),

  updateEvent: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        title: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        coverImageUrl: z.string().url().optional(),
        eventUrl: z.string().url().optional(),
        source: z.string().max(50).optional(),
        externalId: z.string().optional(),
        startAt: z.date().optional(),
        endAt: z.date().optional(),
        venueName: z.string().max(255).optional(),
        address: z.string().optional(),
        city: z.string().min(1).max(100).optional(),
        state: z.string().length(2).optional(),
        categories: z.array(z.string()).optional(),
        visibility: z.enum(["public", "private"]).optional(),
        venueId: z.string().uuid().optional(),
        organizerId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { eventId, ...updates } = input;

      // Fetch the event to check permissions
      const event = await ctx.db.query.events.findFirst({
        where: eq(events.id, eventId),
      });

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

      // Check if user is admin
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.auth.userId),
      });

      const isAdmin = user?.role === "admin";
      const isCreator = event.createdByUserId === ctx.auth.userId;

      // Only admins or the event creator can edit
      if (!isAdmin && !isCreator) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to edit this event",
        });
      }

      // Validate startAt < endAt if both are provided
      const startAt = updates.startAt || event.startAt;
      const endAt = updates.endAt || event.endAt;

      if (endAt && startAt >= endAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "End time must be after start time",
        });
      }

      // Build update object
      const updateData: Record<string, any> = {
        updatedAt: new Date(),
      };

      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined)
        updateData.description = updates.description;
      if (updates.coverImageUrl !== undefined)
        updateData.coverImageUrl = updates.coverImageUrl;
      if (updates.eventUrl !== undefined) updateData.eventUrl = updates.eventUrl;
      if (updates.source !== undefined) updateData.source = updates.source;
      if (updates.externalId !== undefined)
        updateData.externalId = updates.externalId;
      if (updates.startAt !== undefined) updateData.startAt = updates.startAt;
      if (updates.endAt !== undefined) updateData.endAt = updates.endAt;
      if (updates.venueName !== undefined)
        updateData.venueName = updates.venueName;
      if (updates.address !== undefined) updateData.address = updates.address;
      if (updates.city !== undefined) updateData.city = updates.city;
      if (updates.state !== undefined) updateData.state = updates.state;
      if (updates.categories !== undefined)
        updateData.categories = filterValidCategories(updates.categories);
      if (updates.visibility !== undefined)
        updateData.visibility = updates.visibility;
      if (updates.venueId !== undefined)
        updateData.venueId = updates.venueId;
      if (updates.organizerId !== undefined)
        updateData.organizerId = updates.organizerId;

      // Update the event
      const [updatedEvent] = await ctx.db
        .update(events)
        .set(updateData)
        .where(eq(events.id, eventId))
        .returning();

      if (!updatedEvent) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update event",
        });
      }

      return updatedEvent;
    }),

  listPublicEventsPreview: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        city: z.string().optional(),
        limit: z.number().min(1).max(8).default(8),
      })
    )
    .query(async ({ ctx, input }) => {
      const now = new Date();

      const conditions = [
        eq(events.visibility, "public"),
        gte(events.startAt, now),
      ];

      if (input.city) {
        // Look up metro area for coordinates and radius
        const metro = await ctx.db.query.metroAreas.findFirst({
          where: eq(metroAreas.name, input.city),
        });

        // Fall back to cities table if not a metro area
        const originCity = metro ?? await ctx.db.query.cities.findFirst({
          where: eq(cities.name, input.city),
        });

        if (originCity?.latitude != null && originCity?.longitude != null) {
          const radiusMiles = (metro?.radiusMiles) ?? 20;

          const distanceSql = sql`
            (
              3959 * 2 * asin(
                sqrt(
                  pow(sin(radians(${originCity.latitude} - ${cities.latitude}) / 2), 2) +
                  cos(radians(${originCity.latitude})) * cos(radians(${cities.latitude})) *
                  pow(sin(radians(${originCity.longitude} - ${cities.longitude}) / 2), 2)
                )
              )
            )
          `;

          const nearbyEventIds = await ctx.db
            .select({ id: events.id })
            .from(events)
            .innerJoin(
              cities,
              and(eq(cities.name, events.city), eq(cities.state, events.state))
            )
            .where(
              and(
                eq(events.visibility, "public"),
                gte(events.startAt, now),
                sql`${distanceSql} <= ${radiusMiles}`
              )
            );

          if (nearbyEventIds.length === 0) {
            return [];
          }

          conditions.push(
            inArray(
              events.id,
              nearbyEventIds.map((row) => row.id)
            )
          );
        } else {
          conditions.push(eq(events.city, input.city));
        }
      }

      if (input.search) {
        conditions.push(
          or(
            ilike(events.title, `%${input.search}%`),
            ilike(events.venueName, `%${input.search}%`)
          )!
        );
      }

      const eventList = await ctx.db.query.events.findMany({
        where: and(...conditions),
        orderBy: [events.startAt],
        limit: input.limit,
        with: {
          venue: true,
          organizer: true,
          createdBy: true,
        },
      });

      return eventList.map((event) => ({
        ...event,
        userRsvp: null,
        friendsGoing: [] as never[],
      }));
    }),

  getAvailableCities: publicProcedure.query(async ({ ctx }) => {
    // Return all metro areas from the database
    const metros = await ctx.db
      .select({
        city: metroAreas.name,
        state: metroAreas.state,
        latitude: metroAreas.latitude,
        longitude: metroAreas.longitude,
        radiusMiles: metroAreas.radiusMiles,
      })
      .from(metroAreas)
      .orderBy(metroAreas.name);

    return metros;
  }),

  getRecentlyAddedEvents: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(20).default(8),
        city: z.string().optional(),
        radiusMiles: z.number().min(1).max(200).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const currentUser = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.auth.userId),
      });

      const now = new Date();

      const conditions = [
        eq(events.visibility, "public"),
        gte(events.startAt, now), // Only future events
      ];

      if (input.city) {
        // Look up metro area first for coordinates and radius
        const metro = await ctx.db.query.metroAreas.findFirst({
          where: eq(metroAreas.name, input.city),
        });

        let originCity: { latitude: number; longitude: number } | undefined;
        if (metro?.latitude != null && metro?.longitude != null) {
          originCity = { latitude: metro.latitude, longitude: metro.longitude };
        } else {
          const cityConditions = [eq(cities.name, input.city)];
          if (currentUser?.state) {
            cityConditions.push(eq(cities.state, currentUser.state));
          }
          let cityRecord = await ctx.db.query.cities.findFirst({
            where: and(...cityConditions),
          });
          if (!cityRecord && currentUser?.state) {
            cityRecord = await ctx.db.query.cities.findFirst({
              where: eq(cities.name, input.city),
            });
          }
          if (cityRecord?.latitude != null && cityRecord?.longitude != null) {
            originCity = { latitude: cityRecord.latitude, longitude: cityRecord.longitude };
          }
        }

        if (originCity) {
          const radiusMiles = input.radiusMiles ?? metro?.radiusMiles ?? 20;

          const distanceSql = sql`
            (
              3959 * 2 * asin(
                sqrt(
                  pow(sin(radians(${originCity.latitude} - ${cities.latitude}) / 2), 2) +
                  cos(radians(${originCity.latitude})) * cos(radians(${cities.latitude})) *
                  pow(sin(radians(${originCity.longitude} - ${cities.longitude}) / 2), 2)
                )
              )
            )
          `;

          const nearbyEventIds = await ctx.db
            .select({ id: events.id })
            .from(events)
            .innerJoin(
              cities,
              and(eq(cities.name, events.city), eq(cities.state, events.state))
            )
            .where(
              and(
                eq(events.visibility, "public"),
                gte(events.startAt, now),
                sql`${distanceSql} <= ${radiusMiles}`
              )
            );

          if (nearbyEventIds.length === 0) {
            return [];
          }

          conditions.push(
            inArray(
              events.id,
              nearbyEventIds.map((row) => row.id)
            )
          );
        } else {
          conditions.push(eq(events.city, input.city));
        }
      }

      const recentEvents = await ctx.db.query.events.findMany({
        where: and(...conditions),
        orderBy: [desc(events.createdAt)],
        limit: input.limit,
        with: {
          venue: true,
          organizer: true,
          createdBy: true,
        },
      });

      // Fetch user's RSVPs for these events
      const eventIds = recentEvents.map((e) => e.id);
      const userRsvps =
        eventIds.length > 0
          ? await ctx.db.query.rsvps.findMany({
              where: and(
                eq(rsvps.userId, ctx.auth.userId),
                inArray(rsvps.eventId, eventIds)
              ),
            })
          : [];

      // Create a map of event IDs to RSVPs
      const rsvpMap = new Map(userRsvps.map((r) => [r.eventId, r]));

      // currentUser already fetched above

      // Fetch user's friends
      const userFriends = await ctx.db.query.friends.findMany({
        where: and(
          or(
            eq(friends.userId, ctx.auth.userId),
            eq(friends.friendUserId, ctx.auth.userId)
          ),
          eq(friends.status, "accepted")
        ),
      });

      const friendIds = userFriends.map((f) =>
        f.userId === ctx.auth.userId ? f.friendUserId : f.userId
      );

      // Fetch friends' RSVPs (going status only)
      const friendsRsvps =
        eventIds.length > 0 && friendIds.length > 0
          ? await ctx.db.query.rsvps.findMany({
              where: and(
                inArray(rsvps.eventId, eventIds),
                inArray(rsvps.userId, friendIds),
                eq(rsvps.status, "going")
              ),
              with: {
                user: true,
              },
            })
          : [];

      // Create a map of event IDs to attendees
      const attendeesMap = new Map<string, typeof friendsRsvps>();

      // Add current user if they're going to any events
      for (const userRsvp of userRsvps) {
        if (userRsvp.status === "going" && currentUser) {
          if (!attendeesMap.has(userRsvp.eventId)) {
            attendeesMap.set(userRsvp.eventId, []);
          }
          attendeesMap.get(userRsvp.eventId)!.push({
            ...userRsvp,
            user: currentUser,
          } as any);
        }
      }

      // Add friends to the map
      for (const rsvp of friendsRsvps) {
        if (!attendeesMap.has(rsvp.eventId)) {
          attendeesMap.set(rsvp.eventId, []);
        }
        attendeesMap.get(rsvp.eventId)!.push(rsvp);
      }

      // Return events with userRsvp and friendsGoing attached
      return recentEvents.map((event) => ({
        ...event,
        userRsvp: rsvpMap.get(event.id) || null,
        friendsGoing: attendeesMap.get(event.id) || [],
      }));
    }),
});
