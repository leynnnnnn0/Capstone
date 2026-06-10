"use client";

import * as React from "react";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      {...props}
      closeButton={false}
      position="top-right"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:border-slate-200 group-[.toaster]:bg-white group-[.toaster]:text-black group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-black/70",
          actionButton:
            "group-[.toast]:bg-black group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-slate-100 group-[.toast]:text-black",
        },
      }}
    />
  );
}

export { Toaster };
