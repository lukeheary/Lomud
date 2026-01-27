
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export interface UserListUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  imageUrl: string | null;
}

interface UserListProps<T> {
  items: T[];
  getUser: (item: T) => UserListUser;
  renderAction?: (item: T) => ReactNode;
  renderBadges?: (item: T) => ReactNode;
  className?: string;
  emptyMessage?: ReactNode;
  onItemClick?: (item: T) => void;
}

export function UserList<T>({
  items,
  getUser,
  renderAction,
  renderBadges,
  className,
  emptyMessage,
  onItemClick,
}: UserListProps<T>) {
  if (items.length === 0 && emptyMessage) {
    return <>{emptyMessage}</>;
  }

  return (
    <div className={cn("flex flex-col divide-y", className)}>
      {items.map((item, index) => {
        const user = getUser(item);
        return (
          <div
            key={user.id || index}
            className={cn(
              "flex items-center justify-between py-4",
              onItemClick && "cursor-pointer hover:bg-muted/50"
            )}
            onClick={() => onItemClick?.(item)}
          >
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={user.imageUrl || undefined} />
                <AvatarFallback>
                  {user.firstName?.[0]}
                  {user.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">
                    {user.firstName} {user.lastName}
                  </p>
                  {renderBadges && renderBadges(item)}
                </div>
                <p className="text-sm text-muted-foreground">@{user.username}</p>
              </div>
            </div>
            {renderAction && <div>{renderAction(item)}</div>}
          </div>
        );
      })}
    </div>
  );
}
