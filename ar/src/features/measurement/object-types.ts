import type { ObjectType, ObjectTypeDefinition } from "./types";

export const OBJECT_TYPES: Record<ObjectType, ObjectTypeDefinition> = {
  door: {
    label: "Door",
    shortLabel: "Door",
    color: "#2f80ed",
    hex: 0x2f80ed,
  },
  window: {
    label: "Window",
    shortLabel: "Window",
    color: "#22c55e",
    hex: 0x22c55e,
  },
  cabinet: {
    label: "Cabinet",
    shortLabel: "Cabinet",
    color: "#f97316",
    hex: 0xf97316,
  },
  shower: {
    label: "Shower Enclosure",
    shortLabel: "Shower Enc.",
    color: "#a855f7",
    hex: 0xa855f7,
  },
  other: {
    label: "Other",
    shortLabel: "Other",
    color: "#64748b",
    hex: 0x64748b,
  },
};

export const OBJECT_TYPE_KEYS = Object.keys(OBJECT_TYPES) as ObjectType[];
