import AdminUserForm from "@/components/admin-users/AdminUserForm";

export default async function AdminUserEditPage({ params }: { params: Promise<{ user: string }> }) {
  const { user } = await params;

  return <AdminUserForm userId={user} />;
}
