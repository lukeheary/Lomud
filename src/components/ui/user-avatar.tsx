"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Facehash } from "facehash";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  className?: string;
  size?: number;
}

export function UserAvatar({
  src,
  name,
  className,
  size = 256,
}: UserAvatarProps) {
  // Filter out Clerk default images
  const isDefaultImage =
    src?.includes("default-user-image") || src?.includes("gravatar.com/avatar");
  const avatarSrc = isDefaultImage ? undefined : src || undefined;

  return (
    <Avatar className={cn("shrink-0 overflow-hidden", className)}>
      <AvatarImage src={avatarSrc} className="h-full w-full object-cover" />
      <AvatarFallback className="border-none bg-transparent p-0">
        <Facehash
          name={name || "User"}
          size={size}
          className="block h-full w-full"
          variant="solid"
          colors={[
            "#264653", // deep blue-green
            "#2a9d8f", // teal
            "#e9c46a", // warm sand
            "#f4a261", // soft orange
            "#e76f51", // muted coral
          ]}
        />
      </AvatarFallback>
    </Avatar>
  );
}
