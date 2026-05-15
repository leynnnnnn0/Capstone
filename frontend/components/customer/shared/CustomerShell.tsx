import CustomerNavbar from "@/components/customer/CustomerNavbar";
import { RealtimeBridge } from "@/components/realtime/RealtimeBridge";

export default function CustomerShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50">
      <RealtimeBridge />
      <CustomerNavbar />
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </div>
    </main>
  );
}
