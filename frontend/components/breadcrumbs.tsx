import Link from "next/link";
import { Fragment } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";

import type { BreadcrumbItem as BreadcrumbItemType } from "@/types/navigation";

export function Breadcrumbs({
  breadcrumbs,
}: {
  breadcrumbs: BreadcrumbItemType[];
}) {
  return (
    <>
      {breadcrumbs.length > 0 && (
        <Breadcrumb className="min-w-0 overflow-hidden">
          <BreadcrumbList className="min-w-0 flex-nowrap overflow-hidden whitespace-nowrap text-xs sm:text-sm">
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <Fragment key={index}>
                  <BreadcrumbItem className={isLast ? "min-w-0" : "hidden shrink-0 sm:inline-flex"}>
                    {isLast ? (
                      <BreadcrumbPage className="block truncate">{item.title}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={item.href}>{item.title}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator className="hidden shrink-0 sm:list-item" />}
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      )}
    </>
  );
}
