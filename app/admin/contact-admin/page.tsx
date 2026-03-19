import { redirect } from "next/navigation";
import AdminSignOut from "@/app/components/admin-signout";
import AdminAccessRequestForm from "@/app/components/admin-access-request-form";
import { requireValidPageSession } from "@/lib/device-session";

export default async function AdminContactPage() {
  const session = await requireValidPageSession();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8 text-[color:var(--theme-text)]">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-3xl font-semibold">Contact Admin</h2>
        <AdminSignOut />
      </div>

      <div className="page-panel max-w-2xl">
        <AdminAccessRequestForm
          initialName={session.user.name ?? ""}
          initialEmail={session.user.email ?? ""}
        />
      </div>
    </section>
  );
}
