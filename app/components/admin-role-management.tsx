"use client";

import { Button, Checkbox, Input } from "@heroui/react";
import { useState, type FormEvent } from "react";
import { ALL_PERMISSIONS, type Permission } from "@/lib/rbac";
import type { RoleRecord } from "@/lib/site-data";
import { adminFetch } from "@/app/components/admin-session-client";

type Props = {
  initialRoles: RoleRecord[];
  currentUserRoleRank: number;
  currentUserRoleName: string;
};

const permissionLabels: Record<Permission, string> = {
  access_admin: "Access admin dashboard",
  view_analytics: "View analytics summary",
  clear_anayltics: "Clear stored analytics",
  view_sessions: "View session logs",
  view_contact_messages: "View contact form messages",
  view_admin_messages: "View admin request messages",
  view_image_views: "View image tracking logs",
  manage_theme: "Manage website theme",
  manage_users: "Manage users",
  manage_roles: "Manage roles and permissions",
  manage_notifications: "Manage notification schedule",
  manage_secrets: "Manage email server secrets",
  manage_shop: "Manage shop settings",
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
    "rounded-2xl border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-soft)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm data-[hover=true]:bg-[color:var(--theme-surface-soft)] group-data-[focus=true]:border-[color:var(--theme-accent-strong)] group-data-[focus=true]:bg-[color:var(--theme-surface-soft)] group-data-[invalid=true]:!border-red-500 group-data-[invalid=true]:!bg-[color:var(--theme-surface-soft)]",
  input: "!text-white caret-white",
  innerWrapper: "!text-white",
  label: "!text-[color:var(--theme-text-soft)]",
  description: "text-[color:var(--theme-text-muted)]",
};

