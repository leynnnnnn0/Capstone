"use client";

import { useRouter } from "next/navigation";

import { useCurrentUser } from "@/hooks/use-current-user";
import {
  useRealtimeRefresh,
  useRealtimeSubscriptions,
} from "@/hooks/use-realtime";

export function RealtimeBridge() {
  const router = useRouter();
  const { user } = useCurrentUser();

  useRealtimeSubscriptions(user);
  useRealtimeRefresh(() => router.refresh());

  return null;
}
