import CustomerNavbar from "@/components/customer/CustomerNavbar";
import { RealtimeBridge } from "@/components/realtime/RealtimeBridge";

export default function CustomerShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="customer-portal min-h-screen bg-[#f3f6f8] text-[#101820]">
      <RealtimeBridge />
      <CustomerNavbar />
      <div className="mx-auto w-full max-w-[1440px] px-3 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        {children}
      </div>
    </main>
  );
}
