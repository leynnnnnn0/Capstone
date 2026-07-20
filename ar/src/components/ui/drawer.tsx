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
    <div className="pointer-events-auto fixed inset-0 z-40 flex items-end p-0 sm:p-3">
      <button
        type="button"
        className="absolute inset-0 bg-[#0d1f33]/55 backdrop-blur-sm"
        aria-label="Close drawer"
        onClick={() => onOpenChange?.(false)}
      />
      <section
        data-slot="drawer-content"
        className={cn(
          "relative z-10 w-full rounded-t-[1.75rem] border border-white/80 bg-white p-4 text-[#162d4a] shadow-[0_26px_80px_rgba(13,31,51,0.28)] sm:rounded-[1.75rem] sm:p-5",
          "max-h-[82dvh] overflow-y-auto",
          className,
        )}
        {...props}
      >
        <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-[#dce4ea]" />
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
      className={cn("text-xl font-semibold tracking-[-0.03em] text-[#162d4a]", className)}
      {...props}
    />
  );
}

function DrawerDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="drawer-description"
      className={cn("mt-1 text-sm font-normal text-[#7e94a7]", className)}
      {...props}
    />
  );
}

export { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle };
