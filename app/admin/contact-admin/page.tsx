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
    <section className="public-shell">
      <div className="public-layout">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <p className="public-kicker">Access Request</p>
            <h2 className="public-title">Contact Admin</h2>
            <p className="public-copy">
              Send a signed-in request explaining which admin section you need and why access should be granted.
            </p>
          </div>
          <AdminSignOut />
        </div>

        <AdminAccessRequestForm
          initialName={session.user.name ?? ""}
          initialEmail={session.user.email ?? ""}
        />
      </div>
    </section>
  );
}
