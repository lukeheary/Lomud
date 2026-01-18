import { db } from "../db";
import { activityEvents, activityEntityTypeEnum, activityTypeEnum } from "../db/schema";
import { z } from "zod";

type ActivityType = (typeof activityTypeEnum.enumValues)[number];
type ActivityEntityType = (typeof activityEntityTypeEnum.enumValues)[number];

interface LogActivityParams {
    actorUserId: string;
    type: ActivityType;
    entityType: ActivityEntityType;
    entityId: string;
    metadata?: Record<string, any>;
}

export async function logActivity({
    actorUserId,
    type,
    entityType,
    entityId,
    metadata,
}: LogActivityParams) {
    try {
        await db.insert(activityEvents).values({
            actorUserId,
            type,
            entityType,
            entityId,
            metadata,
        });
    } catch (error) {
        console.error("Failed to log activity:", error);
        // We don't want to throw here because logging shouldn't break the main action
    }
}