export default function AdminRoleManagement({
  initialRoles,
  currentUserRoleRank,
  currentUserRoleName,
}: Props) {
  const [roles, setRoles] = useState(initialRoles);
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyRoleName, setBusyRoleName] = useState<string | null>(null);
  const [newRolePermissions, setNewRolePermissions] = useState<Permission[]>([]);
  const [roleDrafts, setRoleDrafts] = useState<Record<string, { description: string; rank: string }>>(
    Object.fromEntries(
      initialRoles.map((role) => [
        role.name,
        { description: role.description ?? "", rank: String(role.rank) },
      ]),
    ),
  );
  const [deleteConfirmations, setDeleteConfirmations] = useState<Record<string, string>>({});

  const saveRole = async (payload: {
    name: string;
    description?: string;
    permissions: Permission[];
    rank: number;
  }) => {
    const response = await adminFetch("/api/admin/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as { error?: string; role?: RoleRecord };

    if (!response.ok || !data.role) {
      throw new Error(data.error ?? "Failed to save role.");
    }

    const savedRole = data.role;

    setRoles((current) => {
      const existing = current.find((role) => role.name === savedRole.name);
      const next = !existing
        ? [...current, savedRole]
        : current.map((role) => (role.name === savedRole.name ? savedRole : role));

      return next.sort((a, b) => b.rank - a.rank || a.name.localeCompare(b.name));
    });
    setRoleDrafts((current) => ({
      ...current,
      [savedRole.name]: {
        description: savedRole.description ?? "",
        rank: String(savedRole.rank),
      },
    }));
  };

  const handleCreateRole = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatusMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      await saveRole({
        name: String(formData.get("roleName") ?? ""),
        description: String(formData.get("roleDescription") ?? ""),
        permissions: newRolePermissions,
        rank: Number(formData.get("roleRank") ?? 0),
      });
      form.reset();
      setNewRolePermissions([]);
      setStatusMessage("Role saved.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to save role.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExistingRolePermissionChange = async (
    role: RoleRecord,
    permission: Permission,
    checked: boolean,
  ) => {
    setStatusMessage("");
    const nextPermissions = checked
      ? Array.from(new Set([...role.permissions, permission]))
      : role.permissions.filter((entry) => entry !== permission);

    try {
      const draft = roleDrafts[role.name] ?? {
        description: role.description ?? "",
        rank: String(role.rank),
      };

      setBusyRoleName(role.name);
      await saveRole({
        name: role.name,
        description: draft.description,
        permissions: nextPermissions,
        rank: Number(draft.rank),
      });
      setStatusMessage(`Updated ${role.name} permissions.`);
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : `Failed to update ${role.name}.`,
      );
    } finally {
      setBusyRoleName(null);
    }
  };

  const handleExistingRoleDetailsSave = async (role: RoleRecord) => {
    setStatusMessage("");
    const draft = roleDrafts[role.name] ?? {
      description: role.description ?? "",
      rank: String(role.rank),
    };

    try {
      setBusyRoleName(role.name);
      await saveRole({
        name: role.name,
        description: draft.description,
        permissions: role.permissions,
        rank: Number(draft.rank),
      });
      setStatusMessage(`Updated ${role.name}.`);
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : `Failed to update ${role.name}.`,
      );
    } finally {
      setBusyRoleName(null);
    }
  };

  const handleDeleteRole = async (roleName: string) => {
    setStatusMessage("");
    setBusyRoleName(roleName);

    try {
      const response = await adminFetch("/api/admin/roles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: roleName }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setStatusMessage(data.error ?? `Failed to delete ${roleName}.`);
        return;
      }

      setRoles((current) => current.filter((role) => role.name !== roleName));
      setRoleDrafts((current) => {
        const next = { ...current };
        delete next[roleName];
        return next;
      });
      setDeleteConfirmations((current) => {
        const next = { ...current };
        delete next[roleName];
        return next;
      });
      setStatusMessage(`Deleted ${roleName}.`);
    } finally {
      setBusyRoleName(null);
    }
  };

  return (
    <section className="theme-subpanel mb-8 rounded-[2rem] p-5 text-white md:p-7">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--theme-accent)]">
            Access Control
          </p>
          <h3 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
            Role Matrix
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--theme-text-muted)]">
            Define role priority, assign permissions, and manage deletion safeguards without breaking the hierarchy.
          </p>
        </div>
        {statusMessage ? (
          <div className="theme-status-pill rounded-full px-4 py-2 text-sm text-[color:var(--theme-text-soft)]">
            {statusMessage}
          </div>
        ) : null}
      </div>

      <form className="theme-card mb-8 rounded-[1.5rem] p-5 md:p-6" onSubmit={handleCreateRole}>
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-lg font-semibold text-white">Create Role</p>
            <p className="text-sm text-[color:var(--theme-text-muted)]">
              New roles must stay below your current rank of {currentUserRoleRank}.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Input label="Role Name" name="roleName" isRequired classNames={fieldClassNames} />
          <Input label="Description" name="roleDescription" classNames={fieldClassNames} />
          <Input
            label="Rank"
            name="roleRank"
            type="number"
            defaultValue="0"
            classNames={fieldClassNames}
            description={`Must be lower than your rank (${currentUserRoleRank}).`}
          />
        </div>

        <div className="theme-card mt-5 rounded-[1.25rem] p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--theme-text-soft)]">
              Permission Set
            </p>
            <p className="text-xs text-[color:var(--theme-text-muted)]">{newRolePermissions.length} selected</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {ALL_PERMISSIONS.map((permission) => (
              <label
                key={permission}
                className="theme-card rounded-2xl px-4 py-3 transition hover:border-[color:var(--theme-accent-strong)] hover:bg-white/[0.04]"
              >
                <Checkbox
                  isSelected={newRolePermissions.includes(permission)}
                  onValueChange={(checked) => {
                    setNewRolePermissions((current) =>
                      checked
                        ? Array.from(new Set([...current, permission]))
                        : current.filter((entry) => entry !== permission),
                    );
                  }}
                  classNames={{ label: "text-white" }}
                >
                  {permissionLabels[permission]}
                </Checkbox>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <Button type="submit" color="primary" isLoading={isSubmitting} className="px-6">
            Save Role
          </Button>
        </div>
      </form>

      <div className="space-y-5">
        {roles.map((role) => {
          const isCurrentUsersRole = role.name === currentUserRoleName;
          const isEditable = role.modifiable && role.rank < currentUserRoleRank;
          const isBusy = busyRoleName === role.name;
          const canDelete = isEditable && !isCurrentUsersRole;
          const confirmationText = deleteConfirmations[role.name] ?? "";
          const requiresExactConfirmation = confirmationText === role.name;
          const draft = roleDrafts[role.name] ?? {
            description: role.description ?? "",
            rank: String(role.rank),
          };

          return (
            <article key={role.name} className="theme-card overflow-hidden rounded-[1.75rem]">
              <div className="border-b border-[color:var(--theme-border)] px-5 py-5 md:px-6">
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_10rem_auto] xl:items-end">
                  <div>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[color:var(--theme-accent-strong)] bg-[color:var(--theme-accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--theme-text)]">
                        {formatRoleName(role.name)}
                      </span>
                      <span className="rounded-full border border-[color:var(--theme-border)] bg-white/5 px-3 py-1 text-xs font-medium text-[color:var(--theme-text-muted)]">
                        {role.name}
                      </span>
                    </div>
                    <p className="text-sm leading-6 text-[color:var(--theme-text-muted)]">
                      {role.modifiable ? "Editable role" : "Locked system role"} · Rank {role.rank}
                      {isCurrentUsersRole ? " · Assigned to your account" : ""}
                    </p>
                  </div>
                  <Input
                    label="Rank"
                    type="number"
                    value={draft.rank}
                    isDisabled={!isEditable || isBusy}
                    description={isEditable ? "Edit role priority" : "Rank is locked for this role"}
                    classNames={fieldClassNames}
                    onValueChange={(value) => {
                      setRoleDrafts((current) => ({
                        ...current,
                        [role.name]: { ...draft, rank: value },
                      }));
                    }}
                  />
                  <Button
                    color="secondary"
                    variant="flat"
                    isDisabled={!isEditable || isBusy}
                    isLoading={isBusy}
                    className="xl:self-end"
                    onPress={() => {
                      void handleExistingRoleDetailsSave(role);
                    }}
                  >
                    Save Details
                  </Button>
                </div>
              </div>

              <div className="grid gap-5 px-5 py-5 md:px-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                <div className="space-y-5">
                  <Input
                    label="Description"
                    value={draft.description}
                    isDisabled={!isEditable || isBusy}
                    classNames={fieldClassNames}
                    onValueChange={(value) => {
                      setRoleDrafts((current) => ({
                        ...current,
                        [role.name]: { ...draft, description: value },
                      }));
                    }}
                  />

                  <div className="theme-card rounded-[1.25rem] p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--theme-text-soft)]">
                        Permissions
                      </p>
                      <p className="text-xs text-[color:var(--theme-text-muted)]">{role.permissions.length} enabled</p>
                    </div>
                    <div className="grid gap-3">
                      {ALL_PERMISSIONS.map((permission) => (
                        <label
                          key={`${role.name}-${permission}`}
                          className="theme-card rounded-2xl px-4 py-3 transition hover:border-[color:var(--theme-accent-strong)] hover:bg-white/[0.04]"
                        >
                          <Checkbox
                            isSelected={role.permissions.includes(permission)}
                            isDisabled={!isEditable || isBusy}
                            onValueChange={(checked) => {
                              void handleExistingRolePermissionChange(role, permission, checked);
                            }}
                            classNames={{ label: "text-white" }}
                          >
                            {permissionLabels[permission]}
                          </Checkbox>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="theme-danger-panel rounded-[1.25rem] p-4">
                  <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-red-200">
                    Dangerous Action
                  </p>
                  <p className="mb-4 text-sm leading-6 text-red-100/80">
                    Type <span className="font-mono text-red-100">{role.name}</span> to confirm deletion. Locked roles, your current role, and roles still assigned to users cannot be deleted.
                  </p>
                  <div className="flex flex-col gap-3">
                    <Input
                      label="Confirmation"
                      value={confirmationText}
                      isDisabled={!canDelete || isBusy}
                      classNames={fieldClassNames}
                      onValueChange={(value) => {
                        setDeleteConfirmations((current) => ({
                          ...current,
                          [role.name]: value,
                        }));
                      }}
                    />
                    <Button
                      color="danger"
                      variant="solid"
                      isDisabled={!canDelete || !requiresExactConfirmation || isBusy}
                      isLoading={isBusy}
                      className="self-start px-5"
                      onPress={() => {
                        void handleDeleteRole(role.name);
                      }}
                    >
                      Delete Role
                    </Button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
