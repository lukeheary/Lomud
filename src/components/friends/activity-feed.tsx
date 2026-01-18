"use client";

import { trpc } from "@/lib/trpc";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    CheckCircle2,
    Star,
    Building2,
    Users,
    CalendarPlus,
    Loader2,
    Circle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface ActivityItemProps {
    activity: any;
}

function ActivityItem({ activity }: ActivityItemProps) {
    const { actor, type, entityType, entityId, metadata, createdAt } = activity;

    const renderIcon = () => {
        switch (type) {
            case "rsvp_going":
                return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case "rsvp_interested":
                return <Star className="h-4 w-4 text-yellow-500" />;
            case "follow_venue":
                return <Building2 className="h-4 w-4 text-blue-500" />;
            case "follow_organizer":
                return <Users className="h-4 w-4 text-purple-500" />;
            case "created_event":
                return <CalendarPlus className="h-4 w-4 text-orange-500" />;
            default:
                return <Circle className="h-4 w-4 text-muted-foreground" />;
        }
    };

    const renderContent = () => {
        const actorName = (
            <span className="font-semibold text-foreground">
                {actor.firstName} {actor.lastName}
            </span>
        );

        // Get the most up-to-date name from the joined records
        const entityName =
            activity.event?.title ||
            activity.venue?.name ||
            activity.organizer?.name ||
            metadata?.name ||
            metadata?.title ||
            "an entity";

        switch (type) {
            case "rsvp_going":
                return (
                    <>
                        {actorName} is going to{" "}
                        <Link
                            href={`/event/${entityId}`}
                            className="font-medium text-primary hover:underline"
                        >
                            {entityName}
                        </Link>
                    </>
                );
            case "rsvp_interested":
                return (
                    <>
                        {actorName} is interested in{" "}
                        <Link
                            href={`/event/${entityId}`}
                            className="font-medium text-primary hover:underline"
                        >
                            {entityName}
                        </Link>
                    </>
                );
            case "follow_venue":
                return (
                    <>
                        {actorName} started following{" "}
                        <span className="font-medium text-foreground">{entityName}</span>
                    </>
                );
            case "follow_organizer":
                return (
                    <>
                        {actorName} started following{" "}
                        <span className="font-medium text-foreground">{entityName}</span>
                    </>
                );
            case "created_event":
                return (
                    <>
                        {actorName} created a new event:{" "}
                        <Link
                            href={`/event/${entityId}`}
                            className="font-medium text-primary hover:underline"
                        >
                            {entityName}
                        </Link>
                    </>
                );
            default:
                return (
                    <>
                        {actorName} performed an action on {entityName}
                    </>
                );
        }
    };

    return (
        <div className="flex gap-4 pb-8 last:pb-0">
            <div className="relative flex flex-col items-center">
                <Avatar className="h-10 w-10 border-2 border-background ring-2 ring-muted/20">
                    <AvatarImage src={actor.imageUrl || undefined} />
                    <AvatarFallback>
                        {actor.firstName?.[0]}
                        {actor.lastName?.[0]}
                    </AvatarFallback>
                </Avatar>
                <div className="absolute top-10 flex h-full w-px bg-muted" />
                <div className="absolute -right-1 -top-1 rounded-full bg-background p-0.5">
                    {renderIcon()}
                </div>
            </div>
            <div className="flex-1 space-y-1 pt-1">
                <p className="text-sm leading-relaxed text-muted-foreground">
                    {renderContent()}
                </p>
                <p className="text-xs text-muted-foreground/60">
                    {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
                </p>
            </div>
        </div>
    );
}

export function ActivityFeed() {
    const { data: activities, isLoading } = trpc.friends.getFriendFeed.useQuery({});

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/40" />
            </div>
        );
    }

    if (!activities || activities.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 rounded-full bg-muted/30 p-4">
                    <Users className="h-8 w-8 text-muted-foreground/60" />
                </div>
                <p className="text-lg font-medium">No recent activity</p>
                <p className="max-w-[250px] text-sm text-muted-foreground">
                    When your friends RSVP to events or follow venues, you'll see it here.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex flex-col">
                {activities.map((activity: any) => (
                    <ActivityItem key={activity.id} activity={activity} />
                ))}
            </div>
        </div>
    );
}
