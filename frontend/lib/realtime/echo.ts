"use client";

import Echo from "laravel-echo";
import Pusher from "pusher-js";

import { api } from "@/lib/api";

declare global {
  interface Window {
    Pusher: typeof Pusher;
  }
}

let echo: Echo<"reverb"> | null = null;

export function getEcho() {
  if (typeof window === "undefined") return null;

  if (echo) return echo;

  window.Pusher = Pusher;

  echo = new Echo({
    broadcaster: "reverb",
    key: process.env.NEXT_PUBLIC_REVERB_APP_KEY ?? "",
    wsHost: process.env.NEXT_PUBLIC_REVERB_HOST ?? "localhost",
    wsPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8080),
    wssPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8080),
    forceTLS: process.env.NEXT_PUBLIC_REVERB_SCHEME === "https",
    enabledTransports: ["ws", "wss"],
    authorizer: (channel) => ({
      authorize: async (socketId, callback) => {
        try {
          const response = await api<Record<string, unknown>>("/api/broadcasting/auth", {
            method: "POST",
            body: JSON.stringify({
              socket_id: socketId,
              channel_name: channel.name,
            }),
          });

          callback(null, response as never);
        } catch (error) {
          callback(error as Error, null);
        }
      },
    }),
  });

  return echo;
}

export function disconnectEcho() {
  echo?.disconnect();
  echo = null;
}
