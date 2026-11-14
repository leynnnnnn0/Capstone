"use client";

import type { ReactNode } from "react";
import { FormPageSkeleton } from "@/components/ui/page-skeletons";
import { can, hasRole } from "@/features/auth/current-user-api";
import { useCurrentUser } from "@/hooks/use-current-user";

export function AdminSystemAccess({
  children,
  permission,
}: {
  children: ReactNode;
  permission: string;
}) {
  const { user, loading } = useCurrentUser();

  if (loading) return <FormPageSkeleton />;

  if (!hasRole(user, "admin") || !can(user, permission)) {
    return <p className="text-sm text-muted-foreground">You don’t have access to this page.</p>;
  }

  return children;
}
