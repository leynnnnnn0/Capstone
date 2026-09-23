import CustomerNavbar from "@/components/customer/CustomerNavbar";
import { RealtimeBridge } from "@/components/realtime/RealtimeBridge";

export default function CustomerShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="customer-portal min-h-screen w-full overflow-x-clip bg-background text-foreground">
      <RealtimeBridge />
      <CustomerNavbar />
      <div className="mx-auto min-w-0 w-full max-w-[1440px] overflow-x-clip px-4 pb-28 pt-5 md:px-6 lg:py-6">
        {children}
      </div>
    </main>
  );
}
