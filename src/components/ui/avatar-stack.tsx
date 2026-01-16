import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface User {
  id: string;
  imageUrl: string | null;
  firstName: string | null;
  lastName: string | null;
}

interface AvatarStackProps {
  users: User[];
  maxDisplay?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AvatarStack({
  users,
  maxDisplay = 5,
  size = "md",
  className = "",
}: AvatarStackProps) {
  const displayedUsers = users.slice(0, maxDisplay);
  const remainingCount = users.length - maxDisplay;

  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  const sizeClass = sizeClasses[size];

  if (users.length === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex -space-x-2">
        {displayedUsers.map((user) => (
          <Avatar
            key={user.id}
            className={`${sizeClass} border border-background`}
          >
            <AvatarImage src={user.imageUrl || undefined} />
            <AvatarFallback className="text-xs">
              {user.firstName?.[0]}
              {user.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>
      {remainingCount > 0 && (
        <div
          className={`ml-1 flex ${sizeClass} items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-semibold`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
