"use client";

import { useEffect, useState } from "react";

import { fetchCurrentUser } from "@/features/auth/current-user-api";
import type { User } from "@/types/user";

export function useCurrentUser({ redirectOnUnauthorized = true }: { redirectOnUnauthorized?: boolean } = {}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetchCurrentUser({ redirectOnUnauthorized })
      .then((response) => {
        if (active) setUser(response.data);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [redirectOnUnauthorized]);

  return { user, loading };
}
