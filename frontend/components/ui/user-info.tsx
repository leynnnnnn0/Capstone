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
        <AvatarFallback className="rounded-full bg-[#d8e9f3] text-sm font-medium text-[#2d425b]">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
        <span className="truncate font-semibold text-[#2d425b]">{user.name}</span>
        {showEmail && (
          <span className="mt-0.5 truncate text-xs text-[#64829a]">
            {user.email}
          </span>
        )}
      </div>
    </>
  );
}
