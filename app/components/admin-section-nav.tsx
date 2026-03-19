import Link from "next/link";
import type { Permission } from "@/lib/rbac";

type Props = {
  permissions: Permission[];
  active: "home" | "analytics" | "logs" | "users" | "roles";
};

const items = [
  { key: "home", href: "/admin", label: "Overview", permission: null },
  { key: "analytics", href: "/admin/analytics", label: "Analytics", permission: "view_analytics" },
  { key: "logs", href: "/admin/logs", label: "Logs", permission: null },
  { key: "users", href: "/admin/users", label: "Users", permission: "manage_users" },
  { key: "roles", href: "/admin/roles", label: "Roles", permission: "manage_roles" },
] as const;

export default function AdminSectionNav({ permissions, active }: Props) {
  return (
    <nav className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm">
      <div className="flex flex-wrap gap-2">
        {items
          .filter((item) => {
            if (item.key === "logs") {
              return (
                permissions.includes("view_sessions") ||
                permissions.includes("view_contact_messages") ||
                permissions.includes("view_admin_messages") ||
                permissions.includes("view_image_views")
              );
            }

            return item.permission === null || permissions.includes(item.permission);
          })
          .map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={
                active === item.key
                  ? "rounded-[1rem] border border-cyan-300/30 bg-cyan-300/15 px-4 py-2.5 text-sm font-medium text-cyan-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  : "rounded-[1rem] border border-transparent bg-transparent px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-white/10 hover:bg-white/[0.05] hover:text-white"
              }
            >
              {item.label}
            </Link>
          ))}
      </div>
    </nav>
  );
}
