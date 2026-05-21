import type { ObjectType } from "./types";

export type ModelCategoryId = "doors" | "windows" | "cabinets";

export interface ModelCategory {
  id: ModelCategoryId;
  label: string;
  description: string;
}

export interface ModelDefinition {
  id: string;
  category: ModelCategoryId;
  type: ObjectType;
  label: string;
  description: string;
  file: string;
  thumbnail?: string;
}

export const MODEL_CATEGORIES: ModelCategory[] = [
  {
    id: "doors",
    label: "Doors",
    description: "Sliding and swing door layouts",
  },
  {
    id: "windows",
    label: "Windows",
    description: "Window panels and glass openings",
  },
  {
    id: "cabinets",
    label: "Cabinets",
    description: "Straight and L-shaped cabinet work",
  },
];

export const MODEL_CATALOG: ModelDefinition[] = [
  {
    id: "door-1",
    category: "doors",
    type: "door",
    label: "Door 1",
    description: "Clean framed door",
    file: "/models/door1.glb",
  },
  {
    id: "door-2",
    category: "doors",
    type: "door",
    label: "Door 2",
    description: "Alternative door frame",
    file: "/models/door2.glb",
  },
  {
    id: "window-1",
    category: "windows",
    type: "window",
    label: "Window",
    description: "Standard glass window",
    file: "/models/window.glb",
    thumbnail: "/models/window.jpg",
  },
  {
    id: "window-2",
    category: "windows",
    type: "window",
    label: "Window 2",
    description: "Alternate window style",
    file: "/models/window2.glb",
  },
  {
    id: "cabinet-l",
    category: "cabinets",
    type: "cabinet",
    label: "Cabinet L",
    description: "L-shaped cabinet layout",
    file: "/models/cabinet_l.glb",
  },
  {
    id: "cabinet-l2",
    category: "cabinets",
    type: "cabinet",
    label: "Cabinet L2",
    description: "Compact L cabinet",
    file: "/models/cabinet_l2.glb",
  },
  {
    id: "cabinet-l3",
    category: "cabinets",
    type: "cabinet",
    label: "Cabinet L3",
    description: "Extended L cabinet",
    file: "/models/cabinet_l3.glb",
  },
];

export const DEFAULT_MODEL = MODEL_CATALOG[0];

export function getModelById(id: string) {
  return MODEL_CATALOG.find((model) => model.id === id) ?? DEFAULT_MODEL;
}
