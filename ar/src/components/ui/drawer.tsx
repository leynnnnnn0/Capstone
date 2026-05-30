import * as React from "react";
import { cn } from "../../lib/utils";

type DrawerContextValue = {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
};

const DrawerContext = React.createContext<DrawerContextValue | null>(null);

function useDrawer() {
  const context = React.useContext(DrawerContext);

  if (!context) {
    throw new Error("Drawer components must be used inside <Drawer>.");
  }

  return context;
}

function Drawer({
  open,
  onOpenChange,
  children,
}: React.PropsWithChildren<DrawerContextValue>) {
  return (
    <DrawerContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DrawerContext.Provider>
  );
}

function DrawerContent({
  className,
  children,
  ...props
}: React.ComponentProps<"section">) {
  const { open, onOpenChange } = useDrawer();

  if (!open) return null;

  return (
    <div className="pointer-events-auto fixed inset-0 z-40 flex items-end">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/25"
        aria-label="Close drawer"
        onClick={() => onOpenChange?.(false)}
      />
      <section
        data-slot="drawer-content"
        className={cn(
          "relative z-10 w-full rounded-t-[2rem] border border-white/80 bg-white p-4 text-slate-950 shadow-2xl",
          "max-h-[82dvh] overflow-y-auto",
          className,
        )}
        {...props}
      >
        <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-slate-200" />
        {children}
      </section>
    </div>
  );
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={cn("flex items-start justify-between gap-4", className)}
      {...props}
    />
  );
}

function DrawerTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="drawer-title"
      className={cn("text-xl font-black tracking-normal text-slate-950", className)}
      {...props}
    />
  );
}

function DrawerDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="drawer-description"
      className={cn("mt-1 text-sm font-semibold text-slate-400", className)}
      {...props}
    />
  );
}

export { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle };
