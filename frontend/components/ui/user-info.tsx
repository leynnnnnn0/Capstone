import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User } from "@/types/user";

export function UserInfo({
  user,
  showEmail = false,
}: {
  user: User;
  showEmail?: boolean;
}) {
  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "SOG";

  return (
    <>
      <Avatar className="h-8 w-8 overflow-hidden rounded-full">
        <AvatarImage src={user.avatar} alt={user.name} />
        <AvatarFallback className="rounded-full bg-[#dbe9f3] text-xs font-bold text-[#162d4a]">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{user.name}</span>
        {showEmail && (
          <span className="truncate text-xs text-muted-foreground">
            {user.email}
          </span>
        )}
      </div>
    </>
  );
}
