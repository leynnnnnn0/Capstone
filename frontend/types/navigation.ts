import type { LucideIcon } from "lucide-react";
import type { LinkProps } from "next/link";

export type BreadcrumbItem = {
  title: string;
  href: LinkProps["href"];
};

export type NavItem = {
  title: string;
  href: LinkProps["href"];
  icon?: LucideIcon | null;
  isActive?: boolean;
  permission?: string;
};
