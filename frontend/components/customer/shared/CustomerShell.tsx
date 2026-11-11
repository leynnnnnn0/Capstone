import CustomerNavbar from "@/components/customer/CustomerNavbar";
import { RealtimeBridge } from "@/components/realtime/RealtimeBridge";

export default function CustomerShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="customer-portal min-h-screen w-full overflow-x-clip bg-background text-foreground [--customer-small-text:0.75rem] [--text-xs:0.875rem] [--text-sm:1rem] [--text-base:1.125rem] [--text-lg:1.25rem] [--text-2xl:1.625rem] [--text-3xl:2rem] bg-[linear-gradient(to_bottom,var(--background)_4rem,color-mix(in_srgb,var(--background)_80%,transparent)_16rem,color-mix(in_srgb,var(--background)_40%,transparent)_38rem),url('/images/customer-dashboard-waves.webp')] bg-cover bg-top dark:bg-[linear-gradient(to_bottom,var(--background)_4rem,color-mix(in_srgb,var(--background)_78%,transparent)_38rem),url('/images/customer-dashboard-waves.webp')]">
      <RealtimeBridge />
      <CustomerNavbar />
      <div className="mx-auto min-w-0 w-full max-w-[1440px] overflow-x-clip px-4 pb-28 pt-5 md:px-6 lg:py-6">
        {children}
      </div>
    </main>
  );
}
