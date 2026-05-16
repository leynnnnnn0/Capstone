import CustomerShell from "@/components/customer/shared/CustomerShell";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <CustomerShell>{children}</CustomerShell>;
}
