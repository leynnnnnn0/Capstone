import CustomerNavbar from "@/components/customer/CustomerNavbar";
import { RealtimeBridge } from "@/components/realtime/RealtimeBridge";

import styles from "./CustomerShell.module.css";

export default function CustomerShell({ children }: { children: React.ReactNode }) {
  return (
    <main className={`${styles.shell} customer-portal min-h-screen md:m-3 md:min-h-[calc(100svh-1.5rem)] md:rounded-3xl md:border md:border-border overflow-x-clip bg-background text-foreground [--customer-small-text:0.75rem] [--text-xs:0.875rem] [--text-sm:1rem] [--text-base:1.125rem] [--text-lg:1.25rem] [--text-2xl:1.625rem] [--text-3xl:2rem]`}>
      <RealtimeBridge />
      <CustomerNavbar />
      <div className="mx-auto min-w-0 w-full max-w-[1440px] overflow-x-clip px-4 pb-28 pt-5 md:px-6 lg:py-6">
        {children}
      </div>
    </main>
  );
}
