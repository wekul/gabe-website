"use client";

import { Button, Input, Select, SelectItem } from "@heroui/react";
import { useMemo, useState, type FormEvent } from "react";
import type { AdminUserRecord, RoleRecord } from "@/lib/site-data";
import type { UserRole } from "@/lib/rbac";
import { adminFetch } from "@/app/components/admin-session-client";

type Props = {
  initialUsers: AdminUserRecord[];
  availableRoles: RoleRecord[];
  currentUserId: string;
  currentUserRoleRank: number;
};

function formatRoleName(roleName: string) {
  return roleName
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const fieldClassNames = {
  inputWrapper:
    "rounded-2xl border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-soft)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] data-[hover=true]:bg-[color:var(--theme-surface-soft)] group-data-[focus=true]:border-[color:var(--theme-accent-strong)] group-data-[focus=true]:bg-[color:var(--theme-surface-soft)] group-data-[invalid=true]:!border-red-500 group-data-[invalid=true]:!bg-[color:var(--theme-surface-soft)]",
  input: "!text-white caret-white",
  innerWrapper: "!text-white",
  label: "!text-[color:var(--theme-text-soft)]",
  description: "text-[color:var(--theme-text-muted)]",
  trigger:
    "rounded-2xl border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-soft)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] data-[hover=true]:bg-[color:var(--theme-surface-soft)] data-[open=true]:bg-[color:var(--theme-surface-soft)] group-data-[focus=true]:border-[color:var(--theme-accent-strong)] group-data-[invalid=true]:!border-red-500 group-data-[invalid=true]:!bg-[color:var(--theme-surface-soft)]",
  value: "!text-white",
  selectorIcon: "text-[color:var(--theme-text-muted)]",
  listboxWrapper: "bg-[color:var(--theme-surface-strong-soft)] text-white",
  listbox: "bg-[color:var(--theme-surface-strong-soft)] text-white",
  popoverContent:
    "rounded-2xl border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-strong-soft)] text-white",
};

export default function AdminUserManagement({
  initialUsers,
  availableRoles,
  currentUserId,
  currentUserRoleRank,
}: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [roles, setRoles] = useState(availableRoles);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [passwordDrafts, setPasswordDrafts] = useState<Record<string, string>>({});
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const assignableRoles = useMemo(
    () => roles.filter((role) => role.rank < currentUserRoleRank),
    [currentUserRoleRank, roles],
  );
  const createRoleOptions = assignableRoles.map((role) => role.name);

  const refreshUsers = async () => {
    const [usersResponse, rolesResponse] = await Promise.all([
      adminFetch("/api/admin/users"),
      adminFetch("/api/admin/roles"),
    ]);

    const usersData = (await usersResponse.json()) as { users?: AdminUserRecord[] };
    const rolesData = (await rolesResponse.json()) as { roles?: RoleRecord[] };

    setUsers(usersData.users ?? []);
    setRoles(rolesData.roles ?? []);
  };

  const handleCreateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatusMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = {
      name: String(formData.get("name") ?? ""),
      username: String(formData.get("username") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      role: String(formData.get("role") ?? "viewer"),
    };

    const response = await adminFetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setStatusMessage(data.error ?? "Failed to create user.");
      setIsSubmitting(false);
      return;
    }

    form.reset();
    await refreshUsers();
    setStatusMessage("User created.");
    setIsSubmitting(false);
  };

  const handleRoleChange = async (userId: string, role: UserRole) => {
    setStatusMessage("");
    setBusyUserId(userId);

    const response = await adminFetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });

    const data = (await response.json()) as {
      error?: string;
      user?: AdminUserRecord;
    };

    setBusyUserId(null);

    if (!response.ok) {
      setStatusMessage(data.error ?? "Failed to update role.");
      return;
    }

    if (data.user) {
      setUsers((current) => current.map((user) => (user.id === userId ? data.user! : user)));
    }

    setStatusMessage("Role updated.");
  };

  const handlePasswordChange = async (userId: string) => {
    const password = passwordDrafts[userId]?.trim() ?? "";

    if (!password) {
      setStatusMessage("Enter a new password before saving.");
      return;
    }

    setStatusMessage("");
    setBusyUserId(userId);

    const response = await adminFetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    const data = (await response.json()) as { error?: string };

    setBusyUserId(null);

    if (!response.ok) {
      setStatusMessage(data.error ?? "Failed to update password.");
      return;
    }

    setPasswordDrafts((current) => ({ ...current, [userId]: "" }));
    setStatusMessage("Password updated.");
  };

  const handleDeleteUser = async (userId: string) => {
    setStatusMessage("");
    setBusyUserId(userId);

    const response = await adminFetch(`/api/admin/users/${userId}`, {
      method: "DELETE",
    });

    const data = (await response.json()) as { error?: string };

    setBusyUserId(null);

    if (!response.ok) {
      setStatusMessage(data.error ?? "Failed to delete user.");
      return;
    }

    setUsers((current) => current.filter((user) => user.id !== userId));
    setPasswordDrafts((current) => {
      const next = { ...current };
      delete next[userId];
      return next;
    });
    setStatusMessage("User deleted.");
  };

  return (
    <section className="theme-subpanel rounded-[1.75rem] p-5 text-white md:p-6">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--theme-accent)]">
            Account Control
          </p>
          <h3 className="text-2xl font-semibold tracking-tight text-white">User Management</h3>
          <p className="mt-2 text-sm leading-6 text-[color:var(--theme-text-muted)]">
            Create accounts, assign lower-ranked roles, and manage credentials without breaking hierarchy rules.
          </p>
        </div>
        {statusMessage ? (
          <div className="theme-status-pill rounded-full px-4 py-2 text-sm text-[color:var(--theme-text-soft)]">
            {statusMessage}
          </div>
        ) : null}
      </div>

      <form className="theme-card mb-6 rounded-[1.5rem] p-5 md:p-6" onSubmit={handleCreateUser}>
        <div className="mb-5">
          <p className="text-lg font-semibold text-white">Create User</p>
          <p className="text-sm text-[color:var(--theme-text-muted)]">
            Available roles are filtered to roles below your current rank.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Input label="Name" name="name" classNames={fieldClassNames} />
          <Input label="Username" name="username" type="text" isRequired classNames={fieldClassNames} />
          <Input
            label="Email"
            name="email"
            type="email"
            isRequired
            classNames={fieldClassNames}
          />
          <Input
            label="Password"
            name="password"
            type="password"
            isRequired
            classNames={fieldClassNames}
          />
          <Select
            label="Role"
            name="role"
            defaultSelectedKeys={
              createRoleOptions.includes("viewer") ? ["viewer"] : createRoleOptions.slice(0, 1)
            }
            classNames={fieldClassNames}
            isDisabled={createRoleOptions.length === 0}
          >
            {assignableRoles.map((role) => (
              <SelectItem key={role.name}>{`${formatRoleName(role.name)} (rank ${role.rank})`}</SelectItem>
            ))}
          </Select>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <Button type="submit" color="primary" isLoading={isSubmitting} isDisabled={createRoleOptions.length === 0}>
            Add User
          </Button>
        </div>
      </form>

      <div className="space-y-4">
        {users.map((user) => {
          const isSelf = user.id === currentUserId;
          const isRankProtected = user.roleRank >= currentUserRoleRank;
          const isLocked = !user.modifiable || isSelf || isRankProtected;
          const isBusy = busyUserId === user.id;
          const availableRoleOptions = assignableRoles.filter((role) => role.rank < currentUserRoleRank);

          return (
            <article key={user.id} className="theme-card rounded-[1.5rem] p-5">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_15rem_17rem_auto] xl:items-end">
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-[color:var(--theme-accent-strong)] bg-[color:var(--theme-accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--theme-text)]">
                      {user.name ?? "Unnamed User"}
                    </span>
                    <span className="rounded-full border border-[color:var(--theme-border)] bg-white/5 px-3 py-1 text-xs font-medium text-[color:var(--theme-text-muted)]">
                      @{user.username}
                    </span>
                  </div>
                  <p className="text-sm text-[color:var(--theme-text-muted)]">{user.email}</p>
                  <p className="mt-2 text-sm text-[color:var(--theme-text-muted)]">
                    Role: {formatRoleName(user.role)} (rank {user.roleRank}) · {isSelf ? "Current user" : !user.modifiable ? "System user locked" : isRankProtected ? "Protected by rank" : "Editable user"}
                  </p>
                </div>

                <Select
                  aria-label={`Role for ${user.username}`}
                  selectedKeys={[user.role]}
                  isDisabled={isLocked || isBusy}
                  classNames={fieldClassNames}
                  onSelectionChange={(keys) => {
                    const nextRole = Array.from(keys)[0];
                    if (typeof nextRole === "string") {
                      void handleRoleChange(user.id, nextRole as UserRole);
                    }
                  }}
                >
                  {availableRoleOptions.map((role) => (
                    <SelectItem key={role.name}>{`${formatRoleName(role.name)} (rank ${role.rank})`}</SelectItem>
                  ))}
                </Select>

                <div className="flex gap-2">
                  <Input
                    aria-label={`New password for ${user.username}`}
                    placeholder="New password"
                    type="password"
                    value={passwordDrafts[user.id] ?? ""}
                    isDisabled={isLocked || isBusy}
                    classNames={fieldClassNames}
                    onValueChange={(value) => {
                      setPasswordDrafts((current) => ({ ...current, [user.id]: value }));
                    }}
                  />
                  <Button
                    color="secondary"
                    variant="flat"
                    className="border border-[color:var(--theme-border)] bg-white/[0.04] text-white"
                    isDisabled={isLocked || isBusy}
                    isLoading={isBusy}
                    onPress={() => {
                      void handlePasswordChange(user.id);
                    }}
                  >
                    Save
                  </Button>
                </div>

                <Button
                  color="danger"
                  variant="flat"
                  className="border border-red-500/20 bg-red-950/30 text-red-100"
                  isDisabled={isLocked || isBusy}
                  isLoading={isBusy}
                  onPress={() => {
                    void handleDeleteUser(user.id);
                  }}
                >
                  Delete
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
