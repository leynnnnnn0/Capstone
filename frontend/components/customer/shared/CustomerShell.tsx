import CustomerNavbar from "@/components/customer/CustomerNavbar";
import { RealtimeBridge } from "@/components/realtime/RealtimeBridge";

export default function CustomerShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="customer-portal min-h-screen w-full overflow-x-clip bg-[#f3f6f8] text-[#101820]">
      <RealtimeBridge />
      <CustomerNavbar />
      <div className="mx-auto min-w-0 w-full max-w-[1440px] overflow-x-clip px-3 pb-28 pt-5 sm:px-6 sm:pb-28 sm:pt-8 lg:px-8 lg:py-10">
        {children}
      </div>
    </main>
  );
}
